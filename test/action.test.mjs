// SPDX-License-Identifier: Apache-2.0
// Red-team 2026-10-06: runs dist/index.js exactly like the Actions runner (INPUT_*, GITHUB_OUTPUT,
// GITHUB_STEP_SUMMARY, GITHUB_WORKSPACE) against adversarial inputs. Offline (only 127.0.0.1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, symlinkSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { directoryRoot, kidForKey, sha256hex, KEY_DIR_DOMAIN } from '../src/verify.js';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist', 'index.js');
const vec = (f) => readFileSync(path.join(ROOT, 'test', 'vectors', f), 'utf8');
const GENUINE = JSON.parse(vec('genuine-fe62b072.json'));
const DIR = JSON.parse(vec('key-directory-epoch3.json'));
const b64 = (u) => Buffer.from(u).toString('base64'); const utf8 = (s) => new TextEncoder().encode(s);

function workspace(files = {}) {
  const ws = mkdtempSync(path.join(tmpdir(), 'rt-ws-'));
  for (const [f, c] of Object.entries(files)) writeFileSync(path.join(ws, f), typeof c === 'string' ? c : JSON.stringify(c));
  return ws;
}
function outputs(file) {
  const o = {}; const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^([a-z]+)<<(ghadelim_[0-9a-f-]+)$/.exec(lines[i]); if (!m) continue;
    const v = []; i++; while (lines[i] !== m[2]) v.push(lines[i++]); o[m[1]] = v.join('\n'); // last write wins, like the runner
  }
  return o;
}
function env(ws, inputs) {
  const e = { PATH: process.env.PATH, HOME: process.env.HOME, GITHUB_WORKSPACE: ws, GITHUB_OUTPUT: path.join(ws, '.out'), GITHUB_STEP_SUMMARY: path.join(ws, '.sum'),
    'INPUT_KEY-DIRECTORY': 'https://fractalai.net.co/.well-known/x402-receipt-keys', 'INPUT_FAIL-ON-INVALID': 'true', 'INPUT_TRUSTED-KEYS': '', 'INPUT_GOVERNANCE-KEY': '' };
  for (const [k, v] of Object.entries(inputs)) e[`INPUT_${k.toUpperCase()}`] = v;
  writeFileSync(e.GITHUB_OUTPUT, ''); writeFileSync(e.GITHUB_STEP_SUMMARY, '');
  return e;
}
function runAction(ws, inputs) {
  const e = env(ws, inputs);
  const r = spawnSync(process.execPath, [DIST], { env: e, encoding: 'utf8', timeout: 60_000 });
  return { code: r.status, log: r.stdout + r.stderr, out: outputs(e.GITHUB_OUTPUT), sum: readFileSync(e.GITHUB_STEP_SUMMARY, 'utf8') };
}
function runActionAsync(ws, inputs, extraEnv = {}) {
  const e = { ...env(ws, inputs), ...extraEnv };
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [DIST], { env: e }); let log = '';
    c.stdout.on('data', (d) => (log += d)); c.stderr.on('data', (d) => (log += d));
    c.on('close', (code) => resolve({ code, log, out: outputs(e.GITHUB_OUTPUT) }));
  });
}
const commandLines = (log) => log.split(/\r\n|\r|\n/).filter((l) => /^\s*::/.test(l) && !/^::(error|warning)::PQC receipt/.test(l));
const PINNED = GENUINE.public_key;
const GOV = DIR.directory_public_key;

test('baseline: genuine receipt + pinned key -> valid=true, exit 0', () => {
  const ws = workspace({ 'r.json': GENUINE });
  const r = runAction(ws, { receipt: 'r.json', 'trusted-keys': PINNED });
  assert.equal(r.code, 0, r.log); assert.equal(r.out.valid, 'true'); assert.equal(r.out.kid, '86c139c960bb274c');
});

test('RT-1/RT-2: newline + workflow-command payload in a receipt field cannot inject commands or markdown', () => {
  const inj = structuredClone(GENUINE);
  inj.algorithm = 'x"\n::add-mask::false\n::stop-commands::pwn\r::notice::VALID ::set-output name=valid::true\n| valid | true |\n### VALID <img src=x>';
  const ws = workspace({ 'r.json': inj });
  const r = runAction(ws, { receipt: 'r.json', 'trusted-keys': PINNED });
  assert.equal(r.code, 1); assert.equal(r.out.valid, 'false');
  assert.deepEqual(commandLines(r.log), [], `injected workflow commands:\n${r.log}`);
  assert.ok(!r.out.reason.includes('\n'), 'reason output is one line');
  const sumLines = r.sum.split('\n');
  assert.equal(sumLines.filter((l) => l.startsWith('#')).length, 1, `injected heading:\n${r.sum}`);
  assert.ok(!sumLines.some((l) => /^\s*::|^\| valid \| true/.test(l)), `summary broken:\n${r.sum}`);
  assert.equal(sumLines.filter((l) => l.startsWith('|')).length, 8, `table rows changed:\n${r.sum}`);
  assert.ok(!r.sum.includes('<img'), 'raw HTML in summary');
});

test('RT-3/RT-4: symlink or absolute path outside the workspace is refused and file content is not echoed', () => {
  const ws = workspace(); symlinkSync('/etc/hosts', path.join(ws, 'link.json'));
  for (const receipt of ['link.json', '/etc/hosts', '../../../../etc/hosts']) {
    const r = runAction(ws, { receipt, 'trusted-keys': PINNED });
    assert.equal(r.out.valid, 'false'); assert.equal(r.code, 1);
    assert.match(r.out.reason, /outside GITHUB_WORKSPACE|does not exist|neither/);
    assert.ok(!/localhost|Host Database/i.test(r.log), r.log);
  }
});

test('RT-4: invalid JSON in a workspace file is reported without a content snippet', () => {
  const ws = workspace({ 'r.json': 'SECRET_TOKEN=abcdef0123456789' });
  const r = runAction(ws, { receipt: 'r.json', 'trusted-keys': PINNED });
  assert.equal(r.out.valid, 'false'); assert.ok(!r.log.includes('SECRET'), r.log);
});

test('RT-5: trusted-keys that parses to zero keys must not fall back to the key directory', () => {
  const ws = workspace({ 'r.json': GENUINE, 'keys.txt': '# TODO pin key here\n#\n', 'dir.json': DIR });
  const r = runAction(ws, { receipt: 'r.json', 'trusted-keys': 'keys.txt', 'key-directory': 'dir.json', 'governance-key': GOV });
  assert.equal(r.out.valid, 'false'); assert.equal(r.code, 1); assert.match(r.out.reason, /contains no key/);
});
test('RT-5: comments with spaces are ignored; a malformed key fails closed with a clear reason', () => {
  const ws = workspace({ 'r.json': GENUINE, 'keys.txt': `# production receipt key, pinned 2026-10-06\n${PINNED} # kid 86c139c960bb274c\n` });
  assert.equal(runAction(ws, { receipt: 'r.json', 'trusted-keys': 'keys.txt' }).out.valid, 'true');
  const bad = runAction(ws, { receipt: 'r.json', 'trusted-keys': `${PINNED},AAAA` });
  assert.equal(bad.out.valid, 'false'); assert.match(bad.out.reason, /not an ML-DSA-65 public key/);
});

test('RT-6/RT-7: oversized body is cut at 2 MB while streaming; a stalled body hits the deadline', async () => {
  const chunk = Buffer.alloc(1 << 20, 0x61); let stalled;
  const srv = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/stall') { res.write('{'); stalled = res; return; }
    let n = 0; const pump = () => { while (n++ < 64) { if (!res.write(chunk)) return res.once('drain', pump); } res.end(); }; pump();
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port; const ws = workspace();
  try {
    const big = await runActionAsync(ws, { receipt: `http://127.0.0.1:${port}/big`, 'trusted-keys': PINNED });
    assert.equal(big.out.valid, 'false'); assert.match(big.out.reason, /larger than 2097152 bytes/);
    const t0 = Date.now();
    const slow = await runActionAsync(ws, { receipt: `http://127.0.0.1:${port}/stall`, 'trusted-keys': PINNED }, { PQC_VERIFY_FETCH_TIMEOUT_MS: '1000' });
    assert.equal(slow.out.valid, 'false'); assert.match(slow.out.reason, /timeout after 1000 ms/);
    assert.ok(Date.now() - t0 < 20_000, `stalled body held the step ${Date.now() - t0} ms`);
  } finally { srv.closeAllConnections(); srv.close(); if (stalled) stalled.destroy(); }
});

test('RT-8: a 64-hex receipt id is never shadowed by a workspace file of the same name', () => {
  const id = 'a'.repeat(64);
  const ws = workspace({ [id]: GENUINE });
  // key-directory on 127.0.0.1:9 (discard port, nothing listens) -> the id fetch fails closed instead of reading the file
  const r = runAction(ws, { receipt: id, 'key-directory': 'http://127.0.0.1:9/.well-known/x402-receipt-keys', 'trusted-keys': PINNED });
  assert.equal(r.out.valid, 'false'); assert.match(r.out.reason, /127\.0\.0\.1:9\/api\/midas\/alerts\/receipt\/a{64}/);
});

test('RT-9: a local key-directory file requires a pinned governance-key (attacker-signed directory refused)', () => {
  const atk = ml_dsa65.keygen(new Uint8Array(32).fill(7)), gov = ml_dsa65.keygen(new Uint8Array(32).fill(8));
  const apk = b64(atk.publicKey), gpk = b64(gov.publicKey);
  const keys = [{ kid: kidForKey(apk), use: 'x402-receipt', public_key_b64: apk, status: 'active', not_before: 0, not_after: null }];
  const root = directoryRoot(keys, '0'.repeat(64), 3, gpk); const sm = `${KEY_DIR_DOMAIN}\n${root}`;
  const evilDir = { spec: KEY_DIR_DOMAIN, epoch: 3, prev_root: '0'.repeat(64), root, keys, signed_message: sm, signature: b64(ml_dsa65.sign(utf8(sm), gov.secretKey)), directory_public_key: gpk };
  const f = structuredClone(GENUINE); f.canonical = f.canonical.replace('risk_tier=critical', 'risk_tier=safe'); f.facts.risk_tier = 'safe';
  f.receipt_id = sha256hex(f.canonical); f.served_message = `FRACTALAI-x402-served-v1\nmidas-alert\n${f.receipt_id}`;
  f.signature = b64(ml_dsa65.sign(utf8(f.served_message), atk.secretKey)); f.public_key = apk;
  const ws = workspace({ 'forged.json': f, 'dir.json': evilDir, 'real-dir.json': DIR, 'r.json': GENUINE });
  const r = runAction(ws, { receipt: 'forged.json', 'key-directory': 'dir.json' });
  assert.equal(r.out.valid, 'false'); assert.match(r.out.reason, /set governance-key/);
  assert.equal(runAction(ws, { receipt: 'forged.json', 'key-directory': 'dir.json', 'governance-key': GOV }).out.valid, 'false');
  const ok = runAction(ws, { receipt: 'r.json', 'key-directory': 'real-dir.json', 'governance-key': GOV });
  assert.equal(ok.out.valid, 'true', ok.log); assert.equal(ok.out.epoch, '3');
});

test('RT-11: epoch output of a rejected directory is empty (README interpolates it into run:)', () => {
  const d = structuredClone(DIR); d.epoch = '3$(touch /tmp/PWNED_BY_EPOCH)';
  const ws = workspace({ 'r.json': GENUINE, 'dir.json': d });
  const r = runAction(ws, { receipt: 'r.json', 'key-directory': 'dir.json', 'governance-key': GOV });
  assert.equal(r.out.valid, 'false'); assert.equal(r.out.epoch, '');
});

test('fail-on-invalid parsing: only false/0/no/off (any case, trimmed) soften; anything else stays fail-closed', () => {
  const ws = workspace({ 'r.json': JSON.parse(vec('tampered-fe62b072.json')) });
  for (const [v, code] of [['false ', 0], ['FALSE', 0], ['0', 0], ['off', 0], ['fasle', 1], ['', 1], ['true', 1], ['nope', 1]]) {
    const r = runAction(ws, { receipt: 'r.json', 'trusted-keys': PINNED, 'fail-on-invalid': v });
    assert.equal(r.code, code, `fail-on-invalid=${JSON.stringify(v)}`); assert.equal(r.out.valid, 'false');
  }
});
