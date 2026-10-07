// SPDX-License-Identifier: Apache-2.0
// v1 verification-core tests, migrated to v2: the Action no longer has a verification core (src/verify.js is
// gone), so every v1 scenario now runs THROUGH dist/index.js and asserts the kernel's leveled verdict as the
// step outputs expose it. Uses the real public receipt fe62b072… and the real directory snapshot (epoch 3,
// verified against the PINNED roots), plus locally generated attacker keys/directories. No network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { directoryRoot, kidForKey, sha256hex, KEY_DIR_DOMAIN } from '../vendor/pqc-receipts-colosseum/kernel/src/index.mjs';
import { workspace, runAction } from './support/runner.mjs';

const load = (f) => JSON.parse(readFileSync(new URL(`./vectors/${f}`, import.meta.url), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const GENUINE = load('genuine-fe62b072.json');
const TAMPERED = load('tampered-fe62b072.json');
const DIR = load('key-directory-epoch3.json');
const CONF = load('conformance-x402-served.json');
const b64 = (u8) => Buffer.from(u8).toString('base64');
const utf8 = (s) => new TextEncoder().encode(s);
const seed = (byte) => new Uint8Array(32).fill(byte);

/** Run the Action on one receipt. `dir` = directory object (file), `inputs` = extra step inputs. */
async function check(receipt, { dir = DIR, inputs = {} } = {}) {
  const files = { 'r.json': typeof receipt === 'string' ? receipt : JSON.stringify(receipt) };
  if (dir) files['dir.json'] = dir;
  const r = await runAction(workspace(files), { receipt: 'r.json', 'key-directory': dir ? 'dir.json' : '', ...inputs });
  return { ...r.out, codes: (r.out.codes || '').split(',').filter(Boolean), code: r.code, log: r.log };
}
/** Re-sign a receipt with an attacker key (fully self-consistent: id, served_message, signature, facts). */
function forge(base, kp, mutate = (c) => c) {
  const r = clone(base);
  r.canonical = mutate(r.canonical);
  r.receipt_id = sha256hex(r.canonical);
  r.served_message = `FRACTALAI-x402-served-v1\nmidas-alert\n${r.receipt_id}`;
  r.signature = b64(ml_dsa65.sign(utf8(r.served_message), kp.secretKey));
  r.public_key = b64(kp.publicKey);
  for (const line of r.canonical.split('\n').slice(1)) { const [k, v] = line.split('='); if (r.facts && k in r.facts) r.facts[k] = typeof r.facts[k] === 'number' ? Number(v) : v; }
  return r;
}
/** A properly signed directory under our own (non-pinned) governance key. */
function makeDir(keys, govKp, epoch = 1) {
  const gk = b64(govKp.publicKey);
  const root = directoryRoot(keys, '0'.repeat(64), epoch, gk);
  const signed_message = `${KEY_DIR_DOMAIN}\n${root}`;
  return { spec: KEY_DIR_DOMAIN, epoch, prev_root: '0'.repeat(64), root, keys, signed_message, signature: b64(ml_dsa65.sign(utf8(signed_message), govKp.secretKey)), directory_public_key: gk };
}

test('genuine real receipt + real directory (epoch 3) -> valid, pinned-root, kid 86c139c960bb274c', async () => {
  const r = await check(GENUINE);
  assert.equal(r.valid, 'true', r.log);
  assert.equal(r.kid, '86c139c960bb274c'); assert.equal(r.epoch, '3'); assert.equal(r['trust-basis'], 'pinned-root');
  assert.deepEqual([r.integrity, r.authentic, r.trusted, r.time_anchored, r.finalized], ['true', 'true', 'true', '', '']);
  assert.equal(r['exit-code'], '0'); assert.equal(r.kind, 'midas-alert');
});
test('genuine receipt + pinned trusted key (offline) -> valid, trust-basis=override', async () => {
  const r = await check(GENUINE, { dir: null, inputs: { 'trusted-keys': GENUINE.public_key } });
  assert.equal(r.valid, 'true', r.log); assert.equal(r['trust-basis'], 'override'); assert.equal(r.epoch, '');
  assert.match(r.log, /::notice::PQC receipt verified with trust_basis=override/);
});
test('FAIL-CLOSED: genuine receipt with no trusted keys and no directory -> authentic but not trusted', async () => {
  const r = await check(GENUINE, { dir: null });
  assert.equal(r.valid, 'false'); assert.equal(r.authentic, 'true'); assert.equal(r.trusted, 'false');
  assert.ok(r.codes.includes('NO_TRUST_SOURCE')); assert.equal(r['exit-code'], '12');
});
test('tampered vector (debt_usd edited in canonical + facts) -> integrity fails', async () => {
  const r = await check(TAMPERED);
  assert.equal(r.valid, 'false'); assert.equal(r.integrity, 'false'); assert.ok(r.codes.includes('RECEIPT_ID_MISMATCH'), r.codes);
});
test('facts-only edit (signed canonical untouched) -> integrity fails (UNSIGNED_FIELD_MISMATCH)', async () => {
  const t = clone(GENUINE); t.facts.health_factor = 1.5;
  const r = await check(t); assert.equal(r.valid, 'false'); assert.ok(r.codes.includes('UNSIGNED_FIELD_MISMATCH'), r.codes);
});
test('unsigned extra field injected into facts -> invalid', async () => {
  const t = clone(GENUINE); t.facts.liquidated = true;
  assert.equal((await check(t)).valid, 'false');
});
test('top-level emitted_at moved -> invalid', async () => {
  const t = clone(GENUINE); t.emitted_at = 1700000000;
  assert.equal((await check(t)).valid, 'false');
});
test('signature byte flipped -> integrity ok, authentic false', async () => {
  const t = clone(GENUINE); const s = Buffer.from(t.signature, 'base64'); s[100] ^= 0x01; t.signature = s.toString('base64');
  const r = await check(t);
  assert.equal(r.valid, 'false'); assert.equal(r.integrity, 'true'); assert.equal(r.authentic, 'false');
  assert.ok(r.codes.includes('SIGNATURE_INVALID')); assert.equal(r.kid, '');
});
test('served_message rebound to another resource -> invalid', async () => {
  const t = clone(GENUINE); t.served_message = t.served_message.replace('midas-alert', 'verify-agent'); delete t.served_domain;
  assert.equal((await check(t)).valid, 'false');
});
test('non-canonical base64 signature (whitespace) -> invalid', async () => {
  const t = clone(GENUINE); t.signature = t.signature.slice(0, 10) + ' ' + t.signature.slice(10);
  const r = await check(t); assert.equal(r.valid, 'false'); assert.equal(r.integrity, 'false');
});
test('FORGERY: attacker re-signs edited facts with own key -> authentic but not trusted (directory and pinned set)', async () => {
  const atk = ml_dsa65.keygen(seed(7));
  const f = forge(GENUINE, atk, (c) => c.replace('risk_tier=critical', 'risk_tier=safe'));
  const viaDir = await check(f);
  assert.equal(viaDir.valid, 'false'); assert.equal(viaDir.authentic, 'true'); assert.ok(viaDir.codes.includes('KEY_NOT_LISTED'), viaDir.codes);
  const viaPin = await check(f, { dir: null, inputs: { 'trusted-keys': GENUINE.public_key } });
  assert.equal(viaPin.valid, 'false'); assert.equal(viaPin.authentic, 'true'); assert.ok(viaPin.codes.includes('KEY_NOT_IN_PINNED_SET'));
});
test('tampered directory (key status edited, signature kept) -> invalid', async () => {
  const d = clone(DIR); d.keys.find((k) => k.kid === '86c139c960bb274c').status = 'revoked';
  const r = await check(GENUINE, { dir: d });
  assert.equal(r.valid, 'false'); assert.ok(r.codes.includes('DIRECTORY_INVALID'), r.codes); assert.equal(r.epoch, '');
});
test('attacker-signed directory listing attacker key -> refused by the PINNED governance key (no input needed)', async () => {
  const atk = ml_dsa65.keygen(seed(9)); const gov = ml_dsa65.keygen(seed(10)); const pk = b64(atk.publicKey);
  const d = makeDir([{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, status: 'active', not_before: 0, not_after: null }], gov);
  const f = forge(GENUINE, atk);
  const r = await check(f, { dir: d });
  assert.equal(r.valid, 'false'); assert.ok(r.codes.includes('DIRECTORY_SIGNER_NOT_PINNED'), r.codes);
  // v1 compatibility: governance-key set to the real FractalAI key still refuses it
  assert.equal((await check(f, { dir: d, inputs: { 'governance-key': DIR.directory_public_key } })).valid, 'false');
});
test('key windows (under an explicit governance-key override): retiring only inside its window; not-yet-valid/reserved/revoked refused', async () => {
  const k = ml_dsa65.keygen(seed(11)); const gov = ml_dsa65.keygen(seed(12));
  const pk = b64(k.publicKey); const f = forge(GENUINE, k); const gk = b64(gov.publicKey);
  const emitted = Number(f.facts.emitted_at);
  const entry = (o) => [{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, ...o }];
  const run = (o) => check(f, { dir: makeDir(entry(o), gov), inputs: { 'governance-key': gk } });
  const ok = await run({ status: 'retiring', not_before: 0, not_after: emitted + 1 });
  assert.equal(ok.valid, 'true', ok.log); assert.equal(ok['trust-basis'], 'override');
  assert.equal((await run({ status: 'retiring', not_before: 0, not_after: emitted - 1 })).valid, 'false');
  assert.equal((await run({ status: 'active', not_before: emitted + 10, not_after: null })).valid, 'false');
  assert.equal((await run({ status: 'reserved', not_before: null, not_after: null })).valid, 'false');
  assert.equal((await run({ status: 'revoked', not_before: 0, not_after: null })).valid, 'false');
});
test('expected-id binds a receipt file to the requested id', async () => {
  assert.equal((await check(GENUINE, { inputs: { 'expected-id': GENUINE.receipt_id } })).valid, 'true');
  const r = await check(GENUINE, { inputs: { 'expected-id': 'a'.repeat(64) } });
  assert.equal(r.valid, 'false'); assert.ok(r.codes.includes('EXPECTED_ID_MISMATCH'));
});
test('conformance vector x402-served (kind=served-proof): genuine / no-trust / tamper / forgery', async () => {
  const pin = { kind: 'served-proof', 'trusted-keys': CONF.trusted_public_key };
  assert.equal((await check(CONF.valid, { dir: null, inputs: pin })).valid, 'true');
  assert.equal((await check(CONF.valid, { dir: null, inputs: { kind: 'served-proof' } })).valid, 'false');
  assert.equal((await check(CONF.tampered, { dir: null, inputs: pin })).valid, 'false');
  const fr = await check(CONF.forged, { dir: null, inputs: pin });
  assert.equal(fr.valid, 'false'); assert.equal(fr.authentic, 'true');
  // v2: the default policy kind is midas-alert; a served proof is not accepted unless the caller asks for it
  const wrongKind = await check(CONF.valid, { dir: null, inputs: { 'trusted-keys': CONF.trusted_public_key } });
  assert.equal(wrongKind.valid, 'false'); assert.equal(wrongKind.integrity, 'false');
});
test('reserved route x402-attest-decision refused in served-proof shape', async () => {
  const t = clone(CONF.valid); t.route_id = 'x402-attest-decision';
  t.signed_message = `${t.domain}\n${t.route_id}\n${t.digest}`;
  const r = await check(t, { dir: null, inputs: { kind: 'served-proof', 'trusted-keys': CONF.trusted_public_key } });
  assert.equal(r.valid, 'false'); assert.ok(r.codes.includes('ROUTE_RESERVED'), r.codes);
});

// ---- red-team 2026-10-06 regressions (core) ----
test('RT-13: served proof from a RETIRING key cannot be backdated with an unsigned top-level emitted_at', async () => {
  const k = ml_dsa65.keygen(seed(21)); const gov = ml_dsa65.keygen(seed(22)); const pk = b64(k.publicKey);
  const digest = sha256hex('signed after not_after'); const sm = `FRACTALAI-x402-served-v1\nverify-agent\n${digest}`;
  const proof = { domain: 'FRACTALAI-x402-served-v1', route_id: 'verify-agent', digest, signed_message: sm, signature: b64(ml_dsa65.sign(utf8(sm), k.secretKey)), public_key: pk, emitted_at: 1600000000 };
  const d = makeDir([{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, status: 'retiring', not_before: 0, not_after: 1700000000 }], gov);
  const r = await check(proof, { dir: d, inputs: { kind: 'served-proof', 'governance-key': b64(gov.publicKey) } });
  assert.equal(r.valid, 'false', r.reason); assert.equal(r.authentic, 'true'); assert.equal(r.trusted, 'false');
});
test('RT-13: receipt whose canonical is not key=value cannot use unsigned top-level emitted_at for a retiring key', async () => {
  const k = ml_dsa65.keygen(seed(23)); const gov = ml_dsa65.keygen(seed(24)); const pk = b64(k.publicKey);
  const f = forge(GENUINE, k, () => 'FRACTALAI-midas-alert-v1\nnot-key-value');
  delete f.facts; delete f.domain; f.emitted_at = 1600000000;
  const d = makeDir([{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, status: 'retiring', not_before: 0, not_after: 1700000000 }], gov);
  assert.equal((await check(f, { dir: d, inputs: { 'governance-key': b64(gov.publicKey) } })).valid, 'false');
});
test('RT-12: directory listing the same key twice (active + revoked) is rejected', async () => {
  const k = ml_dsa65.keygen(seed(25)); const gov = ml_dsa65.keygen(seed(26)); const pk = b64(k.publicKey);
  const e = { kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, not_before: 0, not_after: null };
  const d = makeDir([{ ...e, status: 'active' }, { ...e, status: 'revoked' }], gov);
  const r = await check(forge(GENUINE, k), { dir: d, inputs: { 'governance-key': b64(gov.publicKey) } });
  assert.equal(r.valid, 'false'); assert.ok(r.codes.includes('DIRECTORY_INVALID'), r.codes);
});
test('RT-11: a rejected directory never surfaces its (attacker-controlled) epoch; non-integer epoch rejected', async () => {
  const d = clone(DIR); d.epoch = '3$(touch /tmp/pwned)';
  const r = await check(GENUINE, { dir: d });
  assert.equal(r.valid, 'false'); assert.equal(r.epoch, '');
  const k = ml_dsa65.keygen(seed(27)); const gov = ml_dsa65.keygen(seed(28)); const pk = b64(k.publicKey);
  const sd = makeDir([{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, status: 'active', not_before: 0, not_after: null }], gov, '1;id');
  const r2 = await check(forge(GENUINE, k), { dir: sd, inputs: { 'governance-key': b64(gov.publicKey) } });
  assert.equal(r2.valid, 'false'); assert.equal(r2.epoch, ''); assert.ok(r2.codes.includes('DIRECTORY_INVALID'));
});
test('anti-rollback: an older genuine epoch cannot replace the pinned checkpoint', async () => {
  const d = clone(DIR); d.epoch = 2; // root no longer recomputes either way; the kernel refuses before trusting any key
  const r = await check(GENUINE, { dir: d });
  assert.equal(r.valid, 'false'); assert.equal(r.trusted, 'false');
});
