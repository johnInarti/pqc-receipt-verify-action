// SPDX-License-Identifier: Apache-2.0
// Red-team 2026-10-06 (RT-1..RT-11) regressions, migrated to v2: runs dist/index.js exactly like the Actions
// runner (every action.yml input set, defaults applied; GITHUB_OUTPUT, GITHUB_STEP_SUMMARY, GITHUB_WORKSPACE)
// against adversarial inputs. Offline (only 127.0.0.1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { directoryRoot, kidForKey, sha256hex, KEY_DIR_DOMAIN } from '../vendor/pqc-receipts-colosseum/kernel/src/index.mjs';
import { ROOT, workspace, runAction as run, injectedCommandLines as commandLines } from './support/runner.mjs';

const vec = (f) => readFileSync(path.join(ROOT, 'test', 'vectors', f), 'utf8');
const GENUINE = JSON.parse(vec('genuine-fe62b072.json'));
const DIR = JSON.parse(vec('key-directory-epoch3.json'));
const b64 = (u) => Buffer.from(u).toString('base64'); const utf8 = (s) => new TextEncoder().encode(s);
const PINNED = GENUINE.public_key;
const GOV = DIR.directory_public_key;
// Offline by default: no step below may reach the public directory unless it asks for it.
const OFFLINE = { 'key-directory': '' };

test('baseline: genuine receipt + pinned key -> valid=true, exit 0, every output machine-safe', async () => {
  const ws = workspace({ 'r.json': GENUINE });
  const r = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED });
  assert.equal(r.code, 0, r.log); assert.equal(r.out.valid, 'true'); assert.equal(r.out.kid, '86c139c960bb274c');
  assert.deepEqual(Object.keys(r.out).sort(), ['authentic', 'codes', 'epoch', 'exit-code', 'finalized', 'integrity', 'kid', 'kind', 'reason', 'time_anchored', 'trust-basis', 'trusted', 'valid'].sort());
});

test('RT-10: valid=false is the FIRST output written (fail-closed before any work)', async () => {
  const ws = workspace({ 'r.json': GENUINE });
  await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED });
  assert.match(readFileSync(path.join(ws, '.out'), 'utf8'), /^valid<<ghadelim_[0-9a-f-]+\nfalse\n/);
});

test('RT-1/RT-2: newline + workflow-command payload in a receipt field cannot inject commands or markdown', async () => {
  const inj = structuredClone(GENUINE);
  inj.algorithm = 'x"\n::add-mask::false\n::stop-commands::pwn\r::notice::VALID ::set-output name=valid::true\n| valid | true |\n### VALID <img src=x>\u2028::warning::x\u202e';
  const ws = workspace({ 'r.json': inj });
  const r = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED });
  assert.equal(r.code, 1); assert.equal(r.out.valid, 'false');
  assert.deepEqual(commandLines(r.log), [], `injected workflow commands:\n${r.log}`);
  assert.ok(!r.out.reason.includes('\n'), 'reason output is one line');
  const sumLines = r.sum.split('\n');
  assert.equal(sumLines.filter((l) => l.startsWith('#')).length, 1, `injected heading:\n${r.sum}`);
  assert.ok(!sumLines.some((l) => /^\s*::|^\| valid \| true/.test(l)), `summary broken:\n${r.sum}`);
  assert.equal(sumLines.filter((l) => l.startsWith('|')).length, 16, `table rows changed:\n${r.sum}`);
  assert.ok(!r.sum.includes('<img'), 'raw HTML in summary');
  assert.ok(!/[\u2028\u2029\u202e]/.test(r.log + r.sum), 'line separator / bidi override reached the log');
});

test('RT-3/RT-4: symlink or absolute path outside the workspace is refused and file content is not echoed', async () => {
  const ws = workspace(); symlinkSync('/etc/hosts', path.join(ws, 'link.json'));
  for (const receipt of ['link.json', '/etc/hosts', '../../../../etc/hosts']) {
    const r = await run(ws, { ...OFFLINE, receipt, 'trusted-keys': PINNED });
    assert.equal(r.out.valid, 'false'); assert.equal(r.code, 1);
    assert.match(r.out.reason, /outside GITHUB_WORKSPACE|does not exist|neither/);
    assert.ok(!/localhost|Host Database/i.test(r.log), r.log);
  }
  // the same confinement applies to every file input (trust-roots, key-directory, anchor-refs, trusted-keys)
  for (const inputs of [{ 'trust-roots': 'link.json' }, { 'key-directory': 'link.json' }, { 'anchor-refs': 'link.json', anchors: 'true' }]) {
    writeFileSync(path.join(ws, 'r.json'), JSON.stringify(GENUINE));
    const r = await run(ws, { receipt: 'r.json', ...inputs });
    assert.equal(r.out.valid, 'false'); assert.match(r.out.reason, /outside GITHUB_WORKSPACE/); assert.ok(!/Host Database/i.test(r.log));
  }
});

test('RT-4: invalid JSON in a workspace file is reported without a content snippet', async () => {
  const ws = workspace({ 'r.json': 'SECRET_TOKEN=abcdef0123456789' });
  const r = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED });
  assert.equal(r.out.valid, 'false'); assert.ok(r.out.codes.split(',').includes('JSON_INVALID'));
  assert.ok(!r.log.includes('SECRET') && !r.sum.includes('SECRET'), r.log);
});

test('strict bytes: a BOM, invalid UTF-8 or a duplicate key in the receipt FILE is refused by the kernel', async () => {
  const txt = JSON.stringify(GENUINE);
  const cases = {
    'bom.json': ['\ufeff' + txt, 'JSON_INVALID'],
    'bad-utf8.json': [Buffer.concat([Buffer.from(txt.slice(0, -1) + ',"x":"'), Buffer.from([0xc3, 0x28]), Buffer.from('"}')]), 'JSON_INVALID'],
    'dup.json': [txt.slice(0, -1) + `,"signature":${JSON.stringify(GENUINE.signature)}}`, 'JSON_DUPLICATE_KEY'],
  };
  const ws = workspace(Object.fromEntries(Object.entries(cases).map(([f, [c]]) => [f, c])));
  for (const [f, [, code]] of Object.entries(cases)) {
    const r = await run(ws, { ...OFFLINE, receipt: f, 'trusted-keys': PINNED });
    assert.equal(r.out.valid, 'false', f); assert.equal(r.out.integrity, 'false', f); assert.ok(r.out.codes.split(',').includes(code), `${f}: ${r.out.codes}`);
  }
});

test('RT-5: trusted-keys that parses to zero keys is refused by the kernel (no fallback to the key directory)', async () => {
  const ws = workspace({ 'r.json': GENUINE, 'keys.txt': '# TODO pin key here\n#\n', 'dir.json': DIR });
  const r = await run(ws, { receipt: 'r.json', 'trusted-keys': 'keys.txt', 'key-directory': 'dir.json' });
  assert.equal(r.out.valid, 'false'); assert.equal(r.code, 1); assert.ok(r.out.codes.split(',').includes('NO_TRUST_SOURCE'), r.out.codes);
  assert.equal(r.out['trust-basis'], 'none'); assert.equal(r.out.epoch, ''); // the kernel never accepted the empty set as a trust source
});
test('RT-5: comments with spaces are ignored; a malformed key fails closed with a clear reason', async () => {
  const ws = workspace({ 'r.json': GENUINE, 'keys.txt': `# production receipt key, pinned 2026-10-06\n${PINNED} # kid 86c139c960bb274c\n` });
  assert.equal((await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': 'keys.txt' })).out.valid, 'true');
  const bad = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': `${PINNED},AAAA` });
  assert.equal(bad.out.valid, 'false'); assert.match(bad.out.reason, /not a canonical base64 ML-DSA-65 public key/); assert.equal(bad.out['exit-code'], '2');
});

test('RT-6/RT-7: oversized body is cut at 2 MiB while streaming; a stalled body hits the deadline; the step deadline is hard', async () => {
  const chunk = Buffer.alloc(1 << 20, 0x61); const stalled = [];
  const srv = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/stall') { res.write('{'); stalled.push(res); return; }
    let n = 0; const pump = () => { while (n++ < 64) { if (!res.write(chunk)) return res.once('drain', pump); } res.end(); }; pump();
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port; const ws = workspace();
  try {
    const big = await run(ws, { ...OFFLINE, receipt: `http://127.0.0.1:${port}/big`, 'trusted-keys': PINNED });
    assert.equal(big.out.valid, 'false'); assert.match(big.out.reason, /larger than 2097152 bytes/);
    let t0 = Date.now();
    const slow = await run(ws, { ...OFFLINE, receipt: `http://127.0.0.1:${port}/stall`, 'trusted-keys': PINNED }, { extraEnv: { PQC_VERIFY_FETCH_TIMEOUT_MS: '1000' } });
    assert.equal(slow.out.valid, 'false'); assert.match(slow.out.reason, /timeout after 1000 ms/);
    assert.ok(Date.now() - t0 < 20_000, `stalled body held the step ${Date.now() - t0} ms`);
    // whole-step watchdog: 20 s per attempt x 3 would be ~60 s; timeout-seconds=5 ends the step at ~5 s, valid=false
    t0 = Date.now();
    const hard = await run(ws, { ...OFFLINE, receipt: `http://127.0.0.1:${port}/stall`, 'trusted-keys': PINNED, 'timeout-seconds': '5' });
    assert.equal(hard.out.valid, 'false'); assert.equal(hard.code, 1); assert.match(hard.out.reason, /timeout: verification did not finish within 5 s/);
    assert.ok(Date.now() - t0 < 15_000, `hard deadline not enforced (${Date.now() - t0} ms)`);
  } finally { srv.closeAllConnections(); srv.close(); for (const s of stalled) s.destroy(); }
});

test('RT-8: a 64-hex receipt id is never shadowed by a workspace file of the same name', async () => {
  const id = 'a'.repeat(64);
  const ws = workspace({ [id]: GENUINE });
  // key-directory on 127.0.0.1:9 (discard port, nothing listens) -> the id fetch fails closed instead of reading the file
  const r = await run(ws, { receipt: id, 'key-directory': 'http://127.0.0.1:9/.well-known/x402-receipt-keys', 'trusted-keys': PINNED }, { extraEnv: { PQC_VERIFY_FETCH_TIMEOUT_MS: '1000' } });
  assert.equal(r.out.valid, 'false'); assert.match(r.out.reason, /127\.0\.0\.1:9\/api\/midas\/alerts\/receipt\/a{64}/);
  assert.equal(r.out['exit-code'], '3');
});
test('RT-8: expected-id input that contradicts the receipt id is a usage error', async () => {
  const r = await run(workspace(), { receipt: 'b'.repeat(64), 'expected-id': 'c'.repeat(64), 'key-directory': 'http://127.0.0.1:9/x' });
  assert.equal(r.out.valid, 'false'); assert.equal(r.out['exit-code'], '2');
});

test('RT-9: an attacker-signed key-directory FILE is refused by the PINNED governance key (v2: no governance-key needed)', async () => {
  const atk = ml_dsa65.keygen(new Uint8Array(32).fill(7)), gov = ml_dsa65.keygen(new Uint8Array(32).fill(8));
  const apk = b64(atk.publicKey), gpk = b64(gov.publicKey);
  const keys = [{ kid: kidForKey(apk), use: 'x402-receipt', public_key_b64: apk, status: 'active', not_before: 0, not_after: null }];
  const root = directoryRoot(keys, '0'.repeat(64), 3, gpk); const sm = `${KEY_DIR_DOMAIN}\n${root}`;
  const evilDir = { spec: KEY_DIR_DOMAIN, epoch: 3, prev_root: '0'.repeat(64), root, keys, signed_message: sm, signature: b64(ml_dsa65.sign(utf8(sm), gov.secretKey)), directory_public_key: gpk };
  const f = structuredClone(GENUINE); f.canonical = f.canonical.replace('risk_tier=critical', 'risk_tier=safe'); f.facts.risk_tier = 'safe';
  f.receipt_id = sha256hex(f.canonical); f.served_message = `FRACTALAI-x402-served-v1\nmidas-alert\n${f.receipt_id}`;
  f.signature = b64(ml_dsa65.sign(utf8(f.served_message), atk.secretKey)); f.public_key = apk;
  const ws = workspace({ 'forged.json': f, 'dir.json': evilDir, 'real-dir.json': DIR, 'r.json': GENUINE });
  const r = await run(ws, { receipt: 'forged.json', 'key-directory': 'dir.json' });
  assert.equal(r.out.valid, 'false'); assert.ok(r.out.codes.split(',').includes('DIRECTORY_SIGNER_NOT_PINNED'), r.out.codes);
  assert.equal((await run(ws, { receipt: 'forged.json', 'key-directory': 'dir.json', 'governance-key': GOV })).out.valid, 'false');
  const ok = await run(ws, { receipt: 'r.json', 'key-directory': 'real-dir.json' });
  assert.equal(ok.out.valid, 'true', ok.log); assert.equal(ok.out.epoch, '3'); assert.equal(ok.out['trust-basis'], 'pinned-root');
  // v1's governance-key input still works, now as an explicit override (reported)
  const pinnedGov = await run(ws, { receipt: 'r.json', 'key-directory': 'real-dir.json', 'governance-key': GOV });
  assert.equal(pinnedGov.out.valid, 'true'); assert.equal(pinnedGov.out['trust-basis'], 'override');
});

test('RT-11: epoch output of a rejected directory is empty (README interpolates it into run:)', async () => {
  const d = structuredClone(DIR); d.epoch = '3$(touch /tmp/PWNED_BY_EPOCH)';
  const ws = workspace({ 'r.json': GENUINE, 'dir.json': d });
  const r = await run(ws, { receipt: 'r.json', 'key-directory': 'dir.json' });
  assert.equal(r.out.valid, 'false'); assert.equal(r.out.epoch, '');
});

test('fail-on-invalid parsing: only false/0/no/off (any case, trimmed) soften; anything else stays fail-closed', async () => {
  const ws = workspace({ 'r.json': JSON.parse(vec('tampered-fe62b072.json')) });
  for (const [v, code] of [['false ', 0], ['FALSE', 0], ['0', 0], ['off', 0], ['fasle', 1], ['', 1], ['true', 1], ['nope', 1]]) {
    const r = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED, 'fail-on-invalid': v });
    assert.equal(r.code, code, `fail-on-invalid=${JSON.stringify(v)}`); assert.equal(r.out.valid, 'false');
  }
});
test('trust-widening booleans accept only true/false spellings; garbage is a usage error (valid=false)', async () => {
  const ws = workspace({ 'r.json': GENUINE });
  for (const name of ['allow-tls-directory', 'allow-testnet-anchors', 'anchors', 'require-known-anchorer']) {
    const r = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED, [name]: 'yes please' });
    assert.equal(r.out.valid, 'false', name); assert.equal(r.out['exit-code'], '2', name);
  }
  const lv = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED, require: 'integrity,authentic,trusted,everything' });
  assert.equal(lv.out.valid, 'false'); assert.ok(lv.out.codes.split(',').includes('INPUT_SHAPE'));
});
test('require: levels the caller does not need are not required (integrity is always included)', async () => {
  const ws = workspace({ 'r.json': GENUINE });
  const r = await run(ws, { ...OFFLINE, receipt: 'r.json', require: 'authentic' });
  assert.equal(r.out.valid, 'true', r.log); assert.equal(r.out.trusted, 'false'); assert.equal(r.out['trust-basis'], 'none');
});
test('kind is policy: an explicit empty kind is refused (KIND_UNKNOWN); the document cannot pick its kind', async () => {
  const ws = workspace({ 'r.json': GENUINE });
  const r = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED, kind: '' });
  assert.equal(r.out.valid, 'false'); assert.ok(r.out.codes.split(',').includes('KIND_UNKNOWN'));
  const wrong = await run(ws, { ...OFFLINE, receipt: 'r.json', 'trusted-keys': PINNED, kind: 'x402-seal' });
  assert.equal(wrong.out.valid, 'false'); assert.equal(wrong.out.integrity, 'false');
});
test('trust-roots override is reflected as trust-basis=override', async () => {
  const roots = JSON.parse(readFileSync(path.join(ROOT, 'vendor/pqc-receipts-colosseum/kernel/trust-roots.json'), 'utf8'));
  const ws = workspace({ 'r.json': GENUINE, 'dir.json': DIR, 'roots.json': roots });
  const r = await run(ws, { receipt: 'r.json', 'key-directory': 'dir.json', 'trust-roots': 'roots.json' });
  assert.equal(r.out.valid, 'true', r.log); assert.equal(r.out['trust-basis'], 'override');
  assert.match(r.log, /overrides: roots/);
});
