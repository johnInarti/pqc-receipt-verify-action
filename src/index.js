// SPDX-License-Identifier: Apache-2.0
/**
 * GitHub Action entrypoint: FractalAI PQC Receipt Verify.
 * Reads INPUT_* (as the Actions runner sets them), verifies one receipt fail-closed, writes outputs
 * to $GITHUB_OUTPUT and a summary to $GITHUB_STEP_SUMMARY. No @actions/core dependency on purpose.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { verifyReceipt } from './verify.js';

const DEFAULT_DIRECTORY = 'https://fractalai.net.co/.well-known/x402-receipt-keys';
const FETCH_TIMEOUT_MS = 20_000;
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
    appendFileSync(file, `${name}<<${delim}\n${v}\n${delim}\n`);
  } else {
    process.stdout.write(`[output] ${name}=${v}\n`);
  }
}
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const annotate = (level, msg) => process.stdout.write(`::${level}::${esc(msg)}\n`);
function summary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch { /* summary is best-effort */ }
  }
}

async function fetchJson(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) {
    throw new Error(`refusing non-HTTPS URL ${url}`);
  }
  const res = await fetch(u, { headers: { accept: 'application/json', 'user-agent': 'pqc-receipt-verify-action/1' }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'error' });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > MAX_BODY_BYTES) throw new Error(`GET ${url} -> body larger than ${MAX_BODY_BYTES} bytes`);
  return JSON.parse(text);
}
function readJsonFile(p) {
  const abs = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), p);
  return JSON.parse(readFileSync(abs, 'utf8'));
}
const isUrl = (s) => /^https?:\/\//i.test(s);
const resolvesToFile = (s) => existsSync(path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), s));

/** trusted-keys: base64 keys separated by newlines/commas/whitespace, or a path to a file with them. */
function parseTrustedKeys(raw) {
  if (!raw) return [];
  let text = raw;
  if (!/[\s,]/.test(raw) && raw.length < 1024 && resolvesToFile(raw)) {
    text = readFileSync(path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), raw), 'utf8');
  }
  return text.split(/[\s,]+/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
}

async function loadReceipt(input, directoryInput) {
  if (!input) throw new Error('input "receipt" is required (path to a receipt JSON, a 64-hex receipt id, or an https URL)');
  if (isUrl(input)) return { receipt: await fetchJson(input), source: input };
  if (resolvesToFile(input)) return { receipt: readJsonFile(input), source: input };
  if (/^[0-9a-fA-F]{64}$/.test(input)) {
    const origin = isUrl(directoryInput) ? new URL(directoryInput).origin : new URL(DEFAULT_DIRECTORY).origin;
    const url = `${origin}/api/midas/alerts/receipt/${input.toLowerCase()}`;
    return { receipt: await fetchJson(url), source: url, expectedId: input.toLowerCase() };
  }
  throw new Error(`receipt "${input}" is neither an existing file, a 64-hex receipt id, nor an https URL`);
}

async function run() {
  const failOnInvalid = !/^(false|0|no|off)$/i.test(getInput('fail-on-invalid') || 'true');
  const directoryInput = getInput('key-directory') || DEFAULT_DIRECTORY;
  let result;
  let source = '';
  try {
    const trustedKeys = parseTrustedKeys(getInput('trusted-keys'));
    const { receipt, source: src, expectedId } = await loadReceipt(getInput('receipt'), directoryInput);
    source = src;
    let directory;
    if (trustedKeys.length === 0) {
      directory = isUrl(directoryInput) ? await fetchJson(directoryInput) : readJsonFile(directoryInput);
    }
    result = verifyReceipt(receipt, { trustedKeys, directory, governanceKey: getInput('governance-key') || undefined, expectedId });
  } catch (e) {
    result = { valid: false, reason: `could not verify: ${e instanceof Error ? e.message : String(e)}`, kid: '', epoch: '', signatureValid: false, keyTrust: 'none', checks: {} };
  }

  setOutput('valid', result.valid ? 'true' : 'false');
  setOutput('kid', result.kid || '');
  setOutput('epoch', result.epoch || '');
  setOutput('reason', result.reason);

  process.stdout.write(`receipt: ${source || getInput('receipt')}\n`);
  process.stdout.write(`checks: ${JSON.stringify(result.checks)}\n`);
  process.stdout.write(`${result.valid ? 'VALID' : 'INVALID'}: ${result.reason}\n`);
  summary([
    `### FractalAI PQC receipt — ${result.valid ? 'VALID' : 'INVALID'}`,
    '',
    `| field | value |`, `|---|---|`,
    `| receipt | \`${String(source || getInput('receipt')).replace(/\|/g, '\\|')}\` |`,
    `| valid | ${result.valid} |`, `| kid | ${result.kid || '-'} |`, `| directory epoch | ${result.epoch || '-'} |`,
    `| key trust | ${result.keyTrust} |`, `| reason | ${String(result.reason).replace(/\|/g, '\\|')} |`,
    '',
    '_A valid ML-DSA-65 signature proves authorship and integrity of the signed bytes, not that their content is true._',
  ].join('\n'));

  if (!result.valid) {
    if (failOnInvalid) {
      annotate('error', `PQC receipt INVALID: ${result.reason}`);
      process.exitCode = 1;
    } else {
      annotate('warning', `PQC receipt INVALID (fail-on-invalid=false): ${result.reason}`);
    }
  }
}

run();
