// SPDX-License-Identifier: Apache-2.0
/**
 * GitHub Action entrypoint: FractalAI PQC Receipt Verify v2.
 *
 * This file makes NO trust decision. It only (1) reads the step inputs and the files/URLs they name with
 * strict hygiene, (2) hands raw bytes + an explicit policy to Trust Kernel v2 (vendored byte-exact from
 * johnInarti/pqc-receipts-colosseum@b9e1967, see vendor/VENDOR.json), and (3) publishes the kernel's
 * leveled verdict as machine-safe outputs, a one-line log and an escaped step summary.
 *
 * Reads INPUT_* as the Actions runner sets them; writes $GITHUB_OUTPUT / $GITHUB_STEP_SUMMARY.
 * No @actions/core dependency on purpose.
 */
import { appendFileSync, readFileSync, realpathSync, statSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  verify, boundedFetch, fetchLegacyDirectory, parseJsonStrict, b64decodeStrict, oneLine as kernelOneLine,
  KERNEL_ID, SPEC_VERSION, LEVELS, KIND_NAMES, EXIT, SELF_TEST, ML_DSA_65_PK_BYTES,
} from '../vendor/pqc-receipts-colosseum/kernel/src/index.mjs';
import VENDOR from '../vendor/VENDOR.json' with { type: 'json' };

const KERNEL_PIN = `${KERNEL_ID}@${String(VENDOR.commit).slice(0, 7)}`;
const DEFAULT_DIRECTORY = 'https://fractalai.net.co/.well-known/x402-receipt-keys';
// Per-request deadline (headers + body, enforced by the kernel's boundedFetch). The env override can only
// SHORTEN it (used by the tests).
const FETCH_TIMEOUT_MS = Math.min(20_000, Math.max(500, Number(process.env.PQC_VERIFY_FETCH_TIMEOUT_MS) || 20_000));
const FETCH_ATTEMPTS = 3;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

class UsageError extends Error {
  constructor(msg, code = 'USAGE', exit = EXIT.USAGE) { super(msg); this.code = code; this.exit = exit; }
}
const inputError = (msg, code = 'INPUT') => new UsageError(msg, code, EXIT.INPUT);

// ── runner I/O ─────────────────────────────────────────────────────────────────────────────────────
function getInput(name) {
  // The runner sets INPUT_<NAME> with spaces -> '_' and upper-cased; hyphens are kept.
  const v = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`];
  return typeof v === 'string' ? v.trim() : '';
}
/** RT-1: one value -> exactly one log line (C0/C1, bidi overrides, U+2028/9 escaped; bounded). The kernel's escaper. */
const oneLine = (s, max = 600) => kernelOneLine(s, max);
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
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const annotate = (level, msg) => process.stdout.write(`::${level}::${esc(oneLine(msg))}\n`);
/** RT-2: a summary table cell must not be able to break the table or inject markdown/HTML. */
const mdCell = (s) => oneLine(s, 300).replace(/[\\`*_{}\[\]()#+!|~>-]/g, '\\$&').replace(/&/g, '&amp;').replace(/</g, '&lt;');
function summary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch { /* summary is best-effort */ }
  }
}

// ── inputs ─────────────────────────────────────────────────────────────────────────────────────────
function boolInput(name, def) {
  const v = getInput(name);
  if (v === '') return def;
  if (/^(true|1|yes|on)$/i.test(v)) return true;
  if (/^(false|0|no|off)$/i.test(v)) return false;
  throw new UsageError(`input "${name}" must be true or false`);
}
function intInput(name) {
  const v = getInput(name);
  if (v === '') return undefined;
  if (!/^[0-9]{1,15}$/.test(v) || !Number.isSafeInteger(Number(v))) throw new UsageError(`input "${name}" must be a non-negative safe integer`);
  return Number(v);
}
const listInput = (name) => getInput(name).split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

/**
 * RT-3: local files must resolve — after following symlinks — to a regular file inside GITHUB_WORKSPACE or
 * RUNNER_TEMP, and be at most 2 MiB. A PR could otherwise commit a symlink to /proc/self/environ,
 * ~/.docker/config.json, /dev/zero, … and have it read and echoed.
 */
function workspaceRoots() {
  const roots = [process.env.GITHUB_WORKSPACE || process.cwd(), process.env.RUNNER_TEMP].filter(Boolean);
  return roots.map((r) => { try { return realpathSync(r); } catch { return null; } }).filter(Boolean);
}
const resolveInWorkspace = (p) => path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), p);
const resolvesToFile = (p) => existsSync(resolveInWorkspace(p));
function safeLocalPath(p) {
  let real;
  try { real = realpathSync(resolveInWorkspace(p)); } catch { throw inputError(`file "${p}" does not exist`); }
  const inside = workspaceRoots().some((r) => real === r || real.startsWith(r + path.sep));
  if (!inside) throw inputError(`file "${p}" resolves outside GITHUB_WORKSPACE/RUNNER_TEMP (symlink or path traversal refused)`);
  const st = statSync(real);
  if (!st.isFile()) throw inputError(`"${p}" is not a regular file`);
  if (st.size > MAX_BODY_BYTES) throw inputError(`file "${p}" is larger than ${MAX_BODY_BYTES} bytes`, 'JSON_TOO_LARGE');
  return real;
}
/**
 * Raw bytes of a workspace file, as the kernel should see them. Valid UTF-8 is handed over as a string
 * WITH any byte-order mark kept (so the kernel refuses it); invalid UTF-8 is handed over as bytes, so the
 * kernel reports its own JSON_INVALID. Nothing is parsed or normalised here.
 */
function readRaw(p) {
  const buf = readFileSync(safeLocalPath(p));
  if (buf.length > MAX_BODY_BYTES) throw inputError(`file "${p}" is larger than ${MAX_BODY_BYTES} bytes`, 'JSON_TOO_LARGE');
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buf); } catch { return new Uint8Array(buf); }
}
const isHttpUrl = (s) => /^https?:\/\//i.test(s);
const isReceiptId = (s) => /^[0-9a-fA-F]{64}$/.test(s);

/** GET with the kernel's boundedFetch (one deadline, streamed byte cap, no redirects, https or loopback);
 * up to 3 attempts on transient failures only. A retry can never turn into "valid": the kernel decides. */
async function fetchText(url, { directory = false } = {}) {
  const opts = { headers: { accept: 'application/json', 'user-agent': 'pqc-receipt-verify-action/2' }, timeoutMs: FETCH_TIMEOUT_MS, maxBytes: MAX_BODY_BYTES };
  for (let attempt = 1; ; attempt++) {
    try {
      // Key directory: kernel 2.3 relocation rule (same-origin /.well-known/fractalai-key-directory when the
      // stable path carries the x402 spec format). Never follows a pointer inside a fetched document.
      return directory ? (await fetchLegacyDirectory(url, opts)).text : await boundedFetch(url, opts);
    } catch (e) {
      const detail = String(e?.detail ?? e?.message ?? e);
      const transient = e?.code === 'RPC_ERROR' && /timeout after|failed:|HTTP (5\d\d|429)\b/.test(detail);
      if (!transient || attempt >= FETCH_ATTEMPTS) {
        throw inputError(`GET ${url} -> ${detail}${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`, e?.code ?? 'INPUT');
      }
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
  }
}
/** A value that is either inline JSON or a workspace file holding JSON (returned raw, never re-serialised). */
function jsonOrFile(name) {
  const v = getInput(name);
  if (v === '') return undefined;
  if (/^[\[{]/.test(v)) return v;
  return readRaw(v);
}

/**
 * trusted-keys: base64 keys separated by newlines/commas/whitespace, or a path to a file with them.
 * '#' starts a comment. Each entry must be a canonical 1952-byte ML-DSA-65 key (usage hygiene). A set
 * that yields ZERO keys is handed to the kernel as an empty set (RT-5: never a silent fallback to the
 * directory) and the kernel refuses it (NO_TRUST_SOURCE).
 */
function parseTrustedKeys(raw) {
  let text = raw;
  if (!/[\s,]/.test(raw) && raw.length < 1024 && resolvesToFile(raw)) {
    text = readRaw(raw);
    if (typeof text !== 'string') throw inputError('trusted-keys file is not valid UTF-8');
  }
  const keys = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '')).join('\n')
    .split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  for (const k of keys) {
    try { b64decodeStrict(k, ML_DSA_65_PK_BYTES, 'trusted-keys entry'); } catch { throw new UsageError(`trusted-keys entry "${oneLine(k.slice(0, 16))}…" is not a canonical base64 ML-DSA-65 public key (${ML_DSA_65_PK_BYTES} bytes)`); }
  }
  return keys;
}
/** rpc: one `CHAIN=URL` per line (or comma-separated); CHAIN is eip155:<id> or solana:<cluster>. */
function parseRpc(raw) {
  const out = {};
  for (const item of raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)) {
    const i = item.indexOf('=');
    const chain = i > 0 ? item.slice(0, i).trim() : '';
    const url = i > 0 ? item.slice(i + 1).trim() : '';
    if (!/^(eip155:[0-9]{1,12}|solana:[a-z][a-z-]{0,31})$/.test(chain) || !isHttpUrl(url)) throw new UsageError(`rpc entry "${oneLine(item, 120)}" must look like eip155:5042=https://… or solana:devnet=https://…`);
    (out[chain] ||= []).push(url);
  }
  return out;
}
/** directory-history: one or more workspace files; each holds one epoch object, or (alone) an array of epochs. */
function directoryHistory(raw) {
  const files = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (files.length === 0) return undefined;
  const texts = files.map((f) => readRaw(f));
  if (texts.some((t) => typeof t !== 'string')) throw inputError('directory-history file is not valid UTF-8');
  if (texts.length === 1) return /^\s*\[/.test(texts[0]) ? texts[0] : `[${texts[0]}]`;
  if (texts.some((t) => !/^\s*\{/.test(t))) throw new UsageError('with several directory-history files, each must hold one epoch object');
  return `[${texts.join(',')}]`;
}

/**
 * Builds the kernel call from the inputs. Every trust root the caller replaces (trust-roots, trusted-keys,
 * governance-key, allow-tls-directory, solana-signers) is passed as the kernel's explicit override, which
 * the kernel reflects as trust_basis "override"/"tls" and lists in `overrides`.
 */
async function buildCall() {
  const receiptInput = getInput('receipt');
  if (!receiptInput) throw new UsageError('input "receipt" is required (path to a receipt JSON, a 64-hex receipt id, or an https URL)');
  const opts = { policy: {}, timeoutMs: FETCH_TIMEOUT_MS };
  const notes = [];

  const kinds = listInput('kind');
  if (kinds.length === 1) opts.kind = kinds[0];
  else if (kinds.length > 1) opts.kinds = kinds;
  // kinds.length === 0 (explicit empty input): no policy kind -> the kernel refuses (KIND_UNKNOWN).

  const req = listInput('require');
  if (req.length) opts.policy.require = req;
  opts.policy.allowTestnetAnchors = boolInput('allow-testnet-anchors', false);
  opts.policy.allowUnfinalizedPayment = boolInput('allow-unfinalized-payment', false);
  opts.policy.requireKnownAnchorer = boolInput('require-known-anchorer', false);
  for (const [inp, key] of [['min-confirmations', 'minConfirmations'], ['rpc-quorum', 'rpcQuorum'], ['max-clock-skew-sec', 'maxClockSkewSec']]) {
    const n = intInput(inp); if (n !== undefined) opts.policy[key] = n;
  }
  if (boolInput('anchors', false)) opts.checkAnchors = true;
  if (boolInput('onchain', false)) opts.checkOnchain = true;
  const anchorRefs = jsonOrFile('anchor-refs');
  if (anchorRefs !== undefined) opts.anchors = anchorRefs;
  const rpc = parseRpc(getInput('rpc'));
  if (Object.keys(rpc).length) opts.rpc = rpc;

  let expectedId = getInput('expected-id').toLowerCase() || undefined;
  if (expectedId !== undefined && !isReceiptId(expectedId)) throw new UsageError('input "expected-id" must be 64 hex characters');

  // ── overrides of the baked trust roots (explicit, always reported by the kernel) ──
  const rootsInput = getInput('trust-roots');
  if (rootsInput) {
    const raw = readRaw(rootsInput);
    let roots;
    try { roots = parseJsonStrict(raw); } catch (e) { throw inputError(`trust-roots: ${e?.code ?? 'JSON_INVALID'} ${oneLine(e?.detail ?? '', 120)}`, e?.code ?? 'JSON_INVALID'); }
    if (!roots || typeof roots !== 'object' || Array.isArray(roots)) throw new UsageError('trust-roots must be a JSON object (kernel/trust-roots.json format)');
    opts.roots = roots;
  }
  const govKey = getInput('governance-key');
  if (govKey) {
    try { b64decodeStrict(govKey, ML_DSA_65_PK_BYTES, 'governance-key'); } catch { throw new UsageError(`governance-key is not a canonical base64 ML-DSA-65 public key (${ML_DSA_65_PK_BYTES} bytes)`); }
    opts.governanceKey = govKey;
  }
  if (boolInput('allow-tls-directory', false)) opts.allowTlsDirectory = true;
  const signers = listInput('solana-signers');
  if (signers.length) opts.solanaSigners = signers;
  const trustedRaw = getInput('trusted-keys');
  if (trustedRaw) opts.trustedKeys = JSON.stringify(parseTrustedKeys(trustedRaw));

  // ── the receipt (raw bytes; the kernel parses it) ──
  // key-directory: absent -> the public FractalAI directory; explicitly '' -> no directory at all (only
  // trusted-keys can then establish trust; otherwise the kernel answers NO_TRUST_SOURCE).
  const directoryInput = process.env['INPUT_KEY-DIRECTORY'] === undefined ? DEFAULT_DIRECTORY : getInput('key-directory');
  let receipt, source;
  if (isHttpUrl(receiptInput)) { receipt = await fetchText(receiptInput); source = receiptInput; }
  else if (isReceiptId(receiptInput)) {
    // RT-8: a 64-hex id is ALWAYS fetched by id and bound to it (expectedId), never shadowed by a workspace file.
    const id = receiptInput.toLowerCase();
    if (expectedId !== undefined && expectedId !== id) throw new UsageError('expected-id differs from the receipt id given in "receipt"');
    expectedId = id;
    const origin = new URL(isHttpUrl(directoryInput) ? directoryInput : DEFAULT_DIRECTORY).origin;
    source = `${origin}/api/midas/alerts/receipt/${id}`;
    receipt = await fetchText(source);
  } else if (resolvesToFile(receiptInput)) { receipt = readRaw(receiptInput); source = receiptInput; }
  else throw inputError(`receipt "${oneLine(receiptInput, 120)}" is neither an existing file, a 64-hex receipt id, nor an https URL`);
  if (expectedId !== undefined) opts.expectedId = expectedId;

  // Anchor records (deployments/anchors/*.json in the kernel repo) wrap the receipt: { seal, anchor? }.
  // Same unwrapping as the kernel's own CLI: hand over the inner seal; an outer anchor becomes the default hint.
  if (typeof receipt === 'string') {
    let top = null;
    try { top = parseJsonStrict(receipt); } catch { /* the kernel reports the parse error with its code */ }
    const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    if (top && typeof top === 'object' && !Array.isArray(top) && has(top, 'seal') && top.seal && typeof top.seal === 'object'
        && !['canonical', 'body', 'decision', 'route_id', 'signature', 'receipt_id'].some((k) => has(top, k))) {
      receipt = JSON.stringify(top.seal);
      if (has(top, 'anchor') && opts.anchors === undefined) opts.anchors = JSON.stringify(top.anchor);
      notes.push('anchor record: verified its inner "seal"');
    }
  }

  // ── trust source: pinned set (override) or the key directory (verified against the pinned roots) ──
  if (opts.trustedKeys === undefined && directoryInput !== '') {
    opts.directory = isHttpUrl(directoryInput) ? await fetchText(directoryInput, { directory: true }) : readRaw(directoryInput);
    const hist = directoryHistory(getInput('directory-history'));
    if (hist !== undefined) opts.directoryHistory = hist;
  }
  return { receipt, opts, source, notes };
}

// ── outputs ────────────────────────────────────────────────────────────────────────────────────────
const lvl = (x) => (x === true ? 'true' : x === false ? 'false' : '');
function publish(v, source, notes, failOnInvalid) {
  // RT-11: every output is machine-safe — enums/hex/digits validated, reason one line.
  const kid = /^[0-9a-f]{16}$/.test(v.key?.kid ?? '') ? v.key.kid : '';
  const epoch = Number.isSafeInteger(v.directory?.epoch) && v.directory.epoch >= 0 ? String(v.directory.epoch) : '';
  const basis = ['pinned-root', 'override', 'tls', 'none'].includes(v.trust_basis) ? v.trust_basis : 'none';
  const kind = KIND_NAMES.includes(v.kind) ? v.kind : '';
  const codes = [...new Set((v.reasons || []).map((r) => r.code).filter((c) => /^[A-Z0-9_]{1,64}$/.test(c)))];
  const exitCode = Number.isSafeInteger(v.exit_code) ? String(v.exit_code) : String(EXIT.INPUT);
  const valid = v.valid === true;
  const reason = valid
    ? `valid: ${(v.policy?.require ?? []).join('+')} hold (trust_basis=${basis}${kind ? `, kind=${kind}` : ''})`
    : (v.reasons || []).map((r) => `[${r.level}] ${r.code}: ${r.detail}`).join('; ') || 'invalid';

  setOutput('valid', valid ? 'true' : 'false');
  for (const l of LEVELS) setOutput(l, lvl(v.levels?.[l]));
  setOutput('trust-basis', basis);
  setOutput('kid', kid);
  setOutput('epoch', epoch);
  setOutput('kind', kind);
  setOutput('codes', codes.join(','));
  setOutput('exit-code', exitCode);
  setOutput('reason', oneLine(reason));

  const L = v.levels || {};
  const fmt = (x) => (x === true ? 'yes' : x === false ? 'NO' : '-');
  process.stdout.write(`kernel: ${KERNEL_PIN} (spec ${SPEC_VERSION}, self-test ${SELF_TEST.ok ? 'ok' : 'FAILED'})\n`);
  process.stdout.write(`receipt: ${oneLine(source)}\n`);
  for (const n of notes) process.stdout.write(`note: ${oneLine(n)}\n`);
  process.stdout.write(`${valid ? 'VALID' : 'INVALID'} kind=${kind || '-'} trust_basis=${basis} integrity=${fmt(L.integrity)} authentic=${fmt(L.authentic)} trusted=${fmt(L.trusted)} time_anchored=${fmt(L.time_anchored)} finalized=${fmt(L.finalized)}\n`);
  if (kid) process.stdout.write(`key: kid=${kid} status=${oneLine(v.key?.status ?? '-')} time_basis=${oneLine(v.key?.time_basis ?? '-')}${epoch ? ` directory_epoch=${epoch}` : ''}\n`);
  for (const a of v.anchors || []) process.stdout.write(`anchor: ${oneLine(a.ref ?? '?', 80)} ${a.counts ? 'counted' : 'refused'}${a.facts ? ` time=${oneLine(a.facts.time)} finalized=${oneLine(a.facts.finalized)} class=${oneLine(a.facts.network_class)}` : ''}\n`);
  if ((v.overrides || []).length) process.stdout.write(`overrides: ${oneLine(v.overrides.join(', '))}\n`);
  for (const r of v.reasons || []) process.stdout.write(`reason: [${oneLine(r.level, 20)}] ${oneLine(r.code, 64)}: ${oneLine(r.detail, 300)}\n`);

  summary([
    `### FractalAI PQC receipt — ${valid ? 'VALID' : 'INVALID'}`,
    '',
    '| field | value |', '|---|---|',
    `| receipt | ${mdCell(source)} |`,
    `| kind | ${kind || '\\-'} |`,
    `| valid | ${valid} |`,
    ...LEVELS.map((l) => `| ${l.replace('_', '\\_')} | ${lvl(L[l]) || 'not evaluated'} |`),
    `| trust basis | ${basis} |`,
    `| kid | ${kid || '\\-'} |`, `| directory epoch | ${epoch || '\\-'} |`,
    `| overrides | ${(v.overrides || []).length ? mdCell(v.overrides.join(', ')) : 'none'} |`,
    `| reason | ${mdCell(reason)} |`,
    `| kernel | ${mdCell(KERNEL_PIN)} |`,
    '',
    '_A verdict states facts about bytes, keys and time. A valid ML-DSA-65 signature proves who signed which bytes (and, with anchors, by when) — not that their content is true._',
  ].join('\n'));

  if (valid && basis !== 'pinned-root') annotate('notice', `PQC receipt verified with trust_basis=${basis} (overrides: ${(v.overrides || []).join(', ') || 'none'}) — not the pinned FractalAI roots`);
  if (!valid) {
    if (failOnInvalid) { annotate('error', `PQC receipt INVALID: ${reason}`); process.exitCode = 1; }
    else annotate('warning', `PQC receipt INVALID (fail-on-invalid=false): ${reason}`);
  }
}

/** A verdict-shaped record for failures that happen before the kernel could run (usage / unreadable input). */
const preKernelVerdict = (e) => ({
  valid: false, kind: null, trust_basis: 'none', key: null, directory: null, anchors: [], overrides: [],
  levels: { integrity: false, authentic: false, trusted: false, time_anchored: null, finalized: null },
  reasons: [{ level: 'integrity', code: e instanceof UsageError ? e.code : 'INPUT', detail: `could not verify: ${e instanceof Error ? e.message : String(e)}` }],
  exit_code: e instanceof UsageError ? e.exit : EXIT.INPUT,
});

async function run() {
  // RT-10: write valid=false first; if anything below crashes (OOM, unexpected throw) the output is still
  // "false", never empty. The final setOutput overrides it (last write of a name wins).
  setOutput('valid', 'false');
  setOutput('trust-basis', 'none');
  const failOnInvalid = !/^(false|0|no|off)$/i.test(getInput('fail-on-invalid') || 'true');

  // Hard step deadline: whatever hangs (DNS, a slow RPC chain, …) the step ends with valid=false.
  const timeoutSec = intInput('timeout-seconds') ?? 300;
  const watchdog = setTimeout(() => {
    try { setOutput('valid', 'false'); setOutput('exit-code', String(EXIT.INPUT)); setOutput('reason', `timeout: verification did not finish within ${timeoutSec} s`); } catch { /* ignore */ }
    annotate(failOnInvalid ? 'error' : 'warning', `PQC receipt verify: hard timeout after ${timeoutSec} s (valid=false)`);
    process.exit(failOnInvalid ? 1 : 0);
  }, Math.min(900, Math.max(5, timeoutSec)) * 1000);
  watchdog.unref();

  let v, source = getInput('receipt'), notes = [];
  try {
    const call = await buildCall();
    source = call.source; notes = call.notes;
    v = await verify(call.receipt, call.opts); // never throws: every failure is a coded reason
  } catch (e) {
    v = preKernelVerdict(e);
  }
  clearTimeout(watchdog);
  publish(v, source, notes, failOnInvalid);
}

run().catch((e) => {
  // Fail closed even on an unexpected error outside the verification try-block.
  try { setOutput('valid', 'false'); setOutput('reason', oneLine(`internal error: ${e && e.message}`)); } catch { /* ignore */ }
  process.stdout.write(`::error::${esc(oneLine(`PQC receipt verify internal error: ${e && e.message}`))}\n`);
  process.exitCode = 1;
});
