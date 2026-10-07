// SPDX-License-Identifier: Apache-2.0
/**
 * Pure, offline verification core for FractalAI ML-DSA-65 (FIPS 204) signed receipts.
 *
 * Semantics follow the public reference verifier (pqc-receipts-colosseum/verifier/verify-midas-alert.mjs)
 * and the conformance key-directory checker (conformance/src/key-directory.mjs). FAIL-CLOSED:
 * a receipt is `valid` only if EVERY integrity check passes AND the signing key is trusted
 * (pinned via `trustedKeys`, or listed as active/retiring-in-window in an integrity-checked
 * key directory). A signature that verifies under an unknown key is NOT valid.
 *
 * No network here — the caller supplies the receipt and (optionally) the directory object.
 */
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { createHash } from 'node:crypto';

export const SERVED_PREFIX = 'FRACTALAI-x402-served-v1';
export const KEY_DIR_DOMAIN = 'FRACTALAI-key-directory-v1';
export const ML_DSA_65_PK_BYTES = 1952;
export const ML_DSA_65_SIG_BYTES = 3309;
const ZERO_ROOT = '0'.repeat(64);

const utf8 = (s) => new TextEncoder().encode(s);
export const sha256hex = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
/** kid = sha256(public_key_b64)[:16] — same binding the key directory enforces (red-team C2). */
export const kidForKey = (publicKeyB64) => sha256hex(publicKeyB64).slice(0, 16);

const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
/** Strict base64 decode: rejects non-base64 characters instead of silently skipping them. */
export function b64decode(s) {
  if (typeof s !== 'string') throw new Error('not a string');
  const t = s.trim();
  if (t.length === 0 || t.length % 4 !== 0 || !B64_RE.test(t)) throw new Error('not canonical base64');
  return new Uint8Array(Buffer.from(t, 'base64'));
}
/** Normalise a base64 public key (decode + re-encode) so formatting differences cannot alias keys. */
export const normKey = (b64) => Buffer.from(b64decode(b64)).toString('base64');

/** RFC 8785-style canonical JSON (sorted keys, no whitespace), depth/node-limited — copy of verifier/src/canon.mjs. */
const MAX_DEPTH = 24;
const MAX_NODES = 10_000;
export function jcs(v, depth = 0, counter = { n: 0 }) {
  if (++counter.n > MAX_NODES) throw new Error(`jcs: too many nodes (>${MAX_NODES})`);
  if (depth > MAX_DEPTH) throw new Error(`jcs: nesting depth exceeds ${MAX_DEPTH}`);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error('jcs: non-finite number');
    return JSON.stringify(v);
  }
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map((x) => jcs(x, depth + 1, counter)).join(',') + ']';
  if (typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + jcs(v[k], depth + 1, counter)).join(',') + '}';
  }
  throw new Error(`jcs: unsupported ${typeof v}`);
}

export function directoryRoot(keys, prevRoot, epoch, governanceKeyB64) {
  const canonicalKeys = [...keys].sort((a, b) => (a.kid < b.kid ? -1 : a.kid > b.kid ? 1 : 0));
  return sha256hex(jcs({ epoch, prev_root: prevRoot || ZERO_ROOT, governance_key: governanceKeyB64 || null, keys: canonicalKeys }));
}

/**
 * Integrity check of a key-directory epoch (mirrors conformance/src/key-directory.mjs verifyDirectory):
 * governance ML-DSA-65 signature over `FRACTALAI-key-directory-v1\n<root>`, root recomputes over the
 * full key objects + prev_root + epoch + governance key, every kid == sha256(public_key)[:16].
 * If `governanceKey` is given, the directory signer must equal it (pinned trust root); otherwise the
 * directory's authenticity rests on TLS to its origin — reported as trust = "tls-only".
 */
export function checkDirectory(dir, { governanceKey } = {}) {
  const NO = (reason) => ({ ok: false, reason, trust: 'none' });
  try {
    if (!dir || typeof dir !== 'object') return NO('key directory is not a JSON object');
    if (dir.spec !== KEY_DIR_DOMAIN) return NO(`key directory spec is not ${KEY_DIR_DOMAIN}`);
    if (!Array.isArray(dir.keys)) return NO('key directory has no keys[]');
    // RT-11: epoch is a non-negative integer (it is echoed as an output that workflows interpolate).
    if (!Number.isSafeInteger(dir.epoch) || dir.epoch < 0) return NO('key directory epoch is not a non-negative integer');
    const pk = b64decode(dir.directory_public_key);
    const sig = b64decode(dir.signature);
    if (pk.length !== ML_DSA_65_PK_BYTES) return NO('directory governance key is not 1952 bytes (not ML-DSA-65)');
    if (sig.length !== ML_DSA_65_SIG_BYTES) return NO('directory signature is not 3309 bytes (not ML-DSA-65)');
    const seenKid = new Set();
    const seenKey = new Set();
    for (const k of dir.keys) {
      if (!k || typeof k.public_key_b64 !== 'string' || k.kid !== kidForKey(k.public_key_b64)) {
        return NO('directory has a kid != sha256(public_key)[:16] (forged/aliased kid)');
      }
      // RT-12: one entry per key. Duplicates (e.g. an old "active" entry plus a later "revoked" one for the
      // same key) are ambiguous, and a first-match lookup would honour the stale "active" entry.
      let nk;
      try { nk = normKey(k.public_key_b64); } catch { return NO('directory key is not canonical base64'); }
      if (seenKid.has(k.kid) || seenKey.has(nk)) return NO('directory lists the same key more than once (ambiguous status)');
      seenKid.add(k.kid); seenKey.add(nk);
    }
    const root = directoryRoot(dir.keys, dir.prev_root, dir.epoch, dir.directory_public_key);
    if (root !== dir.root) return NO('directory root does not recompute over keys/epoch/prev_root/governance key (tampered)');
    if (dir.signed_message !== `${KEY_DIR_DOMAIN}\n${dir.root}`) return NO('directory signed_message is not domain\\nroot');
    if (ml_dsa65.verify(sig, utf8(dir.signed_message), pk) !== true) return NO('directory governance signature does not verify');
    if (governanceKey) {
      if (normKey(governanceKey) !== normKey(dir.directory_public_key)) return NO('directory signer != pinned governance key');
      return { ok: true, reason: 'directory signature + root verified; signer matches pinned governance key', trust: 'pinned-governance-key' };
    }
    return { ok: true, reason: 'directory signature + root verified; signer authenticity rests on TLS (no pinned governance key, no on-chain anchor)', trust: 'tls-only' };
  } catch (e) {
    return NO(`directory verify error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Parse a `DOMAIN\nk=v\nk=v…` canonical string. Returns null if it is not in that shape. */
export function parseCanonical(canonical) {
  const lines = canonical.split('\n');
  if (lines.length < 2) return null;
  const fields = {};
  for (const line of lines.slice(1)) {
    const i = line.indexOf('=');
    if (i <= 0) return null;
    const k = line.slice(0, i);
    if (Object.prototype.hasOwnProperty.call(fields, k)) return null; // duplicate key = ambiguous
    fields[k] = line.slice(i + 1);
  }
  return { domain: lines[0], fields };
}

const scalarString = (v) => (v === null ? 'null' : typeof v === 'object' ? undefined : String(v));

/**
 * Key-trust step shared by both receipt shapes. FAIL-CLOSED.
 * `emitted` may be undefined (bare served proofs carry no timestamp): then only an "active" directory
 * key with no validity window violation at "now" is accepted — a retiring key needs a signed emitted_at.
 */
function trustStep(publicKeyB64, kid, emitted, opts, checks, fail) {
  const pkNorm = normKey(publicKeyB64);
  const trusted = (opts.trustedKeys || []).filter(Boolean);
  if (trusted.length > 0) {
    let set;
    try { set = new Set(trusted.map(normKey)); } catch (e) { return fail(`trusted-keys contains a non-base64 entry: ${e.message}`, { kid, signatureValid: true }); }
    checks.key_in_trusted_set = set.has(pkNorm);
    if (!checks.key_in_trusted_set) return fail('signature verifies but the key is NOT in trusted-keys', { kid, signatureValid: true });
    return { valid: true, reason: 'authentic: ML-DSA-65 signature verifies under a pinned trusted key', kid, epoch: '', signatureValid: true, keyTrust: 'pinned', checks };
  }
  const dir = opts.directory;
  if (!dir) return fail('no trusted-keys and no key directory supplied (fail-closed)', { kid, signatureValid: true });
  const d = checkDirectory(dir, { governanceKey: opts.governanceKey });
  checks.key_directory_integrity = d.ok;
  // RT-11: the epoch of a directory that failed verification is attacker-controlled; never surface it.
  if (!d.ok) return fail(`key directory rejected: ${d.reason}`, { kid, signatureValid: true });
  const epoch = String(dir.epoch);
  const entry = dir.keys.find((k) => { try { return normKey(k.public_key_b64) === pkNorm; } catch { return false; } });
  checks.key_in_directory = !!entry;
  if (!entry) return fail('signature verifies but the key is NOT in the key directory', { kid, epoch, signatureValid: true });
  if (entry.use !== undefined && entry.use !== 'x402-receipt') return fail(`directory key use is "${entry.use}", not x402-receipt`, { kid, epoch, signatureValid: true });
  const nb = entry.not_before == null ? null : Number(entry.not_before);
  const na = entry.not_after == null ? null : Number(entry.not_after);
  let statusOk = false;
  let when;
  if (emitted === undefined || emitted === null || emitted === '') {
    when = Math.floor((opts.now ?? Date.now()) / 1000);
    statusOk = entry.status === 'active' && (nb === null || when >= nb) && (na === null || when <= na);
  } else {
    when = Number(emitted);
    if (!Number.isFinite(when)) return fail('emitted_at is not a number', { kid, epoch, signatureValid: true });
    if (entry.status === 'active') statusOk = (nb === null || when >= nb) && (na === null || when <= na);
    else if (entry.status === 'retiring') statusOk = na !== null && when <= na && (nb === null || when >= nb);
  }
  checks.key_status = entry.status;
  checks.key_status_ok_at_emission = statusOk;
  if (!statusOk) return fail(`key status "${entry.status}" does not authorise a receipt emitted at ${when} (accepted: active, or retiring with signed emitted_at <= not_after)`, { kid, epoch, signatureValid: true });
  return {
    valid: true,
    reason: `authentic: ML-DSA-65 signature verifies; key ${entry.kid} is "${entry.status}" in key directory epoch ${epoch} (directory trust: ${d.trust})`,
    kid, epoch, signatureValid: true, keyTrust: `directory:${d.trust}`, checks,
  };
}

const RESERVED_ROUTES = new Set(['x402-attest-decision']); // reserved for the acp-verdict profile (conformance H3)

/** Bare served-proof shape (conformance profile "x402-served"): {domain, route_id, digest, signed_message, signature, public_key}. */
function verifyServedProof(e, opts, checks, fail) {
  for (const f of ['domain', 'route_id', 'digest', 'signed_message', 'signature', 'public_key']) {
    if (typeof e[f] !== 'string' || e[f].length === 0) return fail(`served proof field "${f}" missing or not a string`);
  }
  checks.served_domain = e.domain === SERVED_PREFIX;
  if (!checks.served_domain) return fail(`served proof domain is not ${SERVED_PREFIX}`);
  checks.route_not_reserved = !RESERVED_ROUTES.has(e.route_id) && /^[a-z0-9][a-z0-9._-]*$/.test(e.route_id);
  if (!checks.route_not_reserved) return fail(`route "${e.route_id}" is reserved or malformed`);
  checks.digest_format = /^[0-9a-f]{64}$/.test(e.digest);
  if (!checks.digest_format) return fail('digest is not 64 lowercase hex');
  checks.signed_message_canonical = e.signed_message === `${e.domain}\n${e.route_id}\n${e.digest}`;
  if (!checks.signed_message_canonical) return fail('signed_message != domain\\nroute_id\\ndigest');
  let pk, sig;
  try { pk = b64decode(e.public_key); sig = b64decode(e.signature); } catch (err) { return fail(`public_key/signature not base64: ${err.message}`); }
  checks.public_key_1952_bytes = pk.length === ML_DSA_65_PK_BYTES;
  checks.signature_3309_bytes = sig.length === ML_DSA_65_SIG_BYTES;
  if (!checks.public_key_1952_bytes || !checks.signature_3309_bytes) return fail('public_key/signature sizes are not ML-DSA-65 (1952 / 3309 bytes)');
  let ok = false;
  try { ok = ml_dsa65.verify(sig, utf8(e.signed_message), pk) === true; } catch { ok = false; }
  checks.ml_dsa65_signature_valid = ok;
  const kid = kidForKey(normKey(e.public_key));
  if (!ok) return fail('ML-DSA-65 signature does not verify over signed_message', { kid });
  // RT-13: the served-proof shape signs only domain/route/digest. A top-level emitted_at is NOT signed, so it
  // must not be used to place the proof inside a retiring key's window (it was backdatable at will).
  return trustStep(e.public_key, kid, undefined, opts, checks, fail);
}

/**
 * Verify one receipt.
 * @param {object} receipt   the receipt JSON (as served by /api/midas/alerts/receipt/<id>)
 * @param {object} opts
 *   - trustedKeys: string[]  base64 ML-DSA-65 public keys; if non-empty the directory is NOT consulted
 *   - directory:   object    key-directory epoch (used only when trustedKeys is empty)
 *   - governanceKey: string  optional pinned directory signer (base64)
 *   - expectedId:  string    if the receipt was fetched by id, it must carry exactly that id
 * @returns {{valid:boolean, reason:string, kid:string, epoch:string, signatureValid:boolean, keyTrust:string, checks:object}}
 */
export function verifyReceipt(receipt, opts = {}) {
  const checks = {};
  const fail = (reason, extra = {}) => ({
    valid: false, reason, kid: extra.kid || '', epoch: extra.epoch || '',
    signatureValid: extra.signatureValid === true, keyTrust: extra.keyTrust || 'none', checks,
  });
  try {
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return fail('receipt is not a JSON object');
    if (receipt.receipt_id === undefined && receipt.signed_message !== undefined && receipt.route_id !== undefined) {
      return verifyServedProof(receipt, opts, checks, fail);
    }
    for (const f of ['receipt_id', 'canonical', 'served_message', 'signature', 'public_key']) {
      if (typeof receipt[f] !== 'string' || receipt[f].length === 0) return fail(`receipt field "${f}" missing or not a string`);
    }
    const id = receipt.receipt_id;
    checks.receipt_id_format = /^[0-9a-f]{64}$/.test(id);
    if (!checks.receipt_id_format) return fail('receipt_id is not 64 lowercase hex chars');
    if (opts.expectedId !== undefined) {
      checks.receipt_id_matches_request = id === opts.expectedId.toLowerCase();
      if (!checks.receipt_id_matches_request) return fail('served receipt_id differs from the requested id');
    }
    checks.algorithm_ml_dsa_65 = String(receipt.algorithm || '').toLowerCase() === 'ml-dsa-65';
    if (!checks.algorithm_ml_dsa_65) return fail(`algorithm is "${receipt.algorithm}", expected ml-dsa-65`);

    // 1. receipt_id commits to the canonical (signed) facts.
    checks.receipt_id_is_sha256_of_canonical = sha256hex(receipt.canonical) === id;
    if (!checks.receipt_id_is_sha256_of_canonical) return fail('sha256(canonical) != receipt_id (canonical facts altered)');

    // 2. served_message = "<served_domain>\n<receipt_id>", served_domain = "FRACTALAI-x402-served-v1\n<resource>".
    const sm = receipt.served_message.split('\n');
    const domainOk = sm.length === 3 && sm[0] === SERVED_PREFIX && /^[a-z0-9][a-z0-9._-]*$/.test(sm[1]) && sm[2] === id;
    const declaredOk = receipt.served_domain === undefined || receipt.served_message === `${receipt.served_domain}\n${id}`;
    checks.served_message_domain_bound = domainOk && declaredOk;
    if (!checks.served_message_domain_bound) return fail(`served_message is not "${SERVED_PREFIX}\\n<resource>\\n<receipt_id>"`);

    // 3. Displayed fields must match what was signed (otherwise a viewer could be shown unsigned facts).
    const parsed = parseCanonical(receipt.canonical);
    if (receipt.domain !== undefined) {
      checks.domain_matches_canonical = !!parsed && parsed.domain === receipt.domain;
      if (!checks.domain_matches_canonical) return fail('receipt.domain != first line of canonical');
    }
    let signedEmittedAt;
    if (parsed) signedEmittedAt = parsed.fields.emitted_at;
    if (receipt.facts !== undefined) {
      if (!parsed || typeof receipt.facts !== 'object' || receipt.facts === null) return fail('facts present but canonical is not key=value lines');
      const fk = Object.keys(receipt.facts);
      const ck = Object.keys(parsed.fields);
      const mismatch = [];
      for (const k of new Set([...fk, ...ck])) {
        if (!(k in parsed.fields)) mismatch.push(`${k} (unsigned field in facts)`);
        else if (!(k in receipt.facts)) mismatch.push(`${k} (missing from facts)`);
        else if (scalarString(receipt.facts[k]) !== parsed.fields[k]) mismatch.push(`${k} (facts value != signed value)`);
      }
      checks.facts_match_canonical = mismatch.length === 0;
      if (!checks.facts_match_canonical) return fail(`displayed facts differ from signed canonical: ${mismatch.join(', ')}`);
    }
    if (receipt.emitted_at !== undefined && signedEmittedAt !== undefined) {
      checks.emitted_at_matches_canonical = String(receipt.emitted_at) === signedEmittedAt;
      if (!checks.emitted_at_matches_canonical) return fail('top-level emitted_at != signed emitted_at');
    }

    // 4. ML-DSA-65 signature.
    let pk, sig;
    try { pk = b64decode(receipt.public_key); sig = b64decode(receipt.signature); } catch (e) { return fail(`public_key/signature not base64: ${e.message}`); }
    checks.public_key_1952_bytes = pk.length === ML_DSA_65_PK_BYTES;
    checks.signature_3309_bytes = sig.length === ML_DSA_65_SIG_BYTES;
    if (!checks.public_key_1952_bytes || !checks.signature_3309_bytes) return fail('public_key/signature sizes are not ML-DSA-65 (1952 / 3309 bytes)');
    let sigOk = false;
    try { sigOk = ml_dsa65.verify(sig, utf8(receipt.served_message), pk) === true; } catch { sigOk = false; }
    checks.ml_dsa65_signature_valid = sigOk;
    const kid = kidForKey(normKey(receipt.public_key));
    if (!sigOk) return fail('ML-DSA-65 signature does not verify over served_message', { kid });

    // 5. Key trust — FAIL-CLOSED. A valid signature under an unknown key proves nothing about who signed.
    // RT-13: only a SIGNED emitted_at (from canonical) may place the receipt in a key's validity window.
    const emitted = signedEmittedAt;
    return trustStep(receipt.public_key, kid, emitted, opts, checks, fail);
  } catch (e) {
    return fail(`verify error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
