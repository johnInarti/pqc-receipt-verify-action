// SPDX-License-Identifier: Apache-2.0
// Offline tests of the verification core. Uses the real public receipt fe62b072… and a snapshot of the
// real key directory (epoch 3), plus locally generated attacker keys/directories. No network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { verifyReceipt, checkDirectory, directoryRoot, kidForKey, sha256hex, KEY_DIR_DOMAIN } from '../src/verify.js';

const load = (f) => JSON.parse(readFileSync(new URL(`./vectors/${f}`, import.meta.url), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const GENUINE = load('genuine-fe62b072.json');
const TAMPERED = load('tampered-fe62b072.json');
const DIR = load('key-directory-epoch3.json');
const CONF = load('conformance-x402-served.json');
const b64 = (u8) => Buffer.from(u8).toString('base64');
const utf8 = (s) => new TextEncoder().encode(s);
const seed = (byte) => new Uint8Array(32).fill(byte);

/** Re-sign a receipt with an attacker key (fully self-consistent: id, served_message, signature). */
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
/** Build a properly signed directory with our own governance key (for window/status tests). */
function makeDir(keys, govKp, epoch = 1) {
  const gk = b64(govKp.publicKey);
  const root = directoryRoot(keys, '0'.repeat(64), epoch, gk);
  const signed_message = `${KEY_DIR_DOMAIN}\n${root}`;
  return { spec: KEY_DIR_DOMAIN, epoch, prev_root: '0'.repeat(64), root, keys, signed_message, signature: b64(ml_dsa65.sign(utf8(signed_message), govKp.secretKey)), directory_public_key: gk };
}

test('genuine real receipt + real directory (epoch 3) -> valid, kid 86c139c960bb274c', () => {
  const r = verifyReceipt(GENUINE, { directory: DIR });
  assert.equal(r.valid, true, r.reason);
  assert.equal(r.kid, '86c139c960bb274c');
  assert.equal(r.epoch, '3');
  assert.equal(r.checks.key_status, 'active');
});
test('real directory integrity verifies (signature + root recompute + kid binding)', () => {
  assert.equal(checkDirectory(DIR).ok, true);
  assert.equal(checkDirectory(DIR).trust, 'tls-only');
  assert.equal(checkDirectory(DIR, { governanceKey: DIR.directory_public_key }).trust, 'pinned-governance-key');
});
test('genuine receipt + pinned trusted key (offline) -> valid', () => {
  const r = verifyReceipt(GENUINE, { trustedKeys: [GENUINE.public_key] });
  assert.equal(r.valid, true, r.reason);
  assert.equal(r.keyTrust, 'pinned');
});
test('FAIL-CLOSED: genuine receipt with no trusted keys and no directory -> invalid', () => {
  const r = verifyReceipt(GENUINE, {});
  assert.equal(r.valid, false);
  assert.equal(r.signatureValid, true);
});
test('tampered vector (debt_usd edited in canonical + facts) -> invalid', () => {
  const r = verifyReceipt(TAMPERED, { directory: DIR });
  assert.equal(r.valid, false);
  assert.match(r.reason, /sha256\(canonical\) != receipt_id/);
});
test('facts-only edit (signed canonical untouched) -> invalid', () => {
  const t = clone(GENUINE); t.facts.health_factor = 1.5;
  const r = verifyReceipt(t, { directory: DIR });
  assert.equal(r.valid, false); assert.match(r.reason, /health_factor/);
});
test('unsigned extra field injected into facts -> invalid', () => {
  const t = clone(GENUINE); t.facts.liquidated = true;
  assert.equal(verifyReceipt(t, { directory: DIR }).valid, false);
});
test('top-level emitted_at moved -> invalid', () => {
  const t = clone(GENUINE); t.emitted_at = 1700000000;
  assert.equal(verifyReceipt(t, { directory: DIR }).valid, false);
});
test('signature byte flipped -> invalid', () => {
  const t = clone(GENUINE); const s = Buffer.from(t.signature, 'base64'); s[100] ^= 0x01; t.signature = s.toString('base64');
  const r = verifyReceipt(t, { directory: DIR });
  assert.equal(r.valid, false); assert.equal(r.checks.ml_dsa65_signature_valid, false);
});
test('served_message rebound to another resource -> invalid', () => {
  const t = clone(GENUINE); t.served_message = t.served_message.replace('midas-alert', 'verify-agent'); delete t.served_domain;
  assert.equal(verifyReceipt(t, { directory: DIR }).valid, false);
});
test('non-canonical base64 signature (whitespace) -> invalid', () => {
  const t = clone(GENUINE); t.signature = t.signature.slice(0, 10) + ' ' + t.signature.slice(10);
  assert.equal(verifyReceipt(t, { directory: DIR }).valid, false);
});
test('FORGERY: attacker re-signs edited facts with own key -> signature valid but key untrusted -> invalid', () => {
  const atk = ml_dsa65.keygen(seed(7));
  const f = forge(GENUINE, atk, (c) => c.replace('risk_tier=critical', 'risk_tier=safe'));
  const viaDir = verifyReceipt(f, { directory: DIR });
  assert.equal(viaDir.valid, false); assert.equal(viaDir.signatureValid, true); assert.match(viaDir.reason, /NOT in the key directory/);
  const viaPin = verifyReceipt(f, { trustedKeys: [GENUINE.public_key] });
  assert.equal(viaPin.valid, false); assert.equal(viaPin.signatureValid, true);
});
test('tampered directory (key status edited, signature kept) -> invalid', () => {
  const d = clone(DIR); d.keys.find((k) => k.kid === '86c139c960bb274c').status = 'revoked';
  const r = verifyReceipt(GENUINE, { directory: d });
  assert.equal(r.valid, false); assert.match(r.reason, /root does not recompute/);
});
test('attacker-signed directory listing attacker key -> rejected when governance key is pinned', () => {
  const atk = ml_dsa65.keygen(seed(9)); const gov = ml_dsa65.keygen(seed(10));
  const pk = b64(atk.publicKey);
  const d = makeDir([{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, status: 'active', not_before: 0, not_after: null }], gov);
  const f = forge(GENUINE, atk);
  assert.equal(verifyReceipt(f, { directory: d, governanceKey: DIR.directory_public_key }).valid, false);
});
test('key windows: retiring accepted only if emitted_at <= not_after; reserved/revoked rejected', () => {
  const k = ml_dsa65.keygen(seed(11)); const gov = ml_dsa65.keygen(seed(12));
  const pk = b64(k.publicKey); const f = forge(GENUINE, k);
  const emitted = Number(f.facts.emitted_at);
  const entry = (o) => [{ kid: kidForKey(pk), use: 'x402-receipt', public_key_b64: pk, ...o }];
  assert.equal(verifyReceipt(f, { directory: makeDir(entry({ status: 'retiring', not_before: 0, not_after: emitted + 1 }), gov) }).valid, true);
  assert.equal(verifyReceipt(f, { directory: makeDir(entry({ status: 'retiring', not_before: 0, not_after: emitted - 1 }), gov) }).valid, false);
  assert.equal(verifyReceipt(f, { directory: makeDir(entry({ status: 'active', not_before: emitted + 10, not_after: null }), gov) }).valid, false);
  assert.equal(verifyReceipt(f, { directory: makeDir(entry({ status: 'reserved', not_before: null, not_after: null }), gov) }).valid, false);
  assert.equal(verifyReceipt(f, { directory: makeDir(entry({ status: 'revoked', not_before: 0, not_after: null }), gov) }).valid, false);
});
test('fetched-by-id receipt must carry the requested id', () => {
  assert.equal(verifyReceipt(GENUINE, { directory: DIR, expectedId: GENUINE.receipt_id }).valid, true);
  assert.equal(verifyReceipt(GENUINE, { directory: DIR, expectedId: 'a'.repeat(64) }).valid, false);
});
test('conformance vector x402-served: genuine/no-trust/tamper/forgery (same 4 assertions as check.mjs)', () => {
  const trusted = [CONF.trusted_public_key];
  assert.equal(verifyReceipt(CONF.valid, { trustedKeys: trusted }).valid, true);
  assert.equal(verifyReceipt(CONF.valid, {}).valid, false);
  assert.equal(verifyReceipt(CONF.tampered, { trustedKeys: trusted }).valid, false);
  const fr = verifyReceipt(CONF.forged, { trustedKeys: trusted });
  assert.equal(fr.valid, false); assert.equal(fr.signatureValid, true);
});
test('reserved route x402-attest-decision refused in served-proof shape', () => {
  const t = clone(CONF.valid); t.route_id = 'x402-attest-decision';
  t.signed_message = `${t.domain}\n${t.route_id}\n${t.digest}`;
  assert.equal(verifyReceipt(t, { trustedKeys: [CONF.trusted_public_key] }).valid, false);
});
