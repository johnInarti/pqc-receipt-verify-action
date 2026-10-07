// SPDX-License-Identifier: Apache-2.0
/**
 * GitHub Action entrypoint: FractalAI PQC Receipt Verify.
 * Reads INPUT_* (as the Actions runner sets them), verifies one receipt fail-closed, writes outputs
 * to $GITHUB_OUTPUT and a summary to $GITHUB_STEP_SUMMARY. No @actions/core dependency on purpose.
 */
import { appendFileSync, existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { verifyReceipt, b64decode, ML_DSA_65_PK_BYTES } from './verify.js';

const DEFAULT_DIRECTORY = 'https://fractalai.net.co/.well-known/x402-receipt-keys';
// Per-attempt deadline (headers + body). The env override can only SHORTEN it (used by the tests).
const FETCH_TIMEOUT_MS = Math.min(20_000, Math.max(500, Number(process.env.PQC_VERIFY_FETCH_TIMEOUT_MS) || 20_000));
const FETCH_ATTEMPTS = 3;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

function getInput(name) {
  // The runner sets INPUT_<NAME> with spaces -> '_' and upper-cased; hyphens are kept.
  const v = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`];
  return typeof v === 'string' ? v.trim() : '';
}
function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  const v = String(value);
  if (file) {
    const delim = `ghadelim_${randomUUID()}`;
    if (v.includes(delim)) throw new Error('output value contains its delimiter');
    appendFileSync(file, `${name}<<${delim}\n${v}\n${delim}\n`);
  } else {
    process.stdout.write(`[output] ${name}=${oneLine(v)}\n`);
  }
}
/**
 * RT-1: untrusted text (receipt/directory fields, JSON.parse errors, paths) must never start a log line,
 * or the runner parses it as a workflow command (::add-mask::, ::stop-commands::, ::notice::, ...).
 * Escape every control/line-separator char so one value is always exactly one log line, and cap length.
 */
const MAX_TEXT = 600;
function oneLine(s) {
  const t = String(s).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT)}…(truncated)` : t;
}
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const annotate = (level, msg) => process.stdout.write(`::${level}::${esc(oneLine(msg))}\n`);
/** RT-2: a summary table cell must not be able to break the table or inject markdown/HTML. */
const mdCell = (s) => oneLine(s).replace(/[\\`*_{}\[\]()#+!|~>-]/g, '\\$&').replace(/&/g, '&amp;').replace(/</g, '&lt;');
function summary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch { /* summary is best-effort */ }
  }
}

/** RT-6: read at most MAX_BODY_BYTES from the stream (the old check ran after buffering the whole body). */
async function readCapped(res, url) {
  const len = Number(res.headers.get('content-length'));
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) throw new Error(`GET ${url} -> body larger than ${MAX_BODY_BYTES} bytes`);
  const chunks = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.byteLength;
    if (total > MAX_BODY_BYTES) throw new Error(`GET ${url} -> body larger than ${MAX_BODY_BYTES} bytes`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
function parseJson(text, what) {
  try { return JSON.parse(text); } catch { throw new Error(`${what} is not valid JSON`); } // RT-4: no content snippet in logs
}

async function fetchJson(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) {
    throw new Error(`refusing non-HTTPS URL ${url}`);
  }
  // Up to 3 attempts for transient network errors / 5xx / 429. A 4xx is final. Never retries into "valid":
  // if every attempt fails, the caller reports valid=false (fail-closed).
  // RT-7: the deadline is an explicit, strongly-referenced timer that covers headers AND body. With
  // AbortSignal.timeout() the signal could be garbage-collected after the headers arrived, and a server that
  // stalls mid-body held the step for undici's 300 s body timeout per stall (unbounded with a slow drip).
  for (let attempt = 1; ; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(new Error(`timeout after ${FETCH_TIMEOUT_MS} ms`)), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(u, { headers: { accept: 'application/json', 'user-agent': 'pqc-receipt-verify-action/1' }, signal: ctl.signal, redirect: 'error' });
      if (res.ok) return parseJson(await readCapped(res, url), `GET ${url} body`);
      try { await res.body?.cancel(); } catch { /* ignore */ }
      if ((res.status < 500 && res.status !== 429) || attempt >= FETCH_ATTEMPTS) throw Object.assign(new Error(`GET ${url} -> HTTP ${res.status}`), { final: true });
    } catch (e) {
      if (e && e.final) throw e;
      if (/body larger than|is not valid JSON/.test(String(e && e.message))) throw e; // not transient
      if (attempt >= FETCH_ATTEMPTS) {
        const cause = e && e.cause ? ` (${e.cause.code || e.cause.message || e.cause})` : '';
        throw new Error(`GET ${url} failed after ${attempt} attempts: ${e instanceof Error ? e.message : String(e)}${cause}`);
      }
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
  }
}
/**
 * RT-3: local files (receipt, key-directory, trusted-keys) must resolve — after following symlinks — to a
 * regular file inside GITHUB_WORKSPACE or RUNNER_TEMP, and be at most MAX_BODY_BYTES. A PR could otherwise
 * commit a symlink to /proc/self/environ, ~/.docker/config.json, /dev/zero, … and have it read and echoed.
 */
function workspaceRoots() {
  const roots = [process.env.GITHUB_WORKSPACE || process.cwd(), process.env.RUNNER_TEMP].filter(Boolean);
  return roots.map((r) => { try { return realpathSync(r); } catch { return null; } }).filter(Boolean);
}
function safeLocalPath(p) {
  const base = process.env.GITHUB_WORKSPACE || process.cwd();
  const abs = path.resolve(base, p);
  let real;
  try { real = realpathSync(abs); } catch { return null; }
  const inside = workspaceRoots().some((r) => real === r || real.startsWith(r + path.sep));
  if (!inside) throw new Error(`file "${p}" resolves outside GITHUB_WORKSPACE/RUNNER_TEMP (symlink or path traversal refused)`);
  const st = statSync(real);
  if (!st.isFile()) throw new Error(`"${p}" is not a regular file`);
  if (st.size > MAX_BODY_BYTES) throw new Error(`file "${p}" is larger than ${MAX_BODY_BYTES} bytes`);
  return real;
}
function readTextFile(p) {
  const real = safeLocalPath(p);
  if (!real) throw new Error(`file "${p}" does not exist`);
  return readFileSync(real, 'utf8');
}
function readJsonFile(p) {
  return parseJson(readTextFile(p), `file "${p}"`);
}
const isUrl = (s) => /^https?:\/\//i.test(s);
const resolvesToFile = (s) => existsSync(path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), s));
const isReceiptId = (s) => /^[0-9a-fA-F]{64}$/.test(s);

/** trusted-keys: base64 keys separated by newlines/commas/whitespace, or a path to a file with them. */
function parseTrustedKeys(raw) {
  if (!raw) return [];
  let text = raw;
  if (!/[\s,]/.test(raw) && raw.length < 1024 && resolvesToFile(raw)) text = readTextFile(raw);
  // '#' starts a comment that runs to the end of the line (a comment with spaces used to yield bogus "keys").
  const keys = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '')).join('\n')
    .split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  // RT-5: a non-empty trusted-keys that yields no key must NOT silently fall back to the remote directory
  // (that widened trust from "pinned" to "whatever the directory says").
  if (keys.length === 0) throw new Error('trusted-keys was set but contains no key (empty file or only comments); refusing to fall back to the key directory');
  for (const k of keys) {
    let n;
    try { n = b64decode(k).length; } catch { throw new Error(`trusted-keys entry "${k.slice(0, 16)}…" is not base64`); }
    if (n !== ML_DSA_65_PK_BYTES) throw new Error(`trusted-keys entry "${k.slice(0, 16)}…" is ${n} bytes, not an ML-DSA-65 public key (1952)`);
  }
  return keys;
}

async function loadReceipt(input, directoryInput) {
  if (!input) throw new Error('input "receipt" is required (path to a receipt JSON, a 64-hex receipt id, or an https URL)');
  if (isUrl(input)) return { receipt: await fetchJson(input), source: input };
  // RT-8: a 64-hex id is ALWAYS fetched by id (and bound to that id). A workspace file with that name used
  // to take precedence, letting a PR substitute a different genuine receipt for the requested one.
  if (!isReceiptId(input) && resolvesToFile(input)) return { receipt: readJsonFile(input), source: input };
  if (isReceiptId(input)) {
    const origin = isUrl(directoryInput) ? new URL(directoryInput).origin : new URL(DEFAULT_DIRECTORY).origin;
    const url = `${origin}/api/midas/alerts/receipt/${input.toLowerCase()}`;
    return { receipt: await fetchJson(url), source: url, expectedId: input.toLowerCase() };
  }
  throw new Error(`receipt "${input}" is neither an existing file, a 64-hex receipt id, nor an https URL`);
}

async function run() {
  // RT-10: write valid=false first; if anything below crashes (OOM, unexpected throw) the output is still
  // "false", never empty. The final setOutput overrides it (last write of a name wins).
  setOutput('valid', 'false');
  const failOnInvalid = !/^(false|0|no|off)$/i.test(getInput('fail-on-invalid') || 'true');
  const directoryInput = getInput('key-directory') || DEFAULT_DIRECTORY;
  let result;
  let source = '';
  try {
    const trustedKeys = parseTrustedKeys(getInput('trusted-keys'));
    const { receipt, source: src, expectedId } = await loadReceipt(getInput('receipt'), directoryInput);
    source = src;
    let directory;
    const governanceKey = getInput('governance-key') || undefined;
    if (trustedKeys.length === 0) {
      if (isUrl(directoryInput)) {
        directory = await fetchJson(directoryInput);
      } else {
        // RT-9: a directory read from a file has no TLS origin, so its signature alone proves nothing (anyone
        // who can write the file can sign it with their own governance key). Require a pinned signer.
        if (!governanceKey) throw new Error('key-directory is a local file: set governance-key (the directory signer) — an unpinned local directory authenticates nothing');
        directory = readJsonFile(directoryInput);
      }
    }
    result = verifyReceipt(receipt, { trustedKeys, directory, governanceKey, expectedId });
  } catch (e) {
    result = { valid: false, reason: `could not verify: ${e instanceof Error ? e.message : String(e)}`, kid: '', epoch: '', signatureValid: false, keyTrust: 'none', checks: {} };
  }
  // RT-11: outputs are machine-safe — kid is 16 hex, epoch is a non-negative integer, reason is one line.
  const kid = /^[0-9a-f]{16}$/.test(result.kid || '') ? result.kid : '';
  const epoch = /^[0-9]{1,16}$/.test(String(result.epoch ?? '')) ? String(result.epoch) : '';
  setOutput('valid', result.valid === true ? 'true' : 'false');
  setOutput('kid', kid);
  setOutput('epoch', epoch);
  setOutput('reason', oneLine(result.reason));

  const shownSource = source || getInput('receipt');
  process.stdout.write(`receipt: ${oneLine(shownSource)}\n`);
  process.stdout.write(`checks: ${oneLine(JSON.stringify(result.checks))}\n`);
  process.stdout.write(`${result.valid === true ? 'VALID' : 'INVALID'}: ${oneLine(result.reason)}\n`);
  summary([
    `### FractalAI PQC receipt — ${result.valid === true ? 'VALID' : 'INVALID'}`,
    '',
    `| field | value |`, `|---|---|`,
    `| receipt | ${mdCell(shownSource)} |`,
    `| valid | ${result.valid === true} |`, `| kid | ${kid || '-'} |`, `| directory epoch | ${epoch || '-'} |`,
    `| key trust | ${mdCell(result.keyTrust)} |`, `| reason | ${mdCell(result.reason)} |`,
    '',
    '_A valid ML-DSA-65 signature proves authorship and integrity of the signed bytes, not that their content is true._',
  ].join('\n'));

  if (result.valid !== true) {
    if (failOnInvalid) {
      annotate('error', `PQC receipt INVALID: ${result.reason}`);
      process.exitCode = 1;
    } else {
      annotate('warning', `PQC receipt INVALID (fail-on-invalid=false): ${result.reason}`);
    }
  }
}

run().catch((e) => {
  // Fail closed even on an unexpected error outside the verification try-block.
  try { setOutput('valid', 'false'); setOutput('reason', oneLine(`internal error: ${e && e.message}`)); } catch { /* ignore */ }
  process.stdout.write(`::error::${esc(oneLine(`PQC receipt verify internal error: ${e && e.message}`))}\n`);
  process.exitCode = 1;
});
