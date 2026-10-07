import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
;// CONCATENATED MODULE: external "node:crypto"
const external_node_crypto_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:crypto");
;// CONCATENATED MODULE: external "node:path"
const external_node_path_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:path");
;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/codes.mjs
/**
 * Trust Kernel v2 — levels, reason codes and CLI exit codes (spec/TRUST-KERNEL.md §7, §9).
 * Reason codes are part of the normative interface: the adversarial corpus asserts them, so every
 * implementation (JS, Python, …) MUST emit the same code for the same failure.
 */
const KERNEL_ID = 'fractalai-trust-kernel/2';
const SPEC_VERSION = '2.0.0';

/** Ordered verdict levels. Each level implies the ones before it except time_anchored/finalized, which
 * imply `authentic` (an anchor proves existence of signed bytes, independently of key trust). */
const LEVELS = Object.freeze(['integrity', 'authentic', 'trusted', 'time_anchored', 'finalized']);

/** Default policy: a receipt is `valid` when it is authentic AND signed by a key the pinned roots authorize. */
const DEFAULT_REQUIRE = Object.freeze(['integrity', 'authentic', 'trusted']);

/** CLI exit codes: 0 valid; 1x = first required level that failed; 2 usage; 3 input could not be read/parsed. */
const EXIT = Object.freeze({
  VALID: 0, USAGE: 2, INPUT: 3,
  integrity: 10, authentic: 11, trusted: 12, time_anchored: 13, finalized: 14,
});

const C = Object.freeze({
  // input hygiene
  JSON_INVALID: 'JSON_INVALID', JSON_DUPLICATE_KEY: 'JSON_DUPLICATE_KEY', JSON_TOO_DEEP: 'JSON_TOO_DEEP',
  JSON_TOO_LARGE: 'JSON_TOO_LARGE', JSON_LONE_SURROGATE: 'JSON_LONE_SURROGATE', INPUT_SHAPE: 'INPUT_SHAPE',
  B64_NONCANONICAL: 'B64_NONCANONICAL', KEY_SIZE: 'KEY_SIZE', SIG_SIZE: 'SIG_SIZE',
  SIGNED_JSON_NUMBER: 'SIGNED_JSON_NUMBER',
  // integrity (kind-specific binding)
  KIND_UNKNOWN: 'KIND_UNKNOWN', DOMAIN_MISMATCH: 'DOMAIN_MISMATCH', ALGORITHM: 'ALGORITHM',
  CONTENT_ID_MISMATCH: 'CONTENT_ID_MISMATCH', RECEIPT_ID_MISMATCH: 'RECEIPT_ID_MISMATCH',
  EXPECTED_ID_MISMATCH: 'EXPECTED_ID_MISMATCH', SIGNED_MESSAGE_MISMATCH: 'SIGNED_MESSAGE_MISMATCH',
  CANONICAL_MALFORMED: 'CANONICAL_MALFORMED', UNSIGNED_FIELD_MISMATCH: 'UNSIGNED_FIELD_MISMATCH',
  SIGNED_TIME_MALFORMED: 'SIGNED_TIME_MALFORMED', ROUTE_RESERVED: 'ROUTE_RESERVED', ROUTE_MALFORMED: 'ROUTE_MALFORMED',
  DIGEST_MALFORMED: 'DIGEST_MALFORMED', SCHEMA_MISMATCH: 'SCHEMA_MISMATCH',
  // authentic
  SIGNATURE_INVALID: 'SIGNATURE_INVALID',
  // trusted
  NO_TRUST_SOURCE: 'NO_TRUST_SOURCE', DIRECTORY_INVALID: 'DIRECTORY_INVALID', DIRECTORY_SIGNER_NOT_PINNED: 'DIRECTORY_SIGNER_NOT_PINNED',
  DIRECTORY_ROLLBACK: 'DIRECTORY_ROLLBACK', DIRECTORY_EQUIVOCATION: 'DIRECTORY_EQUIVOCATION', DIRECTORY_CHAIN_GAP: 'DIRECTORY_CHAIN_GAP',
  DIRECTORY_CHAIN_BREAK: 'DIRECTORY_CHAIN_BREAK', DIRECTORY_NOT_APPEND_ONLY: 'DIRECTORY_NOT_APPEND_ONLY',
  KEY_NOT_LISTED: 'KEY_NOT_LISTED', KEY_USE_MISMATCH: 'KEY_USE_MISMATCH', KEY_STATUS_RESERVED: 'KEY_STATUS_RESERVED',
  KEY_STATUS_UNKNOWN: 'KEY_STATUS_UNKNOWN', KEY_REVOKED: 'KEY_REVOKED', KEY_NOT_YET_VALID: 'KEY_NOT_YET_VALID',
  KEY_EXPIRED: 'KEY_EXPIRED', KEY_WINDOW_MALFORMED: 'KEY_WINDOW_MALFORMED', KEY_NEEDS_SIGNED_TIME: 'KEY_NEEDS_SIGNED_TIME',
  SIGNED_TIME_IN_FUTURE: 'SIGNED_TIME_IN_FUTURE', KEY_NOT_IN_PINNED_SET: 'KEY_NOT_IN_PINNED_SET',
  SELF_ATTEST_NOT_TRUSTED: 'SELF_ATTEST_NOT_TRUSTED',
  // time_anchored / finalized
  NO_ANCHOR: 'NO_ANCHOR', ANCHOR_REF_MALFORMED: 'ANCHOR_REF_MALFORMED', ANCHOR_CHAIN_NOT_PINNED: 'ANCHOR_CHAIN_NOT_PINNED',
  ANCHOR_CONTRACT_NOT_PINNED: 'ANCHOR_CONTRACT_NOT_PINNED', ANCHOR_CODEHASH_MISMATCH: 'ANCHOR_CODEHASH_MISMATCH',
  ANCHOR_WRONG_CHAIN: 'ANCHOR_WRONG_CHAIN', ANCHOR_NOT_FOUND: 'ANCHOR_NOT_FOUND', ANCHOR_AMBIGUOUS: 'ANCHOR_AMBIGUOUS',
  ANCHOR_TX_FAILED: 'ANCHOR_TX_FAILED', ANCHOR_LOG_REMOVED: 'ANCHOR_LOG_REMOVED', ANCHOR_LOG_MALFORMED: 'ANCHOR_LOG_MALFORMED',
  ANCHOR_SQUATTED: 'ANCHOR_SQUATTED', ANCHOR_KID_MISMATCH: 'ANCHOR_KID_MISMATCH', ANCHOR_BLOCK_MISMATCH: 'ANCHOR_BLOCK_MISMATCH',
  ANCHOR_TIME_MISMATCH: 'ANCHOR_TIME_MISMATCH', ANCHOR_OBSERVED_AT_MISMATCH: 'ANCHOR_OBSERVED_AT_MISMATCH',
  ANCHOR_FORWARD_DATED: 'ANCHOR_FORWARD_DATED', ANCHOR_CONFIRMATIONS: 'ANCHOR_CONFIRMATIONS',
  ANCHOR_REQUIRES_SIGNED_TIME: 'ANCHOR_REQUIRES_SIGNED_TIME', ANCHOR_TESTNET_NOT_ALLOWED: 'ANCHOR_TESTNET_NOT_ALLOWED',
  ANCHOR_ANCHORER_UNKNOWN: 'ANCHOR_ANCHORER_UNKNOWN', ANCHOR_NO_RPC: 'ANCHOR_NO_RPC', RPC_ERROR: 'RPC_ERROR',
  RPC_DISAGREEMENT: 'RPC_DISAGREEMENT', RPC_QUORUM: 'RPC_QUORUM',
  SOL_GENESIS_MISMATCH: 'SOL_GENESIS_MISMATCH', SOL_NO_BLOCKTIME: 'SOL_NO_BLOCKTIME', SOL_NOT_FINALIZED: 'SOL_NOT_FINALIZED',
  SOL_STATUS_SLOT: 'SOL_STATUS_SLOT', SOL_TX_MALFORMED: 'SOL_TX_MALFORMED', SOL_SIGNATURE_MISMATCH: 'SOL_SIGNATURE_MISMATCH',
  SOL_ED25519_INVALID: 'SOL_ED25519_INVALID', SOL_SIGNER_NOT_ANNOUNCED: 'SOL_SIGNER_NOT_ANNOUNCED',
  SOL_LOOKUP_TABLES: 'SOL_LOOKUP_TABLES', SOL_INSTRUCTION_COUNT: 'SOL_INSTRUCTION_COUNT', SOL_NOT_MEMO: 'SOL_NOT_MEMO',
  SOL_MEMO_SIGNER: 'SOL_MEMO_SIGNER', SOL_MEMO_MISMATCH: 'SOL_MEMO_MISMATCH', SOL_SIGNER_COUNT: 'SOL_SIGNER_COUNT',
  NOT_FINALIZED: 'NOT_FINALIZED',
  KIND_AMBIGUOUS: 'KIND_AMBIGUOUS', KIND_NOT_ALLOWED: 'KIND_NOT_ALLOWED',
  ENGINE_SELFTEST_FAILED: 'ENGINE_SELFTEST_FAILED', ENGINE_UNSAFE_OBJECT_INPUT: 'ENGINE_UNSAFE_OBJECT_INPUT',
  SNAPSHOT_MISMATCH: 'SNAPSHOT_MISMATCH',
  INTERNAL: 'INTERNAL',
});

/** A coded failure. Kernel code throws KernelError; the decision layer turns it into a reason. */
class codes_KernelError extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.code = code;
    this.detail = detail;
  }
}
const fail = (code, detail) => { throw new codes_KernelError(code, detail); };

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/hygiene.mjs
/**
 * Shared input/output hygiene (spec/TRUST-KERNEL.md \u00a78). Every byte that reaches the decision layer
 * passes through here: strict JSON (duplicate keys and lone surrogates are REJECTED, not resolved),
 * hard size/depth/node limits, canonical base64/hex, a fetch with ONE deadline covering headers+body and
 * a streamed byte cap, and an output escaper for terminals / CI logs.
 */


const LIMITS = Object.freeze({
  MAX_JSON_BYTES: 2 * 1024 * 1024,
  MAX_DEPTH: 32,
  MAX_NODES: 100_000,
  MAX_STRING: 1024 * 1024,
  FETCH_TIMEOUT_MS: 20_000,
  FETCH_MAX_BYTES: 2 * 1024 * 1024,
});

const isHighSur = (c) => c >= 0xd800 && c <= 0xdbff;
const isLowSur = (c) => c >= 0xdc00 && c <= 0xdfff;

/**
 * RFC 8259 JSON parser that refuses everything a lenient parser would silently "resolve":
 * duplicate object keys (JSON.parse keeps the last, other stacks the first → parser differential),
 * lone UTF-16 surrogates (not representable in UTF-8 → canonicalisation differential), a leading BOM,
 * trailing garbage, and inputs beyond the size/depth/node limits. Objects are created with a null
 * prototype, so `__proto__` is an ordinary key and cannot pollute anything.
 * @param {string|Uint8Array} input
 */
function parseJsonStrict(input, limits = {}) {
  const L = { ...LIMITS, ...limits };
  let text;
  if (typeof input === 'string') text = input;
  else if (input instanceof Uint8Array) {
    if (input.length > L.MAX_JSON_BYTES) fail(C.JSON_TOO_LARGE, `input is ${input.length} bytes (> ${L.MAX_JSON_BYTES})`);
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(input); } catch { fail(C.JSON_INVALID, 'input is not valid UTF-8'); }
  } else fail(C.JSON_INVALID, 'input is not text');
  // UTF-8 length bound (cheap upper bound first, exact second)
  if (text.length > L.MAX_JSON_BYTES || new TextEncoder().encode(text).length > L.MAX_JSON_BYTES) fail(C.JSON_TOO_LARGE, `input exceeds ${L.MAX_JSON_BYTES} bytes`);
  if (text.charCodeAt(0) === 0xfeff) fail(C.JSON_INVALID, 'byte-order mark not allowed');
  let i = 0, nodes = 0;
  const n = text.length;
  const err = (m) => fail(C.JSON_INVALID, `${m} at offset ${i}`);
  const ws = () => { while (i < n) { const c = text.charCodeAt(i); if (c === 0x20 || c === 0x0a || c === 0x0d || c === 0x09) i++; else break; } };
  const str = () => {
    i++; // opening quote
    let out = '';
    let start = i;
    for (;;) {
      if (i >= n) err('unterminated string');
      const c = text.charCodeAt(i);
      if (c === 0x22) { out += text.slice(start, i); i++; break; }
      if (c < 0x20) err('control character in string');
      if (isHighSur(c)) {
        const d = text.charCodeAt(i + 1);
        if (!isLowSur(d)) fail(C.JSON_LONE_SURROGATE, `lone high surrogate at offset ${i}`);
        i += 2; continue;
      }
      if (isLowSur(c)) fail(C.JSON_LONE_SURROGATE, `lone low surrogate at offset ${i}`);
      if (c === 0x5c) {
        out += text.slice(start, i);
        const e = text[i + 1];
        i += 2;
        if (e === '"') out += '"'; else if (e === '\\') out += '\\'; else if (e === '/') out += '/';
        else if (e === 'b') out += '\b'; else if (e === 'f') out += '\f'; else if (e === 'n') out += '\n';
        else if (e === 'r') out += '\r'; else if (e === 't') out += '\t';
        else if (e === 'u') {
          const hex = text.slice(i, i + 4);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) err('bad \\u escape');
          const cu = parseInt(hex, 16); i += 4;
          if (isHighSur(cu)) {
            const hex2 = text.slice(i, i + 6);
            if (!/^\\u[0-9a-fA-F]{4}$/.test(hex2) || !isLowSur(parseInt(hex2.slice(2), 16))) fail(C.JSON_LONE_SURROGATE, `lone high surrogate escape at offset ${i - 6}`);
            out += String.fromCharCode(cu, parseInt(hex2.slice(2), 16)); i += 6;
          } else if (isLowSur(cu)) fail(C.JSON_LONE_SURROGATE, `lone low surrogate escape at offset ${i - 6}`);
          else out += String.fromCharCode(cu);
        } else err('bad escape');
        start = i;
        if (out.length > L.MAX_STRING) fail(C.JSON_TOO_LARGE, 'string too long');
        continue;
      }
      i++;
    }
    if (out.length > L.MAX_STRING) fail(C.JSON_TOO_LARGE, 'string too long');
    return out;
  };
  const num = () => {
    const m = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(i, i + 400));
    if (!m) err('bad number');
    i += m[0].length;
    const v = Number(m[0]);
    if (!Number.isFinite(v)) err('number out of range');
    return v;
  };
  const value = (depth) => {
    if (depth > L.MAX_DEPTH) fail(C.JSON_TOO_DEEP, `nesting depth exceeds ${L.MAX_DEPTH}`);
    if (++nodes > L.MAX_NODES) fail(C.JSON_TOO_LARGE, `more than ${L.MAX_NODES} JSON nodes`);
    ws();
    const c = text[i];
    if (c === '{') {
      i++; const obj = Object.create(null); ws();
      if (text[i] === '}') { i++; return obj; }
      for (;;) {
        ws(); if (text[i] !== '"') err('expected object key');
        const k = str();
        if (Object.prototype.hasOwnProperty.call(obj, k)) fail(C.JSON_DUPLICATE_KEY, `duplicate key ${JSON.stringify(k).slice(0, 80)}`);
        ws(); if (text[i] !== ':') err('expected :'); i++;
        obj[k] = value(depth + 1);
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === '}') { i++; return obj; }
        err('expected , or }');
      }
    }
    if (c === '[') {
      i++; const arr = []; ws();
      if (text[i] === ']') { i++; return arr; }
      for (;;) {
        arr.push(value(depth + 1)); ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === ']') { i++; return arr; }
        err('expected , or ]');
      }
    }
    if (c === '"') return str();
    if (c === '-' || (c >= '0' && c <= '9')) return num();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    return err('unexpected token');
  };
  const v = value(0);
  ws();
  if (i !== n) err('trailing characters');
  return v;
}

/** Deep check that an already-parsed value respects the same limits (for callers passing objects). */
function assertJsonValue(v, limits = {}) {
  const L = { ...LIMITS, ...limits };
  let nodes = 0;
  const walk = (x, d) => {
    if (d > L.MAX_DEPTH) fail(C.JSON_TOO_DEEP, `nesting depth exceeds ${L.MAX_DEPTH}`);
    if (++nodes > L.MAX_NODES) fail(C.JSON_TOO_LARGE, `more than ${L.MAX_NODES} JSON nodes`);
    if (x === null || typeof x === 'boolean') return;
    if (typeof x === 'number') { if (!Number.isFinite(x)) fail(C.INPUT_SHAPE, 'non-finite number'); return; }
    if (typeof x === 'string') {
      if (x.length > L.MAX_STRING) fail(C.JSON_TOO_LARGE, 'string too long');
      for (let k = 0; k < x.length; k++) {
        const c = x.charCodeAt(k);
        if (isHighSur(c)) { if (!isLowSur(x.charCodeAt(k + 1))) fail(C.JSON_LONE_SURROGATE, 'lone surrogate in string'); k++; }
        else if (isLowSur(c)) fail(C.JSON_LONE_SURROGATE, 'lone surrogate in string');
      }
      return;
    }
    if (Array.isArray(x)) { for (const y of x) walk(y, d + 1); return; }
    if (typeof x === 'object') {
      const proto = Object.getPrototypeOf(x);
      if (proto !== null && proto !== Object.prototype) fail(C.INPUT_SHAPE, 'non-plain object');
      for (const k of Object.keys(x)) { walk(k, d + 1); walk(x[k], d + 1); }
      return;
    }
    fail(C.INPUT_SHAPE, `unsupported JSON type ${typeof x}`);
  };
  walk(v, 0);
  return v;
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => isPlainObject(o) && Object.prototype.hasOwnProperty.call(o, k);

const B64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const B64_DEC = (() => { const t = new Int16Array(128).fill(-1); const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; for (let k = 0; k < 64; k++) t[a.charCodeAt(k)] = k; return t; })();
const B64_ENC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function b64encode(bytes) {
  let s = '';
  let k = 0;
  for (; k + 2 < bytes.length; k += 3) { const v = (bytes[k] << 16) | (bytes[k + 1] << 8) | bytes[k + 2]; s += B64_ENC[v >> 18] + B64_ENC[(v >> 12) & 63] + B64_ENC[(v >> 6) & 63] + B64_ENC[v & 63]; }
  if (k < bytes.length) {
    const rem = bytes.length - k;
    const v = (bytes[k] << 16) | ((rem > 1 ? bytes[k + 1] : 0) << 8);
    s += B64_ENC[v >> 18] + B64_ENC[(v >> 12) & 63] + (rem > 1 ? B64_ENC[(v >> 6) & 63] : '=') + '=';
  }
  return s;
}

/** Canonical RFC 4648 \u00a74 base64 only: padded, standard alphabet, no whitespace, zero padding bits
 * (decode→encode must round-trip, so one byte string has exactly one accepted text form). */
function b64decodeStrict(s, expectedLen, what = 'value') {
  if (typeof s !== 'string' || s.length === 0 || !B64_RE.test(s)) fail(C.B64_NONCANONICAL, `${what} is not canonical base64`);
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  const out = new Uint8Array((s.length / 4) * 3 - pad);
  let o = 0;
  for (let k = 0; k < s.length; k += 4) {
    const a = B64_DEC[s.charCodeAt(k)], b = B64_DEC[s.charCodeAt(k + 1)];
    const c = s[k + 2] === '=' ? 0 : B64_DEC[s.charCodeAt(k + 2)], d = s[k + 3] === '=' ? 0 : B64_DEC[s.charCodeAt(k + 3)];
    const v = (a << 18) | (b << 12) | (c << 6) | d;
    if (o < out.length) out[o++] = v >> 16;
    if (o < out.length) out[o++] = (v >> 8) & 255;
    if (o < out.length) out[o++] = v & 255;
  }
  if (b64encode(out) !== s) fail(C.B64_NONCANONICAL, `${what} has non-zero padding bits`);
  if (expectedLen !== undefined && out.length !== expectedLen) {
    fail(expectedLen === 1952 ? C.KEY_SIZE : expectedLen === 3309 ? C.SIG_SIZE : C.INPUT_SHAPE, `${what} is ${out.length} bytes, expected ${expectedLen}`);
  }
  return out;
}

const isHex = (s, len) => typeof s === 'string' && (len === undefined ? /^[0-9a-f]+$/ : new RegExp(`^[0-9a-f]{${len}}$`)).test(s);
const isHex0x = (s, len) => typeof s === 'string' && new RegExp(`^0x[0-9a-fA-F]{${len}}$`).test(s);
const isSafeUint = (v) => Number.isSafeInteger(v) && v >= 0;
function hexToBytes(h) {
  const s = h.startsWith('0x') ? h.slice(2) : h;
  if (s.length % 2 || !/^[0-9a-fA-F]*$/.test(s)) fail(C.INPUT_SHAPE, 'bad hex');
  const out = new Uint8Array(s.length / 2);
  for (let k = 0; k < out.length; k++) out[k] = parseInt(s.slice(2 * k, 2 * k + 2), 16);
  return out;
}
const bytesToHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
/** JSON-RPC quantity: 0x-prefixed hex without leading zeros (we accept leading zeros, but nothing else). */
function qty(h, what = 'quantity') {
  if (typeof h !== 'string' || !/^0x[0-9a-fA-F]{1,16}$/.test(h)) fail(C.ANCHOR_LOG_MALFORMED, `${what} is not a hex quantity`);
  const v = Number.parseInt(h.slice(2), 16);
  if (!Number.isSafeInteger(v)) fail(C.ANCHOR_LOG_MALFORMED, `${what} out of range`);
  return v;
}
const toQty = (n) => '0x' + n.toString(16);

/**
 * Output escaping: one value → one line, no control/bidi/line-separator characters, bounded length.
 * Untrusted text (receipt fields, RPC error strings, URLs) MUST go through this before reaching a
 * terminal, a CI log (workflow-command injection) or a Markdown summary.
 */
function oneLine(s, max = 600) {
  const t = String(s).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return t.length > max ? `${t.slice(0, max)}…(truncated)` : t;
}
/** JSON for a terminal: JSON.stringify already escapes C0 controls; additionally escape C1/bidi/separators. */
function safeJson(v, space = 2) {
  return JSON.stringify(v, null, space).replace(/[\u007f-\u009f\u2028\u2029\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/**
 * fetch with ONE hard deadline covering connection, headers AND body (a strongly referenced timer, not
 * AbortSignal.timeout, which can be collected after the headers arrive), a streamed byte cap (checked
 * while reading, not after buffering), no redirects, and https-only (http allowed for loopback only).
 * Returns the body as text. Never retries: callers decide (a retry can never turn into "valid").
 */
async function boundedFetch(url, { method = 'GET', headers = {}, body, timeoutMs = LIMITS.FETCH_TIMEOUT_MS, maxBytes = LIMITS.FETCH_MAX_BYTES, fetchImpl = globalThis.fetch, allowInsecureLoopback = true } = {}) {
  let u;
  try { u = new URL(url); } catch { throw new codes_KernelError(C.RPC_ERROR, `invalid URL ${oneLine(url, 120)}`); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  const custom = fetchImpl !== globalThis.fetch;
  if (!custom && u.protocol !== 'https:' && !(u.protocol === 'http:' && loopback && allowInsecureLoopback)) {
    throw new codes_KernelError(C.RPC_ERROR, `refusing non-HTTPS URL ${oneLine(url, 120)}`);
  }
  const ctl = new AbortController();
  let timedOut = false;
  let rejectDeadline;
  // The deadline is enforced by RACING it (not only by abort propagation): some transports do not reject a
  // pending body read when the signal fires after the headers arrived, which used to hang the verifier.
  const deadline = new Promise((_, rej) => { rejectDeadline = rej; });
  deadline.catch(() => {});
  const timer = setTimeout(() => {
    timedOut = true;
    ctl.abort(new Error(`deadline ${timeoutMs} ms`));
    rejectDeadline(new codes_KernelError(C.RPC_ERROR, `timeout after ${timeoutMs} ms (${oneLine(u.origin, 120)})`));
  }, timeoutMs);
  let reader = null;
  const work = (async () => {
    const res = await fetchImpl(url, { method, headers, body, signal: ctl.signal, redirect: 'error' });
    if (!res || typeof res !== 'object') throw new codes_KernelError(C.RPC_ERROR, 'no response');
    if (!res.ok) { try { await res.body?.cancel?.(); } catch { /* ignore */ } throw new codes_KernelError(C.RPC_ERROR, `HTTP ${res.status} from ${oneLine(u.origin, 120)}`); }
    const ctype = res.headers?.get?.('content-type');
    if (typeof ctype === 'string' && ctype !== '' && !/^application\/([a-z0-9.+-]*\+)?json\b/i.test(ctype.trim())) throw new codes_KernelError(C.RPC_ERROR, `unexpected content-type ${oneLine(ctype, 60)} (want application/json)`);
    const len = Number(res.headers?.get?.('content-length'));
    if (Number.isFinite(len) && len > maxBytes) throw new codes_KernelError(C.JSON_TOO_LARGE, `response larger than ${maxBytes} bytes`);
    if (res.body && typeof res.body.getReader === 'function') {
      reader = res.body.getReader();
      const chunks = []; let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) throw new codes_KernelError(C.JSON_TOO_LARGE, `response larger than ${maxBytes} bytes`);
        chunks.push(value);
      }
      const all = new Uint8Array(total); let o = 0; for (const ch of chunks) { all.set(ch, o); o += ch.byteLength; }
      return new TextDecoder('utf-8', { fatal: false }).decode(all);
    }
    if (typeof res.text === 'function') {
      const t = await res.text();
      if (t.length > maxBytes) throw new codes_KernelError(C.JSON_TOO_LARGE, `response larger than ${maxBytes} bytes`);
      return t;
    }
    if (typeof res.json === 'function') return JSON.stringify(await res.json());
    throw new codes_KernelError(C.RPC_ERROR, 'response has no body');
  })();
  work.catch(() => {});
  try {
    return await Promise.race([work, deadline]);
  } catch (e) {
    if (e instanceof codes_KernelError) throw e;
    if (timedOut) throw new codes_KernelError(C.RPC_ERROR, `timeout after ${timeoutMs} ms (${oneLine(u.origin, 120)})`);
    throw new codes_KernelError(C.RPC_ERROR, `fetch ${oneLine(u.origin, 120)} failed: ${oneLine(e?.message ?? e, 200)}`);
  } finally {
    clearTimeout(timer);
    if (reader) { try { reader.cancel().catch(() => {}); } catch { /* ignore */ } }
    if (!ctl.signal.aborted) { /* completed normally */ } 
  }
}

/** GET a JSON document strictly (bounded fetch + strict parse). */
async function fetchJsonStrict(url, opts = {}) {
  return parseJsonStrict(await boundedFetch(url, { ...opts, headers: { accept: 'application/json', ...(opts.headers || {}) } }));
}

;// CONCATENATED MODULE: ./node_modules/@noble/hashes/utils.js
/**
 * Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
 * @param a - value to test
 * @returns `true` when the value is a Uint8Array-compatible view.
 * @example
 * Check whether a value is a Uint8Array-compatible view.
 * ```ts
 * isBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_isBytes(a) {
    // Plain `instanceof Uint8Array` is too strict for some Buffer / proxy / cross-realm cases.
    // The fallback still requires a real ArrayBuffer view, so plain
    // JSON-deserialized `{ constructor: ... }` spoofing is rejected, and
    // `BYTES_PER_ELEMENT === 1` keeps the fallback on byte-oriented views.
    return (a instanceof Uint8Array ||
        (ArrayBuffer.isView(a) &&
            a.constructor.name === 'Uint8Array' &&
            'BYTES_PER_ELEMENT' in a &&
            a.BYTES_PER_ELEMENT === 1));
}
/**
 * Asserts something is a non-negative integer.
 * @param n - number to validate
 * @param title - label included in thrown errors
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a non-negative integer option.
 * ```ts
 * anumber(32, 'length');
 * ```
 */
function anumber(n, title = '') {
    if (typeof n !== 'number') {
        const prefix = title && `"${title}" `;
        throw new TypeError(`${prefix}expected number, got ${typeof n}`);
    }
    if (!Number.isSafeInteger(n) || n < 0) {
        const prefix = title && `"${title}" `;
        throw new RangeError(`${prefix}expected integer >= 0, got ${n}`);
    }
}
/**
 * Asserts something is Uint8Array.
 * @param value - value to validate
 * @param length - optional exact length constraint
 * @param title - label included in thrown errors
 * @returns The validated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate that a value is a byte array.
 * ```ts
 * abytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_abytes(value, length, title = '') {
    const bytes = utils_isBytes(value);
    const len = value?.length;
    const needsLen = length !== undefined;
    if (!bytes || (needsLen && len !== length)) {
        const prefix = title && `"${title}" `;
        const ofLen = needsLen ? ` of length ${length}` : '';
        const got = bytes ? `length=${len}` : `type=${typeof value}`;
        const message = prefix + 'expected Uint8Array' + ofLen + ', got ' + got;
        if (!bytes)
            throw new TypeError(message);
        throw new RangeError(message);
    }
    return value;
}
/**
 * Copies bytes into a fresh Uint8Array.
 * Buffer-style slices can alias the same backing store, so callers that need ownership should copy.
 * @param bytes - source bytes to clone
 * @returns Freshly allocated copy of `bytes`.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Clone a byte array before mutating it.
 * ```ts
 * const copy = copyBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(utils_abytes(bytes));
}
/**
 * Asserts something is a wrapped hash constructor.
 * @param h - hash constructor to validate
 * @throws On wrong argument types or invalid hash wrapper shape. {@link TypeError}
 * @throws On invalid hash metadata ranges or values. {@link RangeError}
 * @throws If the hash metadata allows empty outputs or block sizes. {@link Error}
 * @example
 * Validate a callable hash wrapper.
 * ```ts
 * import { ahash } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * ahash(sha256);
 * ```
 */
function ahash(h) {
    if (typeof h !== 'function' || typeof h.create !== 'function')
        throw new TypeError('Hash must wrapped by utils.createHasher');
    anumber(h.outputLen);
    anumber(h.blockLen);
    // HMAC and KDF callers treat these as real byte lengths; allowing zero lets fake wrappers pass
    // validation and can produce empty outputs instead of failing fast.
    if (h.outputLen < 1)
        throw new Error('"outputLen" must be >= 1');
    if (h.blockLen < 1)
        throw new Error('"blockLen" must be >= 1');
}
/**
 * Asserts a hash instance has not been destroyed or finished.
 * @param instance - hash instance to validate
 * @param checkFinished - whether to reject finalized instances
 * @throws If the hash instance has already been destroyed or finalized. {@link Error}
 * @example
 * Validate that a hash instance is still usable.
 * ```ts
 * import { aexists } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aexists(hash);
 * ```
 */
function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
/**
 * Asserts output is a sufficiently-sized byte array.
 * @param out - destination buffer
 * @param instance - hash instance providing output length
 * Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a caller-provided digest buffer.
 * ```ts
 * import { aoutput } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aoutput(new Uint8Array(hash.outputLen), hash);
 * ```
 */
function aoutput(out, instance) {
    utils_abytes(out, undefined, 'digestInto() output');
    const min = instance.outputLen;
    if (out.length < min) {
        throw new RangeError('"digestInto() output" expected to be of length >=' + min);
    }
}
/**
 * Casts a typed array view to Uint8Array.
 * @param arr - source typed array
 * @returns Uint8Array view over the same buffer.
 * @example
 * Reinterpret a typed array as bytes.
 * ```ts
 * u8(new Uint32Array([1, 2]));
 * ```
 */
function u8(arr) {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Casts a typed array view to Uint32Array.
 * `arr.byteOffset` must already be 4-byte aligned or the platform
 * Uint32Array constructor will throw.
 * @param arr - source typed array
 * @returns Uint32Array view over the same buffer.
 * @example
 * Reinterpret a byte array as 32-bit words.
 * ```ts
 * u32(new Uint8Array(8));
 * ```
 */
function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
 * Zeroizes typed arrays in place. Warning: JS provides no guarantees.
 * @param arrays - arrays to overwrite with zeros
 * @example
 * Zeroize sensitive buffers in place.
 * ```ts
 * clean(new Uint8Array([1, 2, 3]));
 * ```
 */
function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
    }
}
/**
 * Creates a DataView for byte-level manipulation.
 * @param arr - source typed array
 * @returns DataView over the same buffer region.
 * @example
 * Create a DataView over an existing buffer.
 * ```ts
 * createView(new Uint8Array(4));
 * ```
 */
function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Rotate-right operation for uint32 values.
 * @param word - source word
 * @param shift - shift amount in bits
 * @returns Rotated word.
 * @example
 * Rotate a 32-bit word to the right.
 * ```ts
 * rotr(0x12345678, 8);
 * ```
 */
function rotr(word, shift) {
    return (word << (32 - shift)) | (word >>> shift);
}
/**
 * Rotate-left operation for uint32 values.
 * @param word - source word
 * @param shift - shift amount in bits
 * @returns Rotated word.
 * @example
 * Rotate a 32-bit word to the left.
 * ```ts
 * rotl(0x12345678, 8);
 * ```
 */
function rotl(word, shift) {
    return (word << shift) | ((word >>> (32 - shift)) >>> 0);
}
/** Whether the current platform is little-endian. */
const utils_isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
/**
 * Byte-swap operation for uint32 values.
 * @param word - source word
 * @returns Word with reversed byte order.
 * @example
 * Reverse the byte order of a 32-bit word.
 * ```ts
 * byteSwap(0x11223344);
 * ```
 */
function byteSwap(word) {
    return (((word << 24) & 0xff000000) |
        ((word << 8) & 0xff0000) |
        ((word >>> 8) & 0xff00) |
        ((word >>> 24) & 0xff));
}
/**
 * Conditionally byte-swaps one 32-bit word on big-endian platforms.
 * @param n - source word
 * @returns Original or byte-swapped word depending on platform endianness.
 * @example
 * Normalize a 32-bit word for host endianness.
 * ```ts
 * swap8IfBE(0x11223344);
 * ```
 */
const swap8IfBE = (/* unused pure expression or super */ null && (utils_isLE
    ? (n) => n
    : (n) => byteSwap(n) >>> 0));
/**
 * Byte-swaps every word of a Uint32Array in place.
 * @param arr - array to mutate
 * @returns The same array after mutation; callers pass live state arrays here.
 * @example
 * Reverse the byte order of every word in place.
 * ```ts
 * byteSwap32(new Uint32Array([0x11223344]));
 * ```
 */
function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
    }
    return arr;
}
/**
 * Conditionally byte-swaps a Uint32Array on big-endian platforms.
 * @param u - array to normalize for host endianness
 * @returns Original or byte-swapped array depending on platform endianness.
 *   On big-endian runtimes this mutates `u` in place via `byteSwap32(...)`.
 * @example
 * Normalize a word array for host endianness.
 * ```ts
 * swap32IfBE(new Uint32Array([0x11223344]));
 * ```
 */
const swap32IfBE = utils_isLE
    ? (u) => u
    : byteSwap32;
// Built-in hex conversion https://caniuse.com/mdn-javascript_builtins_uint8array_fromhex
const hasHexBuiltin = /* @__PURE__ */ (() => 
// @ts-ignore
typeof Uint8Array.from([]).toHex === 'function' && typeof Uint8Array.fromHex === 'function')();
// Array where index 0xf0 (240) is mapped to string 'f0'
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
/**
 * Convert byte array to hex string.
 * Uses the built-in function when available and assumes it matches the tested
 * fallback semantics.
 * @param bytes - bytes to encode
 * @returns Lowercase hexadecimal string.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Convert bytes to lowercase hexadecimal.
 * ```ts
 * bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
 * ```
 */
function utils_bytesToHex(bytes) {
    utils_abytes(bytes);
    // @ts-ignore
    if (hasHexBuiltin)
        return bytes.toHex();
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}
// We use optimized technique to convert hex string to byte array
const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
        return ch - asciis._0; // '2' => 50-48
    if (ch >= asciis.A && ch <= asciis.F)
        return ch - (asciis.A - 10); // 'B' => 66-(65-10)
    if (ch >= asciis.a && ch <= asciis.f)
        return ch - (asciis.a - 10); // 'b' => 98-(97-10)
    return;
}
/**
 * Convert hex string to byte array. Uses built-in function, when available.
 * @param hex - hexadecimal string to decode
 * @returns Decoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Decode lowercase hexadecimal into bytes.
 * ```ts
 * hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 * ```
 */
function utils_hexToBytes(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    if (hasHexBuiltin) {
        try {
            return Uint8Array.fromHex(hex);
        }
        catch (error) {
            if (error instanceof SyntaxError)
                throw new RangeError(error.message);
            throw error;
        }
    }
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
        throw new RangeError('hex string expected, got unpadded hex of length ' + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi));
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
        if (n1 === undefined || n2 === undefined) {
            const char = hex[hi] + hex[hi + 1];
            throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2; // multiply first octet, e.g. 'a3' => 10*16+3 => 160 + 3 => 163
    }
    return array;
}
/**
 * There is no setImmediate in browser and setTimeout is slow.
 * This yields to the Promise/microtask scheduler queue, not to timers or the
 * full macrotask event loop.
 * @example
 * Yield to the next scheduler tick.
 * ```ts
 * await nextTick();
 * ```
 */
const nextTick = async () => { };
/**
 * Returns control to the Promise/microtask scheduler every `tick`
 * milliseconds to avoid blocking long loops.
 * @param iters - number of loop iterations to run
 * @param tick - maximum time slice in milliseconds
 * @param cb - callback executed on each iteration
 * @example
 * Run a loop that periodically yields back to the event loop.
 * ```ts
 * await asyncLoop(2, 0, () => {});
 * ```
 */
async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await nextTick();
        ts += diff;
    }
}
/**
 * Converts string to bytes using UTF8 encoding.
 * Built-in doesn't validate input to be string: we do the check.
 * Non-ASCII details are delegated to the platform `TextEncoder`.
 * @param str - string to encode
 * @returns UTF-8 encoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Encode a string as UTF-8 bytes.
 * ```ts
 * utf8ToBytes('abc'); // Uint8Array.from([97, 98, 99])
 * ```
 */
function utf8ToBytes(str) {
    if (typeof str !== 'string')
        throw new TypeError('string expected');
    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
}
/**
 * Helper for KDFs: consumes Uint8Array or string.
 * String inputs are UTF-8 encoded; byte-array inputs stay aliased to the caller buffer.
 * @param data - user-provided KDF input
 * @param errorTitle - label included in thrown errors
 * @returns Byte representation of the input.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Normalize KDF input to bytes.
 * ```ts
 * kdfInputToBytes('password');
 * ```
 */
function kdfInputToBytes(data, errorTitle = '') {
    if (typeof data === 'string')
        return utf8ToBytes(data);
    return utils_abytes(data, undefined, errorTitle);
}
/**
 * Copies several Uint8Arrays into one.
 * @param arrays - arrays to concatenate
 * @returns Concatenated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Concatenate multiple byte arrays.
 * ```ts
 * concatBytes(new Uint8Array([1]), new Uint8Array([2]));
 * ```
 */
function utils_concatBytes(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        utils_abytes(a);
        sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
    }
    return res;
}
/**
 * Merges default options and passed options.
 * @param defaults - base option object
 * @param opts - user overrides
 * @returns Merged option object. The merge mutates `defaults` in place.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Merge user overrides onto default options.
 * ```ts
 * checkOpts({ dkLen: 32 }, { asyncTick: 10 });
 * ```
 */
function checkOpts(defaults, opts) {
    if (opts !== undefined && {}.toString.call(opts) !== '[object Object]')
        throw new TypeError('options must be object or undefined');
    const merged = Object.assign(defaults, opts);
    return merged;
}
/**
 * Creates a callable hash function from a stateful class constructor.
 * @param hashCons - hash constructor or factory
 * @param info - optional metadata such as DER OID
 * @returns Frozen callable hash wrapper with `.create()`.
 *   Wrapper construction eagerly calls `hashCons(undefined)` once to read
 *   `outputLen` / `blockLen`, so constructor side effects happen at module
 *   init time.
 * @example
 * Wrap a stateful hash constructor into a callable helper.
 * ```ts
 * import { createHasher } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const wrapped = createHasher(sha256.create, { oid: sha256.oid });
 * wrapped(new Uint8Array([1]));
 * ```
 */
function utils_createHasher(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts)
        .update(msg)
        .digest();
    const tmp = hashCons(undefined);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
}
/**
 * Cryptographically secure PRNG backed by `crypto.getRandomValues`.
 * @param bytesLength - number of random bytes to generate
 * @returns Random bytes.
 * The platform `getRandomValues()` implementation still defines any
 * single-call length cap, and this helper rejects oversize requests
 * with a stable library `RangeError` instead of host-specific errors.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If the current runtime does not provide `crypto.getRandomValues`. {@link Error}
 * @example
 * Generate a fresh random key or nonce.
 * ```ts
 * const key = randomBytes(16);
 * ```
 */
function randomBytes(bytesLength = 32) {
    // Match the repo's other length-taking helpers instead of relying on Uint8Array coercion.
    anumber(bytesLength, 'bytesLength');
    const cr = typeof globalThis === 'object' ? globalThis.crypto : null;
    if (typeof cr?.getRandomValues !== 'function')
        throw new Error('crypto.getRandomValues must be defined');
    // Web Cryptography API Level 2 §10.1.1:
    // if `byteLength > 65536`, throw `QuotaExceededError`.
    // Keep the guard explicit so callers can see the quota in code
    // instead of discovering it by reading the spec or host errors.
    // This wrapper surfaces the same quota as a stable library RangeError.
    if (bytesLength > 65536)
        throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
    return cr.getRandomValues(new Uint8Array(bytesLength));
}
/**
 * Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
 * @param suffix - final OID byte for the selected hash.
 *   The helper accepts any byte even though only the documented NIST hash
 *   suffixes are meaningful downstream.
 * @returns Object containing the DER-encoded OID.
 * @example
 * Build OID metadata for a NIST hash.
 * ```ts
 * oidNist(0x01);
 * ```
 */
const utils_oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, suffix]),
});
//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/utils.js
/**
 * Hex, bytes and number utilities.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

/**
 * Validates that a value is a byte array.
 * @param value - Value to validate.
 * @param length - Optional exact byte length.
 * @param title - Optional field name.
 * @returns Original byte array.
 * @example
 * Reject non-byte input before passing data into curve code.
 *
 * ```ts
 * abytes(new Uint8Array(1));
 * ```
 */
const curves_utils_abytes = (value, length, title) => utils_abytes(value, length, title);
/**
 * Validates that a value is a non-negative safe integer.
 * @param n - Value to validate.
 * @param title - Optional field name.
 * @example
 * Validate a numeric length before allocating buffers.
 *
 * ```ts
 * anumber(1);
 * ```
 */
const utils_anumber = anumber;
/**
 * Encodes bytes as lowercase hex.
 * @param bytes - Bytes to encode.
 * @returns Lowercase hex string.
 * @example
 * Serialize bytes as hex for logging or fixtures.
 *
 * ```ts
 * bytesToHex(Uint8Array.of(1, 2, 3));
 * ```
 */
const curves_utils_bytesToHex = utils_bytesToHex;
/**
 * Concatenates byte arrays.
 * @param arrays - Byte arrays to join.
 * @returns Concatenated bytes.
 * @example
 * Join domain-separated chunks into one buffer.
 *
 * ```ts
 * concatBytes(Uint8Array.of(1), Uint8Array.of(2));
 * ```
 */
const curves_utils_concatBytes = (...arrays) => utils_concatBytes(...arrays);
/**
 * Decodes lowercase or uppercase hex into bytes.
 * @param hex - Hex string to decode.
 * @returns Decoded bytes.
 * @example
 * Parse fixture hex into bytes before hashing.
 *
 * ```ts
 * hexToBytes('0102');
 * ```
 */
const curves_utils_hexToBytes = (hex) => utils_hexToBytes(hex);
/**
 * Checks whether a value is a Uint8Array.
 * @param a - Value to inspect.
 * @returns `true` when `a` is a Uint8Array.
 * @example
 * Branch on byte input before decoding it.
 *
 * ```ts
 * isBytes(new Uint8Array(1));
 * ```
 */
const curves_utils_isBytes = utils_isBytes;
/**
 * Reads random bytes from the platform CSPRNG.
 * @param bytesLength - Number of random bytes to read.
 * @returns Fresh random bytes.
 * @example
 * Generate a random seed for a keypair.
 *
 * ```ts
 * randomBytes(2);
 * ```
 */
const utils_randomBytes = (bytesLength) => randomBytes(bytesLength);
const _0n = /* @__PURE__ */ BigInt(0);
const _1n = /* @__PURE__ */ BigInt(1);
/**
 * Validates that a flag is boolean.
 * @param value - Value to validate.
 * @param title - Optional field name.
 * @returns Original value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Reject non-boolean option flags early.
 *
 * ```ts
 * abool(true);
 * ```
 */
function abool(value, title = '') {
    if (typeof value !== 'boolean') {
        const prefix = title && `"${title}" `;
        throw new TypeError(prefix + 'expected boolean, got type=' + typeof value);
    }
    return value;
}
/**
 * Validates that a value is a non-negative bigint or safe integer.
 * @param n - Value to validate.
 * @returns The same validated value.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate one integer-like value before serializing it.
 *
 * ```ts
 * abignumber(1n);
 * ```
 */
function abignumber(n) {
    if (typeof n === 'bigint') {
        if (!isPosBig(n))
            throw new RangeError('positive bigint expected, got ' + n);
    }
    else
        utils_anumber(n);
    return n;
}
/**
 * Validates that a value is a safe integer.
 * @param value - Integer to validate.
 * @param title - Optional field name.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a window size before scalar arithmetic uses it.
 *
 * ```ts
 * asafenumber(1);
 * ```
 */
function utils_asafenumber(value, title = '') {
    if (typeof value !== 'number') {
        const prefix = title && `"${title}" `;
        throw new TypeError(prefix + 'expected number, got type=' + typeof value);
    }
    if (!Number.isSafeInteger(value)) {
        const prefix = title && `"${title}" `;
        throw new RangeError(prefix + 'expected safe integer, got ' + value);
    }
}
/**
 * Encodes a bigint into even-length big-endian hex.
 * The historical "unpadded" name only means "no fixed-width field padding"; odd-length hex still
 * gets one leading zero nibble so the result always represents whole bytes.
 * @param num - Number to encode.
 * @returns Big-endian hex string.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Encode a scalar into hex without a `0x` prefix.
 *
 * ```ts
 * numberToHexUnpadded(255n);
 * ```
 */
function numberToHexUnpadded(num) {
    const hex = abignumber(num).toString(16);
    return hex.length & 1 ? '0' + hex : hex;
}
/**
 * Parses a big-endian hex string into bigint.
 * Accepts odd-length hex through the native `BigInt('0x' + hex)` parser and currently surfaces the
 * same native `SyntaxError` for malformed hex instead of wrapping it in a library-specific error.
 * @param hex - Hex string without `0x`.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Parse a scalar from fixture hex.
 *
 * ```ts
 * hexToNumber('ff');
 * ```
 */
function hexToNumber(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    return hex === '' ? _0n : BigInt('0x' + hex); // Big Endian
}
// BE: Big Endian, LE: Little Endian
/**
 * Parses big-endian bytes into bigint.
 * @param bytes - Bytes in big-endian order.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Read a scalar encoded in network byte order.
 *
 * ```ts
 * bytesToNumberBE(Uint8Array.of(1, 0));
 * ```
 */
function utils_bytesToNumberBE(bytes) {
    return hexToNumber(utils_bytesToHex(bytes));
}
/**
 * Parses little-endian bytes into bigint.
 * @param bytes - Bytes in little-endian order.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Read a scalar encoded in little-endian form.
 *
 * ```ts
 * bytesToNumberLE(Uint8Array.of(1, 0));
 * ```
 */
function utils_bytesToNumberLE(bytes) {
    return hexToNumber(utils_bytesToHex(curves_utils_copyBytes(utils_abytes(bytes)).reverse()));
}
/**
 * Encodes a bigint into fixed-length big-endian bytes.
 * @param n - Number to encode.
 * @param len - Output length in bytes. Must be greater than zero.
 * @returns Big-endian byte array.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Serialize a scalar into a 32-byte field element.
 *
 * ```ts
 * numberToBytesBE(255n, 2);
 * ```
 */
function utils_numberToBytesBE(n, len) {
    anumber(len);
    if (len === 0)
        throw new RangeError('zero length');
    n = abignumber(n);
    const hex = n.toString(16);
    // Detect overflow before hex parsing so oversized values don't leak the shared odd-hex error.
    if (hex.length > len * 2)
        throw new RangeError('number too large');
    return utils_hexToBytes(hex.padStart(len * 2, '0'));
}
/**
 * Encodes a bigint into fixed-length little-endian bytes.
 * @param n - Number to encode.
 * @param len - Output length in bytes.
 * @returns Little-endian byte array.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Serialize a scalar for little-endian protocols.
 *
 * ```ts
 * numberToBytesLE(255n, 2);
 * ```
 */
function utils_numberToBytesLE(n, len) {
    return utils_numberToBytesBE(n, len).reverse();
}
// Unpadded, rarely used
/**
 * Encodes a bigint into variable-length big-endian bytes.
 * @param n - Number to encode.
 * @returns Variable-length big-endian bytes.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Serialize a bigint without fixed-width padding.
 *
 * ```ts
 * numberToVarBytesBE(255n);
 * ```
 */
function numberToVarBytesBE(n) {
    return hexToBytes_(numberToHexUnpadded(abignumber(n)));
}
// Compares 2 u8a-s in kinda constant time
/**
 * Compares two byte arrays in constant-ish time.
 * @param a - Left byte array.
 * @param b - Right byte array.
 * @returns `true` when bytes match.
 * @example
 * Compare two encoded points without early exit.
 *
 * ```ts
 * equalBytes(Uint8Array.of(1), Uint8Array.of(1));
 * ```
 */
function equalBytes(a, b) {
    a = curves_utils_abytes(a);
    b = curves_utils_abytes(b);
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * Copies Uint8Array. We can't use u8a.slice(), because u8a can be Buffer,
 * and Buffer#slice creates mutable copy. Never use Buffers!
 * @param bytes - Bytes to copy.
 * @returns Detached copy.
 * @example
 * Make an isolated copy before mutating serialized bytes.
 *
 * ```ts
 * copyBytes(Uint8Array.of(1, 2, 3));
 * ```
 */
function curves_utils_copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(curves_utils_abytes(bytes));
}
/**
 * Decodes 7-bit ASCII string to Uint8Array, throws on non-ascii symbols
 * Should be safe to use for things expected to be ASCII.
 * Returns exact same result as `TextEncoder` for ASCII or throws.
 * @param ascii - ASCII input text.
 * @returns Encoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Encode an ASCII domain-separation tag.
 *
 * ```ts
 * asciiToBytes('ABC');
 * ```
 */
function utils_asciiToBytes(ascii) {
    if (typeof ascii !== 'string')
        throw new TypeError('ascii string expected, got ' + typeof ascii);
    return Uint8Array.from(ascii, (c, i) => {
        const charCode = c.charCodeAt(0);
        if (c.length !== 1 || charCode > 127) {
            throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
        }
        return charCode;
    });
}
// Historical name: this accepts non-negative bigints, including zero.
const isPosBig = (n) => typeof n === 'bigint' && _0n <= n;
/**
 * Checks whether a bigint lies inside a half-open range.
 * @param n - Candidate value.
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 * @returns `true` when the value is inside the range.
 * @example
 * Check whether a candidate scalar fits the field order.
 *
 * ```ts
 * inRange(2n, 1n, 3n);
 * ```
 */
function inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
 * Asserts `min <= n < max`. NOTE: upper bound is exclusive.
 * @param title - Value label for error messages.
 * @param n - Candidate value.
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 * Wrong-type inputs are not separated from out-of-range values here: they still flow through the
 * shared `RangeError` path because this is only a throwing wrapper around `inRange(...)`.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Assert that a bigint stays within one half-open range.
 *
 * ```ts
 * aInRange('x', 2n, 1n, 256n);
 * ```
 */
function aInRange(title, n, min, max) {
    // Why min <= n < max and not a (min < n < max) OR b (min <= n <= max)?
    // consider P=256n, min=0n, max=P
    // - a for min=0 would require -1:          `inRange('x', x, -1n, P)`
    // - b would commonly require subtraction:  `inRange('x', x, 0n, P - 1n)`
    // - our way is the cleanest:               `inRange('x', x, 0n, P)
    if (!inRange(n, min, max))
        throw new RangeError('expected valid ' + title + ': ' + min + ' <= n < ' + max + ', got ' + n);
}
// Bit operations
/**
 * Calculates amount of bits in a bigint.
 * Same as `n.toString(2).length`
 * TODO: merge with nLength in modular
 * @param n - Value to inspect.
 * @returns Bit length.
 * @throws If the value is negative. {@link Error}
 * @example
 * Measure the bit length of a scalar before serialization.
 *
 * ```ts
 * bitLen(8n);
 * ```
 */
function utils_bitLen(n) {
    // Size callers in this repo only use non-negative orders / scalars, so negative inputs are a
    // contract bug and must not silently collapse to zero bits.
    if (n < _0n)
        throw new Error('expected non-negative bigint, got ' + n);
    let len;
    for (len = 0; n > _0n; n >>= _1n, len += 1)
        ;
    return len;
}
/**
 * Gets single bit at position.
 * NOTE: first bit position is 0 (same as arrays)
 * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
 * @param n - Source value.
 * @param pos - Bit position. Negative positions are passed through to raw
 *   bigint shift semantics; because the mask is built as `1n << pos`,
 *   they currently collapse to `0n` and make the helper a no-op.
 * @returns Bit as bigint.
 * @example
 * Gets single bit at position.
 *
 * ```ts
 * bitGet(5n, 0);
 * ```
 */
function bitGet(n, pos) {
    return (n >> BigInt(pos)) & _1n;
}
/**
 * Sets single bit at position.
 * @param n - Source value.
 * @param pos - Bit position. Negative positions are passed through to raw bigint shift semantics,
 *   so they currently behave like left shifts.
 * @param value - Whether the bit should be set.
 * @returns Updated bigint.
 * @example
 * Sets single bit at position.
 *
 * ```ts
 * bitSet(0n, 1, true);
 * ```
 */
function bitSet(n, pos, value) {
    const mask = _1n << BigInt(pos);
    // Clearing needs AND-not here; OR with zero leaves an already-set bit untouched.
    return value ? n | mask : n & ~mask;
}
/**
 * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
 * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
 * @param n - Number of bits. Negative widths are currently passed through to raw bigint shift
 *   semantics and therefore produce `-1n`.
 * @returns Bitmask value.
 * @example
 * Calculate mask for N bits.
 *
 * ```ts
 * bitMask(4);
 * ```
 */
const utils_bitMask = (n) => (_1n << BigInt(n)) - _1n;
/**
 * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
 * @param hashLen - Hash output size in bytes. Callers are expected to pass a positive length; `0`
 *   is not rejected here and would make the internal generate loop non-progressing.
 * @param qByteLen - Requested output size in bytes. Callers are expected to pass a positive length.
 * @param hmacFn - HMAC implementation.
 * @returns Function that will call DRBG until the predicate returns anything
 *   other than `undefined`.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Build a deterministic nonce generator for RFC6979-style signing.
 *
 * ```ts
 * import { createHmacDrbg } from '@noble/curves/utils.js';
 * import { hmac } from '@noble/hashes/hmac.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const drbg = createHmacDrbg(32, 32, (key, msg) => hmac(sha256, key, msg));
 * const seed = new Uint8Array(32);
 * drbg(seed, (bytes) => bytes);
 * ```
 */
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    anumber_(hashLen, 'hashLen');
    anumber_(qByteLen, 'qByteLen');
    if (typeof hmacFn !== 'function')
        throw new TypeError('hmacFn must be a function');
    // creates Uint8Array
    const u8n = (len) => new Uint8Array(len);
    const NULL = Uint8Array.of();
    const byte0 = Uint8Array.of(0x00);
    const byte1 = Uint8Array.of(0x01);
    const _maxDrbgIters = 1000;
    // Step B, Step C: set hashLen to 8*ceil(hlen/8).
    // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 signatures.
    let v = u8n(hashLen);
    // Steps B and C of RFC6979 3.2.
    let k = u8n(hashLen);
    let i = 0; // Iterations counter, will throw when over 1000
    const reset = () => {
        v.fill(1);
        k.fill(0);
        i = 0;
    };
    // hmac(k)(v, ...values)
    const h = (...msgs) => hmacFn(k, curves_utils_concatBytes(v, ...msgs));
    const reseed = (seed = NULL) => {
        // HMAC-DRBG reseed() function. Steps D-G
        k = h(byte0, seed); // k = hmac(k || v || 0x00 || seed)
        v = h(); // v = hmac(k || v)
        if (seed.length === 0)
            return;
        k = h(byte1, seed); // k = hmac(k || v || 0x01 || seed)
        v = h(); // v = hmac(k || v)
    };
    const gen = () => {
        // HMAC-DRBG generate() function
        if (i++ >= _maxDrbgIters)
            throw new Error('drbg: tried max amount of iterations');
        let len = 0;
        const out = [];
        while (len < qByteLen) {
            v = h();
            const sl = v.slice();
            out.push(sl);
            len += v.length;
        }
        return curves_utils_concatBytes(...out);
    };
    const genUntil = (seed, pred) => {
        reset();
        reseed(seed); // Steps D-G
        let res = undefined; // Step H: grind until the predicate accepts a candidate.
        // Falsy values like 0 are valid outputs.
        while ((res = pred(gen())) === undefined)
            reseed();
        reset();
        return res;
    };
    return genUntil;
}
/**
 * Validates declared required and optional field types on a plain object.
 * Extra keys are intentionally ignored because many callers validate only the subset they use from
 * richer option bags or runtime objects.
 * @param object - Object to validate.
 * @param fields - Required field types.
 * @param optFields - Optional field types.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Check user options before building a curve helper.
 *
 * ```ts
 * validateObject({ flag: true }, { flag: 'boolean' });
 * ```
 */
function utils_validateObject(object, fields = {}, optFields = {}) {
    if (Object.prototype.toString.call(object) !== '[object Object]')
        throw new TypeError('expected valid options object');
    function checkField(fieldName, expectedType, isOpt) {
        // Config/data fields must be explicit own properties, but runtime objects such as Field
        // instances intentionally satisfy required method slots via their shared prototype.
        if (!isOpt && expectedType !== 'function' && !Object.hasOwn(object, fieldName))
            throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
        const val = object[fieldName];
        if (isOpt && val === undefined)
            return;
        const current = typeof val;
        if (current !== expectedType || val === null)
            throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
}
/**
 * Throws not implemented error.
 * @returns Never returns.
 * @throws If the unfinished code path is reached. {@link Error}
 * @example
 * Surface the placeholder error from an unfinished code path.
 *
 * ```ts
 * try {
 *   notImplemented();
 * } catch {}
 * ```
 */
const notImplemented = () => {
    throw new Error('not implemented');
};
//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/_u64.js
const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
const _32n = /* @__PURE__ */ BigInt(32);
// Split bigint into two 32-bit halves. With `le=true`, returned fields become `{ h: low, l: high
// }` to match little-endian word order rather than the property names.
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
// Split bigint list into `[highWords, lowWords]` when `le=false`; with `le=true`, the first array
// holds the low halves because `fromBig(...)` swaps the semantic meaning of `h` and `l`.
function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
// Combine explicit `(high, low)` 32-bit halves into a bigint; `>>> 0` normalizes signed JS
// bitwise results back to uint32 first, and little-endian callers must swap.
const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
// High 32-bit half of a 64-bit logical right shift for `s` in `0..31`.
const shrSH = (h, _l, s) => h >>> s;
// Low 32-bit half of a 64-bit logical right shift, valid for `s` in `1..31`.
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
// High 32-bit half of a 64-bit right rotate for `s === 32`; this is just the swapped low half.
const rotr32H = (_h, l) => l;
// Low 32-bit half of a 64-bit right rotate for `s === 32`; this is just the swapped high half.
const rotr32L = (h, _l) => h;
// High 32-bit half of a 64-bit left rotate, valid for `s` in `1..31`.
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
// Low 32-bit half of a 64-bit left rotate, valid for `s` in `1..31`.
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
// High 32-bit half of a 64-bit left rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
// Low 32-bit half of a 64-bit left rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
// Add two split 64-bit words and return the split `{ h, l }` sum.
// JS uses 32-bit signed integers for bitwise operations, so we cannot simply shift the carry out
// of the low sum and instead use division.
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
// Unmasked low-word accumulator for 3-way addition; pass the raw result into `add3H(...)`.
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
// High-word finalize step for 3-way addition; `low` must be the untruncated output of `add3L(...)`.
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 4-way addition; pass the raw result into `add4H(...)`.
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
// High-word finalize step for 4-way addition; `low` must be the untruncated output of `add4L(...)`.
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 5-way addition; pass the raw result into `add5H(...)`.
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
// High-word finalize step for 5-way addition; `low` must be the untruncated output of `add5L(...)`.
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
// prettier-ignore

// Canonical grouped namespace for callers that prefer one object.
// Named exports stay for direct imports.
// prettier-ignore
const u64 = {
    fromBig, split, toBig,
    shrSH, shrSL,
    rotrSH, rotrSL, rotrBH, rotrBL,
    rotr32H, rotr32L,
    rotlSH, rotlSL, rotlBH, rotlBL,
    add, add3L, add3H, add4L, add4H, add5H, add5L,
};
// Default export mirrors named `u64` for compatibility with object-style imports.
/* harmony default export */ const _u64 = ((/* unused pure expression or super */ null && (u64)));
//# sourceMappingURL=_u64.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/sha3.js
/**
 * SHA3 (keccak) hash function, based on a new "Sponge function" design.
 * Different from older hashes, the internal state is bigger than output size.
 *
 * Check out
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf | FIPS-202},
 * {@link https://keccak.team/keccak.html | Website}, and
 * {@link https://crypto.stackexchange.com/q/15727 | the differences between
 * SHA-3 and Keccak}.
 *
 * Check out `sha3-addons` module for cSHAKE, k12, and others.
 * @module
 */

// prettier-ignore

// No __PURE__ annotations in sha3 header:
// EVERYTHING is in fact used on every export.
// Various per round constants calculations
const sha3_0n = BigInt(0);
const sha3_1n = BigInt(1);
const _2n = BigInt(2);
const _7n = BigInt(7);
const _256n = BigInt(256);
// FIPS 202 Algorithm 5 rc(): when the outgoing bit is 1, the 8-bit LFSR xors
// taps 0, 4, 5, and 6, which compresses to the feedback mask `0x71`.
const _0x71n = BigInt(0x71);
const SHA3_PI = [];
const SHA3_ROTL = [];
const _SHA3_IOTA = []; // no pure annotation: var is always used
for (let round = 0, R = sha3_1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = sha3_0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << sha3_1n) ^ ((R >> _7n) * _0x71n)) % _256n;
        if (R & _2n)
            t ^= sha3_1n << ((sha3_1n << BigInt(j)) - sha3_1n);
    }
    _SHA3_IOTA.push(t);
}
const IOTAS = split(_SHA3_IOTA, true);
// `split(..., true)` keeps the local little-endian lane-word layout used by
// `state32`, so these `H` / `L` tables follow the file's first-word /
// second-word lane slots rather than `_u64.ts`'s usual high/low naming.
const SHA3_IOTA_H = IOTAS[0];
const SHA3_IOTA_L = IOTAS[1];
// Left rotation (without 0, 32, 64)
const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
/**
 * `keccakf1600` internal permutation, additionally allows adjusting the round count.
 * @param s - 5x5 Keccak state encoded as 25 lanes split into 50 uint32 words
 *   in this file's local little-endian lane-word order
 * @param rounds - number of rounds to execute
 * @throws If `rounds` is outside the supported `1..24` range. {@link Error}
 * @example
 * Permute a Keccak state with the default 24 rounds.
 * ```ts
 * keccakP(new Uint32Array(50));
 * ```
 */
function keccakP(s, rounds = 24) {
    anumber(rounds, 'rounds');
    // This implementation precomputes only the standard Keccak-f[1600] 24-round Iota table.
    if (rounds < 1 || rounds > 24)
        throw new Error('"rounds" expected integer 1..24');
    const B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++)
            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        // Same as:
        // for (let x = 0; x < 10; x++) B[x] = s[y + x];
        // for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        for (let y = 0; y < 50; y += 10) {
            const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
            s[y] ^= ~s[y + 2] & s[y + 4];
            s[y + 1] ^= ~s[y + 3] & s[y + 5];
            s[y + 2] ^= ~s[y + 4] & s[y + 6];
            s[y + 3] ^= ~s[y + 5] & s[y + 7];
            s[y + 4] ^= ~s[y + 6] & s[y + 8];
            s[y + 5] ^= ~s[y + 7] & s[y + 9];
            s[y + 6] ^= ~s[y + 8] & b0;
            s[y + 7] ^= ~s[y + 9] & b1;
            s[y + 8] ^= ~b0 & b2;
            s[y + 9] ^= ~b1 & b3;
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    clean(B);
}
/**
 * Keccak sponge function.
 * @param blockLen - absorb/squeeze rate in bytes
 * @param suffix - domain separation suffix byte
 * @param outputLen - default digest length in bytes. This base sponge only
 *   requires a non-negative integer; wrappers that need positive output
 *   lengths must enforce that themselves.
 * @param enableXOF - whether XOF output is allowed
 * @param rounds - number of Keccak-f rounds
 * @example
 * Build a sponge state, absorb bytes, then finalize a digest.
 * ```ts
 * const hash = new Keccak(136, 0x06, 32);
 * hash.update(new Uint8Array([1, 2, 3]));
 * hash.digest();
 * ```
 */
class Keccak {
    state;
    pos = 0;
    posOut = 0;
    finished = false;
    state32;
    destroyed = false;
    blockLen;
    suffix;
    outputLen;
    canXOF;
    enableXOF = false;
    rounds;
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.canXOF = enableXOF;
        this.rounds = rounds;
        // Can be passed from user as dkLen
        anumber(outputLen, 'outputLen');
        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
        // 0 < blockLen < 200
        if (!(0 < blockLen && blockLen < 200))
            throw new Error('only keccak-f1600 function is supported');
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
    }
    clone() {
        return this._cloneInto();
    }
    keccak() {
        swap32IfBE(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE(this.state32);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        aexists(this);
        utils_abytes(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
                state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
                this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // FIPS 202 appends the SHA3/SHAKE domain-separation suffix before pad10*1.
        // These byte values already include the first padding bit, while the
        // final `0x80` below supplies the closing `1` bit in the last rate byte.
        state[pos] ^= suffix;
        // If that combined suffix lands in the last rate byte and already sets
        // bit 7, absorb it first so the final pad10*1 bit can be xored into a
        // fresh block.
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
            this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    writeInto(out) {
        aexists(this, false);
        utils_abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len;) {
            if (this.posOut >= blockLen)
                this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        // Plain SHA3/Keccak usage with XOF is probably a mistake, but this base
        // class is also reused by SHAKE/cSHAKE/KMAC/TupleHash/ParallelHash/
        // TurboSHAKE/KangarooTwelve wrappers that intentionally enable XOF.
        if (!this.enableXOF)
            throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
    }
    xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        aoutput(out, this);
        if (this.finished)
            throw new Error('digest() was already called');
        // `aoutput(...)` allows oversized buffers; digestInto() must fill only the advertised digest.
        this.writeInto(out.subarray(0, this.outputLen));
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.outputLen);
        this.digestInto(out);
        return out;
    }
    destroy() {
        this.destroyed = true;
        clean(this.state);
    }
    _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
        // Reused destinations can come from a different rate/capacity variant, so clone must rewrite
        // the sponge geometry as well as the state words.
        to.blockLen = blockLen;
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        // Clones must preserve the public capability bit too; `_KMAC` reuses this path and deep clone
        // tests compare instance fields directly, so leaving `canXOF` behind makes the clone lie.
        to.canXOF = this.canXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const genKeccak = (suffix, blockLen, outputLen, info = {}) => utils_createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
/**
 * SHA3-224 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-224.
 * ```ts
 * sha3_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 144, 28, 
/* @__PURE__ */ oidNist(0x07))));
/**
 * SHA3-256 hash function. Different from keccak-256.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-256.
 * ```ts
 * sha3_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 136, 32, 
/* @__PURE__ */ oidNist(0x08))));
/**
 * SHA3-384 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-384.
 * ```ts
 * sha3_384(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 104, 48, 
/* @__PURE__ */ oidNist(0x09))));
/**
 * SHA3-512 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-512.
 * ```ts
 * sha3_512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_512 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 72, 64, 
/* @__PURE__ */ oidNist(0x0a))));
/**
 * Keccak-224 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-224.
 * ```ts
 * keccak_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x01, 144, 28)));
/**
 * Keccak-256 hash function. Different from SHA3-256.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-256.
 * ```ts
 * keccak_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_256 = /* @__PURE__ */ genKeccak(0x01, 136, 32);
/**
 * Keccak-384 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-384.
 * ```ts
 * keccak_384(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x01, 104, 48)));
/**
 * Keccak-512 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-512.
 * ```ts
 * keccak_512(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_512 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x01, 72, 64)));
const genShake = (suffix, blockLen, outputLen, info = {}) => utils_createHasher((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === undefined ? outputLen : opts.dkLen, true), info);
/**
 * SHAKE128 XOF with 128-bit security and a 16-byte default output.
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE128.
 * ```ts
 * shake128(new Uint8Array([97, 98, 99]), { dkLen: 32 });
 * ```
 */
const shake128 = 
/* @__PURE__ */
genShake(0x1f, 168, 16, /* @__PURE__ */ utils_oidNist(0x0b));
/**
 * SHAKE256 XOF with 256-bit security and a 32-byte default output.
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE256.
 * ```ts
 * shake256(new Uint8Array([97, 98, 99]), { dkLen: 64 });
 * ```
 */
const shake256 = 
/* @__PURE__ */
genShake(0x1f, 136, 32, /* @__PURE__ */ utils_oidNist(0x0c));
/**
 * SHAKE128 XOF with 256-bit output (NIST version).
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE128 using a 32-byte default output.
 * ```ts
 * shake128_32(new Uint8Array([97, 98, 99]), { dkLen: 32 });
 * ```
 */
const shake128_32 = 
/* @__PURE__ */
(/* unused pure expression or super */ null && (genShake(0x1f, 168, 32, /* @__PURE__ */ oidNist(0x0b))));
/**
 * SHAKE256 XOF with 512-bit output (NIST version).
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE256 using a 64-byte default output.
 * ```ts
 * shake256_64(new Uint8Array([97, 98, 99]), { dkLen: 64 });
 * ```
 */
const shake256_64 = 
/* @__PURE__ */
(/* unused pure expression or super */ null && (genShake(0x1f, 136, 64, /* @__PURE__ */ oidNist(0x0c))));
//# sourceMappingURL=sha3.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/abstract/fft.js
function checkU32(n) {
    // 0xff_ff_ff_ff
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff)
        throw new Error('wrong u32 integer:' + n);
    return n;
}
/**
 * Checks if integer is in form of `1 << X`.
 * @param x - Integer to inspect.
 * @returns `true` when the value is a power of two.
 * @throws If `x` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Validate that an FFT size is a power of two.
 *
 * ```ts
 * isPowerOfTwo(8);
 * ```
 */
function isPowerOfTwo(x) {
    checkU32(x);
    return (x & (x - 1)) === 0 && x !== 0;
}
/**
 * @param n - Input value.
 * @returns Next power of two within the u32/array-length domain.
 * @throws If `n` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Round an integer up to the FFT size it needs.
 *
 * ```ts
 * nextPowerOfTwo(9);
 * ```
 */
function nextPowerOfTwo(n) {
    checkU32(n);
    if (n <= 1)
        return 1;
    // FFT sizes here are used as JS array lengths, so `2^32` is not a meaningful result:
    // keep the fast u32 bit-twiddling path and fail explicitly instead of wrapping to 1.
    if (n > 0x8000_0000)
        throw new Error('nextPowerOfTwo overflow: result does not fit u32');
    return (1 << (log2(n - 1) + 1)) >>> 0;
}
/**
 * @param n - Value to reverse.
 * @param bits - Number of bits to use.
 * @returns Bit-reversed integer.
 * @throws If `n` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Reverse the low `bits` bits of one index.
 *
 * ```ts
 * reverseBits(3, 3);
 * ```
 */
function reverseBits(n, bits) {
    checkU32(n);
    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 32)
        throw new Error(`expected integer 0 <= bits <= 32, got ${bits}`);
    let reversed = 0;
    for (let i = 0; i < bits; i++, n >>>= 1)
        reversed = (reversed << 1) | (n & 1);
    // JS bitwise ops are signed i32; cast back so 32-bit reversals stay in the unsigned u32 domain.
    return reversed >>> 0;
}
/**
 * Similar to `bitLen(x)-1` but much faster for small integers, like indices.
 * @param n - Input value.
 * @returns Base-2 logarithm. For `n = 0`, the current implementation returns `-1`.
 * @throws If `n` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Compute the radix-2 stage count for one transform size.
 *
 * ```ts
 * log2(8);
 * ```
 */
function log2(n) {
    checkU32(n);
    return 31 - Math.clz32(n);
}
/**
 * Moves lowest bit to highest position, which at first step splits
 * array on even and odd indices, then it applied again to each part,
 * which is core of fft
 * @param values - Mutable coefficient array.
 * @returns Mutated input array.
 * @throws If the array length is not a positive power of two. {@link Error}
 * @example
 * Reorder coefficients into bit-reversed order in place.
 *
 * ```ts
 * const values = Uint8Array.from([0, 1, 2, 3]);
 * bitReversalInplace(values);
 * ```
 */
function bitReversalInplace(values) {
    const n = values.length;
    // Size-1 FFT is the identity, so bit-reversal must stay a no-op there instead of rejecting it.
    if (!isPowerOfTwo(n))
        throw new Error('expected positive power-of-two length, got ' + n);
    const bits = log2(n);
    for (let i = 0; i < n; i++) {
        const j = reverseBits(i, bits);
        if (i < j) {
            const tmp = values[i];
            values[i] = values[j];
            values[j] = tmp;
        }
    }
    return values;
}
/**
 * @param values - Input values.
 * @returns Reordered copy.
 * @throws If the array length is not a positive power of two. {@link Error}
 * @example
 * Return a reordered copy instead of mutating the input in place.
 *
 * ```ts
 * const reordered = bitReversalPermutation([0, 1, 2, 3]);
 * ```
 */
function bitReversalPermutation(values) {
    return bitReversalInplace(values.slice());
}
const fft_1n = /** @__PURE__ */ BigInt(1);
function findGenerator(field) {
    let G = BigInt(2);
    for (; field.eql(field.pow(G, field.ORDER >> fft_1n), field.ONE); G++)
        ;
    return G;
}
/**
 * We limit roots up to 2**31, which is a lot: 2-billion polynomimal should be rare.
 * @param field - Field implementation.
 * @param generator - Optional generator override.
 * @returns Roots-of-unity cache.
 * @example
 * Cache roots once, then ask for the omega table of one FFT size.
 *
 * ```ts
 * import { rootsOfUnity } from '@noble/curves/abstract/fft.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const roots = rootsOfUnity(Field(17n));
 * const omega = roots.omega(4);
 * ```
 */
function rootsOfUnity(field, generator) {
    // Factor field.ORDER-1 as oddFactor * 2^powerOfTwo
    let oddFactor = field.ORDER - fft_1n;
    let powerOfTwo = 0;
    for (; (oddFactor & fft_1n) !== fft_1n; powerOfTwo++, oddFactor >>= fft_1n)
        ;
    // Find non quadratic residue
    let G = generator !== undefined ? BigInt(generator) : findGenerator(field);
    // Powers of generator
    const omegas = new Array(powerOfTwo + 1);
    omegas[powerOfTwo] = field.pow(G, oddFactor);
    for (let i = powerOfTwo; i > 0; i--)
        omegas[i - 1] = field.sqr(omegas[i]);
    // Compute all roots of unity for powers up to maxPower
    const rootsCache = [];
    const checkBits = (bits) => {
        checkU32(bits);
        if (bits > 31 || bits > powerOfTwo)
            throw new Error('rootsOfUnity: wrong bits ' + bits + ' powerOfTwo=' + powerOfTwo);
        return bits;
    };
    const precomputeRoots = (maxPower) => {
        checkBits(maxPower);
        for (let power = maxPower; power >= 0; power--) {
            if (rootsCache[power])
                continue; // Skip if we've already computed roots for this power
            const rootsAtPower = [];
            for (let j = 0, cur = field.ONE; j < 2 ** power; j++, cur = field.mul(cur, omegas[power]))
                rootsAtPower.push(cur);
            rootsCache[power] = rootsAtPower;
        }
        return rootsCache[maxPower];
    };
    const brpCache = new Map();
    const inverseCache = new Map();
    // roots()/brp()/inverse() expose shared cached arrays by reference for speed; callers must treat them as read-only.
    // NOTE: we use bits instead of power, because power = 2**bits,
    // but power is not neccesary isPowerOfTwo(power)!
    return {
        info: { G, powerOfTwo, oddFactor },
        roots: (bits) => {
            const b = checkBits(bits);
            return precomputeRoots(b);
        },
        brp(bits) {
            const b = checkBits(bits);
            if (brpCache.has(b))
                return brpCache.get(b);
            else {
                const res = bitReversalPermutation(this.roots(b));
                brpCache.set(b, res);
                return res;
            }
        },
        inverse(bits) {
            const b = checkBits(bits);
            if (inverseCache.has(b))
                return inverseCache.get(b);
            else {
                const res = field.invertBatch(this.roots(b));
                inverseCache.set(b, res);
                return res;
            }
        },
        omega: (bits) => omegas[checkBits(bits)],
        clear: () => {
            rootsCache.splice(0, rootsCache.length);
            brpCache.clear();
            inverseCache.clear();
        },
    };
}
/**
 * Constructs different flavors of FFT. radix2 implementation of low level mutating API. Flavors:
 *
 * - DIT (Decimation-in-Time): Bottom-Up (leaves to root), Cool-Turkey
 * - DIF (Decimation-in-Frequency): Top-Down (root to leaves), Gentleman-Sande
 *
 * DIT takes brp input, returns natural output.
 * DIF takes natural input, returns brp output.
 *
 * The output is actually identical. Time / frequence distinction is not meaningful
 * for Polynomial multiplication in fields.
 * Which means if protocol supports/needs brp output/inputs, then we can skip this step.
 *
 * Cyclic NTT: Rq = Zq[x]/(x^n-1). butterfly_DIT+loop_DIT OR butterfly_DIF+loop_DIT, roots are omega
 * Negacyclic NTT: Rq = Zq[x]/(x^n+1). butterfly_DIT+loop_DIF, at least for mlkem / mldsa
 * @param F - Field operations.
 * @param coreOpts - FFT configuration:
 *   - `N`: Transform size. Must be a power of two.
 *   - `roots`: Stage roots for the selected transform size.
 *   - `dit`: Whether to run the DIT variant instead of DIF.
 *   - `invertButterflies` (optional): Whether to invert butterfly placement.
 *   - `skipStages` (optional): Number of initial stages to skip.
 *   - `brp` (optional): Whether to apply bit-reversal permutation at the boundary.
 * @returns Low-level FFT loop.
 * @throws If the FFT options or cached roots are invalid for the requested size. {@link Error}
 * @example
 * Constructs different flavors of FFT.
 *
 * ```ts
 * import { FFTCore, rootsOfUnity } from '@noble/curves/abstract/fft.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const roots = rootsOfUnity(Fp).roots(2);
 * const loop = FFTCore(Fp, { N: 4, roots, dit: true });
 * const values = loop([1n, 2n, 3n, 4n]);
 * ```
 */
const FFTCore = (F, coreOpts) => {
    const { N, roots, dit, invertButterflies = false, skipStages = 0, brp = true } = coreOpts;
    const bits = log2(N);
    if (!isPowerOfTwo(N))
        throw new Error('FFT: Polynomial size should be power of two');
    // Wrong-sized root tables can stay in-bounds for some loop shapes and silently compute nonsense.
    if (roots.length !== N)
        throw new Error(`FFT: wrong roots length: expected ${N}, got ${roots.length}`);
    const isDit = dit !== invertButterflies;
    isDit;
    return (values) => {
        if (values.length !== N)
            throw new Error('FFT: wrong Polynomial length');
        if (dit && brp)
            bitReversalInplace(values);
        for (let i = 0, g = 1; i < bits - skipStages; i++) {
            // For each stage s (sub-FFT length m = 2^s)
            const s = dit ? i + 1 + skipStages : bits - i;
            const m = 1 << s;
            const m2 = m >> 1;
            const stride = N >> s;
            // Loop over each subarray of length m
            for (let k = 0; k < N; k += m) {
                // Loop over each butterfly within the subarray
                for (let j = 0, grp = g++; j < m2; j++) {
                    const rootPos = invertButterflies ? (dit ? N - grp : grp) : j * stride;
                    const i0 = k + j;
                    const i1 = k + j + m2;
                    const omega = roots[rootPos];
                    const b = values[i1];
                    const a = values[i0];
                    // Inlining gives us 10% perf in kyber vs functions
                    if (isDit) {
                        const t = F.mul(b, omega); // Standard DIT butterfly
                        values[i0] = F.add(a, t);
                        values[i1] = F.sub(a, t);
                    }
                    else if (invertButterflies) {
                        values[i0] = F.add(b, a); // DIT loop + inverted butterflies (Kyber decode)
                        values[i1] = F.mul(F.sub(b, a), omega);
                    }
                    else {
                        values[i0] = F.add(a, b); // Standard DIF butterfly
                        values[i1] = F.mul(F.sub(a, b), omega);
                    }
                }
            }
        }
        if (!dit && brp)
            bitReversalInplace(values);
        return values;
    };
};
/**
 * NTT aka FFT over finite field (NOT over complex numbers).
 * Naming mirrors other libraries.
 * @param roots - Roots-of-unity cache.
 * @param opts - Field operations. See {@link FFTOpts}.
 * @returns Forward and inverse FFT helpers.
 * @example
 * NTT aka FFT over finite field (NOT over complex numbers).
 *
 * ```ts
 * import { FFT, rootsOfUnity } from '@noble/curves/abstract/fft.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const fft = FFT(rootsOfUnity(Fp), Fp);
 * const values = fft.direct([1n, 2n, 3n, 4n]);
 * ```
 */
function FFT(roots, opts) {
    const getLoop = (N, roots, brpInput = false, brpOutput = false) => {
        if (brpInput && brpOutput) {
            // we cannot optimize this case, but lets support it anyway
            return (values) => FFTCore(opts, { N, roots, dit: false, brp: false })(bitReversalInplace(values));
        }
        if (brpInput)
            return FFTCore(opts, { N, roots, dit: true, brp: false });
        if (brpOutput)
            return FFTCore(opts, { N, roots, dit: false, brp: false });
        return FFTCore(opts, { N, roots, dit: true, brp: true }); // all natural
    };
    return {
        direct(values, brpInput = false, brpOutput = false) {
            const N = values.length;
            if (!isPowerOfTwo(N))
                throw new Error('FFT: Polynomial size should be power of two');
            const bits = log2(N);
            return getLoop(N, roots.roots(bits), brpInput, brpOutput)(values.slice());
        },
        inverse(values, brpInput = false, brpOutput = false) {
            const N = values.length;
            if (!isPowerOfTwo(N))
                throw new Error('FFT: Polynomial size should be power of two');
            const bits = log2(N);
            const res = getLoop(N, roots.inverse(bits), brpInput, brpOutput)(values.slice());
            const ivm = opts.inv(BigInt(values.length)); // scale
            // we can get brp output if we use dif instead of dit!
            for (let i = 0; i < res.length; i++)
                res[i] = opts.mul(res[i], ivm);
            // Allows to re-use non-inverted roots, but is VERY fragile
            // return [res[0]].concat(res.slice(1).reverse());
            // inverse calculated as pow(-1), which transforms into ω^{-kn} (-> reverses indices)
            return res;
        },
    };
}
function poly(field, roots, create, fft, length) {
    const F = field;
    const _create = create ||
        ((len, elm) => new Array(len).fill(elm ?? F.ZERO));
    // `poly.mul(a, b)` distinguishes polynomial-vs-scalar at runtime, so keep accepted
    // polynomial containers concrete instead of trying to support arbitrary wrappers.
    const isPoly = (x) => {
        if (Array.isArray(x))
            return true;
        if (!ArrayBuffer.isView(x))
            return false;
        const v = x;
        return (typeof v.length === 'number' &&
            typeof v.slice === 'function' &&
            typeof v[Symbol.iterator] === 'function');
    };
    const checkLength = (...lst) => {
        if (!lst.length)
            return 0;
        for (const i of lst)
            if (!isPoly(i))
                throw new Error('poly: not polynomial: ' + i);
        const L = lst[0].length;
        for (let i = 1; i < lst.length; i++)
            if (lst[i].length !== L)
                throw new Error(`poly: mismatched lengths ${L} vs ${lst[i].length}`);
        if (length !== undefined && L !== length)
            throw new Error(`poly: expected fixed length ${length}, got ${L}`);
        return L;
    };
    function findOmegaIndex(x, n, brp = false) {
        const bits = log2(n);
        const omega = brp ? roots.brp(bits) : roots.roots(bits);
        for (let i = 0; i < n; i++)
            if (F.eql(x, omega[i]))
                return i;
        return -1;
    }
    // TODO: mutating versions for mlkem/mldsa
    return {
        roots,
        create: _create,
        length,
        extend: (a, len) => {
            checkLength(a);
            const out = _create(len, F.ZERO);
            // Plain arrays grow when writing past `out.length`, so cap the copy explicitly to keep
            // `extend()` consistent with typed arrays and with its documented truncate behavior.
            for (let i = 0; i < Math.min(a.length, len); i++)
                out[i] = a[i];
            return out;
        },
        degree: (a) => {
            checkLength(a);
            for (let i = a.length - 1; i >= 0; i--)
                if (!F.is0(a[i]))
                    return i;
            return -1;
        },
        add: (a, b) => {
            const len = checkLength(a, b);
            const out = _create(len);
            for (let i = 0; i < len; i++)
                out[i] = F.add(a[i], b[i]);
            return out;
        },
        sub: (a, b) => {
            const len = checkLength(a, b);
            const out = _create(len);
            for (let i = 0; i < len; i++)
                out[i] = F.sub(a[i], b[i]);
            return out;
        },
        dot: (a, b) => {
            const len = checkLength(a, b);
            const out = _create(len);
            for (let i = 0; i < len; i++)
                out[i] = F.mul(a[i], b[i]);
            return out;
        },
        mul: (a, b) => {
            if (isPoly(b)) {
                const len = checkLength(a, b);
                if (fft) {
                    const A = fft.direct(a, false, true);
                    const B = fft.direct(b, false, true);
                    for (let i = 0; i < A.length; i++)
                        A[i] = F.mul(A[i], B[i]);
                    return fft.inverse(A, true, false);
                }
                else {
                    // NOTE: this is quadratic and mostly for compat tests with FFT
                    const res = _create(len);
                    for (let i = 0; i < len; i++) {
                        for (let j = 0; j < len; j++) {
                            const k = (i + j) % len; // wrap mod length
                            res[k] = F.add(res[k], F.mul(a[i], b[j]));
                        }
                    }
                    return res;
                }
            }
            else {
                const out = _create(checkLength(a));
                for (let i = 0; i < out.length; i++)
                    out[i] = F.mul(a[i], b);
                return out;
            }
        },
        convolve(a, b) {
            const len = nextPowerOfTwo(a.length + b.length - 1);
            return this.mul(this.extend(a, len), this.extend(b, len));
        },
        shift(p, factor) {
            const out = _create(checkLength(p));
            out[0] = p[0];
            for (let i = 1, power = F.ONE; i < p.length; i++) {
                power = F.mul(power, factor);
                out[i] = F.mul(p[i], power);
            }
            return out;
        },
        clone: (a) => {
            checkLength(a);
            const out = _create(a.length);
            for (let i = 0; i < a.length; i++)
                out[i] = a[i];
            return out;
        },
        eval: (a, basis) => {
            checkLength(a, basis);
            let acc = F.ZERO;
            for (let i = 0; i < a.length; i++)
                acc = F.add(acc, F.mul(a[i], basis[i]));
            return acc;
        },
        monomial: {
            basis: (x, n) => {
                const out = _create(n);
                let pow = F.ONE;
                for (let i = 0; i < n; i++) {
                    out[i] = pow;
                    pow = F.mul(pow, x);
                }
                return out;
            },
            eval: (a, x) => {
                checkLength(a);
                // Same as eval(a, monomialBasis(x, a.length)), but it is faster this way
                let acc = F.ZERO;
                for (let i = a.length - 1; i >= 0; i--)
                    acc = F.add(F.mul(acc, x), a[i]);
                return acc;
            },
        },
        lagrange: {
            basis: (x, n, brp = false, weights) => {
                const bits = log2(n);
                const cache = weights || (brp ? roots.brp(bits) : roots.roots(bits)); // [ω⁰, ω¹, ..., ωⁿ⁻¹]
                const out = _create(n);
                // Fast Kronecker-δ shortcut
                const idx = findOmegaIndex(x, n, brp);
                if (idx !== -1) {
                    out[idx] = F.ONE;
                    return out;
                }
                const tm = F.pow(x, BigInt(n));
                const c = F.mul(F.sub(tm, F.ONE), F.inv(BigInt(n))); // c = (xⁿ - 1)/n
                const denom = _create(n);
                for (let i = 0; i < n; i++)
                    denom[i] = F.sub(x, cache[i]);
                const inv = F.invertBatch(denom);
                for (let i = 0; i < n; i++)
                    out[i] = F.mul(c, F.mul(cache[i], inv[i]));
                return out;
            },
            eval(a, x, brp = false) {
                checkLength(a);
                const idx = findOmegaIndex(x, a.length, brp);
                if (idx !== -1)
                    return a[idx]; // fast path
                const L = this.basis(x, a.length, brp); // Lᵢ(x)
                let acc = F.ZERO;
                for (let i = 0; i < a.length; i++)
                    if (!F.is0(a[i]))
                        acc = F.add(acc, F.mul(a[i], L[i]));
                return acc;
            },
        },
        vanishing(roots) {
            checkLength(roots);
            const out = _create(roots.length + 1, F.ZERO);
            out[0] = F.ONE;
            for (const r of roots) {
                const neg = F.neg(r);
                for (let j = out.length - 1; j > 0; j--)
                    out[j] = F.add(F.mul(out[j], neg), out[j - 1]);
                out[0] = F.mul(out[0], neg);
            }
            return out;
        },
    };
}
//# sourceMappingURL=fft.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/post-quantum/utils.js
/**
 * Utilities for hex, bytearray and number handling.
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */

/**
 * Asserts that a value is a byte array and optionally checks its length.
 * Returns the original reference unchanged on success, and currently also accepts Node `Buffer`
 * values through the upstream validator.
 * This helper throws on malformed input, so APIs that must return `false` need to guard lengths
 * before decoding or before calling it.
 * @example
 * Validate that a value is a byte array with the expected length.
 * ```ts
 * abytes(new Uint8Array([1]), 1);
 * ```
 */
const abytesDoc = utils_abytes;

/**
 * Concatenates byte arrays into a new `Uint8Array`.
 * Zero arguments return an empty `Uint8Array`.
 * Invalid segments throw before allocation because each argument is validated first.
 * @example
 * Concatenate two byte arrays into one result.
 * ```ts
 * concatBytes(new Uint8Array([1]), new Uint8Array([2]));
 * ```
 */
const concatBytesDoc = (/* unused pure expression or super */ null && (concatBytes));

/**
 * Returns cryptographically secure random bytes.
 * Requires `globalThis.crypto.getRandomValues` and throws if that API is unavailable.
 * `bytesLength` is validated by the upstream helper as a non-negative integer before allocation,
 * so negative and fractional values both throw instead of truncating through JS `ToIndex`.
 * @param bytesLength - Number of random bytes to generate.
 * @returns Fresh random bytes.
 * @example
 * Generate a fresh random seed.
 * ```ts
 * const seed = randomBytes(4);
 * ```
 */
const post_quantum_utils_randomBytes = randomBytes;
/**
 * Compares two byte arrays in a length-constant way for equal lengths.
 * Unequal lengths return `false` immediately, and there is no runtime type validation.
 * @param a - First byte array.
 * @param b - Second byte array.
 * @returns Whether both arrays contain the same bytes.
 * @example
 * Compare two byte arrays for equality.
 * ```ts
 * equalBytes(new Uint8Array([1]), new Uint8Array([1]));
 * ```
 */
function utils_equalBytes(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * Copies bytes into a fresh `Uint8Array`.
 * Returns a detached plain `Uint8Array` after validating that the input is real bytes.
 * @param bytes - Source bytes.
 * @returns Copy of the input bytes.
 * @example
 * Copy bytes into a fresh array.
 * ```ts
 * copyBytes(new Uint8Array([1, 2]));
 * ```
 */
function post_quantum_utils_copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(abytes(bytes));
}
/**
 * Byte-swaps each 64-bit lane in place.
 * Falcon's exact binary64 tables are stored as little-endian byte payloads, so BE runtimes need
 * this boundary helper before aliasing them as host `Float64Array` lanes.
 * @param arr - Byte buffer whose length is a multiple of 8.
 * @returns The same buffer after in-place 64-bit lane byte swaps.
 * @example
 * Byte-swap one 64-bit lane in place.
 * ```ts
 * byteSwap64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
 * ```
 */
function byteSwap64(arr) {
    const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    for (let i = 0; i < bytes.length; i += 8) {
        const a0 = bytes[i + 0];
        const a1 = bytes[i + 1];
        const a2 = bytes[i + 2];
        const a3 = bytes[i + 3];
        bytes[i + 0] = bytes[i + 7];
        bytes[i + 1] = bytes[i + 6];
        bytes[i + 2] = bytes[i + 5];
        bytes[i + 3] = bytes[i + 4];
        bytes[i + 4] = a3;
        bytes[i + 5] = a2;
        bytes[i + 6] = a1;
        bytes[i + 7] = a0;
    }
    return arr;
}
/**
 * Byte-swaps 64-bit lanes on big-endian runtimes and returns the input unchanged on little-endian.
 * This keeps Falcon's binary64 tables in canonical little-endian order before aliasing them as
 * `Float64Array` lanes on the current host.
 * @param arr - Buffer to pass through or swap in place.
 * @returns The same buffer, normalized for Falcon's little-endian table layout.
 * @example
 * Normalize one host-endian buffer for Falcon's float tables.
 * ```ts
 * baswap64If(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
 * ```
 */
const baswap64If = (/* unused pure expression or super */ null && (isLE
    ? (arr) => arr
    : byteSwap64));
/**
 * Validates that an options bag is a plain object.
 * @param opts - Options object to validate.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate that an options bag is a plain object.
 * ```ts
 * validateOpts({});
 * ```
 */
function validateOpts(opts) {
    // Arrays silently passed here before, but these call sites expect named option-bag fields.
    if (Object.prototype.toString.call(opts) !== '[object Object]')
        throw new TypeError('expected valid options object');
}
/**
 * Validates common verification options.
 * `context` itself is validated with `abytes(...)`, and individual algorithms may narrow support
 * further after this shared plain-object gate.
 * @param opts - Verification options. See {@link VerOpts}.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate common verification options.
 * ```ts
 * validateVerOpts({ context: new Uint8Array([1]) });
 * ```
 */
function validateVerOpts(opts) {
    validateOpts(opts);
    if (opts.context !== undefined)
        utils_abytes(opts.context, undefined, 'opts.context');
}
/**
 * Validates common signing options.
 * `extraEntropy` is validated with `abytes(...)`; exact lengths and extra algorithm-specific
 * restrictions are enforced later by callers.
 * @param opts - Signing options. See {@link SigOpts}.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate common signing options.
 * ```ts
 * validateSigOpts({ extraEntropy: new Uint8Array([1]) });
 * ```
 */
function validateSigOpts(opts) {
    validateVerOpts(opts);
    if (opts.extraEntropy !== false && opts.extraEntropy !== undefined)
        utils_abytes(opts.extraEntropy, undefined, 'opts.extraEntropy');
}
/**
 * Builds a fixed-layout coder from byte lengths and nested coders.
 * Raw-length fields decode as zero-copy `subarray(...)` views, and nested coders may preserve that
 * aliasing too. Nested coder `encode(...)` results are treated as owned scratch: `splitCoder`
 * copies them into the output and then zeroizes them with `fill(0)`. If a nested encoder forwards
 * caller-owned bytes, it must do so only after detaching them into a disposable copy.
 * @param label - Label used in validation errors.
 * @param lengths - Field lengths or nested coders.
 * @returns Composite fixed-length coder.
 * @example
 * Build a fixed-layout coder from byte lengths and nested coders.
 * ```ts
 * splitCoder('demo', 1, 2).encode([new Uint8Array([1]), new Uint8Array([2, 3])]);
 * ```
 */
function splitCoder(label, ...lengths) {
    const getLength = (c) => typeof c === 'number' ? c : c.bytesLen;
    const bytesLen = lengths.reduce((sum, a) => sum + getLength(a), 0);
    return {
        bytesLen,
        encode: (bufs) => {
            const res = new Uint8Array(bytesLen);
            for (let i = 0, pos = 0; i < lengths.length; i++) {
                const c = lengths[i];
                const l = getLength(c);
                const b = typeof c === 'number' ? bufs[i] : c.encode(bufs[i]);
                utils_abytes(b, l, label);
                res.set(b, pos);
                if (typeof c !== 'number')
                    b.fill(0); // clean
                pos += l;
            }
            return res;
        },
        decode: (buf) => {
            utils_abytes(buf, bytesLen, label);
            const res = [];
            for (const c of lengths) {
                const l = getLength(c);
                const b = buf.subarray(0, l);
                res.push(typeof c === 'number' ? b : c.decode(b));
                buf = buf.subarray(l);
            }
            return res;
        },
    };
}
// nano-packed.array (fixed size)
/**
 * Builds a fixed-length vector coder from another fixed-length coder.
 * Element decoding receives `subarray(...)` views, so aliasing depends on the element coder.
 * Element coder `encode(...)` results are treated as owned scratch: `vecCoder` copies them into
 * the output and then zeroizes them with `fill(0)`. If an element encoder forwards caller-owned
 * bytes, it must do so only after detaching them into a disposable copy. `vecCoder` also trusts
 * the `BytesCoderLen` contract: each encoded element must already be exactly `c.bytesLen` bytes.
 * @param c - Element coder.
 * @param vecLen - Number of elements in the vector.
 * @returns Fixed-length vector coder.
 * @example
 * Build a fixed-length vector coder from another fixed-length coder.
 * ```ts
 * vecCoder(
 *   { bytesLen: 1, encode: (n: number) => Uint8Array.of(n), decode: (b: Uint8Array) => b[0] || 0 },
 *   2
 * ).encode([1, 2]);
 * ```
 */
function vecCoder(c, vecLen) {
    const coder = c;
    const bytesLen = vecLen * coder.bytesLen;
    return {
        bytesLen,
        encode: (u) => {
            if (u.length !== vecLen)
                throw new RangeError(`vecCoder.encode: wrong length=${u.length}. Expected: ${vecLen}`);
            const res = new Uint8Array(bytesLen);
            for (let i = 0, pos = 0; i < u.length; i++) {
                const b = coder.encode(u[i]);
                res.set(b, pos);
                b.fill(0); // clean
                pos += b.length;
            }
            return res;
        },
        decode: (a) => {
            utils_abytes(a, bytesLen);
            const r = [];
            for (let i = 0; i < a.length; i += coder.bytesLen)
                r.push(coder.decode(a.subarray(i, i + coder.bytesLen)));
            return r;
        },
    };
}
/**
 * Overwrites supported typed-array inputs with zeroes in place.
 * Accepts direct typed arrays and one-level arrays of them.
 * @param list - Typed arrays or one-level lists of typed arrays to clear.
 * @example
 * Overwrite typed arrays with zeroes.
 * ```ts
 * const buf = Uint8Array.of(1, 2, 3);
 * cleanBytes(buf);
 * ```
 */
function cleanBytes(...list) {
    for (const t of list) {
        if (Array.isArray(t))
            for (const b of t)
                b.fill(0);
        else
            t.fill(0);
    }
}
/**
 * Creates a 32-bit mask with the lowest `bits` bits set.
 * @param bits - Number of low bits to keep.
 * @returns Bit mask with `bits` ones.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Create a low-bit mask for packed-field operations.
 * ```ts
 * const mask = getMask(4);
 * ```
 */
function getMask(bits) {
    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 32)
        throw new RangeError(`expected bits in [0..32], got ${bits}`);
    // JS shifts are modulo 32, so bit 32 needs an explicit full-width mask.
    return bits === 32 ? 0xffffffff : ~(-1 << bits) >>> 0;
}
/** Shared empty byte array used as the default context. */
const EMPTY = /* @__PURE__ */ Uint8Array.of();
/**
 * Builds the domain-separated message payload for the pure sign/verify paths.
 * Context length `255` is valid; only `ctx.length > 255` is rejected.
 * @param msg - Message bytes.
 * @param ctx - Optional context bytes.
 * @returns Domain-separated message payload.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Build the domain-separated payload before direct signing.
 * ```ts
 * const payload = getMessage(new Uint8Array([1, 2]));
 * ```
 */
function getMessage(msg, ctx = EMPTY) {
    utils_abytes(msg);
    utils_abytes(ctx);
    if (ctx.length > 255)
        throw new RangeError('context should be 255 bytes or less');
    return utils_concatBytes(new Uint8Array([0, ctx.length]), ctx, msg);
}
// DER tag+length plus the shared NIST hash OID arc 2.16.840.1.101.3.4.2.* used by the
// FIPS 204 / FIPS 205 pre-hash wrappers; the final byte selects SHA-256, SHA-512, SHAKE128,
// SHAKE256, or another approved hash/XOF under that subtree.
// 06 09 60 86 48 01 65 03 04 02
const oidNistP = /* @__PURE__ */ Uint8Array.from([6, 9, 0x60, 0x86, 0x48, 1, 0x65, 3, 4, 2]);
/**
 * Validates that a hash exposes a NIST hash OID and enough collision resistance.
 * Current accepted surface is broader than the FIPS algorithm tables: any hash/XOF under the NIST
 * `2.16.840.1.101.3.4.2.*` subtree is accepted if its effective `outputLen` is strong enough.
 * XOF callers must pass a callable whose `outputLen` matches the digest length they actually intend
 * to sign; bare `shake128` / `shake256` defaults are too short for the stronger prehash modes.
 * @param hash - Hash function to validate.
 * @param requiredStrength - Minimum required collision-resistance strength in bits.
 * @throws If the hash metadata or collision resistance is insufficient. {@link Error}
 * @example
 * Validate that a hash exposes a NIST hash OID and enough collision resistance.
 * ```ts
 * import { sha256 } from '@noble/hashes/sha2.js';
 * import { checkHash } from '@noble/post-quantum/utils.js';
 * checkHash(sha256, 128);
 * ```
 */
function checkHash(hash, requiredStrength = 0) {
    if (!hash.oid || !utils_equalBytes(hash.oid.subarray(0, 10), oidNistP))
        throw new Error('hash.oid is invalid: expected NIST hash');
    // FIPS 204 / FIPS 205 require both collision and second-preimage strength; for approved NIST
    // hashes/XOFs under this OID subtree, the collision bound from the configured digest length is
    // the tighter runtime check, so enforce that lower bound here.
    const collisionResistance = (hash.outputLen * 8) / 2;
    if (requiredStrength > collisionResistance) {
        throw new Error('Pre-hash security strength too low: ' +
            collisionResistance +
            ', required: ' +
            requiredStrength);
    }
}
/**
 * Builds the domain-separated prehash payload for the prehash sign/verify paths.
 * Callers are expected to vet `hash.oid` first, e.g. via `checkHash(...)`; calling this helper
 * directly with a hash object that lacks `oid` currently throws later inside `concatBytes(...)`.
 * Context length `255` is valid; only `ctx.length > 255` is rejected.
 * @param hash - Prehash function.
 * @param msg - Message bytes.
 * @param ctx - Optional context bytes.
 * @returns Domain-separated prehash payload.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Build the domain-separated prehash payload for external hashing.
 * ```ts
 * import { sha256 } from '@noble/hashes/sha2.js';
 * import { getMessagePrehash } from '@noble/post-quantum/utils.js';
 * getMessagePrehash(sha256, new Uint8Array([1, 2]));
 * ```
 */
function getMessagePrehash(hash, msg, ctx = EMPTY) {
    utils_abytes(msg);
    utils_abytes(ctx);
    if (ctx.length > 255)
        throw new RangeError('context should be 255 bytes or less');
    const hashed = hash(msg);
    return utils_concatBytes(new Uint8Array([1, ctx.length]), ctx, hash.oid, hashed);
}
//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/post-quantum/_crystals.js
/**
 * Internal methods for lattice-based ML-KEM and ML-DSA.
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */



/**
 * Creates shared modular arithmetic, NTT, and packing helpers for CRYSTALS schemes.
 * @param opts - Polynomial and transform parameters. See {@link CrystalOpts}.
 * @returns CRYSTALS arithmetic and encoding helpers.
 * @example
 * Create shared modular arithmetic and NTT helpers for a CRYSTALS parameter set.
 * ```ts
 * const crystals = genCrystals({
 *   newPoly: (n) => new Uint16Array(n),
 *   N: 256,
 *   Q: 3329,
 *   F: 3303,
 *   ROOT_OF_UNITY: 17,
 *   brvBits: 7,
 *   isKyber: true,
 * });
 * const reduced = crystals.mod(-1);
 * ```
 */
const genCrystals = (opts) => {
    // isKyber: true means Kyber, false means Dilithium
    const { newPoly, N, Q, F, ROOT_OF_UNITY, brvBits, isKyber } = opts;
    // Normalize JS `%` into the canonical Z_m representative `[0, modulo-1]` expected by
    // FIPS 203 §2.3 / FIPS 204 §2.3 before downstream mod-q arithmetic.
    const mod = (a, modulo = Q) => {
        const result = a % modulo | 0;
        return (result >= 0 ? result | 0 : (modulo + result) | 0) | 0;
    };
    // FIPS 204 §7.4 uses the centered `mod ±` representative for low bits, keeping the
    // positive midpoint when `modulo` is even.
    // Center to `[-floor((modulo-1)/2), floor(modulo/2)]`.
    const smod = (a, modulo = Q) => {
        const r = mod(a, modulo) | 0;
        return (r > modulo >> 1 ? (r - modulo) | 0 : r) | 0;
    };
    // Kyber uses the FIPS 203 Appendix A `BitRev_7` table here via the first 128 entries, while
    // Dilithium uses the FIPS 204 §7.5 / Appendix B `BitRev_8` zetas table over all 256 entries.
    function getZettas() {
        const out = newPoly(N);
        for (let i = 0; i < N; i++) {
            const b = reverseBits(i, brvBits);
            const p = BigInt(ROOT_OF_UNITY) ** BigInt(b) % BigInt(Q);
            out[i] = Number(p) | 0;
        }
        return out;
    }
    const nttZetas = getZettas();
    // Number-Theoretic Transform
    // Explained: https://electricdusk.com/ntt.html
    // Kyber has slightly different params, since there is no 512th primitive root of unity mod q,
    // only 256th primitive root of unity mod. Which also complicates MultiplyNTT.
    const field = {
        add: (a, b) => mod((a | 0) + (b | 0)) | 0,
        sub: (a, b) => mod((a | 0) - (b | 0)) | 0,
        mul: (a, b) => mod((a | 0) * (b | 0)) | 0,
        inv: (_a) => {
            throw new Error('not implemented');
        },
    };
    const nttOpts = {
        N,
        roots: nttZetas,
        invertButterflies: true,
        skipStages: isKyber ? 1 : 0,
        brp: false,
    };
    const dif = FFTCore(field, { dit: false, ...nttOpts });
    const dit = FFTCore(field, { dit: true, ...nttOpts });
    const NTT = {
        encode: (r) => {
            return dif(r);
        },
        decode: (r) => {
            dit(r);
            // The inverse-NTT normalization factor is family-specific: FIPS 203 Algorithm 10 line 14
            // uses `128^-1 mod q` for Kyber, while FIPS 204 Algorithm 42 lines 21-23 use `256^-1 mod q`.
            // kyber uses 128 here, because brv && stuff
            for (let i = 0; i < r.length; i++)
                r[i] = mod(F * r[i]);
            return r;
        },
    };
    // Pack one little-endian `d`-bit word per coefficient, matching FIPS 203 ByteEncode /
    // ByteDecode and the FIPS 204 BitsToBytes-based polynomial packing helpers.
    const bitsCoder = (d, c) => {
        const mask = getMask(d);
        const bytesLen = d * (N / 8);
        return {
            bytesLen,
            encode: (poly_) => {
                const poly = poly_;
                const r = new Uint8Array(bytesLen);
                for (let i = 0, buf = 0, bufLen = 0, pos = 0; i < poly.length; i++) {
                    buf |= (c.encode(poly[i]) & mask) << bufLen;
                    bufLen += d;
                    for (; bufLen >= 8; bufLen -= 8, buf >>= 8)
                        r[pos++] = buf & getMask(bufLen);
                }
                return r;
            },
            decode: (bytes) => {
                const r = newPoly(N);
                for (let i = 0, buf = 0, bufLen = 0, pos = 0; i < bytes.length; i++) {
                    buf |= bytes[i] << bufLen;
                    bufLen += 8;
                    for (; bufLen >= d; bufLen -= d, buf >>= d)
                        r[pos++] = c.decode(buf & mask);
                }
                return r;
            },
        };
    };
    return {
        mod,
        smod,
        nttZetas: nttZetas,
        NTT: {
            encode: (r) => NTT.encode(r),
            decode: (r) => NTT.decode(r),
        },
        bitsCoder: bitsCoder,
    };
};
const createXofShake = (shake) => (seed, blockLen) => {
    if (!blockLen)
        blockLen = shake.blockLen;
    // Optimizations that won't mater:
    // - cached seed update (two .update(), on start and on the end)
    // - another cache which cloned into working copy
    // Faster than multiple updates, since seed less than blockLen
    const _seed = new Uint8Array(seed.length + 2);
    _seed.set(seed);
    const seedLen = seed.length;
    const buf = new Uint8Array(blockLen); // == shake128.blockLen
    let h = shake.create({});
    let calls = 0;
    let xofs = 0;
    return {
        stats: () => ({ calls, xofs }),
        get: (x, y) => {
            // Rebind to `seed || x || y` so callers can implement the spec's per-coordinate
            // SHAKE inputs like `rho || j || i` and `rho || IntegerToBytes(counter, 2)`.
            _seed[seedLen + 0] = x;
            _seed[seedLen + 1] = y;
            h.destroy();
            h = shake.create({}).update(_seed);
            calls++;
            return () => {
                xofs++;
                return h.xofInto(buf);
            };
        },
        clean: () => {
            h.destroy();
            cleanBytes(buf, _seed);
        },
    };
};
/**
 * SHAKE128-based extendable-output reader factory used by ML-KEM.
 * `get(x, y)` selects one coordinate pair at a time; calling it again invalidates previously
 * returned readers, and each squeeze reuses one mutable internal output buffer.
 * @param seed - Seed bytes for the reader.
 * @param blockLen - Optional output block length.
 * @returns Stateful XOF reader.
 * @example
 * Build the ML-KEM SHAKE128 matrix expander and read one block.
 * ```ts
 * import { randomBytes } from '@noble/post-quantum/utils.js';
 * import { XOF128 } from '@noble/post-quantum/_crystals.js';
 * const reader = XOF128(randomBytes(32));
 * const block = reader.get(0, 0)();
 * ```
 */
const _crystals_XOF128 = /* @__PURE__ */ createXofShake(shake128);
/**
 * SHAKE256-based extendable-output reader factory used by ML-DSA.
 * `get(x, y)` appends raw one-byte coordinates to the seed, invalidates previously returned
 * readers, and reuses one mutable internal output buffer for each squeeze.
 * @param seed - Seed bytes for the reader.
 * @param blockLen - Optional output block length.
 * @returns Stateful XOF reader.
 * @example
 * Build the ML-DSA SHAKE256 coefficient expander and read one block.
 * ```ts
 * import { randomBytes } from '@noble/post-quantum/utils.js';
 * import { XOF256 } from '@noble/post-quantum/_crystals.js';
 * const reader = XOF256(randomBytes(32));
 * const block = reader.get(0, 0)();
 * ```
 */
const _crystals_XOF256 = /* @__PURE__ */ createXofShake(shake256);
//# sourceMappingURL=_crystals.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/post-quantum/ml-dsa.js
/**
 * ML-DSA: Module Lattice-based Digital Signature Algorithm from
 * [FIPS-204](https://csrc.nist.gov/pubs/fips/204/ipd). A.k.a. CRYSTALS-Dilithium.
 *
 * Has similar internals to ML-KEM, but their keys and params are different.
 * Check out [official site](https://www.pq-crystals.org/dilithium/index.shtml),
 * [repo](https://github.com/pq-crystals/dilithium).
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */




function validateInternalOpts(opts) {
    validateOpts(opts);
    if (opts.externalMu !== undefined)
        abool(opts.externalMu, 'opts.externalMu');
}
// Constants
// FIPS 204 fixes ML-DSA over R = Z[X]/(X^256 + 1), so every polynomial has 256 coefficients.
const N = 256;
// 2**23 − 2**13 + 1, 23 bits: multiply will be 46. We have enough precision in JS to avoid bigints
const Q = 8380417;
// FIPS 204 §2.5 / Table 1 fixes zeta = 1753 as the 512th root of unity used by ML-DSA's NTT.
const ROOT_OF_UNITY = 1753;
// f = 256**−1 mod q, pow(256, -1, q) = 8347681 (python3)
const F = 8347681;
// FIPS 204 Table 1 / §7.4 fixes d = 13 dropped low bits for Power2Round on t.
const D = 13;
// FIPS 204 Table 1 fixes gamma2 to (q-1)/88 for ML-DSA-44 and (q-1)/32 for ML-DSA-65/87;
// §7.4 then uses alpha = 2*gamma2 for Decompose / MakeHint / UseHint.
// Dilithium is kinda parametrized over GAMMA2, but everything will break with any other value.
const GAMMA2_1 = Math.floor((Q - 1) / 88) | 0;
const GAMMA2_2 = Math.floor((Q - 1) / 32) | 0;
/** Internal params for different versions of ML-DSA  */
// prettier-ignore
/** Built-in ML-DSA parameter presets keyed by security categories `2/3/5`
 * for `ml_dsa44` / `ml_dsa65` / `ml_dsa87`.
 * This is only the Table 1 subset used directly here: `BETA = TAU * ETA` is derived later,
 * while `C_TILDE_BYTES`, `TR_BYTES`, `CRH_BYTES`, and `securityLevel` live in the preset wrappers.
 */
const PARAMS = /* @__PURE__ */ (() => Object.freeze({
    2: Object.freeze({
        K: 4, L: 4, D, GAMMA1: 2 ** 17, GAMMA2: GAMMA2_1, TAU: 39, ETA: 2, OMEGA: 80
    }),
    3: Object.freeze({
        K: 6, L: 5, D, GAMMA1: 2 ** 19, GAMMA2: GAMMA2_2, TAU: 49, ETA: 4, OMEGA: 55
    }),
    5: Object.freeze({
        K: 8, L: 7, D, GAMMA1: 2 ** 19, GAMMA2: GAMMA2_2, TAU: 60, ETA: 2, OMEGA: 75
    }),
}))();
const newPoly = (n) => new Int32Array(n);
// Shared CRYSTALS helper in the ML-DSA branch: non-Kyber mode, 8-bit bit-reversal,
// and Int32Array polys because ordinary-form coefficients can be negative / centered.
const crystals = /* @__PURE__ */ genCrystals({
    N,
    Q,
    F,
    ROOT_OF_UNITY,
    newPoly,
    isKyber: false,
    brvBits: 8,
});
const id = (n) => n;
// compress()/verify() must be compatible in both directions:
// wrap the shared d-bit packer with the FIPS 204 SimpleBitPack / BitPack coefficient maps.
// malformed-input rejection only happens through the optional verify hook.
const polyCoder = (d, compress = id, verify = id) => crystals.bitsCoder(d, {
    encode: (i) => compress(verify(i)),
    decode: (i) => verify(compress(i)),
});
// Mutates `a` in place; callers must pass same-length polynomials.
const polyAdd = (a_, b_) => {
    const a = a_;
    const b = b_;
    for (let i = 0; i < a.length; i++)
        a[i] = crystals.mod(a[i] + b[i]);
    return a;
};
// Mutates `a` in place; callers must pass same-length polynomials.
const polySub = (a_, b_) => {
    const a = a_;
    const b = b_;
    for (let i = 0; i < a.length; i++)
        a[i] = crystals.mod(a[i] - b[i]);
    return a;
};
// Mutates `p` in place and assumes it is a decoded `t1`-range polynomial.
const polyShiftl = (p_) => {
    const p = p_;
    for (let i = 0; i < N; i++)
        p[i] <<= D;
    return p;
};
const polyChknorm = (p_, B) => {
    const p = p_;
    // FIPS 204 Algorithms 7 and 8 express the same centered-norm check with explicit inequalities.
    for (let i = 0; i < N; i++)
        if (Math.abs(crystals.smod(p[i])) >= B)
            return true;
    return false;
};
// Both inputs must already be in NTT / `T_q` form.
const MultiplyNTTs = (a_, b_) => {
    const a = a_;
    const b = b_;
    // NOTE: we don't use montgomery reduction in code, since it requires 64 bit ints,
    // which is not available in JS. mod(a[i] * b[i]) is ok, since Q is 23 bit,
    // which means a[i] * b[i] is 46 bit, which is safe to use in JS. (number is 53 bits).
    // Barrett reduction is slower than mod :(
    const c = newPoly(N);
    for (let i = 0; i < a.length; i++)
        c[i] = crystals.mod(a[i] * b[i]);
    return c;
};
// Return poly in NTT representation
function RejNTTPoly(xof_) {
    const xof = xof_;
    // Samples a polynomial ∈ Tq. xof() must return byte lengths divisible by 3.
    const r = newPoly(N);
    // NOTE: we can represent 3xu24 as 4xu32, but it doesn't improve perf :(
    for (let j = 0; j < N;) {
        const b = xof();
        if (b.length % 3)
            throw new Error('RejNTTPoly: unaligned block');
        for (let i = 0; j < N && i <= b.length - 3; i += 3) {
            // FIPS 204 Algorithm 14 clears the top bit of b2 before forming the 23-bit candidate.
            const t = (b[i + 0] | (b[i + 1] << 8) | (b[i + 2] << 16)) & 0x7fffff; // 3 bytes
            if (t < Q)
                r[j++] = t;
        }
    }
    return r;
}
// Instantiate one ML-DSA parameter set from the Table 1 lattice constants plus the
// Table 2 byte lengths / hash-width choices used by the public wrappers below.
function getDilithium(opts_) {
    const opts = opts_;
    const { K, L, GAMMA1, GAMMA2, TAU, ETA, OMEGA } = opts;
    const { CRH_BYTES, TR_BYTES, C_TILDE_BYTES, XOF128, XOF256, securityLevel } = opts;
    if (![2, 4].includes(ETA))
        throw new Error('Wrong ETA');
    if (![1 << 17, 1 << 19].includes(GAMMA1))
        throw new Error('Wrong GAMMA1');
    if (![GAMMA2_1, GAMMA2_2].includes(GAMMA2))
        throw new Error('Wrong GAMMA2');
    const BETA = TAU * ETA;
    const decompose = (r) => {
        // Decomposes r into (r1, r0) such that r ≡ r1(2γ2) + r0 mod q.
        const rPlus = crystals.mod(r);
        const r0 = crystals.smod(rPlus, 2 * GAMMA2) | 0;
        // FIPS 204 Algorithm 36 folds the top bucket `q-1` back to `(r1, r0) = (0, r0-1)`.
        if (rPlus - r0 === Q - 1)
            return { r1: 0 | 0, r0: (r0 - 1) | 0 };
        const r1 = Math.floor((rPlus - r0) / (2 * GAMMA2)) | 0;
        return { r1, r0 }; // r1 = HighBits, r0 = LowBits
    };
    const HighBits = (r) => decompose(r).r1;
    const LowBits = (r) => decompose(r).r0;
    const MakeHint = (z, r) => {
        // Compute hint bit indicating whether adding z to r alters the high bits of r.
        // FIPS 204 §6.2 also permits the Section 5.1 alternative from [6], which uses the
        // transformed low-bits/high-bits state at this call site instead of Algorithm 39 literally.
        // This optimized predicate only applies to those transformed Section 5.1 inputs; it is
        // not a drop-in replacement for Algorithm 39 on arbitrary `(z, r)` pairs.
        // From dilithium code
        const res0 = z <= GAMMA2 || z > Q - GAMMA2 || (z === Q - GAMMA2 && r === 0) ? 0 : 1;
        // from FIPS204:
        // // const r1 = HighBits(r);
        // // const v1 = HighBits(r + z);
        // // const res1 = +(r1 !== v1);
        // But they return different results! However, decompose is same.
        // So, either there is a bug in Dilithium ref implementation or in FIPS204.
        // For now, lets use dilithium one, so test vectors can be passed.
        // The round-3 Dilithium / ML-DSA code uses the same low-bits / high-bits convention after
        // `r0 += ct0`.
        // See dilithium-py README section "Optimising decomposition and making hints".
        return res0;
    };
    const UseHint = (h, r) => {
        // Returns the high bits of r adjusted according to hint h
        const m = Math.floor((Q - 1) / (2 * GAMMA2));
        const { r1, r0 } = decompose(r);
        // 3: if h = 1 and r0 > 0 return (r1 + 1) mod m
        // 4: if h = 1 and r0 ≤ 0 return (r1 − 1) mod m
        if (h === 1)
            return r0 > 0 ? crystals.mod(r1 + 1, m) | 0 : crystals.mod(r1 - 1, m) | 0;
        return r1 | 0;
    };
    const Power2Round = (r) => {
        // Decomposes r into (r1, r0) such that r ≡ r1*(2**d) + r0 mod q.
        const rPlus = crystals.mod(r);
        const r0 = crystals.smod(rPlus, 2 ** D) | 0;
        return { r1: Math.floor((rPlus - r0) / 2 ** D) | 0, r0 };
    };
    const hintCoder = {
        bytesLen: OMEGA + K,
        encode: (h_) => {
            const h = h_;
            if (h === false)
                throw new Error('hint.encode: hint is false'); // should never happen
            const res = new Uint8Array(OMEGA + K);
            for (let i = 0, k = 0; i < K; i++) {
                for (let j = 0; j < N; j++)
                    if (h[i][j] !== 0)
                        res[k++] = j;
                res[OMEGA + i] = k;
            }
            return res;
        },
        decode: (buf) => {
            const h = [];
            let k = 0;
            for (let i = 0; i < K; i++) {
                const hi = newPoly(N);
                if (buf[OMEGA + i] < k || buf[OMEGA + i] > OMEGA)
                    return false;
                for (let j = k; j < buf[OMEGA + i]; j++) {
                    if (j > k && buf[j] <= buf[j - 1])
                        return false;
                    hi[buf[j]] = 1;
                }
                k = buf[OMEGA + i];
                h.push(hi);
            }
            for (let j = k; j < OMEGA; j++)
                if (buf[j] !== 0)
                    return false;
            return h;
        },
    };
    const ETACoder = polyCoder(ETA === 2 ? 3 : 4, (i) => ETA - i, (i) => {
        if (!(-ETA <= i && i <= ETA))
            throw new Error(`malformed key s1/s3 ${i} outside of ETA range [${-ETA}, ${ETA}]`);
        return i;
    });
    const T0Coder = polyCoder(13, (i) => (1 << (D - 1)) - i);
    const T1Coder = polyCoder(10);
    // Requires smod. Need to fix!
    const ZCoder = polyCoder(GAMMA1 === 1 << 17 ? 18 : 20, (i) => crystals.smod(GAMMA1 - i));
    const W1Coder = polyCoder(GAMMA2 === GAMMA2_1 ? 6 : 4);
    const W1Vec = vecCoder(W1Coder, K);
    // Main structures
    const publicCoder = splitCoder('publicKey', 32, vecCoder(T1Coder, K));
    const secretCoder = splitCoder('secretKey', 32, 32, TR_BYTES, vecCoder(ETACoder, L), vecCoder(ETACoder, K), vecCoder(T0Coder, K));
    const sigCoder = splitCoder('signature', C_TILDE_BYTES, vecCoder(ZCoder, L), hintCoder);
    const CoefFromHalfByte = ETA === 2
        ? (n) => (n < 15 ? 2 - (n % 5) : false)
        : (n) => (n < 9 ? 4 - n : false);
    // Return poly in ordinary representation.
    // This helper returns ordinary-form `[-ETA, ETA]` coefficients for ExpandS; callers apply
    // `NTT.encode()` later when needed.
    function RejBoundedPoly(xof_) {
        const xof = xof_;
        // Samples an element a ∈ Rq with coeffcients in [−η, η] computed via rejection sampling from ρ.
        const r = newPoly(N);
        for (let j = 0; j < N;) {
            const b = xof();
            for (let i = 0; j < N && i < b.length; i += 1) {
                // half byte. Should be superfast with vector instructions. But very slow with js :(
                const d1 = CoefFromHalfByte(b[i] & 0x0f);
                const d2 = CoefFromHalfByte((b[i] >> 4) & 0x0f);
                if (d1 !== false)
                    r[j++] = d1;
                if (j < N && d2 !== false)
                    r[j++] = d2;
            }
        }
        return r;
    }
    const SampleInBall = (seed) => {
        // Samples a polynomial c ∈ Rq with coeffcients from {−1, 0, 1} and Hamming weight τ
        const pre = newPoly(N);
        const s = shake256.create({}).update(seed);
        const buf = new Uint8Array(shake256.blockLen);
        s.xofInto(buf);
        // FIPS 204 Algorithm 29 uses the first 8 squeezed bytes as the 64 sign bits `h`,
        // then rejection-samples coefficient positions from the remaining XOF stream.
        const masks = buf.slice(0, 8);
        for (let i = N - TAU, pos = 8, maskPos = 0, maskBit = 0; i < N; i++) {
            let b = i + 1;
            for (; b > i;) {
                b = buf[pos++];
                if (pos < shake256.blockLen)
                    continue;
                s.xofInto(buf);
                pos = 0;
            }
            pre[i] = pre[b];
            pre[b] = 1 - (((masks[maskPos] >> maskBit++) & 1) << 1);
            if (maskBit >= 8) {
                maskPos++;
                maskBit = 0;
            }
        }
        return pre;
    };
    const polyPowerRound = (p_) => {
        const p = p_;
        const res0 = newPoly(N);
        const res1 = newPoly(N);
        for (let i = 0; i < p.length; i++) {
            const { r0, r1 } = Power2Round(p[i]);
            res0[i] = r0;
            res1[i] = r1;
        }
        return { r0: res0, r1: res1 };
    };
    const polyUseHint = (u_, h_) => {
        const u = u_;
        const h = h_;
        // In-place on `u`: verification only needs the recovered high bits, so reuse the
        // temporary `wApprox` buffer instead of allocating another polynomial.
        for (let i = 0; i < N; i++)
            u[i] = UseHint(h[i], u[i]);
        return u;
    };
    const polyMakeHint = (a_, b_) => {
        const a = a_;
        const b = b_;
        const v = newPoly(N);
        let cnt = 0;
        for (let i = 0; i < N; i++) {
            const h = MakeHint(a[i], b[i]);
            v[i] = h;
            cnt += h;
        }
        return { v, cnt };
    };
    const signRandBytes = 32;
    const seedCoder = splitCoder('seed', 32, 64, 32);
    // API & argument positions are exactly as in FIPS204.
    const internal = Object.freeze({
        info: Object.freeze({ type: 'internal-ml-dsa' }),
        lengths: Object.freeze({
            secretKey: secretCoder.bytesLen,
            publicKey: publicCoder.bytesLen,
            seed: 32,
            signature: sigCoder.bytesLen,
            signRand: signRandBytes,
        }),
        keygen: (seed) => {
            // H(𝜉||IntegerToBytes(𝑘, 1)||IntegerToBytes(ℓ, 1), 128) 2: ▷ expand seed
            const seedDst = new Uint8Array(32 + 2);
            const randSeed = seed === undefined;
            if (randSeed)
                seed = post_quantum_utils_randomBytes(32);
            abytesDoc(seed, 32, 'seed');
            seedDst.set(seed);
            if (randSeed)
                cleanBytes(seed);
            seedDst[32] = K;
            seedDst[33] = L;
            const [rho, rhoPrime, K_] = seedCoder.decode(shake256(seedDst, { dkLen: seedCoder.bytesLen }));
            const xofPrime = XOF256(rhoPrime);
            const s1 = [];
            for (let i = 0; i < L; i++)
                s1.push(RejBoundedPoly(xofPrime.get(i & 0xff, (i >> 8) & 0xff)));
            const s2 = [];
            for (let i = L; i < L + K; i++)
                s2.push(RejBoundedPoly(xofPrime.get(i & 0xff, (i >> 8) & 0xff)));
            const s1Hat = s1.map((i) => crystals.NTT.encode(i.slice()));
            const t0 = [];
            const t1 = [];
            const xof = XOF128(rho);
            const t = newPoly(N);
            for (let i = 0; i < K; i++) {
                // t ← NTT−1(A*NTT(s1)) + s2
                cleanBytes(t); // don't-reallocate
                for (let j = 0; j < L; j++) {
                    const aij = RejNTTPoly(xof.get(j, i)); // super slow!
                    polyAdd(t, MultiplyNTTs(aij, s1Hat[j]));
                }
                crystals.NTT.decode(t);
                const { r0, r1 } = polyPowerRound(polyAdd(t, s2[i])); // (t1, t0) ← Power2Round(t, d)
                t0.push(r0);
                t1.push(r1);
            }
            const publicKey = publicCoder.encode([rho, t1]); // pk ← pkEncode(ρ, t1)
            const tr = shake256(publicKey, { dkLen: TR_BYTES }); // tr ← H(BytesToBits(pk), 512)
            // sk ← skEncode(ρ, K,tr, s1, s2, t0)
            const secretKey = secretCoder.encode([rho, K_, tr, s1, s2, t0]);
            xof.clean();
            xofPrime.clean();
            // STATS
            // Kyber512: { calls: 4, xofs: 12 }, Kyber768: { calls: 9, xofs: 27 },
            // Kyber1024: { calls: 16, xofs: 48 }
            // DSA44: { calls: 24, xofs: 24 }, DSA65: { calls: 41, xofs: 41 },
            // DSA87: { calls: 71, xofs: 71 }
            cleanBytes(rho, rhoPrime, K_, s1, s2, s1Hat, t, t0, t1, tr, seedDst);
            return {
                publicKey: publicKey,
                secretKey: secretKey,
            };
        },
        getPublicKey: (secretKey) => {
            // (ρ, K,tr, s1, s2, t0) ← skDecode(sk)
            const [rho, _K, _tr, s1, s2, _t0] = secretCoder.decode(secretKey);
            const xof = XOF128(rho);
            const s1Hat = s1.map((p) => crystals.NTT.encode(p.slice()));
            const t1 = [];
            const tmp = newPoly(N);
            for (let i = 0; i < K; i++) {
                tmp.fill(0);
                for (let j = 0; j < L; j++) {
                    const aij = RejNTTPoly(xof.get(j, i)); // A_ij in NTT
                    polyAdd(tmp, MultiplyNTTs(aij, s1Hat[j])); // += A_ij * s1_j
                }
                crystals.NTT.decode(tmp); // NTT⁻¹
                polyAdd(tmp, s2[i]); // t_i = A·s1 + s2
                const { r1 } = polyPowerRound(tmp); // r1 = t1, r0 ≈ t0
                t1.push(r1);
            }
            xof.clean();
            cleanBytes(tmp, s1Hat, _t0, s1, s2);
            return publicCoder.encode([rho, t1]);
        },
        // NOTE: random is optional.
        sign: (msg, secretKey, opts = {}) => {
            validateSigOpts(opts);
            validateInternalOpts(opts);
            let { extraEntropy: random, externalMu = false } = opts;
            // This part can be pre-cached per secretKey, but there is only minor performance improvement,
            // since we re-use a lot of variables to computation.
            // (ρ, K,tr, s1, s2, t0) ← skDecode(sk)
            const [rho, _K, tr, s1, s2, t0] = secretCoder.decode(secretKey);
            // Cache matrix to avoid re-compute later
            const A = []; // A ← ExpandA(ρ)
            const xof = XOF128(rho);
            for (let i = 0; i < K; i++) {
                const pv = [];
                for (let j = 0; j < L; j++)
                    pv.push(RejNTTPoly(xof.get(j, i)));
                A.push(pv);
            }
            xof.clean();
            for (let i = 0; i < L; i++)
                crystals.NTT.encode(s1[i]); // sˆ1 ← NTT(s1)
            for (let i = 0; i < K; i++) {
                crystals.NTT.encode(s2[i]); // sˆ2 ← NTT(s2)
                crystals.NTT.encode(t0[i]); // tˆ0 ← NTT(t0)
            }
            // This part is per msg
            const mu = externalMu
                ? msg
                : // 6: µ ← H(tr||M, 512)
                    //    ▷ Compute message representative µ
                    shake256.create({ dkLen: CRH_BYTES }).update(tr).update(msg).digest();
            // Compute private random seed
            const rnd = random === false
                ? new Uint8Array(32)
                : random === undefined
                    ? post_quantum_utils_randomBytes(signRandBytes)
                    : random;
            abytesDoc(rnd, 32, 'extraEntropy');
            const rhoprime = shake256
                .create({ dkLen: CRH_BYTES })
                .update(_K)
                .update(rnd)
                .update(mu)
                .digest(); // ρ′← H(K||rnd||µ, 512)
            abytesDoc(rhoprime, CRH_BYTES);
            const x256 = XOF256(rhoprime, ZCoder.bytesLen);
            //  Rejection sampling loop
            main_loop: for (let kappa = 0;;) {
                const y = [];
                // y ← ExpandMask(ρ , κ)
                for (let i = 0; i < L; i++, kappa++)
                    y.push(ZCoder.decode(x256.get(kappa & 0xff, kappa >> 8)()));
                const z = y.map((i) => crystals.NTT.encode(i.slice()));
                const w = [];
                for (let i = 0; i < K; i++) {
                    // w ← NTT−1(A ◦ NTT(y))
                    const wi = newPoly(N);
                    for (let j = 0; j < L; j++)
                        polyAdd(wi, MultiplyNTTs(A[i][j], z[j]));
                    crystals.NTT.decode(wi);
                    w.push(wi);
                }
                const w1 = w.map((j) => j.map(HighBits)); // w1 ← HighBits(w)
                // Commitment hash: c˜ ∈{0, 1 2λ } ← H(µ||w1Encode(w1), 2λ)
                const cTilde = shake256
                    .create({ dkLen: C_TILDE_BYTES })
                    .update(mu)
                    .update(W1Vec.encode(w1))
                    .digest();
                // Verifer’s challenge
                // c ← SampleInBall(c˜1); cˆ ← NTT(c)
                const cHat = crystals.NTT.encode(SampleInBall(cTilde));
                // ⟨⟨cs1⟩⟩ ← NTT−1(cˆ◦ sˆ1)
                const cs1 = s1.map((i) => MultiplyNTTs(i, cHat));
                for (let i = 0; i < L; i++) {
                    polyAdd(crystals.NTT.decode(cs1[i]), y[i]); // z ← y + ⟨⟨cs1⟩⟩
                    if (polyChknorm(cs1[i], GAMMA1 - BETA))
                        continue main_loop; // ||z||∞ ≥ γ1 − β
                }
                // cs1 is now z (▷ Signer’s response)
                let cnt = 0;
                const h = [];
                for (let i = 0; i < K; i++) {
                    const cs2 = crystals.NTT.decode(MultiplyNTTs(s2[i], cHat)); // ⟨⟨cs2⟩⟩ ← NTT−1(cˆ◦ sˆ2)
                    const r0 = polySub(w[i], cs2).map(LowBits); // r0 ← LowBits(w − ⟨⟨cs2⟩⟩)
                    if (polyChknorm(r0, GAMMA2 - BETA))
                        continue main_loop; // ||r0||∞ ≥ γ2 − β
                    const ct0 = crystals.NTT.decode(MultiplyNTTs(t0[i], cHat)); // ⟨⟨ct0⟩⟩ ← NTT−1(cˆ◦ tˆ0)
                    if (polyChknorm(ct0, GAMMA2))
                        continue main_loop;
                    polyAdd(r0, ct0);
                    // ▷ Signer’s hint
                    const hint = polyMakeHint(r0, w1[i]); // h ← MakeHint(−⟨⟨ct0⟩⟩, w− ⟨⟨cs2⟩⟩ + ⟨⟨ct0⟩⟩)
                    h.push(hint.v);
                    cnt += hint.cnt;
                }
                if (cnt > OMEGA)
                    continue; // the number of 1’s in h is greater than ω
                x256.clean();
                const res = sigCoder.encode([cTilde, cs1, h]); // σ ← sigEncode(c˜, z mod±q, h)
                // rho, _K, tr is subarray of secretKey, cannot clean.
                cleanBytes(cTilde, cs1, h, cHat, w1, w, z, y, rhoprime, s1, s2, t0, ...A);
                // `externalMu` hands ownership of `mu` to the caller,
                // so only wipe the internally derived digest form here;
                // zeroizing caller memory would break the caller's own reuse / verify path.
                if (!externalMu)
                    cleanBytes(mu);
                return res;
            }
            // @ts-ignore
            throw new Error('Unreachable code path reached, report this error');
        },
        verify: (sig, msg, publicKey, opts = {}) => {
            validateInternalOpts(opts);
            const { externalMu = false } = opts;
            // ML-DSA.Verify(pk, M, σ): Verifes a signature σ for a message M.
            const [rho, t1] = publicCoder.decode(publicKey); // (ρ, t1) ← pkDecode(pk)
            const tr = shake256(publicKey, { dkLen: TR_BYTES }); // 6: tr ← H(BytesToBits(pk), 512)
            if (sig.length !== sigCoder.bytesLen)
                return false; // return false instead of exception
            // (c˜, z, h) ← sigDecode(σ)
            // ▷ Signer’s commitment hash c ˜, response z and hint
            const [cTilde, z, h] = sigCoder.decode(sig);
            if (h === false)
                return false; // if h = ⊥ then return false
            for (let i = 0; i < L; i++)
                if (polyChknorm(z[i], GAMMA1 - BETA))
                    return false;
            const mu = externalMu
                ? msg
                : // 7: µ ← H(tr||M, 512)
                    shake256.create({ dkLen: CRH_BYTES }).update(tr).update(msg).digest();
            // Compute verifer’s challenge from c˜
            const c = crystals.NTT.encode(SampleInBall(cTilde)); // c ← SampleInBall(c˜1)
            const zNtt = z.map((i) => i.slice()); // zNtt = NTT(z)
            for (let i = 0; i < L; i++)
                crystals.NTT.encode(zNtt[i]);
            const wTick1 = [];
            const xof = XOF128(rho);
            for (let i = 0; i < K; i++) {
                const ct12d = MultiplyNTTs(crystals.NTT.encode(polyShiftl(t1[i])), c); //c * t1 * (2**d)
                const Az = newPoly(N); // // A * z
                for (let j = 0; j < L; j++) {
                    const aij = RejNTTPoly(xof.get(j, i)); // A[i][j] inplace
                    polyAdd(Az, MultiplyNTTs(aij, zNtt[j]));
                }
                // wApprox = A*z - c*t1 * (2**d)
                const wApprox = crystals.NTT.decode(polySub(Az, ct12d));
                // Reconstruction of signer’s commitment
                wTick1.push(polyUseHint(wApprox, h[i])); // w ′ ← UseHint(h, w'approx )
            }
            xof.clean();
            // c˜′← H (µ||w1Encode(w′1), 2λ),  Hash it; this should match c˜
            const c2 = shake256
                .create({ dkLen: C_TILDE_BYTES })
                .update(mu)
                .update(W1Vec.encode(wTick1))
                .digest();
            // Additional checks in FIPS-204:
            // [[ ||z||∞ < γ1 − β ]] and [[c ˜ = c˜′]] and [[number of 1’s in h is ≤ ω]]
            for (const t of h) {
                const sum = t.reduce((acc, i) => acc + i, 0);
                if (!(sum <= OMEGA))
                    return false;
            }
            for (const t of z)
                if (polyChknorm(t, GAMMA1 - BETA))
                    return false;
            return utils_equalBytes(cTilde, c2);
        },
    });
    return Object.freeze({
        info: Object.freeze({ type: 'ml-dsa' }),
        internal,
        securityLevel: securityLevel,
        keygen: internal.keygen,
        lengths: internal.lengths,
        getPublicKey: internal.getPublicKey,
        sign: (msg, secretKey, opts = {}) => {
            validateSigOpts(opts);
            const M = getMessage(msg, opts.context);
            const res = internal.sign(M, secretKey, opts);
            cleanBytes(M);
            return res;
        },
        verify: (sig, msg, publicKey, opts = {}) => {
            validateVerOpts(opts);
            return internal.verify(sig, getMessage(msg, opts.context), publicKey);
        },
        prehash: (hash) => {
            checkHash(hash, securityLevel);
            return Object.freeze({
                info: Object.freeze({ type: 'hashml-dsa' }),
                securityLevel: securityLevel,
                lengths: internal.lengths,
                keygen: internal.keygen,
                getPublicKey: internal.getPublicKey,
                sign: (msg, secretKey, opts = {}) => {
                    validateSigOpts(opts);
                    const M = getMessagePrehash(hash, msg, opts.context);
                    const res = internal.sign(M, secretKey, opts);
                    cleanBytes(M);
                    return res;
                },
                verify: (sig, msg, publicKey, opts = {}) => {
                    validateVerOpts(opts);
                    return internal.verify(sig, getMessagePrehash(hash, msg, opts.context), publicKey);
                },
            });
        },
    });
}
/** ML-DSA-44 for 128-bit security level. Not recommended after 2030, as per ASD. */
const ml_dsa44 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => getDilithium({
    ...PARAMS[2],
    CRH_BYTES: 64,
    TR_BYTES: 64,
    C_TILDE_BYTES: 32,
    XOF128,
    XOF256,
    securityLevel: 128,
}))()));
/** ML-DSA-65 for 192-bit security level. Not recommended after 2030, as per ASD. */
const ml_dsa65 = /* @__PURE__ */ (() => getDilithium({
    ...PARAMS[3],
    CRH_BYTES: 64,
    TR_BYTES: 64,
    C_TILDE_BYTES: 48,
    XOF128: _crystals_XOF128,
    XOF256: _crystals_XOF256,
    securityLevel: 192,
}))();
/** ML-DSA-87 for 256-bit security level. OK after 2030, as per ASD. */
const ml_dsa87 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => getDilithium({
    ...PARAMS[5],
    CRH_BYTES: 64,
    TR_BYTES: 64,
    C_TILDE_BYTES: 64,
    XOF128,
    XOF256,
    securityLevel: 256,
}))()));
//# sourceMappingURL=ml-dsa.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/_md.js
/**
 * Internal Merkle-Damgard hash utils.
 * @module
 */

/**
 * Shared 32-bit conditional boolean primitive reused by SHA-256, SHA-1, and MD5 `F`.
 * Returns bits from `b` when `a` is set, otherwise from `c`.
 * The XOR form is equivalent to MD5's `F(X,Y,Z) = XY v not(X)Z` because the masked terms never
 * set the same bit.
 * @param a - selector word
 * @param b - word chosen when selector bit is set
 * @param c - word chosen when selector bit is clear
 * @returns Mixed 32-bit word.
 * @example
 * Combine three words with the shared 32-bit choice primitive.
 * ```ts
 * Chi(0xffffffff, 0x12345678, 0x87654321);
 * ```
 */
function Chi(a, b, c) {
    return (a & b) ^ (~a & c);
}
/**
 * Shared 32-bit majority primitive reused by SHA-256 and SHA-1.
 * Returns bits shared by at least two inputs.
 * @param a - first input word
 * @param b - second input word
 * @param c - third input word
 * @returns Mixed 32-bit word.
 * @example
 * Combine three words with the shared 32-bit majority primitive.
 * ```ts
 * Maj(0xffffffff, 0x12345678, 0x87654321);
 * ```
 */
function Maj(a, b, c) {
    return (a & b) ^ (a & c) ^ (b & c);
}
/**
 * Merkle-Damgard hash construction base class.
 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
 * Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
 * strings with partial-byte tails.
 * @param blockLen - internal block size in bytes
 * @param outputLen - digest size in bytes
 * @param padOffset - trailing length field size in bytes
 * @param isLE - whether length and state words are encoded in little-endian
 * @example
 * Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
 * ```ts
 * import { _SHA1 } from '@noble/hashes/legacy.js';
 * const hash = new _SHA1();
 * hash.update(new Uint8Array([97, 98, 99]));
 * hash.digest();
 * ```
 */
class HashMD {
    blockLen;
    outputLen;
    canXOF = false;
    padOffset;
    isLE;
    // For partial updates less than block size
    buffer;
    view;
    finished = false;
    length = 0;
    pos = 0;
    destroyed = false;
    constructor(blockLen, outputLen, padOffset, isLE) {
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
    }
    update(data) {
        aexists(this);
        utils_abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path only when there is no buffered partial block: `take === blockLen` implies
            // `this.pos === 0`, so we can process full blocks directly from the input view.
            if (take === blockLen) {
                const dataView = createView(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        clean(this.buffer.subarray(pos));
        // we have less than padOffset left in buffer, so we cannot put length in
        // current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
        // `padOffset` reserves the whole length field. For SHA-384/512 the high 64 bits stay zero from
        // the padding fill above, and JS will overflow before user input can make that half non-zero.
        // So we only need to write the low 64 bits here.
        view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which must be fused in single op with modulo by JIT
        if (len % 4)
            throw new Error('_sha2: outputLen must be aligned to 32bit');
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
            throw new Error('_sha2: outputLen bigger than state');
        for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        // Copy before destroy(): subclasses wipe `buffer` during cleanup, but `digest()` must return
        // fresh bytes to the caller.
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to ||= new this.constructor();
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        // Only partial-block bytes need copying: when `length % blockLen === 0`, `pos === 0` and
        // later `update()` / `digestInto()` overwrite `to.buffer` from the start before reading it.
        if (length % blockLen)
            to.buffer.set(buffer);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
/**
 * Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
 * Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
 */
/** Initial SHA256 state from RFC 6234 §6.1: the first 32 bits of the fractional parts of the
 * square roots of the first eight prime numbers. Exported as a shared table; callers must treat
 * it as read-only because constructors copy words from it by index. */
const SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);
/** Initial SHA224 state `H(0)` from RFC 6234 §6.1. Exported as a shared table; callers must
 * treat it as read-only because constructors copy words from it by index. */
const SHA224_IV = /* @__PURE__ */ Uint32Array.from([
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4,
]);
/** Initial SHA384 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the ninth
 * through sixteenth prime numbers. Exported as a shared table; callers must treat it as read-only
 * because constructors copy halves from it by index. */
const SHA384_IV = /* @__PURE__ */ Uint32Array.from([
    0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4,
]);
/** Initial SHA512 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the first
 * eight prime numbers. Exported as a shared table; callers must treat it as read-only because
 * constructors copy halves from it by index. */
const SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);
//# sourceMappingURL=_md.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/sha2.js
/**
 * SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
 * SHA256 is the fastest hash implementable in JS, even faster than Blake3.
 * Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
 * @module
 */



/**
 * SHA-224 / SHA-256 round constants from RFC 6234 §5.1: the first 32 bits
 * of the cube roots of the first 64 primes (2..311).
 */
// prettier-ignore
const SHA256_K = /* @__PURE__ */ Uint32Array.from([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
/** Reusable SHA-224 / SHA-256 message schedule buffer `W_t` from RFC 6234 §6.2 step 1. */
const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal SHA-224 / SHA-256 compression engine from RFC 6234 §6.2. */
class SHA2_32B extends HashMD {
    constructor(outputLen) {
        super(64, outputLen, 8, false);
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        clean(SHA256_W);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
    }
}
/** Internal SHA-256 hash class grounded in RFC 6234 §6.2. */
class _SHA256 extends SHA2_32B {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
    A = SHA256_IV[0] | 0;
    B = SHA256_IV[1] | 0;
    C = SHA256_IV[2] | 0;
    D = SHA256_IV[3] | 0;
    E = SHA256_IV[4] | 0;
    F = SHA256_IV[5] | 0;
    G = SHA256_IV[6] | 0;
    H = SHA256_IV[7] | 0;
    constructor() {
        super(32);
    }
}
/** Internal SHA-224 hash class grounded in RFC 6234 §6.2 and §8.5. */
class _SHA224 extends SHA2_32B {
    A = SHA224_IV[0] | 0;
    B = SHA224_IV[1] | 0;
    C = SHA224_IV[2] | 0;
    D = SHA224_IV[3] | 0;
    E = SHA224_IV[4] | 0;
    F = SHA224_IV[5] | 0;
    G = SHA224_IV[6] | 0;
    H = SHA224_IV[7] | 0;
    constructor() {
        super(28);
    }
}
// SHA2-512 is slower than sha256 in js because u64 operations are slow.
// SHA-384 / SHA-512 round constants from RFC 6234 §5.2:
// 80 full 64-bit words split into high/low halves.
// prettier-ignore
const K512 = /* @__PURE__ */ (() => split([
    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
].map(n => BigInt(n))))();
const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
// Reusable high-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
// Reusable low-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
/** Internal SHA-384 / SHA-512 compression engine from RFC 6234 §6.4. */
class SHA2_64B extends HashMD {
    constructor(outputLen) {
        super(128, outputLen, 16, false);
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32((offset += 4));
        }
        for (let i = 16; i < 80; i++) {
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
            const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
            const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
            // SHA512_W[i] = s0 + s1 + SHA512_W[i - 7] + SHA512_W[i - 16];
            const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for (let i = 0; i < 80; i++) {
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
            const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
            const CHIl = (El & Fl) ^ (~El & Gl);
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
            const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = add3L(T1l, sigma0l, MAJl);
            Ah = add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        clean(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
/** Internal SHA-512 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA512 extends SHA2_64B {
    Ah = SHA512_IV[0] | 0;
    Al = SHA512_IV[1] | 0;
    Bh = SHA512_IV[2] | 0;
    Bl = SHA512_IV[3] | 0;
    Ch = SHA512_IV[4] | 0;
    Cl = SHA512_IV[5] | 0;
    Dh = SHA512_IV[6] | 0;
    Dl = SHA512_IV[7] | 0;
    Eh = SHA512_IV[8] | 0;
    El = SHA512_IV[9] | 0;
    Fh = SHA512_IV[10] | 0;
    Fl = SHA512_IV[11] | 0;
    Gh = SHA512_IV[12] | 0;
    Gl = SHA512_IV[13] | 0;
    Hh = SHA512_IV[14] | 0;
    Hl = SHA512_IV[15] | 0;
    constructor() {
        super(64);
    }
}
/** Internal SHA-384 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA384 extends SHA2_64B {
    Ah = SHA384_IV[0] | 0;
    Al = SHA384_IV[1] | 0;
    Bh = SHA384_IV[2] | 0;
    Bl = SHA384_IV[3] | 0;
    Ch = SHA384_IV[4] | 0;
    Cl = SHA384_IV[5] | 0;
    Dh = SHA384_IV[6] | 0;
    Dl = SHA384_IV[7] | 0;
    Eh = SHA384_IV[8] | 0;
    El = SHA384_IV[9] | 0;
    Fh = SHA384_IV[10] | 0;
    Fl = SHA384_IV[11] | 0;
    Gh = SHA384_IV[12] | 0;
    Gl = SHA384_IV[13] | 0;
    Hh = SHA384_IV[14] | 0;
    Hl = SHA384_IV[15] | 0;
    constructor() {
        super(48);
    }
}
/**
 * Truncated SHA512/256 and SHA512/224.
 * SHA512_IV is XORed with 0xa5a5a5a5a5a5a5a5, then used as "intermediary" IV of SHA512/t.
 * Then t hashes string to produce result IV.
 * See the repo-side derivation recipe in `test/misc/sha2-gen-iv.js`.
 * These IV literals are checked against that script rather than a dedicated
 * local RFC section.
 */
/** SHA-512/224 IV derived by the SHA-512/t recipe in `test/misc/sha2-gen-iv.js` and
 * stored as sixteen big-endian 32-bit halves. */
const T224_IV = /* @__PURE__ */ Uint32Array.from([
    0x8c3d37c8, 0x19544da2, 0x73e19966, 0x89dcd4d6, 0x1dfab7ae, 0x32ff9c82, 0x679dd514, 0x582f9fcf,
    0x0f6d2b69, 0x7bd44da8, 0x77e36f73, 0x04c48942, 0x3f9d85a8, 0x6a1d36c8, 0x1112e6ad, 0x91d692a1,
]);
/** SHA-512/256 IV derived by the SHA-512/t recipe in `test/misc/sha2-gen-iv.js` and
 * stored as sixteen big-endian 32-bit halves. */
const T256_IV = /* @__PURE__ */ Uint32Array.from([
    0x22312194, 0xfc2bf72c, 0x9f555fa3, 0xc84c64c2, 0x2393b86b, 0x6f53b151, 0x96387719, 0x5940eabd,
    0x96283ee2, 0xa88effe3, 0xbe5e1e25, 0x53863992, 0x2b0199fc, 0x2c85b8aa, 0x0eb72ddc, 0x81c52ca2,
]);
/** Internal SHA-512/224 hash class using the derived `T224_IV` and the shared
 * RFC 6234 §6.4 compression engine. */
class _SHA512_224 extends SHA2_64B {
    Ah = T224_IV[0] | 0;
    Al = T224_IV[1] | 0;
    Bh = T224_IV[2] | 0;
    Bl = T224_IV[3] | 0;
    Ch = T224_IV[4] | 0;
    Cl = T224_IV[5] | 0;
    Dh = T224_IV[6] | 0;
    Dl = T224_IV[7] | 0;
    Eh = T224_IV[8] | 0;
    El = T224_IV[9] | 0;
    Fh = T224_IV[10] | 0;
    Fl = T224_IV[11] | 0;
    Gh = T224_IV[12] | 0;
    Gl = T224_IV[13] | 0;
    Hh = T224_IV[14] | 0;
    Hl = T224_IV[15] | 0;
    constructor() {
        super(28);
    }
}
/** Internal SHA-512/256 hash class using the derived `T256_IV` and the shared
 * RFC 6234 §6.4 compression engine. */
class _SHA512_256 extends SHA2_64B {
    Ah = T256_IV[0] | 0;
    Al = T256_IV[1] | 0;
    Bh = T256_IV[2] | 0;
    Bl = T256_IV[3] | 0;
    Ch = T256_IV[4] | 0;
    Cl = T256_IV[5] | 0;
    Dh = T256_IV[6] | 0;
    Dl = T256_IV[7] | 0;
    Eh = T256_IV[8] | 0;
    El = T256_IV[9] | 0;
    Fh = T256_IV[10] | 0;
    Fl = T256_IV[11] | 0;
    Gh = T256_IV[12] | 0;
    Gl = T256_IV[13] | 0;
    Hh = T256_IV[14] | 0;
    Hl = T256_IV[15] | 0;
    constructor() {
        super(32);
    }
}
/**
 * SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
 *
 * - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
 * - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
 * - Each sha256 hash is executing 2^18 bit operations.
 * - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-256.
 * ```ts
 * sha256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha256 = /* @__PURE__ */ utils_createHasher(() => new _SHA256(), 
/* @__PURE__ */ utils_oidNist(0x01));
/**
 * SHA2-224 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-224.
 * ```ts
 * sha224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA224(), 
/* @__PURE__ */ oidNist(0x04))));
/**
 * SHA2-512 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512.
 * ```ts
 * sha512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha2_sha512 = /* @__PURE__ */ utils_createHasher(() => new _SHA512(), 
/* @__PURE__ */ utils_oidNist(0x03));
/**
 * SHA2-384 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-384.
 * ```ts
 * sha384(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA384(), 
/* @__PURE__ */ oidNist(0x02))));
/**
 * SHA2-512/256 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on {@link https://eprint.iacr.org/2010/548.pdf | truncated SHA512}.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512/256.
 * ```ts
 * sha512_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA512_256(), 
/* @__PURE__ */ oidNist(0x06))));
/**
 * SHA2-512/224 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on {@link https://eprint.iacr.org/2010/548.pdf | truncated SHA512}.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512/224.
 * ```ts
 * sha512_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA512_224(), 
/* @__PURE__ */ oidNist(0x05))));
//# sourceMappingURL=sha2.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/abstract/modular.js
/**
 * Utils for modular division and fields.
 * Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
 * There is no division: it is replaced by modular multiplicative inverse.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

// Numbers aren't used in x25519 / x448 builds
// prettier-ignore
const modular_0n = /* @__PURE__ */ BigInt(0), modular_1n = /* @__PURE__ */ BigInt(1), modular_2n = /* @__PURE__ */ BigInt(2);
// prettier-ignore
const _3n = /* @__PURE__ */ BigInt(3), _4n = /* @__PURE__ */ BigInt(4), _5n = /* @__PURE__ */ BigInt(5);
// prettier-ignore
const modular_7n = /* @__PURE__ */ BigInt(7), _8n = /* @__PURE__ */ BigInt(8), _9n = /* @__PURE__ */ BigInt(9);
const _16n = /* @__PURE__ */ BigInt(16);
/**
 * @param a - Dividend value.
 * @param b - Positive modulus.
 * @returns Reduced value in `[0, b)` only when `b` is positive.
 * @throws If the modulus is not positive. {@link Error}
 * @example
 * Normalize a bigint into one field residue.
 *
 * ```ts
 * mod(-1n, 5n);
 * ```
 */
function modular_mod(a, b) {
    if (b <= modular_0n)
        throw new Error('mod: expected positive modulus, got ' + b);
    const result = a % b;
    return result >= modular_0n ? result : b + result;
}
/**
 * Efficiently raise num to a power with modular reduction.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 * Low-level helper: callers that need canonical residues must pass a valid `num` for the chosen
 * modulus instead of relying on the `power===0/1` fast paths to normalize it.
 * @param num - Base value.
 * @param power - Exponent value.
 * @param modulo - Reduction modulus.
 * @returns Modular exponentiation result.
 * @throws If the modulus or exponent is invalid. {@link Error}
 * @example
 * Raise one bigint to a modular power.
 *
 * ```ts
 * pow(2n, 6n, 11n) // 64n % 11n == 9n
 * ```
 */
function pow(num, power, modulo) {
    return FpPow(Field(modulo), num, power);
}
/**
 * Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)`.
 * Low-level helper: callers that need canonical residues must pass a valid `x` for the chosen
 * modulus; the `power===0` fast path intentionally returns the input unchanged.
 * @param x - Base value.
 * @param power - Number of squarings.
 * @param modulo - Reduction modulus.
 * @returns Repeated-squaring result.
 * @throws If the exponent is negative. {@link Error}
 * @example
 * Apply repeated squaring inside one field.
 *
 * ```ts
 * pow2(3n, 2n, 11n);
 * ```
 */
function modular_pow2(x, power, modulo) {
    if (power < modular_0n)
        throw new Error('pow2: expected non-negative exponent, got ' + power);
    let res = x;
    while (power-- > modular_0n) {
        res *= res;
        res %= modulo;
    }
    return res;
}
/**
 * Inverses number over modulo.
 * Implemented using the {@link https://brilliant.org/wiki/extended-euclidean-algorithm/ | extended Euclidean algorithm}.
 * @param number - Value to invert.
 * @param modulo - Positive modulus.
 * @returns Multiplicative inverse.
 * @throws If the modulus is invalid or the inverse does not exist. {@link Error}
 * @example
 * Compute one modular inverse with the extended Euclidean algorithm.
 *
 * ```ts
 * invert(3n, 11n);
 * ```
 */
function invert(number, modulo) {
    if (number === modular_0n)
        throw new Error('invert: expected non-zero number');
    if (modulo <= modular_0n)
        throw new Error('invert: expected positive modulus, got ' + modulo);
    // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
    let a = modular_mod(number, modulo);
    let b = modulo;
    // prettier-ignore
    let x = modular_0n, y = modular_1n, u = modular_1n, v = modular_0n;
    while (a !== modular_0n) {
        const q = b / a;
        const r = b - a * q;
        const m = x - u * q;
        const n = y - v * q;
        // prettier-ignore
        b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== modular_1n)
        throw new Error('invert: does not exist');
    return modular_mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
    const F = Fp;
    if (!F.eql(F.sqr(root), n))
        throw new Error('Cannot find square root');
}
// Not all roots are possible! Example which will throw:
// const NUM =
// n = 72057594037927816n;
// Fp = Field(BigInt('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab'));
function sqrt3mod4(Fp, n) {
    const F = Fp;
    const p1div4 = (F.ORDER + modular_1n) / _4n;
    const root = F.pow(n, p1div4);
    assertIsSquare(F, root, n);
    return root;
}
// Equivalent `q = 5 (mod 8)` square-root formula (Atkin-style), not the RFC Appendix I.2 CMOV
// pseudocode verbatim.
function sqrt5mod8(Fp, n) {
    const F = Fp;
    const p5div8 = (F.ORDER - _5n) / _8n;
    const n2 = F.mul(n, modular_2n);
    const v = F.pow(n2, p5div8);
    const nv = F.mul(n, v);
    const i = F.mul(F.mul(nv, modular_2n), v);
    const root = F.mul(nv, F.sub(i, F.ONE));
    assertIsSquare(F, root, n);
    return root;
}
// Based on RFC9380, Kong algorithm
// prettier-ignore
function sqrt9mod16(P) {
    const Fp_ = Field(P);
    const tn = tonelliShanks(P);
    const c1 = tn(Fp_, Fp_.neg(Fp_.ONE)); //  1. c1 = sqrt(-1) in F, i.e., (c1^2) == -1 in F
    const c2 = tn(Fp_, c1); //  2. c2 = sqrt(c1) in F, i.e., (c2^2) == c1 in F
    const c3 = tn(Fp_, Fp_.neg(c1)); //  3. c3 = sqrt(-c1) in F, i.e., (c3^2) == -c1 in F
    const c4 = (P + modular_7n) / _16n; //  4. c4 = (q + 7) / 16        # Integer arithmetic
    return ((Fp, n) => {
        const F = Fp;
        let tv1 = F.pow(n, c4); //  1. tv1 = x^c4
        let tv2 = F.mul(tv1, c1); //  2. tv2 = c1 * tv1
        const tv3 = F.mul(tv1, c2); //  3. tv3 = c2 * tv1
        const tv4 = F.mul(tv1, c3); //  4. tv4 = c3 * tv1
        const e1 = F.eql(F.sqr(tv2), n); //  5.  e1 = (tv2^2) == x
        const e2 = F.eql(F.sqr(tv3), n); //  6.  e2 = (tv3^2) == x
        tv1 = F.cmov(tv1, tv2, e1); //  7. tv1 = CMOV(tv1, tv2, e1)  # Select tv2 if (tv2^2) == x
        tv2 = F.cmov(tv4, tv3, e2); //  8. tv2 = CMOV(tv4, tv3, e2)  # Select tv3 if (tv3^2) == x
        const e3 = F.eql(F.sqr(tv2), n); //  9.  e3 = (tv2^2) == x
        const root = F.cmov(tv1, tv2, e3); // 10.  z = CMOV(tv1, tv2, e3)   # Select sqrt from tv1 & tv2
        assertIsSquare(F, root, n);
        return root;
    });
}
/**
 * Tonelli-Shanks square root search algorithm.
 * This implementation is variable-time: it searches data-dependently for the first non-residue `Z`
 * and for the smallest `i` in the main loop, unlike RFC 9380 Appendix I.4's constant-time shape.
 * 1. {@link https://eprint.iacr.org/2012/685.pdf | eprint 2012/685}, page 12
 * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
 * @param P - field order
 * @returns function that takes field Fp (created from P) and number n
 * @throws If the field is too small, non-prime, or the square root does not exist. {@link Error}
 * @example
 * Construct a square-root helper for primes that need Tonelli-Shanks.
 *
 * ```ts
 * import { Field, tonelliShanks } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrt = tonelliShanks(17n)(Fp, 4n);
 * ```
 */
function tonelliShanks(P) {
    // Initialization (precomputation).
    // Caching initialization could boost perf by 7%.
    if (P < _3n)
        throw new Error('sqrt is not defined for small field');
    // Factor P - 1 = Q * 2^S, where Q is odd
    let Q = P - modular_1n;
    let S = 0;
    while (Q % modular_2n === modular_0n) {
        Q /= modular_2n;
        S++;
    }
    // Find the first quadratic non-residue Z >= 2
    let Z = modular_2n;
    const _Fp = Field(P);
    while (FpLegendre(_Fp, Z) === 1) {
        // Basic primality test for P. After x iterations, chance of
        // not finding quadratic non-residue is 2^x, so 2^1000.
        if (Z++ > 1000)
            throw new Error('Cannot find square root: probably non-prime P');
    }
    // Fast-path; usually done before Z, but we do "primality test".
    if (S === 1)
        return sqrt3mod4;
    // Slow-path
    // TODO: test on Fp2 and others
    let cc = _Fp.pow(Z, Q); // c = z^Q
    const Q1div2 = (Q + modular_1n) / modular_2n;
    return function tonelliSlow(Fp, n) {
        const F = Fp;
        if (F.is0(n))
            return n;
        // Check if n is a quadratic residue using Legendre symbol
        if (FpLegendre(F, n) !== 1)
            throw new Error('Cannot find square root');
        // Initialize variables for the main loop
        let M = S;
        let c = F.mul(F.ONE, cc); // c = z^Q, move cc from field _Fp into field Fp
        let t = F.pow(n, Q); // t = n^Q, first guess at the fudge factor
        let R = F.pow(n, Q1div2); // R = n^((Q+1)/2), first guess at the square root
        // Main loop
        // while t != 1
        while (!F.eql(t, F.ONE)) {
            if (F.is0(t))
                return F.ZERO; // if t=0 return R=0
            let i = 1;
            // Find the smallest i >= 1 such that t^(2^i) ≡ 1 (mod P)
            let t_tmp = F.sqr(t); // t^(2^1)
            while (!F.eql(t_tmp, F.ONE)) {
                i++;
                t_tmp = F.sqr(t_tmp); // t^(2^2)...
                if (i === M)
                    throw new Error('Cannot find square root');
            }
            // Calculate the exponent for b: 2^(M - i - 1)
            const exponent = modular_1n << BigInt(M - i - 1); // bigint is important
            const b = F.pow(c, exponent); // b = 2^(M - i - 1)
            // Update variables
            M = i;
            c = F.sqr(b); // c = b^2
            t = F.mul(t, c); // t = (t * b^2)
            R = F.mul(R, b); // R = R*b
        }
        return R;
    };
}
/**
 * Square root for a finite field. Will try optimized versions first:
 *
 * 1. P ≡ 3 (mod 4)
 * 2. P ≡ 5 (mod 8)
 * 3. P ≡ 9 (mod 16)
 * 4. Tonelli-Shanks algorithm
 *
 * Different algorithms can give different roots, it is up to user to decide which one they want.
 * For example there is FpSqrtOdd/FpSqrtEven to choose a root by oddness
 * (used for hash-to-curve).
 * @param P - Field order.
 * @returns Square-root helper. The generic fallback inherits Tonelli-Shanks' variable-time
 *   behavior and this selector assumes prime-field-style integer moduli.
 * @throws If the field is unsupported or the square root does not exist. {@link Error}
 * @example
 * Choose the square-root helper appropriate for one field modulus.
 *
 * ```ts
 * import { Field, FpSqrt } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrt = FpSqrt(17n)(Fp, 4n);
 * ```
 */
function FpSqrt(P) {
    // P ≡ 3 (mod 4) => √n = n^((P+1)/4)
    if (P % _4n === _3n)
        return sqrt3mod4;
    // P ≡ 5 (mod 8) => Atkin algorithm, page 10 of https://eprint.iacr.org/2012/685.pdf
    if (P % _8n === _5n)
        return sqrt5mod8;
    // P ≡ 9 (mod 16) => Kong algorithm, page 11 of https://eprint.iacr.org/2012/685.pdf (algorithm 4)
    if (P % _16n === _9n)
        return sqrt9mod16(P);
    // Tonelli-Shanks algorithm
    return tonelliShanks(P);
}
/**
 * @param num - Value to inspect.
 * @param modulo - Field modulus.
 * @returns `true` when the least-significant little-endian bit is set.
 * @throws If the modulus is invalid for `mod(...)`. {@link Error}
 * @example
 * Inspect the low bit used by little-endian sign conventions.
 *
 * ```ts
 * isNegativeLE(3n, 11n);
 * ```
 */
const isNegativeLE = (num, modulo) => (modular_mod(num, modulo) & modular_1n) === modular_1n;
// prettier-ignore
// Arithmetic-only subset checked by validateField(). This is intentionally not the full runtime
// IField contract: helpers like `isValidNot0`, `invertBatch`, `toBytes`, `fromBytes`, `cmov`, and
// field-specific extras like `isOdd` are left to the callers that actually need them.
const FIELD_FIELDS = [
    'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
    'eql', 'add', 'sub', 'mul', 'pow', 'div',
    'addN', 'subN', 'mulN', 'sqrN'
];
/**
 * @param field - Field implementation.
 * @returns Validated field. This only checks the arithmetic subset needed by generic helpers; it
 *   does not guarantee full runtime-method coverage for serialization, batching, `cmov`, or
 *   field-specific extras beyond positive `BYTES` / `BITS`.
 * @throws If the field shape or numeric metadata are invalid. {@link Error}
 * @example
 * Check that a field implementation exposes the operations curve code expects.
 *
 * ```ts
 * import { Field, validateField } from '@noble/curves/abstract/modular.js';
 * const Fp = validateField(Field(17n));
 * ```
 */
function modular_validateField(field) {
    const initial = {
        ORDER: 'bigint',
        BYTES: 'number',
        BITS: 'number',
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
        map[val] = 'function';
        return map;
    }, initial);
    utils_validateObject(field, opts);
    // Runtime field implementations must expose real integer byte/bit sizes; fractional / NaN /
    // infinite metadata leaks through validateObject(type='number') but breaks encoders and caches.
    utils_asafenumber(field.BYTES, 'BYTES');
    utils_asafenumber(field.BITS, 'BITS');
    // Runtime field implementations must expose positive byte/bit sizes; zero leaks through the
    // numeric shape checks above but still breaks encoding helpers and cached-length assumptions.
    if (field.BYTES < 1 || field.BITS < 1)
        throw new Error('invalid field: expected BYTES/BITS > 0');
    if (field.ORDER <= modular_1n)
        throw new Error('invalid field: expected ORDER > 1, got ' + field.ORDER);
    return field;
}
// Generic field functions
/**
 * Same as `pow` but for Fp: non-constant-time.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 * @param Fp - Field implementation.
 * @param num - Base value.
 * @param power - Exponent value.
 * @returns Powered field element.
 * @throws If the exponent is negative. {@link Error}
 * @example
 * Raise one field element to a public exponent.
 *
 * ```ts
 * import { Field, FpPow } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const x = FpPow(Fp, 3n, 5n);
 * ```
 */
function FpPow(Fp, num, power) {
    const F = Fp;
    if (power < modular_0n)
        throw new Error('invalid exponent, negatives unsupported');
    if (power === modular_0n)
        return F.ONE;
    if (power === modular_1n)
        return num;
    let p = F.ONE;
    let d = num;
    while (power > modular_0n) {
        if (power & modular_1n)
            p = F.mul(p, d);
        d = F.sqr(d);
        power >>= modular_1n;
    }
    return p;
}
/**
 * Efficiently invert an array of Field elements.
 * Exception-free. Zero-valued field elements stay `undefined` unless `passZero` is enabled.
 * @param Fp - Field implementation.
 * @param nums - Values to invert.
 * @param passZero - map 0 to 0 (instead of undefined)
 * @returns Inverted values.
 * @example
 * Invert several field elements with one shared inversion.
 *
 * ```ts
 * import { Field, FpInvertBatch } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const inv = FpInvertBatch(Fp, [1n, 2n, 4n]);
 * ```
 */
function modular_FpInvertBatch(Fp, nums, passZero = false) {
    const F = Fp;
    const inverted = new Array(nums.length).fill(passZero ? F.ZERO : undefined);
    // Walk from first to last, multiply them by each other MOD p
    const multipliedAcc = nums.reduce((acc, num, i) => {
        if (F.is0(num))
            return acc;
        inverted[i] = acc;
        return F.mul(acc, num);
    }, F.ONE);
    // Invert last element
    const invertedAcc = F.inv(multipliedAcc);
    // Walk from last to first, multiply them by inverted each other MOD p
    nums.reduceRight((acc, num, i) => {
        if (F.is0(num))
            return acc;
        inverted[i] = F.mul(acc, inverted[i]);
        return F.mul(acc, num);
    }, invertedAcc);
    return inverted;
}
/**
 * @param Fp - Field implementation.
 * @param lhs - Dividend value.
 * @param rhs - Divisor value.
 * @returns Division result.
 * @throws If the divisor is non-invertible. {@link Error}
 * @example
 * Divide one field element by another.
 *
 * ```ts
 * import { Field, FpDiv } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const x = FpDiv(Fp, 6n, 3n);
 * ```
 */
function FpDiv(Fp, lhs, rhs) {
    const F = Fp;
    return F.mul(lhs, typeof rhs === 'bigint' ? invert(rhs, F.ORDER) : F.inv(rhs));
}
/**
 * Legendre symbol.
 * Legendre constant is used to calculate Legendre symbol (a | p)
 * which denotes the value of a^((p-1)/2) (mod p).
 *
 * * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
 * * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
 * * (a | p) ≡ 0    if a ≡ 0 (mod p)
 * @param Fp - Field implementation.
 * @param n - Value to inspect.
 * @returns Legendre symbol.
 * @throws If the field returns an invalid Legendre symbol value. {@link Error}
 * @example
 * Compute the Legendre symbol of one field element.
 *
 * ```ts
 * import { Field, FpLegendre } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const symbol = FpLegendre(Fp, 4n);
 * ```
 */
function FpLegendre(Fp, n) {
    const F = Fp;
    // We can use 3rd argument as optional cache of this value
    // but seems unneeded for now. The operation is very fast.
    const p1mod2 = (F.ORDER - modular_1n) / modular_2n;
    const powered = F.pow(n, p1mod2);
    const yes = F.eql(powered, F.ONE);
    const zero = F.eql(powered, F.ZERO);
    const no = F.eql(powered, F.neg(F.ONE));
    if (!yes && !zero && !no)
        throw new Error('invalid Legendre symbol result');
    return yes ? 1 : zero ? 0 : -1;
}
/**
 * @param Fp - Field implementation.
 * @param n - Value to inspect.
 * @returns `true` when `Fp.sqrt(n)` exists. This includes `0`, even though strict "quadratic
 *   residue" terminology often reserves that name for the non-zero square class.
 * @throws If the field returns an invalid Legendre symbol value. {@link Error}
 * @example
 * Check whether one field element has a square root in the field.
 *
 * ```ts
 * import { Field, FpIsSquare } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const isSquare = FpIsSquare(Fp, 4n);
 * ```
 */
function FpIsSquare(Fp, n) {
    const l = FpLegendre(Fp, n);
    // Zero is a square too: 0 = 0^2, and Fp.sqrt(0) already returns 0.
    return l !== -1;
}
/**
 * @param n - Curve order. Callers are expected to pass a positive order.
 * @param nBitLength - Optional cached bit length. Callers are expected to pass a positive cached
 *   value when overriding the derived bit length.
 * @returns Byte and bit lengths.
 * @throws If the order or cached bit length is invalid. {@link Error}
 * @example
 * Measure the encoding sizes needed for one modulus.
 *
 * ```ts
 * nLength(255n);
 * ```
 */
function nLength(n, nBitLength) {
    // Bit size, byte size of CURVE.n
    if (nBitLength !== undefined)
        utils_anumber(nBitLength);
    if (n <= modular_0n)
        throw new Error('invalid n length: expected positive n, got ' + n);
    if (nBitLength !== undefined && nBitLength < 1)
        throw new Error('invalid n length: expected positive bit length, got ' + nBitLength);
    const bits = utils_bitLen(n);
    // Cached bit lengths smaller than ORDER would truncate serialized scalars/elements and poison
    // any math that relies on the derived field metadata.
    if (nBitLength !== undefined && nBitLength < bits)
        throw new Error(`invalid n length: expected bit length (${bits}) >= n.length (${nBitLength})`);
    const _nBitLength = nBitLength !== undefined ? nBitLength : bits;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
}
// Keep the lazy sqrt cache off-instance so Field(...) can return a frozen object. Otherwise the
// cached helper write would keep the field surface externally mutable.
const FIELD_SQRT = new WeakMap();
class _Field {
    ORDER;
    BITS;
    BYTES;
    isLE;
    ZERO = modular_0n;
    ONE = modular_1n;
    _lengths;
    _mod;
    constructor(ORDER, opts = {}) {
        // ORDER <= 1 is degenerate: ONE would not be a valid field element and helpers like pow/inv
        // would stop modeling field arithmetic.
        if (ORDER <= modular_1n)
            throw new Error('invalid field: expected ORDER > 1, got ' + ORDER);
        let _nbitLength = undefined;
        this.isLE = false;
        if (opts != null && typeof opts === 'object') {
            // Cached bit lengths are trusted here and should already be positive / consistent with ORDER.
            if (typeof opts.BITS === 'number')
                _nbitLength = opts.BITS;
            if (typeof opts.sqrt === 'function')
                // `_Field.prototype` is frozen below, so custom sqrt hooks must become own properties
                // explicitly instead of relying on writable prototype shadowing via assignment.
                Object.defineProperty(this, 'sqrt', { value: opts.sqrt, enumerable: true });
            if (typeof opts.isLE === 'boolean')
                this.isLE = opts.isLE;
            if (opts.allowedLengths)
                this._lengths = Object.freeze(opts.allowedLengths.slice());
            if (typeof opts.modFromBytes === 'boolean')
                this._mod = opts.modFromBytes;
        }
        const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
        if (nByteLength > 2048)
            throw new Error('invalid field: expected ORDER of <= 2048 bytes');
        this.ORDER = ORDER;
        this.BITS = nBitLength;
        this.BYTES = nByteLength;
        Object.freeze(this);
    }
    create(num) {
        return modular_mod(num, this.ORDER);
    }
    isValid(num) {
        if (typeof num !== 'bigint')
            throw new TypeError('invalid field element: expected bigint, got ' + typeof num);
        return modular_0n <= num && num < this.ORDER; // 0 is valid element, but it's not invertible
    }
    is0(num) {
        return num === modular_0n;
    }
    // is valid and invertible
    isValidNot0(num) {
        return !this.is0(num) && this.isValid(num);
    }
    isOdd(num) {
        return (num & modular_1n) === modular_1n;
    }
    neg(num) {
        return modular_mod(-num, this.ORDER);
    }
    eql(lhs, rhs) {
        return lhs === rhs;
    }
    sqr(num) {
        return modular_mod(num * num, this.ORDER);
    }
    add(lhs, rhs) {
        return modular_mod(lhs + rhs, this.ORDER);
    }
    sub(lhs, rhs) {
        return modular_mod(lhs - rhs, this.ORDER);
    }
    mul(lhs, rhs) {
        return modular_mod(lhs * rhs, this.ORDER);
    }
    pow(num, power) {
        return FpPow(this, num, power);
    }
    div(lhs, rhs) {
        return modular_mod(lhs * invert(rhs, this.ORDER), this.ORDER);
    }
    // Same as above, but doesn't normalize
    sqrN(num) {
        return num * num;
    }
    addN(lhs, rhs) {
        return lhs + rhs;
    }
    subN(lhs, rhs) {
        return lhs - rhs;
    }
    mulN(lhs, rhs) {
        return lhs * rhs;
    }
    inv(num) {
        return invert(num, this.ORDER);
    }
    sqrt(num) {
        // Caching sqrt helpers speeds up sqrt9mod16 by 5x and Tonelli-Shanks by about 10% without keeping
        // the field instance itself mutable.
        let sqrt = FIELD_SQRT.get(this);
        if (!sqrt)
            FIELD_SQRT.set(this, (sqrt = FpSqrt(this.ORDER)));
        return sqrt(this, num);
    }
    toBytes(num) {
        // Serialize fixed-width limbs without re-validating the field range. Callers that need a
        // canonical encoding must pass a valid element; some protocols intentionally serialize raw
        // residues here and reduce or validate them elsewhere.
        return this.isLE ? utils_numberToBytesLE(num, this.BYTES) : utils_numberToBytesBE(num, this.BYTES);
    }
    fromBytes(bytes, skipValidation = false) {
        curves_utils_abytes(bytes);
        const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
        if (allowedLengths) {
            // `allowedLengths` must list real positive byte lengths; otherwise empty input would get
            // padded into zero and silently decode as a field element.
            if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
                throw new Error('Field.fromBytes: expected ' + allowedLengths + ' bytes, got ' + bytes.length);
            }
            const padded = new Uint8Array(BYTES);
            // isLE add 0 to right, !isLE to the left.
            padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
            bytes = padded;
        }
        if (bytes.length !== BYTES)
            throw new Error('Field.fromBytes: expected ' + BYTES + ' bytes, got ' + bytes.length);
        let scalar = isLE ? utils_bytesToNumberLE(bytes) : utils_bytesToNumberBE(bytes);
        if (modFromBytes)
            scalar = modular_mod(scalar, ORDER);
        if (!skipValidation)
            if (!this.isValid(scalar))
                throw new Error('invalid field element: outside of range 0..ORDER');
        // Range validation is optional here because some protocols intentionally decode raw residues
        // and reduce or validate them elsewhere.
        return scalar;
    }
    // TODO: we don't need it here, move out to separate fn
    invertBatch(lst) {
        return modular_FpInvertBatch(this, lst);
    }
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov(a, b, condition) {
        // Field elements have `isValid(...)`; the CMOV branch bit is a direct runtime input, so reject
        // non-boolean selectors here instead of letting JS truthiness silently change arithmetic.
        abool(condition, 'condition');
        return condition ? b : a;
    }
}
// Freeze the shared method surface too; otherwise callers can still poison every Field instance by
// monkey-patching `_Field.prototype` even if each instance is frozen.
Object.freeze(_Field.prototype);
/**
 * Creates a finite field. Major performance optimizations:
 * * 1. Denormalized operations like mulN instead of mul.
 * * 2. Identical object shape: never add or remove keys.
 * * 3. Frozen stable object shape; the lazy sqrt cache lives in a module-level `WeakMap`.
 * Fragile: always run a benchmark on a change.
 * Security note: operations and low-level serializers like `toBytes` don't check `isValid` for
 * all elements for performance and protocol-flexibility reasons; callers are responsible for
 * supplying valid elements when they need canonical field behavior.
 * This is low-level code, please make sure you know what you're doing.
 *
 * Note about field properties:
 * * CHARACTERISTIC p = prime number, number of elements in main subgroup.
 * * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
 *
 * @param ORDER - field order, probably prime, or could be composite
 * @param opts - Field options such as bit length or endianness. See {@link FieldOpts}.
 * @returns Frozen field instance with a stable object shape. This wrapper forwards `opts` straight
 *   into `_Field`, so it inherits `_Field`'s assumptions about cached sizes and `allowedLengths`.
 * @example
 * Construct one prime field with optional overrides.
 *
 * ```ts
 * Field(11n);
 * ```
 */
function Field(ORDER, opts = {}) {
    return new _Field(ORDER, opts);
}
// Generic random scalar, we can do same for other fields if via Fp2.mul(Fp2.ONE, Fp2.random)?
// This allows unsafe methods like ignore bias or zero. These unsafe, but often used in different protocols (if deterministic RNG).
// which mean we cannot force this via opts.
// Not sure what to do with randomBytes, we can accept it inside opts if wanted.
// Probably need to export getMinHashLength somewhere?
// random(bytes?: Uint8Array, unsafeAllowZero = false, unsafeAllowBias = false) {
//   const LEN = !unsafeAllowBias ? getMinHashLength(ORDER) : BYTES;
//   if (bytes === undefined) bytes = randomBytes(LEN); // _opts.randomBytes?
//   const num = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
//   // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
//   const reduced = unsafeAllowZero ? mod(num, ORDER) : mod(num, ORDER - _1n) + _1n;
//   return reduced;
// },
/**
 * @param Fp - Field implementation.
 * @param elm - Value to square-root.
 * @returns Odd square root when two roots exist. The special case `elm = 0` still returns `0`,
 *   which is the only square root but is not odd.
 * @throws If the field lacks oddness checks or the square root does not exist. {@link Error}
 * @example
 * Select the odd square root when two roots exist.
 *
 * ```ts
 * import { Field, FpSqrtOdd } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const root = FpSqrtOdd(Fp, 4n);
 * ```
 */
function FpSqrtOdd(Fp, elm) {
    const F = Fp;
    if (!F.isOdd)
        throw new Error("Field doesn't have isOdd");
    const root = F.sqrt(elm);
    return F.isOdd(root) ? root : F.neg(root);
}
/**
 * @param Fp - Field implementation.
 * @param elm - Value to square-root.
 * @returns Even square root.
 * @throws If the field lacks oddness checks or the square root does not exist. {@link Error}
 * @example
 * Select the even square root when two roots exist.
 *
 * ```ts
 * import { Field, FpSqrtEven } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const root = FpSqrtEven(Fp, 4n);
 * ```
 */
function modular_FpSqrtEven(Fp, elm) {
    const F = Fp;
    if (!F.isOdd)
        throw new Error("Field doesn't have isOdd");
    const root = F.sqrt(elm);
    return F.isOdd(root) ? F.neg(root) : root;
}
/**
 * Returns total number of bytes consumed by the field element.
 * For example, 32 bytes for usual 256-bit weierstrass curve.
 * @param fieldOrder - number of field elements, usually CURVE.n. Callers are expected to pass an
 *   order greater than 1.
 * @returns byte length of field
 * @throws If the field order is not a bigint. {@link Error}
 * @example
 * Read the fixed-width byte length of one field.
 *
 * ```ts
 * getFieldBytesLength(255n);
 * ```
 */
function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== 'bigint')
        throw new Error('field order must be bigint');
    // Valid field elements are in 0..ORDER-1, so ORDER <= 1 would make the encoded range degenerate.
    if (fieldOrder <= modular_1n)
        throw new Error('field order must be greater than 1');
    // Valid field elements are < ORDER, so the maximal encoded element is ORDER - 1.
    const bitLength = bitLen(fieldOrder - modular_1n);
    return Math.ceil(bitLength / 8);
}
/**
 * Returns minimal amount of bytes that can be safely reduced
 * by field order.
 * Should be 2^-128 for 128-bit curve such as P256.
 * This is the reduction / modulo-bias lower bound; higher-level helpers may still impose a larger
 * absolute floor for policy reasons.
 * @param fieldOrder - number of field elements greater than 1, usually CURVE.n.
 * @returns byte length of target hash
 * @throws If the field order is invalid. {@link Error}
 * @example
 * Compute the minimum hash length needed for field reduction.
 *
 * ```ts
 * getMinHashLength(255n);
 * ```
 */
function getMinHashLength(fieldOrder) {
    const length = getFieldBytesLength(fieldOrder);
    return length + Math.ceil(length / 2);
}
/**
 * "Constant-time" private key generation utility.
 * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
 * and convert them into private scalar, with the modulo bias being negligible.
 * Needs at least 48 bytes of input for 32-byte private key. The implementation also keeps a hard
 * 16-byte minimum even when `getMinHashLength(...)` is smaller, so toy-small inputs do not look
 * accidentally acceptable for real scalar derivation.
 * See {@link https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/ | Kudelski's modulo-bias guide},
 * {@link https://csrc.nist.gov/publications/detail/fips/186/5/final | FIPS 186-5 appendix A.2}, and
 * {@link https://www.rfc-editor.org/rfc/rfc9380#section-5 | RFC 9380 section 5}. Unlike RFC 9380
 * `hash_to_field`, this helper intentionally maps into the non-zero private-scalar range `1..n-1`.
 * @param key - Uniform input bytes.
 * @param fieldOrder - Size of subgroup.
 * @param isLE - interpret hash bytes as LE num
 * @returns valid private scalar
 * @throws If the hash length or field order is invalid for scalar reduction. {@link Error}
 * @example
 * Map hash output into a private scalar range.
 *
 * ```ts
 * mapHashToField(new Uint8Array(48).fill(1), 255n);
 * ```
 */
function mapHashToField(key, fieldOrder, isLE = false) {
    abytes(key);
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = Math.max(getMinHashLength(fieldOrder), 16);
    // No toy-small inputs: the helper is for real scalar derivation, not tiny test curves. No huge
    // inputs: easier to reason about JS timing / allocation behavior.
    if (len < minLen || len > 1024)
        throw new Error('expected ' + minLen + '-1024 bytes of input, got ' + len);
    const num = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
    // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
    const reduced = modular_mod(num, fieldOrder - modular_1n) + modular_1n;
    return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
//# sourceMappingURL=modular.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/abstract/curve.js
/**
 * Methods for elliptic curve multiplication by scalars.
 * Contains wNAF, pippenger.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */


const curve_0n = /* @__PURE__ */ BigInt(0);
const curve_1n = /* @__PURE__ */ BigInt(1);
/**
 * Validates the static surface of a point constructor.
 * This is only a cheap sanity check for the constructor hooks and fields consumed by generic
 * factories; it does not certify `BASE`/`ZERO` semantics or prove the curve implementation itself.
 * @param Point - Runtime point constructor.
 * @throws On missing constructor hooks or malformed field metadata. {@link TypeError}
 * @example
 * Check that one point constructor exposes the static hooks generic helpers need.
 *
 * ```ts
 * import { ed25519 } from '@noble/curves/ed25519.js';
 * import { validatePointCons } from '@noble/curves/abstract/curve.js';
 * validatePointCons(ed25519.Point);
 * ```
 */
function validatePointCons(Point) {
    const pc = Point;
    if (typeof pc !== 'function')
        throw new TypeError('Point must be a constructor');
    // validateObject only accepts plain objects, so copy the constructor statics into one bag first.
    validateObject({
        Fp: pc.Fp,
        Fn: pc.Fn,
        fromAffine: pc.fromAffine,
        fromBytes: pc.fromBytes,
        fromHex: pc.fromHex,
    }, {
        Fp: 'object',
        Fn: 'object',
        fromAffine: 'function',
        fromBytes: 'function',
        fromHex: 'function',
    });
    validateField(pc.Fp);
    validateField(pc.Fn);
}
/**
 * Computes both candidates first, but the final selection still branches on `condition`, so this
 * is not a strict constant-time CMOV primitive.
 * @param condition - Whether to negate the point.
 * @param item - Point-like value.
 * @returns Original or negated value.
 * @example
 * Keep the point or return its negation based on one boolean branch.
 *
 * ```ts
 * import { negateCt } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const maybeNegated = negateCt(true, p256.Point.BASE);
 * ```
 */
function negateCt(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
}
/**
 * Takes a bunch of Projective Points but executes only one
 * inversion on all of them. Inversion is very slow operation,
 * so this improves performance massively.
 * Optimization: converts a list of projective points to a list of identical points with Z=1.
 * Input points are left unchanged; the normalized points are returned as fresh instances.
 * @param c - Point constructor.
 * @param points - Projective points.
 * @returns Fresh projective points reconstructed from normalized affine coordinates.
 * @example
 * Batch-normalize projective points with a single shared inversion.
 *
 * ```ts
 * import { normalizeZ } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const points = normalizeZ(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()]);
 * ```
 */
function normalizeZ(c, points) {
    const invertedZs = modular_FpInvertBatch(c.Fp, points.map((p) => p.Z));
    return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
        throw new Error('invalid window size, expected [1..' + bits + '], got W=' + W);
}
function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1; // W=8 33. Not 32, because we skip zero
    const windowSize = 2 ** (W - 1); // W=8 128. Not 256, because we skip zero
    const maxNumber = 2 ** W; // W=8 256
    const mask = utils_bitMask(W); // W=8 255 == mask 0b11111111
    const shiftBy = BigInt(W); // W=8 8
    return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask); // extract W bits.
    let nextN = n >> shiftBy; // shift number by W bits.
    // What actually happens here:
    // const highestBit = Number(mask ^ (mask >> 1n));
    // let wbits2 = wbits - 1; // skip zero
    // if (wbits2 & highestBit) { wbits2 ^= Number(mask); // (~);
    // split if bits > max: +224 => 256-32
    if (wbits > windowSize) {
        // we skip zero, which means instead of `>= size-1`, we do `> size`
        wbits -= maxNumber; // -32, can be maxNumber - wbits, but then we need to set isNeg here.
        nextN += curve_1n; // +256 (carry)
    }
    const offsetStart = window * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1; // -1 because we skip zero; ignore when isZero
    const isZero = wbits === 0; // is current window slice a 0?
    const isNeg = wbits < 0; // is current window slice negative?
    const isNegF = window % 2 !== 0; // fake branch noise only
    const offsetF = offsetStart; // fake branch noise only
    return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
    if (!Array.isArray(points))
        throw new Error('array expected');
    points.forEach((p, i) => {
        if (!(p instanceof c))
            throw new Error('invalid point at index ' + i);
    });
}
function validateMSMScalars(scalars, field) {
    if (!Array.isArray(scalars))
        throw new Error('array of scalars expected');
    scalars.forEach((s, i) => {
        if (!field.isValid(s))
            throw new Error('invalid scalar at index ' + i);
    });
}
// Since points in different groups cannot be equal (different object constructor),
// we can have single place to store precomputes.
// Allows to make points frozen / immutable.
const pointPrecomputes = new WeakMap();
const pointWindowSizes = new WeakMap();
function getW(P) {
    // To disable precomputes:
    // return 1;
    // `1` is also the uncached sentinel: use the ladder / non-precomputed path.
    return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
    // Internal invariant: a non-zero remainder here means the wNAF window decomposition or loop
    // count is inconsistent, not that the original caller provided a bad scalar.
    if (n !== curve_0n)
        throw new Error('invalid wNAF');
}
/**
 * Elliptic curve multiplication of Point by scalar. Fragile.
 * Table generation takes **30MB of ram and 10ms on high-end CPU**,
 * but may take much longer on slow devices. Actual generation will happen on
 * first call of `multiply()`. By default, `BASE` point is precomputed.
 *
 * Scalars should always be less than curve order: this should be checked inside of a curve itself.
 * Creates precomputation tables for fast multiplication:
 * - private scalar is split by fixed size windows of W bits
 * - every window point is collected from window's table & added to accumulator
 * - since windows are different, same point inside tables won't be accessed more than once per calc
 * - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
 * - +1 window is neccessary for wNAF
 * - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
 *
 * TODO: research returning a 2d JS array of windows instead of a single window.
 * This would allow windows to be in different memory locations.
 * @param Point - Point constructor.
 * @param bits - Scalar bit length.
 * @example
 * Elliptic curve multiplication of Point by scalar.
 *
 * ```ts
 * import { wNAF } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const ladder = new wNAF(p256.Point, p256.Point.Fn.BITS);
 * ```
 */
class wNAF {
    BASE;
    ZERO;
    Fn;
    bits;
    // Parametrized with a given Point class (not individual point)
    constructor(Point, bits) {
        this.BASE = Point.BASE;
        this.ZERO = Point.ZERO;
        this.Fn = Point.Fn;
        this.bits = bits;
    }
    // non-const time multiplication ladder
    _unsafeLadder(elm, n, p = this.ZERO) {
        let d = elm;
        while (n > curve_0n) {
            if (n & curve_1n)
                p = p.add(d);
            d = d.double();
            n >>= curve_1n;
        }
        return p;
    }
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param point - Point instance
     * @param W - window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(point, W) {
        const { windows, windowSize } = calcWOpts(W, this.bits);
        const points = [];
        let p = point;
        let base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            // i=1, bc we skip 0
            for (let i = 1; i < windowSize; i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * More compact implementation:
     * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
        // Scalar should be smaller than field order
        if (!this.Fn.isValid(n))
            throw new Error('invalid scalar');
        // Accumulators
        let p = this.ZERO;
        let f = this.BASE;
        // This code was first written with assumption that 'f' and 'p' will never be infinity point:
        // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
        // there is negate now: it is possible that negated element from low value
        // would be the same as high element, which will create carry into next window.
        // It's not obvious how this can fail, but still worth investigating later.
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
            // (n === _0n) is handled and not early-exited. isEven and offsetF are used for noise
            const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
            n = nextN;
            if (isZero) {
                // bits are 0: add garbage to fake point
                // Important part for const-time getPublicKey: add random "noise" point to f.
                f = f.add(negateCt(isNegF, precomputes[offsetF]));
            }
            else {
                // bits are 1: add to result point
                p = p.add(negateCt(isNeg, precomputes[offset]));
            }
        }
        assert0(n);
        // Return both real and fake points so JIT keeps the noise path alive.
        // Known caveat: negate/carry interactions can still drive `f` to infinity even when `p` is not,
        // which weakens the noise path and leaves this only "less const-time" by about one bigint mul.
        return { p, f };
    }
    /**
     * Implements unsafe EC multiplication using precomputed tables
     * and w-ary non-adjacent form.
     * @param acc - accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
            if (n === curve_0n)
                break; // Early-exit, skip 0 value
            const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
            n = nextN;
            if (isZero) {
                // Window bits are 0: skip processing.
                // Move to next window.
                continue;
            }
            else {
                const item = precomputes[offset];
                acc = acc.add(isNeg ? item.negate() : item); // Re-using acc allows to save adds in MSM
            }
        }
        assert0(n);
        return acc;
    }
    getPrecomputes(W, point, transform) {
        // Cache key is only point identity plus the remembered window size; callers must not reuse the
        // same point with incompatible `transform(...)` layouts and expect a separate cache entry.
        let comp = pointPrecomputes.get(point);
        if (!comp) {
            comp = this.precomputeWindow(point, W);
            if (W !== 1) {
                // Doing transform outside of if brings 15% perf hit
                if (typeof transform === 'function')
                    comp = transform(comp);
                pointPrecomputes.set(point, comp);
            }
        }
        return comp;
    }
    cached(point, scalar, transform) {
        const W = getW(point);
        return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
    }
    unsafe(point, scalar, transform, prev) {
        const W = getW(point);
        if (W === 1)
            return this._unsafeLadder(point, scalar, prev); // For W=1 ladder is ~x2 faster
        return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
    }
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    createCache(P, W) {
        validateW(W, this.bits);
        pointWindowSizes.set(P, W);
        pointPrecomputes.delete(P);
    }
    hasCache(elm) {
        return getW(elm) !== 1;
    }
}
/**
 * Endomorphism-specific multiplication for Koblitz curves.
 * Cost: 128 dbl, 0-256 adds.
 * @param Point - Point constructor.
 * @param point - Input point.
 * @param k1 - First non-negative absolute scalar chunk.
 * @param k2 - Second non-negative absolute scalar chunk.
 * @returns Partial multiplication results.
 * @example
 * Endomorphism-specific multiplication for Koblitz curves.
 *
 * ```ts
 * import { mulEndoUnsafe } from '@noble/curves/abstract/curve.js';
 * import { secp256k1 } from '@noble/curves/secp256k1.js';
 * const parts = mulEndoUnsafe(secp256k1.Point, secp256k1.Point.BASE, 3n, 5n);
 * ```
 */
function mulEndoUnsafe(Point, point, k1, k2) {
    let acc = point;
    let p1 = Point.ZERO;
    let p2 = Point.ZERO;
    while (k1 > curve_0n || k2 > curve_0n) {
        if (k1 & curve_1n)
            p1 = p1.add(acc);
        if (k2 & curve_1n)
            p2 = p2.add(acc);
        acc = acc.double();
        k1 >>= curve_1n;
        k2 >>= curve_1n;
    }
    return { p1, p2 };
}
/**
 * Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 * 30x faster vs naive addition on L=4096, 10x faster than precomputes.
 * For N=254bit, L=1, it does: 1024 ADD + 254 DBL. For L=5: 1536 ADD + 254 DBL.
 * Algorithmically constant-time (for same L), even when 1 point + scalar, or when scalar = 0.
 * @param c - Curve Point constructor
 * @param points - array of L curve points
 * @param scalars - array of L scalars (aka secret keys / bigints)
 * @returns MSM result point. Empty input is accepted and returns the identity.
 * @throws If the point set, scalar set, or MSM sizing is invalid. {@link Error}
 * @example
 * Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 *
 * ```ts
 * import { pippenger } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const point = pippenger(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()], [2n, 3n]);
 * ```
 */
function pippenger(c, points, scalars) {
    // If we split scalars by some window (let's say 8 bits), every chunk will only
    // take 256 buckets even if there are 4096 scalars, also re-uses double.
    // TODO:
    // - https://eprint.iacr.org/2024/750.pdf
    // - https://tches.iacr.org/index.php/TCHES/article/view/10287
    // 0 is accepted in scalars
    const fieldN = c.Fn;
    validateMSMPoints(points, c);
    validateMSMScalars(scalars, fieldN);
    const plength = points.length;
    const slength = scalars.length;
    if (plength !== slength)
        throw new Error('arrays of points and scalars must have equal length');
    // if (plength === 0) throw new Error('array must be of length >= 2');
    const zero = c.ZERO;
    const wbits = bitLen(BigInt(plength));
    let windowSize = 1; // bits
    if (wbits > 12)
        windowSize = wbits - 3;
    else if (wbits > 4)
        windowSize = wbits - 2;
    else if (wbits > 0)
        windowSize = 2;
    const MASK = bitMask(windowSize);
    const buckets = new Array(Number(MASK) + 1).fill(zero); // +1 for zero array
    const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
    let sum = zero;
    for (let i = lastBits; i >= 0; i -= windowSize) {
        buckets.fill(zero);
        for (let j = 0; j < slength; j++) {
            const scalar = scalars[j];
            const wbits = Number((scalar >> BigInt(i)) & MASK);
            buckets[wbits] = buckets[wbits].add(points[j]);
        }
        let resI = zero; // not using this will do small speed-up, but will lose ct
        // Skip first bucket, because it is zero
        for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
            sumI = sumI.add(buckets[j]);
            resI = resI.add(sumI);
        }
        sum = sum.add(resI);
        if (i !== 0)
            for (let j = 0; j < windowSize; j++)
                sum = sum.double();
    }
    return sum;
}
/**
 * Precomputed multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 * @param c - Curve Point constructor
 * @param points - array of L curve points
 * @param windowSize - Precompute window size.
 * @returns Function which multiplies points with scalars. The closure accepts
 *   `scalars.length <= points.length`, and omitted trailing scalars are treated as zero.
 * @throws If the point set or precompute window is invalid. {@link Error}
 * @example
 * Precomputed multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 *
 * ```ts
 * import { precomputeMSMUnsafe } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const msm = precomputeMSMUnsafe(p256.Point, [p256.Point.BASE], 4);
 * const point = msm([3n]);
 * ```
 */
function precomputeMSMUnsafe(c, points, windowSize) {
    /**
     * Performance Analysis of Window-based Precomputation
     *
     * Base Case (256-bit scalar, 8-bit window):
     * - Standard precomputation requires:
     *   - 31 additions per scalar × 256 scalars = 7,936 ops
     *   - Plus 255 summary additions = 8,191 total ops
     *   Note: Summary additions can be optimized via accumulator
     *
     * Chunked Precomputation Analysis:
     * - Using 32 chunks requires:
     *   - 255 additions per chunk
     *   - 256 doublings
     *   - Total: (255 × 32) + 256 = 8,416 ops
     *
     * Memory Usage Comparison:
     * Window Size | Standard Points | Chunked Points
     * ------------|-----------------|---------------
     *     4-bit   |     520         |      15
     *     8-bit   |    4,224        |     255
     *    10-bit   |   13,824        |   1,023
     *    16-bit   |  557,056        |  65,535
     *
     * Key Advantages:
     * 1. Enables larger window sizes due to reduced memory overhead
     * 2. More efficient for smaller scalar counts:
     *    - 16 chunks: (16 × 255) + 256 = 4,336 ops
     *    - ~2x faster than standard 8,191 ops
     *
     * Limitations:
     * - Not suitable for plain precomputes (requires 256 constant doublings)
     * - Performance degrades with larger scalar counts:
     *   - Optimal for ~256 scalars
     *   - Less efficient for 4096+ scalars (Pippenger preferred)
     */
    const fieldN = c.Fn;
    validateW(windowSize, fieldN.BITS);
    validateMSMPoints(points, c);
    const zero = c.ZERO;
    const tableSize = 2 ** windowSize - 1; // table size (without zero)
    const chunks = Math.ceil(fieldN.BITS / windowSize); // chunks of item
    const MASK = bitMask(windowSize);
    const tables = points.map((p) => {
        const res = [];
        for (let i = 0, acc = p; i < tableSize; i++) {
            res.push(acc);
            acc = acc.add(p);
        }
        return res;
    });
    return (scalars) => {
        validateMSMScalars(scalars, fieldN);
        if (scalars.length > points.length)
            throw new Error('array of scalars must be smaller than array of points');
        let res = zero;
        for (let i = 0; i < chunks; i++) {
            // No need to double if accumulator is still zero.
            if (res !== zero)
                for (let j = 0; j < windowSize; j++)
                    res = res.double();
            const shiftBy = BigInt(chunks * windowSize - (i + 1) * windowSize);
            for (let j = 0; j < scalars.length; j++) {
                const n = scalars[j];
                const curr = Number((n >> shiftBy) & MASK);
                if (!curr)
                    continue; // skip zero scalars chunks
                res = res.add(tables[j][curr - 1]);
            }
        }
        return res;
    };
}
function createField(order, field, isLE) {
    if (field) {
        // Reuse supplied field overrides as-is; `isLE` only affects freshly constructed fallback
        // fields, and validateField() below only checks the arithmetic subset, not full byte/cmov
        // behavior.
        if (field.ORDER !== order)
            throw new Error('Field.ORDER must match order: Fp == p, Fn == n');
        modular_validateField(field);
        return field;
    }
    else {
        return Field(order, { isLE });
    }
}
/**
 * Validates basic CURVE shape and field membership, then creates fields.
 * This does not prove that the generator is on-curve, that subgroup/order data are consistent, or
 * that the curve equation itself is otherwise sane.
 * @param type - Curve family.
 * @param CURVE - Curve parameters.
 * @param curveOpts - Optional field overrides:
 *   - `Fp` (optional): Optional base-field override.
 *   - `Fn` (optional): Optional scalar-field override.
 * @param FpFnLE - Whether field encoding is little-endian.
 * @returns Frozen curve parameters and fields.
 * @throws If the curve parameters or field overrides are invalid. {@link Error}
 * @example
 * Build curve fields from raw constants before constructing a curve instance.
 *
 * ```ts
 * const curve = createCurveFields('weierstrass', {
 *   p: 17n,
 *   n: 19n,
 *   h: 1n,
 *   a: 2n,
 *   b: 2n,
 *   Gx: 5n,
 *   Gy: 1n,
 * });
 * ```
 */
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
    if (FpFnLE === undefined)
        FpFnLE = type === 'edwards';
    if (!CURVE || typeof CURVE !== 'object')
        throw new Error(`expected valid ${type} CURVE object`);
    for (const p of ['p', 'n', 'h']) {
        const val = CURVE[p];
        if (!(typeof val === 'bigint' && val > curve_0n))
            throw new Error(`CURVE.${p} must be positive bigint`);
    }
    const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
    const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
    const _b = type === 'weierstrass' ? 'b' : 'd';
    const params = ['Gx', 'Gy', 'a', _b];
    for (const p of params) {
        // @ts-ignore
        if (!Fp.isValid(CURVE[p]))
            throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
    }
    CURVE = Object.freeze(Object.assign({}, CURVE));
    return { CURVE, Fp, Fn };
}
/**
 * @param randomSecretKey - Secret-key generator.
 * @param getPublicKey - Public-key derivation helper.
 * @returns Keypair generator.
 * @example
 * Build a `keygen()` helper from existing secret-key and public-key primitives.
 *
 * ```ts
 * import { createKeygen } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const keygen = createKeygen(p256.utils.randomSecretKey, p256.getPublicKey);
 * const pair = keygen();
 * ```
 */
function createKeygen(randomSecretKey, getPublicKey) {
    return function keygen(seed) {
        const secretKey = randomSecretKey(seed);
        return { secretKey, publicKey: getPublicKey(secretKey) };
    };
}
//# sourceMappingURL=curve.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/abstract/edwards.js
/**
 * Twisted Edwards curve. The formula is: ax² + y² = 1 + dx²y².
 * For design rationale of types / exports, see weierstrass module documentation.
 * Untwisted Edwards curves exist, but they aren't used in real-world protocols.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */



// Be friendly to bad ECMAScript parsers by not using bigint literals
// prettier-ignore
const edwards_0n = /* @__PURE__ */ BigInt(0), edwards_1n = /* @__PURE__ */ BigInt(1), edwards_2n = /* @__PURE__ */ BigInt(2), edwards_8n = /* @__PURE__ */ BigInt(8);
// Affine Edwards-equation check only; this does not prove subgroup membership, canonical
// encoding, prime-order base-point requirements, or identity exclusion.
function isEdValidXY(Fp, CURVE, x, y) {
    const x2 = Fp.sqr(x);
    const y2 = Fp.sqr(y);
    const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
    const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
    return Fp.eql(left, right);
}
/**
 * @param params - Curve parameters. See {@link EdwardsOpts}.
 * @param extraOpts - Optional helpers and overrides. See {@link EdwardsExtraOpts}.
 * @returns Edwards point constructor. Generator validation here only checks
 *   that `(Gx, Gy)` satisfies the affine Edwards equation.
 *   RFC 8032 base-point constraints like `B != (0,1)` and `[L]B = 0`
 *   are left to the caller's chosen parameters, since eager subgroup
 *   validation here adds about 10-15ms to heavyweight imports like ed448.
 *   The returned constructor also eagerly marks `Point.BASE` for W=8
 *   precompute caching. Some code paths still assume
 *   `Fp.BYTES === Fn.BYTES`, so mismatched byte lengths are not fully audited here.
 * @throws If the curve parameters or Edwards overrides are invalid. {@link Error}
 * @example
 * ```ts
 * import { edwards } from '@noble/curves/abstract/edwards.js';
 * import { jubjub } from '@noble/curves/misc.js';
 * // Build a point constructor from explicit curve parameters, then use its base point.
 * const Point = edwards(jubjub.Point.CURVE());
 * Point.BASE.toHex();
 * ```
 */
function edwards(params, extraOpts = {}) {
    const opts = extraOpts;
    const validated = createCurveFields('edwards', params, opts, opts.FpFnLE);
    const { Fp, Fn } = validated;
    let CURVE = validated.CURVE;
    const { h: cofactor } = CURVE;
    utils_validateObject(opts, {}, { uvRatio: 'function' });
    // Important:
    // There are some places where Fp.BYTES is used instead of nByteLength.
    // So far, everything has been tested with curves of Fp.BYTES == nByteLength.
    // TODO: test and find curves which behave otherwise.
    const MASK = edwards_2n << (BigInt(Fn.BYTES * 8) - edwards_1n);
    const modP = (n) => Fp.create(n); // Function overrides
    // sqrt(u/v)
    const uvRatio = opts.uvRatio === undefined
        ? (u, v) => {
            try {
                return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
            }
            catch (e) {
                return { isValid: false, value: edwards_0n };
            }
        }
        : opts.uvRatio;
    // Validate whether the passed curve params are valid.
    // equation ax² + y² = 1 + dx²y² should work for generator point.
    if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
        throw new Error('bad curve params: generator point');
    /**
     * Asserts coordinate is valid: 0 <= n < MASK.
     * Coordinates >= Fp.ORDER are allowed for zip215.
     */
    function acoord(title, n, banZero = false) {
        const min = banZero ? edwards_1n : edwards_0n;
        aInRange('coordinate ' + title, n, min, MASK);
        return n;
    }
    function aedpoint(other) {
        if (!(other instanceof Point))
            throw new Error('EdwardsPoint expected');
    }
    // Extended Point works in extended coordinates: (X, Y, Z, T) ∋ (x=X/Z, y=Y/Z, T=xy).
    // https://en.wikipedia.org/wiki/Twisted_Edwards_curve#Extended_coordinates
    class Point {
        // base / generator point
        static BASE = new Point(CURVE.Gx, CURVE.Gy, edwards_1n, modP(CURVE.Gx * CURVE.Gy));
        // zero / infinity / identity point
        static ZERO = new Point(edwards_0n, edwards_1n, edwards_1n, edwards_0n); // 0, 1, 1, 0
        // math field
        static Fp = Fp;
        // scalar field
        static Fn = Fn;
        X;
        Y;
        Z;
        T;
        constructor(X, Y, Z, T) {
            this.X = acoord('x', X);
            this.Y = acoord('y', Y);
            this.Z = acoord('z', Z, true);
            this.T = acoord('t', T);
            Object.freeze(this);
        }
        static CURVE() {
            return CURVE;
        }
        /**
         * Create one extended Edwards point from affine coordinates.
         * Does NOT validate that the point is on-curve or torsion-free.
         * Use `.assertValidity()` on adversarial inputs.
         */
        static fromAffine(p) {
            if (p instanceof Point)
                throw new Error('extended point not allowed');
            const { x, y } = p || {};
            acoord('x', x);
            acoord('y', y);
            return new Point(x, y, edwards_1n, modP(x * y));
        }
        // Uses algo from RFC8032 5.1.3.
        static fromBytes(bytes, zip215 = false) {
            const len = Fp.BYTES;
            const { a, d } = CURVE;
            bytes = curves_utils_copyBytes(curves_utils_abytes(bytes, len, 'point'));
            abool(zip215, 'zip215');
            const normed = curves_utils_copyBytes(bytes); // copy again, we'll manipulate it
            const lastByte = bytes[len - 1]; // select last byte
            normed[len - 1] = lastByte & ~0x80; // clear last bit
            const y = utils_bytesToNumberLE(normed);
            // zip215=true is good for consensus-critical apps. =false follows RFC8032 / NIST186-5.
            // RFC8032 prohibits >= p, but ZIP215 doesn't
            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
            const max = zip215 ? MASK : Fp.ORDER;
            aInRange('point.y', y, edwards_0n, max);
            // Ed25519: x² = (y²-1)/(dy²+1) mod p. Ed448: x² = (y²-1)/(dy²-1) mod p. Generic case:
            // ax²+y²=1+dx²y² => y²-1=dx²y²-ax² => y²-1=x²(dy²-a) => x²=(y²-1)/(dy²-a)
            const y2 = modP(y * y); // denominator is always non-0 mod p.
            const u = modP(y2 - edwards_1n); // u = y² - 1
            const v = modP(d * y2 - a); // v = d y² + 1.
            let { isValid, value: x } = uvRatio(u, v); // √(u/v)
            if (!isValid)
                throw new Error('bad point: invalid y coordinate');
            const isXOdd = (x & edwards_1n) === edwards_1n; // There are 2 square roots. Use x_0 bit to select proper
            const isLastByteOdd = (lastByte & 0x80) !== 0; // x_0, last bit
            if (!zip215 && x === edwards_0n && isLastByteOdd)
                // if x=0 and x_0 = 1, fail
                throw new Error('bad point: x=0 and x_0=1');
            if (isLastByteOdd !== isXOdd)
                x = modP(-x); // if x_0 != x mod 2, set x = p-x
            return Point.fromAffine({ x, y });
        }
        static fromHex(hex, zip215 = false) {
            return Point.fromBytes(curves_utils_hexToBytes(hex), zip215);
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        precompute(windowSize = 8, isLazy = true) {
            wnaf.createCache(this, windowSize);
            if (!isLazy)
                this.multiply(edwards_2n); // random number
            return this;
        }
        // Useful in fromAffine() - not for fromBytes(), which always created valid points.
        assertValidity() {
            const p = this;
            const { a, d } = CURVE;
            // Keep generic Edwards validation fail-closed on the neutral point.
            // Even though ZERO is algebraically valid and can roundtrip through encodings, higher-level
            // callers often reach it only through broken hash/scalar plumbing; rejecting it here avoids
            // silently treating that degenerate state as an ordinary public point.
            if (p.is0())
                throw new Error('bad point: ZERO'); // TODO: optimize, with vars below?
            // Equation in affine coordinates: ax² + y² = 1 + dx²y²
            // Equation in projective coordinates (X/Z, Y/Z, Z):  (aX² + Y²)Z² = Z⁴ + dX²Y²
            const { X, Y, Z, T } = p;
            const X2 = modP(X * X); // X²
            const Y2 = modP(Y * Y); // Y²
            const Z2 = modP(Z * Z); // Z²
            const Z4 = modP(Z2 * Z2); // Z⁴
            const aX2 = modP(X2 * a); // aX²
            const left = modP(Z2 * modP(aX2 + Y2)); // (aX² + Y²)Z²
            const right = modP(Z4 + modP(d * modP(X2 * Y2))); // Z⁴ + dX²Y²
            if (left !== right)
                throw new Error('bad point: equation left != right (1)');
            // In Extended coordinates we also have T, which is x*y=T/Z: check X*Y == Z*T
            const XY = modP(X * Y);
            const ZT = modP(Z * T);
            if (XY !== ZT)
                throw new Error('bad point: equation left != right (2)');
        }
        // Compare one point to another.
        equals(other) {
            aedpoint(other);
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const { X: X2, Y: Y2, Z: Z2 } = other;
            const X1Z2 = modP(X1 * Z2);
            const X2Z1 = modP(X2 * Z1);
            const Y1Z2 = modP(Y1 * Z2);
            const Y2Z1 = modP(Y2 * Z1);
            return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        negate() {
            // Flips point sign to a negative one (-x, y in affine coords)
            return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
        }
        // Fast algo for doubling Extended Point.
        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
        // Cost: 4M + 4S + 1*a + 6add + 1*2.
        double() {
            const { a } = CURVE;
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const A = modP(X1 * X1); // A = X12
            const B = modP(Y1 * Y1); // B = Y12
            const C = modP(edwards_2n * modP(Z1 * Z1)); // C = 2*Z12
            const D = modP(a * A); // D = a*A
            const x1y1 = X1 + Y1;
            const E = modP(modP(x1y1 * x1y1) - A - B); // E = (X1+Y1)2-A-B
            const G = D + B; // G = D+B
            const F = G - C; // F = G-C
            const H = D - B; // H = D-B
            const X3 = modP(E * F); // X3 = E*F
            const Y3 = modP(G * H); // Y3 = G*H
            const T3 = modP(E * H); // T3 = E*H
            const Z3 = modP(F * G); // Z3 = F*G
            return new Point(X3, Y3, Z3, T3);
        }
        // Fast algo for adding 2 Extended Points.
        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
        // Cost: 9M + 1*a + 1*d + 7add.
        add(other) {
            aedpoint(other);
            const { a, d } = CURVE;
            const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
            const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
            const A = modP(X1 * X2); // A = X1*X2
            const B = modP(Y1 * Y2); // B = Y1*Y2
            const C = modP(T1 * d * T2); // C = T1*d*T2
            const D = modP(Z1 * Z2); // D = Z1*Z2
            const E = modP((X1 + Y1) * (X2 + Y2) - A - B); // E = (X1+Y1)*(X2+Y2)-A-B
            const F = D - C; // F = D-C
            const G = D + C; // G = D+C
            const H = modP(B - a * A); // H = B-a*A
            const X3 = modP(E * F); // X3 = E*F
            const Y3 = modP(G * H); // Y3 = G*H
            const T3 = modP(E * H); // T3 = E*H
            const Z3 = modP(F * G); // Z3 = F*G
            return new Point(X3, Y3, Z3, T3);
        }
        subtract(other) {
            // Validate before calling `negate()` so wrong inputs fail with the point guard
            // instead of leaking a foreign `negate()` error.
            aedpoint(other);
            return this.add(other.negate());
        }
        // Constant-time multiplication.
        multiply(scalar) {
            // 1 <= scalar < L
            // Keep the subgroup-scalar contract strict instead of reducing 0 / n to ZERO.
            // In keygen/signing-style callers, those values usually mean broken hash/scalar plumbing,
            // and failing closed is safer than silently producing the identity point.
            if (!Fn.isValidNot0(scalar))
                throw new RangeError('invalid scalar: expected 1 <= sc < curve.n');
            const { p, f } = wnaf.cached(this, scalar, (p) => normalizeZ(Point, p));
            return normalizeZ(Point, [p, f])[0];
        }
        // Non-constant-time multiplication. Uses double-and-add algorithm.
        // It's faster, but should only be used when you don't care about
        // an exposed private key e.g. sig verification.
        // Keeps the same subgroup-scalar contract: 0 is allowed for public-scalar callers, but
        // n and larger values are rejected instead of being reduced mod n to the identity point.
        multiplyUnsafe(scalar) {
            // 0 <= scalar < L
            if (!Fn.isValid(scalar))
                throw new RangeError('invalid scalar: expected 0 <= sc < curve.n');
            if (scalar === edwards_0n)
                return Point.ZERO;
            if (this.is0() || scalar === edwards_1n)
                return this;
            return wnaf.unsafe(this, scalar, (p) => normalizeZ(Point, p));
        }
        // Checks if point is of small order.
        // If you add something to small order point, you will have "dirty"
        // point with torsion component.
        // Clears cofactor and checks if the result is 0.
        isSmallOrder() {
            return this.clearCofactor().is0();
        }
        // Multiplies point by curve order and checks if the result is 0.
        // Returns `false` is the point is dirty.
        isTorsionFree() {
            return wnaf.unsafe(this, CURVE.n).is0();
        }
        // Converts Extended point to default (x, y) coordinates.
        // Can accept precomputed Z^-1 - for example, from invertBatch.
        toAffine(invertedZ) {
            const p = this;
            let iz = invertedZ;
            const { X, Y, Z } = p;
            const is0 = p.is0();
            if (iz == null)
                iz = is0 ? edwards_8n : Fp.inv(Z); // 8 was chosen arbitrarily
            const x = modP(X * iz);
            const y = modP(Y * iz);
            const zz = Fp.mul(Z, iz);
            if (is0)
                return { x: edwards_0n, y: edwards_1n };
            if (zz !== edwards_1n)
                throw new Error('invZ was invalid');
            return { x, y };
        }
        clearCofactor() {
            if (cofactor === edwards_1n)
                return this;
            return this.multiplyUnsafe(cofactor);
        }
        toBytes() {
            const { x, y } = this.toAffine();
            // Fp.toBytes() allows non-canonical encoding of y (>= p).
            const bytes = Fp.toBytes(y);
            // Each y has 2 valid points: (x, y), (x,-y).
            // When compressing, it's enough to store y and use the last byte to encode sign of x
            bytes[bytes.length - 1] |= x & edwards_1n ? 0x80 : 0;
            return bytes;
        }
        toHex() {
            return curves_utils_bytesToHex(this.toBytes());
        }
        toString() {
            return `<Point ${this.is0() ? 'ZERO' : this.toHex()}>`;
        }
    }
    const wnaf = new wNAF(Point, Fn.BITS);
    // Keep constructor work cheap: subgroup/generator validation belongs to the caller's curve
    // parameters, and doing the extra checks here adds about 10-15ms to heavy module imports.
    // Callers that construct custom curves are responsible for supplying the correct base point.
    // try {
    //   Point.BASE.assertValidity();
    //   if (!Point.BASE.isTorsionFree()) throw new Error('bad point: not in prime-order subgroup');
    // } catch {
    //   throw new Error('bad curve params: generator point');
    // }
    // Tiny toy curves can have scalar fields narrower than 8 bits. Skip the
    // eager W=8 cache there instead of rejecting an otherwise valid constructor.
    if (Fn.BITS >= 8)
        Point.BASE.precompute(8); // Enable precomputes. Slows down first publicKey computation by 20ms.
    Object.freeze(Point.prototype);
    Object.freeze(Point);
    return Point;
}
/**
 * Base class for prime-order points like Ristretto255 and Decaf448.
 * These points eliminate cofactor issues by representing equivalence classes
 * of Edwards curve points. Multiple Edwards representatives can describe the
 * same abstract wrapper element, so wrapper validity is not the same thing as
 * the hidden representative being torsion-free.
 * @param ep - Backing Edwards point.
 * @example
 * Base class for prime-order points like Ristretto255 and Decaf448.
 *
 * ```ts
 * import { ristretto255 } from '@noble/curves/ed25519.js';
 * const point = ristretto255.Point.BASE.multiply(2n);
 * ```
 */
class PrimeEdwardsPoint {
    static BASE;
    static ZERO;
    static Fp;
    static Fn;
    ep;
    /**
     * Wrap one internal Edwards representative directly.
     * This is not a canonical encoding boundary: alternate Edwards
     * representatives may still describe the same abstract wrapper element.
     */
    constructor(ep) {
        this.ep = ep;
    }
    // Static methods that must be implemented by subclasses
    static fromBytes(_bytes) {
        notImplemented();
    }
    static fromHex(_hex) {
        notImplemented();
    }
    get x() {
        return this.toAffine().x;
    }
    get y() {
        return this.toAffine().y;
    }
    // Common implementations
    clearCofactor() {
        // no-op for the abstract prime-order wrapper group; this is about the
        // wrapper element, not the hidden Edwards representative.
        return this;
    }
    assertValidity() {
        // Keep wrapper validity at the abstract-group boundary. Canonical decode
        // may choose Edwards representatives that differ by small torsion, so
        // checking `this.ep.isTorsionFree()` here would reject valid wrapper points.
        this.ep.assertValidity();
    }
    /**
     * Return affine coordinates of the current internal Edwards representative.
     * This is a convenience helper, not a canonical Ristretto/Decaf encoding.
     * Equal abstract elements may expose different `x` / `y`; use
     * `toBytes()` / `fromBytes()` for canonical roundtrips.
     */
    toAffine(invertedZ) {
        return this.ep.toAffine(invertedZ);
    }
    toHex() {
        return curves_utils_bytesToHex(this.toBytes());
    }
    toString() {
        return this.toHex();
    }
    isTorsionFree() {
        // Abstract Ristretto/Decaf elements are already prime-order even when the
        // hidden Edwards representative is not torsion-free.
        return true;
    }
    isSmallOrder() {
        return false;
    }
    add(other) {
        this.assertSame(other);
        return this.init(this.ep.add(other.ep));
    }
    subtract(other) {
        this.assertSame(other);
        return this.init(this.ep.subtract(other.ep));
    }
    multiply(scalar) {
        return this.init(this.ep.multiply(scalar));
    }
    multiplyUnsafe(scalar) {
        return this.init(this.ep.multiplyUnsafe(scalar));
    }
    double() {
        return this.init(this.ep.double());
    }
    negate() {
        return this.init(this.ep.negate());
    }
    precompute(windowSize, isLazy) {
        this.ep.precompute(windowSize, isLazy);
        // Keep the wrapper identity stable like the backing Edwards API instead of
        // allocating a fresh wrapper around the same cached point.
        return this;
    }
}
/**
 * Initializes EdDSA signatures over given Edwards curve.
 * @param Point - Edwards point constructor.
 * @param cHash - Hash function.
 * @param eddsaOpts - Optional signature helpers. See {@link EdDSAOpts}.
 * @returns EdDSA helper namespace.
 * @throws If the hash function, options, or derived point operations are invalid. {@link Error}
 * @example
 * Initializes EdDSA signatures over given Edwards curve.
 *
 * ```ts
 * import { eddsa } from '@noble/curves/abstract/edwards.js';
 * import { jubjub } from '@noble/curves/misc.js';
 * import { sha512 } from '@noble/hashes/sha2.js';
 * const sigs = eddsa(jubjub.Point, sha512);
 * const { secretKey, publicKey } = sigs.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = sigs.sign(msg, secretKey);
 * const isValid = sigs.verify(sig, msg, publicKey);
 * ```
 */
function eddsa(Point, cHash, eddsaOpts = {}) {
    if (typeof cHash !== 'function')
        throw new Error('"hash" function param is required');
    const hash = cHash;
    const opts = eddsaOpts;
    utils_validateObject(opts, {}, {
        adjustScalarBytes: 'function',
        randomBytes: 'function',
        domain: 'function',
        prehash: 'function',
        zip215: 'boolean',
        mapToCurve: 'function',
    });
    const { prehash } = opts;
    const { BASE, Fp, Fn } = Point;
    const outputLen = hash.outputLen;
    const expectedLen = 2 * Fp.BYTES;
    // When hash metadata is available, reject incompatible EdDSA wrappers at construction time
    // instead of deferring the mismatch until the first keygen/sign call.
    if (outputLen !== undefined) {
        utils_asafenumber(outputLen, 'hash.outputLen');
        if (outputLen !== expectedLen)
            throw new Error(`hash.outputLen must be ${expectedLen}, got ${outputLen}`);
    }
    const randomBytes = opts.randomBytes === undefined ? utils_randomBytes : opts.randomBytes;
    const adjustScalarBytes = opts.adjustScalarBytes === undefined
        ? (bytes) => bytes
        : opts.adjustScalarBytes;
    const domain = opts.domain === undefined
        ? (data, ctx, phflag) => {
            abool(phflag, 'phflag');
            if (ctx.length || phflag)
                throw new Error('Contexts/pre-hash are not supported');
            return data;
        }
        : opts.domain; // NOOP
    // Parse an EdDSA digest as a little-endian integer and reduce it modulo the scalar field order.
    function modN_LE(hash) {
        return Fn.create(utils_bytesToNumberLE(hash)); // Not Fn.fromBytes: it has length limit
    }
    // Get the hashed private scalar per RFC8032 5.1.5
    function getPrivateScalar(key) {
        const len = lengths.secretKey;
        curves_utils_abytes(key, lengths.secretKey, 'secretKey');
        // Hash private key with curve's hash function to produce uniformingly random input
        // Check byte lengths: ensure(64, h(ensure(32, key)))
        const hashed = curves_utils_abytes(hash(key), 2 * len, 'hashedSecretKey');
        // Slice before clamping so in-place adjustors don't corrupt the prefix half.
        const head = adjustScalarBytes(hashed.slice(0, len)); // clear first half bits, produce FE
        const prefix = hashed.slice(len, 2 * len); // second half is called key prefix (5.1.6)
        const scalar = modN_LE(head); // The actual private scalar
        return { head, prefix, scalar };
    }
    /** Convenience method that creates public key from scalar. RFC8032 5.1.5
     * Also exposes the derived scalar/prefix tuple and point form reused by sign().
     */
    function getExtendedPublicKey(secretKey) {
        const { head, prefix, scalar } = getPrivateScalar(secretKey);
        const point = BASE.multiply(scalar); // Point on Edwards curve aka public key
        const pointBytes = point.toBytes();
        return { head, prefix, scalar, point, pointBytes };
    }
    /** Calculates EdDSA pub key. RFC8032 5.1.5. */
    function getPublicKey(secretKey) {
        return getExtendedPublicKey(secretKey).pointBytes;
    }
    // Hash domain-separated chunks into a little-endian scalar modulo the group order.
    function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
        const msg = curves_utils_concatBytes(...msgs);
        return modN_LE(hash(domain(msg, curves_utils_abytes(context, undefined, 'context'), !!prehash)));
    }
    /** Signs message with secret key. RFC8032 5.1.6 */
    function sign(msg, secretKey, options = {}) {
        msg = curves_utils_abytes(msg, undefined, 'message');
        if (prehash)
            msg = prehash(msg); // for ed25519ph etc.
        const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
        const r = hashDomainToScalar(options.context, prefix, msg); // r = dom2(F, C) || prefix || PH(M)
        // RFC 8032 5.1.6 allows r mod L = 0, and SUPERCOP ref10 accepts the resulting identity-point
        // signature.
        // We intentionally keep the safe multiply() rejection here so a miswired all-zero hash provider
        // fails loudly instead of silently producing a degenerate signature.
        const R = BASE.multiply(r).toBytes(); // R = rG
        const k = hashDomainToScalar(options.context, R, pointBytes, msg); // R || A || PH(M)
        const s = Fn.create(r + k * scalar); // S = (r + k * s) mod L
        if (!Fn.isValid(s))
            throw new Error('sign failed: invalid s'); // 0 <= s < L
        const rs = curves_utils_concatBytes(R, Fn.toBytes(s));
        return curves_utils_abytes(rs, lengths.signature, 'result');
    }
    // Keep the shared helper strict by default: RFC 8032 / NIST-style wrappers should reject
    // non-canonical encodings unless they explicitly opt into ZIP-215's more permissive decode rules.
    const verifyOpts = {
        zip215: opts.zip215,
    };
    /**
     * Verifies EdDSA signature against message and public key. RFC 8032 §§5.1.7 and 5.2.7.
     * A cofactored verification equation is checked.
     */
    function verify(sig, msg, publicKey, options = verifyOpts) {
        // Preserve the wrapper-selected default for `{}` / `{ zip215: undefined }`, not just omitted opts.
        const { context } = options;
        const zip215 = options.zip215 === undefined ? !!verifyOpts.zip215 : options.zip215;
        const len = lengths.signature;
        sig = curves_utils_abytes(sig, len, 'signature');
        msg = curves_utils_abytes(msg, undefined, 'message');
        publicKey = curves_utils_abytes(publicKey, lengths.publicKey, 'publicKey');
        if (zip215 !== undefined)
            abool(zip215, 'zip215');
        if (prehash)
            msg = prehash(msg); // for ed25519ph, etc
        const mid = len / 2;
        const r = sig.subarray(0, mid);
        const s = utils_bytesToNumberLE(sig.subarray(mid, len));
        let A, R, SB;
        try {
            // ZIP-215 is more permissive than RFC 8032 / NIST186-5. Use it only for wrappers that
            // explicitly want consensus-style unreduced encoding acceptance.
            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
            A = Point.fromBytes(publicKey, zip215);
            R = Point.fromBytes(r, zip215);
            SB = BASE.multiplyUnsafe(s); // 0 <= s < l is done inside
        }
        catch (error) {
            return false;
        }
        // RFC 8032 §§5.1.7/5.2.7 and FIPS 186-5 §§7.7.2/7.8.2 only decode A' and check the cofactored
        // verification equation; they do not add a separate low-order-public-key rejection here.
        // Strict mode still rejects small-order A' intentionally for SBS-style non-repudiation and to
        // avoid ambiguous verification outcomes where unusual low-order keys can make distinct
        // key/signature/message combinations verify.
        if (!zip215 && A.isSmallOrder())
            return false;
        // ZIP-215 accepts noncanonical / unreduced point encodings, so the challenge hash must use the
        // exact signature/public-key bytes rather than canonicalized re-encodings of the decoded points.
        const k = hashDomainToScalar(context, r, publicKey, msg);
        const RkA = R.add(A.multiplyUnsafe(k));
        // Check the cofactored verification equation via the curve cofactor h.
        // [h][S]B = [h]R + [h][k]A'
        return RkA.subtract(SB).clearCofactor().is0();
    }
    const _size = Fp.BYTES; // 32 for ed25519, 57 for ed448
    const lengths = {
        secretKey: _size,
        publicKey: _size,
        signature: 2 * _size,
        seed: _size,
    };
    function randomSecretKey(seed) {
        seed = seed === undefined ? randomBytes(lengths.seed) : seed;
        return curves_utils_abytes(seed, lengths.seed, 'seed');
    }
    function isValidSecretKey(key) {
        return curves_utils_isBytes(key) && key.length === lengths.secretKey;
    }
    function isValidPublicKey(key, zip215) {
        try {
            // Preserve the wrapper-selected default for omitted / `undefined` ZIP-215 flags here too.
            return !!Point.fromBytes(key, zip215 === undefined ? verifyOpts.zip215 : zip215);
        }
        catch (error) {
            return false;
        }
    }
    const utils = {
        getExtendedPublicKey,
        randomSecretKey,
        isValidSecretKey,
        isValidPublicKey,
        /**
         * Converts ed public key to x public key. Uses formula:
         * - ed25519:
         *   - `(u, v) = ((1+y)/(1-y), sqrt(-486664)*u/x)`
         *   - `(x, y) = (sqrt(-486664)*u/v, (u-1)/(u+1))`
         * - ed448:
         *   - `(u, v) = ((y-1)/(y+1), sqrt(156324)*u/x)`
         *   - `(x, y) = (sqrt(156324)*u/v, (1+u)/(1-u))`
         */
        toMontgomery(publicKey) {
            const { y } = Point.fromBytes(publicKey);
            const size = lengths.publicKey;
            const is25519 = size === 32;
            if (!is25519 && size !== 57)
                throw new Error('only defined for 25519 and 448');
            const u = is25519 ? Fp.div(edwards_1n + y, edwards_1n - y) : Fp.div(y - edwards_1n, y + edwards_1n);
            return Fp.toBytes(u);
        },
        toMontgomerySecret(secretKey) {
            const size = lengths.secretKey;
            curves_utils_abytes(secretKey, size);
            const hashed = hash(secretKey.subarray(0, size));
            return adjustScalarBytes(hashed).subarray(0, size);
        },
    };
    Object.freeze(lengths);
    Object.freeze(utils);
    return Object.freeze({
        keygen: createKeygen(randomSecretKey, getPublicKey),
        getPublicKey,
        sign,
        verify,
        utils,
        Point,
        lengths,
    });
}
//# sourceMappingURL=edwards.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/abstract/hash-to-curve.js


// Octet Stream to Integer. "spec" implementation of os2ip is 2.5x slower vs bytesToNumberBE.
const os2ip = (/* unused pure expression or super */ null && (bytesToNumberBE));
// Integer to Octet Stream (numberToBytesBE).
function i2osp(value, length) {
    utils_asafenumber(value);
    utils_asafenumber(length);
    // This helper stays on the JS bitwise/u32 fast-path. Callers that need wider encodings should
    // use bigint + numberToBytesBE instead of routing large widths through this small helper.
    if (length < 0 || length > 4)
        throw new Error('invalid I2OSP length: ' + length);
    if (value < 0 || value > 2 ** (8 * length) - 1)
        throw new Error('invalid I2OSP input: ' + value);
    const res = Array.from({ length }).fill(0);
    for (let i = length - 1; i >= 0; i--) {
        res[i] = value & 0xff;
        value >>>= 8;
    }
    return new Uint8Array(res);
}
// RFC 9380 only applies strxor() to equal-length strings; callers must preserve that invariant.
function strxor(a, b) {
    const arr = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
        arr[i] = a[i] ^ b[i];
    }
    return arr;
}
// User can always use utf8 if they want, by passing Uint8Array.
// If string is passed, we treat it as ASCII: other formats are likely a mistake.
function normDST(DST) {
    if (!curves_utils_isBytes(DST) && typeof DST !== 'string')
        throw new Error('DST must be Uint8Array or ascii string');
    const dst = typeof DST === 'string' ? utils_asciiToBytes(DST) : DST;
    // RFC 9380 §3.1 requirement 2: tags "MUST have nonzero length".
    if (dst.length === 0)
        throw new Error('DST must be non-empty');
    return dst;
}
/**
 * Produces a uniformly random byte string using a cryptographic hash
 * function H that outputs b bits.
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-5.3.1 | RFC 9380 section 5.3.1}.
 * @param msg - Input message.
 * @param DST - Domain separation tag. This helper normalizes DST, rejects empty DSTs, and
 *   oversize-hashes DST when needed.
 * @param lenInBytes - Output length.
 * @param H - Hash function.
 * @returns Uniform byte string.
 * @throws If the message, DST, hash, or output length is invalid. {@link Error}
 * @example
 * Expand one message into uniform bytes with the XMD construction.
 *
 * ```ts
 * import { expand_message_xmd } from '@noble/curves/abstract/hash-to-curve.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const uniform = expand_message_xmd(new TextEncoder().encode('hello noble'), 'DST', 32, sha256);
 * ```
 */
function expand_message_xmd(msg, DST, lenInBytes, H) {
    curves_utils_abytes(msg);
    utils_asafenumber(lenInBytes);
    DST = normDST(DST);
    // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.3
    if (DST.length > 255)
        DST = H(curves_utils_concatBytes(utils_asciiToBytes('H2C-OVERSIZE-DST-'), DST));
    const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
    const ell = Math.ceil(lenInBytes / b_in_bytes);
    if (lenInBytes > 65535 || ell > 255)
        throw new Error('expand_message_xmd: invalid lenInBytes');
    const DST_prime = curves_utils_concatBytes(DST, i2osp(DST.length, 1));
    const Z_pad = new Uint8Array(r_in_bytes); // RFC 9380: Z_pad = I2OSP(0, s_in_bytes)
    const l_i_b_str = i2osp(lenInBytes, 2); // len_in_bytes_str
    const b = new Array(ell);
    const b_0 = H(curves_utils_concatBytes(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
    b[0] = H(curves_utils_concatBytes(b_0, i2osp(1, 1), DST_prime));
    // `b[0]` already stores RFC `b_1`, so only derive `b_2..b_ell` here. The old `<= ell`
    // loop computed one extra tail block, which was usually sliced away but broke at max `ell=255`
    // by reaching `I2OSP(256, 1)`.
    for (let i = 1; i < ell; i++) {
        const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
        b[i] = H(curves_utils_concatBytes(...args));
    }
    const pseudo_random_bytes = curves_utils_concatBytes(...b);
    return pseudo_random_bytes.slice(0, lenInBytes);
}
/**
 * Produces a uniformly random byte string using an extendable-output function (XOF) H.
 * 1. The collision resistance of H MUST be at least k bits.
 * 2. H MUST be an XOF that has been proved indifferentiable from
 *    a random oracle under a reasonable cryptographic assumption.
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-5.3.2 | RFC 9380 section 5.3.2}.
 * @param msg - Input message.
 * @param DST - Domain separation tag. This helper normalizes DST, rejects empty DSTs, and
 *   oversize-hashes DST when needed.
 * @param lenInBytes - Output length.
 * @param k - Target security level.
 * @param H - XOF hash function.
 * @returns Uniform byte string.
 * @throws If the message, DST, XOF, or output length is invalid. {@link Error}
 * @example
 * Expand one message into uniform bytes with the XOF construction.
 *
 * ```ts
 * import { expand_message_xof } from '@noble/curves/abstract/hash-to-curve.js';
 * import { shake256 } from '@noble/hashes/sha3.js';
 * const uniform = expand_message_xof(
 *   new TextEncoder().encode('hello noble'),
 *   'DST',
 *   32,
 *   128,
 *   shake256
 * );
 * ```
 */
function expand_message_xof(msg, DST, lenInBytes, k, H) {
    abytes(msg);
    asafenumber(lenInBytes);
    DST = normDST(DST);
    // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.3
    // RFC 9380 §5.3.3: DST = H("H2C-OVERSIZE-DST-" || a_very_long_DST, ceil(2 * k / 8)).
    if (DST.length > 255) {
        const dkLen = Math.ceil((2 * k) / 8);
        DST = H.create({ dkLen }).update(asciiToBytes('H2C-OVERSIZE-DST-')).update(DST).digest();
    }
    if (lenInBytes > 65535 || DST.length > 255)
        throw new Error('expand_message_xof: invalid lenInBytes');
    return (H.create({ dkLen: lenInBytes })
        .update(msg)
        .update(i2osp(lenInBytes, 2))
        // 2. DST_prime = DST || I2OSP(len(DST), 1)
        .update(DST)
        .update(i2osp(DST.length, 1))
        .digest());
}
/**
 * Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F.
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-5.2 | RFC 9380 section 5.2}.
 * @param msg - Input message bytes.
 * @param count - Number of field elements to derive. Must be `>= 1`.
 * @param options - RFC 9380 options. See {@link H2COpts}. `m` must be `>= 1`.
 * @returns `[u_0, ..., u_(count - 1)]`, a list of field elements.
 * @throws If the expander choice or RFC 9380 options are invalid. {@link Error}
 * @example
 * Hash one message into field elements before mapping it onto a curve.
 *
 * ```ts
 * import { hash_to_field } from '@noble/curves/abstract/hash-to-curve.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const scalars = hash_to_field(new TextEncoder().encode('hello noble'), 2, {
 *   DST: 'DST',
 *   p: 17n,
 *   m: 1,
 *   k: 128,
 *   expand: 'xmd',
 *   hash: sha256,
 * });
 * ```
 */
function hash_to_field(msg, count, options) {
    validateObject(options, {
        p: 'bigint',
        m: 'number',
        k: 'number',
        hash: 'function',
    });
    const { p, k, m, hash, expand, DST } = options;
    asafenumber(hash.outputLen, 'valid hash');
    abytes(msg);
    asafenumber(count);
    // RFC 9380 §5.2 defines hash_to_field over a list of one or more field elements and requires
    // extension degree `m >= 1`; rejecting here avoids degenerate `[]` / `[[]]` helper outputs.
    if (count < 1)
        throw new Error('hash_to_field: expected count >= 1');
    if (m < 1)
        throw new Error('hash_to_field: expected m >= 1');
    const log2p = p.toString(2).length;
    const L = Math.ceil((log2p + k) / 8); // section 5.1 of ietf draft link above
    const len_in_bytes = count * m * L;
    let prb; // pseudo_random_bytes
    if (expand === 'xmd') {
        prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
    }
    else if (expand === 'xof') {
        prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
    }
    else if (expand === '_internal_pass') {
        // for internal tests only
        prb = msg;
    }
    else {
        throw new Error('expand must be "xmd" or "xof"');
    }
    const u = new Array(count);
    for (let i = 0; i < count; i++) {
        const e = new Array(m);
        for (let j = 0; j < m; j++) {
            const elm_offset = L * (j + i * m);
            const tv = prb.subarray(elm_offset, elm_offset + L);
            e[j] = mod(os2ip(tv), p);
        }
        u[i] = e;
    }
    return u;
}
/**
 * @param field - Field implementation.
 * @param map - Isogeny coefficients.
 * @returns Isogeny mapping helper.
 * @example
 * Build one rational isogeny map, then apply it to affine x/y coordinates.
 *
 * ```ts
 * import { isogenyMap } from '@noble/curves/abstract/hash-to-curve.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const iso = isogenyMap(Fp, [[0n, 1n], [1n], [1n], [1n]]);
 * const point = iso(3n, 5n);
 * ```
 */
function isogenyMap(field, map) {
    // Make same order as in spec
    const coeff = map.map((i) => Array.from(i).reverse());
    return (x, y) => {
        const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
        // RFC 9380 §6.6.3 / Appendix E: denominator-zero exceptional cases must
        // return the identity on E.
        // Shipped Weierstrass consumers encode that affine identity as all-zero
        // coordinates, so `passZero=true` intentionally collapses zero
        // denominators to `{ x: 0, y: 0 }`.
        const [xd_inv, yd_inv] = FpInvertBatch(field, [xd, yd], true);
        x = field.mul(xn, xd_inv); // xNum / xDen
        y = field.mul(y, field.mul(yn, yd_inv)); // y * (yNum / yDev)
        return { x, y };
    };
}
// Keep the shared DST removable when the selected bundle never hashes to scalar.
// Callers that need protocol-specific scalar domain separation must override this generic default.
// RFC 9497 §§4.1-4.5 use this ASCII prefix before appending the ciphersuite context string.
// Export a string instead of mutable bytes so callers cannot poison default hash-to-scalar behavior
// by mutating a shared Uint8Array in place.
const _DST_scalar = 'HashToScalar-';
/**
 * Creates hash-to-curve methods from EC Point and mapToCurve function. See {@link H2CHasher}.
 * @param Point - Point constructor.
 * @param mapToCurve - Map-to-curve function.
 * @param defaults - Default hash-to-curve options. This object is frozen in place and reused as
 *   the shared defaults bundle for the returned helpers.
 * @returns Hash-to-curve helper namespace.
 * @throws If the map-to-curve callback or default hash-to-curve options are invalid. {@link Error}
 * @example
 * Bundle hash-to-curve, hash-to-scalar, and encode-to-curve helpers for one curve.
 *
 * ```ts
 * import { createHasher } from '@noble/curves/abstract/hash-to-curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hasher = createHasher(p256.Point, () => p256.Point.BASE.toAffine(), {
 *   DST: 'P256_XMD:SHA-256_SSWU_RO_',
 *   encodeDST: 'P256_XMD:SHA-256_SSWU_NU_',
 *   p: p256.Point.Fp.ORDER,
 *   m: 1,
 *   k: 128,
 *   expand: 'xmd',
 *   hash: sha256,
 * });
 * const point = hasher.encodeToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
function hash_to_curve_createHasher(Point, mapToCurve, defaults) {
    if (typeof mapToCurve !== 'function')
        throw new Error('mapToCurve() must be defined');
    // `Point` is intentionally not shape-validated eagerly here: point constructors vary across
    // curve families, so this helper only checks the hooks it can validate cheaply. Misconfigured
    // suites fail later when hashing first touches Point.fromAffine / Point.ZERO / clearCofactor().
    const snapshot = (src) => Object.freeze({
        ...src,
        DST: isBytes(src.DST) ? copyBytes(src.DST) : src.DST,
        ...(src.encodeDST === undefined
            ? {}
            : { encodeDST: isBytes(src.encodeDST) ? copyBytes(src.encodeDST) : src.encodeDST }),
    });
    // Keep one private defaults snapshot for actual hashing and expose fresh
    // detached snapshots via the public getter.
    // Otherwise a caller could mutate `hasher.defaults.DST` in place and poison
    // the singleton hasher for every other consumer in the same process.
    const safeDefaults = snapshot(defaults);
    function map(num) {
        return Point.fromAffine(mapToCurve(num));
    }
    function clear(initial) {
        const P = initial.clearCofactor();
        // Keep ZERO as the algebraic cofactor-clearing result here; strict public point-validity
        // surfaces may still reject it later, but createHasher.clear() itself is not that boundary.
        if (P.equals(Point.ZERO))
            return Point.ZERO;
        P.assertValidity();
        return P;
    }
    return Object.freeze({
        get defaults() {
            return snapshot(safeDefaults);
        },
        Point,
        hashToCurve(msg, options) {
            const opts = Object.assign({}, safeDefaults, options);
            const u = hash_to_field(msg, 2, opts);
            const u0 = map(u[0]);
            const u1 = map(u[1]);
            return clear(u0.add(u1));
        },
        encodeToCurve(msg, options) {
            const optsDst = safeDefaults.encodeDST ? { DST: safeDefaults.encodeDST } : {};
            const opts = Object.assign({}, safeDefaults, optsDst, options);
            const u = hash_to_field(msg, 1, opts);
            const u0 = map(u[0]);
            return clear(u0);
        },
        /** See {@link H2CHasher} */
        mapToCurve(scalars) {
            // Curves with m=1 accept only single scalar
            if (safeDefaults.m === 1) {
                if (typeof scalars !== 'bigint')
                    throw new Error('expected bigint (m=1)');
                return clear(map([scalars]));
            }
            if (!Array.isArray(scalars))
                throw new Error('expected array of bigints');
            for (const i of scalars)
                if (typeof i !== 'bigint')
                    throw new Error('expected array of bigints');
            return clear(map(scalars));
        },
        // hash_to_scalar can produce 0: https://www.rfc-editor.org/errata/eid8393
        // RFC 9380, draft-irtf-cfrg-bbs-signatures-08. Default scalar DST is the shared generic
        // `HashToScalar-` prefix above unless the caller overrides it per invocation.
        hashToScalar(msg, options) {
            // @ts-ignore
            const N = Point.Fn.ORDER;
            const opts = Object.assign({}, safeDefaults, { p: N, m: 1, DST: _DST_scalar }, options);
            return hash_to_field(msg, 1, opts)[0][0];
        },
    });
}
//# sourceMappingURL=hash-to-curve.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/ed25519.js
/**
 * ed25519 Twisted Edwards curve with following addons:
 * - X25519 ECDH
 * - Ristretto cofactor elimination
 * - Elligator hash-to-group / point indistinguishability
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */










// prettier-ignore
const ed25519_0n = /* @__PURE__ */ BigInt(0), ed25519_1n = /* @__PURE__ */ BigInt(1), ed25519_2n = /* @__PURE__ */ BigInt(2), ed25519_3n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(3)));
// prettier-ignore
const ed25519_5n = /* @__PURE__ */ BigInt(5), ed25519_8n = /* @__PURE__ */ BigInt(8);
// P = 2n**255n - 19n
const ed25519_CURVE_p = /* @__PURE__ */ BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed');
// N = 2n**252n + 27742317777372353535851937790883648493n
// a = Fp.create(BigInt(-1))
// d = -121665/121666 a.k.a. Fp.neg(121665 * Fp.inv(121666))
const ed25519_CURVE = /* @__PURE__ */ (() => ({
    p: ed25519_CURVE_p,
    n: BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed'),
    h: ed25519_8n,
    a: BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec'),
    d: BigInt('0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3'),
    Gx: BigInt('0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a'),
    Gy: BigInt('0x6666666666666666666666666666666666666666666666666666666666666658'),
}))();
function ed25519_pow_2_252_3(x) {
    // prettier-ignore
    const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
    const P = ed25519_CURVE_p;
    const x2 = (x * x) % P;
    const b2 = (x2 * x) % P; // x^3, 11
    const b4 = (modular_pow2(b2, ed25519_2n, P) * b2) % P; // x^15, 1111
    const b5 = (modular_pow2(b4, ed25519_1n, P) * x) % P; // x^31
    const b10 = (modular_pow2(b5, ed25519_5n, P) * b5) % P;
    const b20 = (modular_pow2(b10, _10n, P) * b10) % P;
    const b40 = (modular_pow2(b20, _20n, P) * b20) % P;
    const b80 = (modular_pow2(b40, _40n, P) * b40) % P;
    const b160 = (modular_pow2(b80, _80n, P) * b80) % P;
    const b240 = (modular_pow2(b160, _80n, P) * b80) % P;
    const b250 = (modular_pow2(b240, _10n, P) * b10) % P;
    const pow_p_5_8 = (modular_pow2(b250, ed25519_2n, P) * x) % P;
    // ^ This is x^((p-5)/8); multiply by x once more to get x^((p+3)/8).
    return { pow_p_5_8, b2 };
}
// Mutates and returns the provided 32-byte buffer in place.
function adjustScalarBytes(bytes) {
    // Section 5: For X25519, in order to decode 32 random bytes as an integer scalar,
    // set the three least significant bits of the first byte
    bytes[0] &= 248; // 0b1111_1000
    // and the most significant bit of the last to zero,
    bytes[31] &= 127; // 0b0111_1111
    // set the second most significant bit of the last byte to 1
    bytes[31] |= 64; // 0b0100_0000
    return bytes;
}
// √(-1) aka √(a) aka 2^((p-1)/4)
// Fp.sqrt(Fp.neg(1))
const ED25519_SQRT_M1 = /* @__PURE__ */ BigInt('19681161376707505956807079304988542015446066515923890162744021073123829784752');
// sqrt(u/v). Returns `{ isValid, value }`; on non-squares `value` is still a
// dummy root-shaped field element so callers can stay constant-time.
function uvRatio(u, v) {
    const P = ed25519_CURVE_p;
    const v3 = modular_mod(v * v * v, P); // v³
    const v7 = modular_mod(v3 * v3 * v, P); // v⁷
    // (p+3)/8 and (p-5)/8
    const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
    let x = modular_mod(u * v3 * pow, P); // (uv³)(uv⁷)^(p-5)/8
    const vx2 = modular_mod(v * x * x, P); // vx²
    const root1 = x; // First root candidate
    const root2 = modular_mod(x * ED25519_SQRT_M1, P); // Second root candidate
    const useRoot1 = vx2 === u; // If vx² = u (mod p), x is a square root
    const useRoot2 = vx2 === modular_mod(-u, P); // If vx² = -u, set x <-- x * 2^((p-1)/4)
    const noRoot = vx2 === modular_mod(-u * ED25519_SQRT_M1, P); // There is no valid root, vx² = -u√(-1)
    if (useRoot1)
        x = root1;
    if (useRoot2 || noRoot)
        x = root2; // We return root2 anyway, for const-time
    if (isNegativeLE(x, P))
        x = modular_mod(-x, P);
    return { isValid: useRoot1 || useRoot2, value: x };
}
const ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
// Public field alias stays stricter than the RFC 8032 Appendix A sample code:
// `Fp.inv(0)` throws instead of returning `0`.
const Fp = /* @__PURE__ */ (() => ed25519_Point.Fp)();
const Fn = /* @__PURE__ */ (() => ed25519_Point.Fn)();
// RFC 8032 `dom2` helper for ctx/ph variants only. Plain Ed25519 keeps the
// empty-domain path in `ed()` and would be wrong if routed through this helper.
function ed25519_domain(data, ctx, phflag) {
    if (ctx.length > 255)
        throw new Error('Context is too big');
    return utils_concatBytes(utils_asciiToBytes('SigEd25519 no Ed25519 collisions'), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
}
function ed(opts) {
    // Ed25519 keeps ZIP-215 default verification semantics for consensus compatibility.
    return eddsa(ed25519_Point, sha2_sha512, Object.assign({ adjustScalarBytes, zip215: true }, opts));
}
/**
 * ed25519 curve with EdDSA signatures.
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Generate one Ed25519 keypair, sign a message, and verify it.
 *
 * ```js
 * import { ed25519 } from '@noble/curves/ed25519.js';
 * const { secretKey, publicKey } = ed25519.keygen();
 * // const publicKey = ed25519.getPublicKey(secretKey);
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519.sign(msg, secretKey);
 * const isValid = ed25519.verify(sig, msg, publicKey); // ZIP215
 * // RFC8032 / FIPS 186-5
 * const isValid2 = ed25519.verify(sig, msg, publicKey, { zip215: false });
 * ```
 */
const ed25519 = /* @__PURE__ */ ed({});
/**
 * Context version of ed25519 (ctx for domain separation). See {@link ed25519}
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Sign and verify with Ed25519ctx under one explicit context.
 *
 * ```ts
 * const context = new TextEncoder().encode('docs');
 * const { secretKey, publicKey } = ed25519ctx.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519ctx.sign(msg, secretKey, { context });
 * const isValid = ed25519ctx.verify(sig, msg, publicKey, { context });
 * ```
 */
const ed25519ctx = /* @__PURE__ */ ed({ domain: ed25519_domain });
/**
 * Prehashed version of ed25519. See {@link ed25519}
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Use the prehashed Ed25519 variant for one message.
 *
 * ```ts
 * const { secretKey, publicKey } = ed25519ph.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519ph.sign(msg, secretKey);
 * const isValid = ed25519ph.verify(sig, msg, publicKey);
 * ```
 */
const ed25519ph = /* @__PURE__ */ ed({ domain: ed25519_domain, prehash: sha2_sha512 });
/**
 * FROST threshold signatures over ed25519. RFC 9591.
 * @example
 * Create one trusted-dealer package for 2-of-3 ed25519 signing.
 *
 * ```ts
 * const alice = ed25519_FROST.Identifier.derive('alice@example.com');
 * const bob = ed25519_FROST.Identifier.derive('bob@example.com');
 * const carol = ed25519_FROST.Identifier.derive('carol@example.com');
 * const deal = ed25519_FROST.trustedDealer({ min: 2, max: 3 }, [alice, bob, carol]);
 * ```
 */
const ed25519_FROST = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createFROST({
    name: 'FROST-ED25519-SHA512-v1',
    Point: ed25519_Point,
    validatePoint: (p) => {
        p.assertValidity();
        if (!p.isTorsionFree())
            throw new Error('bad point: not torsion-free');
    },
    hash: sha512,
    // RFC 9591 keeps H2 undecorated here for RFC 8032 compatibility. In createFROST(),
    // `H2: ''` becomes an empty DST prefix; the built-in hashToScalar fallback treats
    // that the same as omitted DST, even though custom hooks can still observe the empty bag.
    H2: '',
}))()));
/**
 * ECDH using curve25519 aka x25519.
 * `getSharedSecret()` rejects low-order peer inputs by default, and seeded
 * `keygen(seed)` reuses the provided 32-byte seed buffer instead of copying it.
 * @example
 * Derive one shared secret between two X25519 peers.
 *
 * ```js
 * import { x25519 } from '@noble/curves/ed25519.js';
 * const alice = x25519.keygen();
 * const bob = x25519.keygen();
 * const shared = x25519.getSharedSecret(alice.secretKey, bob.publicKey);
 * ```
 */
const x25519 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => {
    const P = ed25519_CURVE_p;
    return montgomery({
        P,
        type: 'x25519',
        powPminus2: (x) => {
            // x^(p-2) aka x^(2^255-21)
            const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
            return mod(pow2(pow_p_5_8, ed25519_3n, P) * b2, P);
        },
        adjustScalarBytes,
    });
})()));
// Hash To Curve Elligator2 Map (NOTE: different from ristretto255 elligator)
// RFC 9380 Appendix G.2.2 / Err4730 requires `sgn0(c1) = 0` for the Edwards
// map constant below, so use the even root explicitly.
// 1. c1 = (q + 3) / 8 # Integer arithmetic
const ELL2_C1 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => (ed25519_CURVE_p + ed25519_3n) / ed25519_8n)()));
const ELL2_C2 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => Fp.pow(ed25519_2n, ELL2_C1))())); // 2. c2 = 2^c1
const ELL2_C3 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => Fp.sqrt(Fp.neg(Fp.ONE)))())); // 3. c3 = sqrt(-1)
/**
 * RFC 9380 method `map_to_curve_elligator2_curve25519`. Experimental name: may be renamed later.
 * @private
 */
// prettier-ignore
function _map_to_curve_elligator2_curve25519(u) {
    const ELL2_C4 = (ed25519_CURVE_p - ed25519_5n) / ed25519_8n; // 4. c4 = (q - 5) / 8       # Integer arithmetic
    const ELL2_J = BigInt(486662);
    let tv1 = Fp.sqr(u); //  1.  tv1 = u^2
    tv1 = Fp.mul(tv1, ed25519_2n); //  2.  tv1 = 2 * tv1
    // 3. xd = tv1 + 1 # Nonzero: -1 is square (mod p), tv1 is not
    let xd = Fp.add(tv1, Fp.ONE);
    let x1n = Fp.neg(ELL2_J); //  4.  x1n = -J              # x1 = x1n / xd = -J / (1 + 2 * u^2)
    let tv2 = Fp.sqr(xd); //  5.  tv2 = xd^2
    let gxd = Fp.mul(tv2, xd); //  6.  gxd = tv2 * xd        # gxd = xd^3
    let gx1 = Fp.mul(tv1, ELL2_J); //  7.  gx1 = J * tv1         # x1n + J * xd
    gx1 = Fp.mul(gx1, x1n); //  8.  gx1 = gx1 * x1n       # x1n^2 + J * x1n * xd
    gx1 = Fp.add(gx1, tv2); //  9.  gx1 = gx1 + tv2       # x1n^2 + J * x1n * xd + xd^2
    gx1 = Fp.mul(gx1, x1n); //  10. gx1 = gx1 * x1n       # x1n^3 + J * x1n^2 * xd + x1n * xd^2
    let tv3 = Fp.sqr(gxd); //  11. tv3 = gxd^2
    tv2 = Fp.sqr(tv3); //  12. tv2 = tv3^2           # gxd^4
    tv3 = Fp.mul(tv3, gxd); //  13. tv3 = tv3 * gxd       # gxd^3
    tv3 = Fp.mul(tv3, gx1); //  14. tv3 = tv3 * gx1       # gx1 * gxd^3
    tv2 = Fp.mul(tv2, tv3); //  15. tv2 = tv2 * tv3       # gx1 * gxd^7
    let y11 = Fp.pow(tv2, ELL2_C4); //  16. y11 = tv2^c4        # (gx1 * gxd^7)^((p - 5) / 8)
    y11 = Fp.mul(y11, tv3); //  17. y11 = y11 * tv3       # gx1*gxd^3*(gx1*gxd^7)^((p-5)/8)
    let y12 = Fp.mul(y11, ELL2_C3); //  18. y12 = y11 * c3
    tv2 = Fp.sqr(y11); //  19. tv2 = y11^2
    tv2 = Fp.mul(tv2, gxd); //  20. tv2 = tv2 * gxd
    let e1 = Fp.eql(tv2, gx1); //  21.  e1 = tv2 == gx1
    // 22. y1 = CMOV(y12, y11, e1) # If g(x1) is square, this is its sqrt
    let y1 = Fp.cmov(y12, y11, e1);
    let x2n = Fp.mul(x1n, tv1); //  23. x2n = x1n * tv1       # x2 = x2n / xd = 2 * u^2 * x1n / xd
    let y21 = Fp.mul(y11, u); //  24. y21 = y11 * u
    y21 = Fp.mul(y21, ELL2_C2); //  25. y21 = y21 * c2
    let y22 = Fp.mul(y21, ELL2_C3); //  26. y22 = y21 * c3
    let gx2 = Fp.mul(gx1, tv1); //  27. gx2 = gx1 * tv1       # g(x2) = gx2 / gxd = 2 * u^2 * g(x1)
    tv2 = Fp.sqr(y21); //  28. tv2 = y21^2
    tv2 = Fp.mul(tv2, gxd); //  29. tv2 = tv2 * gxd
    let e2 = Fp.eql(tv2, gx2); //  30.  e2 = tv2 == gx2
    // 31. y2 = CMOV(y22, y21, e2) # If g(x2) is square, this is its sqrt
    let y2 = Fp.cmov(y22, y21, e2);
    tv2 = Fp.sqr(y1); //  32. tv2 = y1^2
    tv2 = Fp.mul(tv2, gxd); //  33. tv2 = tv2 * gxd
    let e3 = Fp.eql(tv2, gx1); //  34.  e3 = tv2 == gx1
    let xn = Fp.cmov(x2n, x1n, e3); //  35.  xn = CMOV(x2n, x1n, e3)  # If e3, x = x1, else x = x2
    let y = Fp.cmov(y2, y1, e3); //  36.   y = CMOV(y2, y1, e3)    # If e3, y = y1, else y = y2
    let e4 = Fp.isOdd(y); //  37.  e4 = sgn0(y) == 1        # Fix sign of y
    y = Fp.cmov(y, Fp.neg(y), e3 !== e4); //  38.   y = CMOV(y, -y, e3 XOR e4)
    return { xMn: xn, xMd: xd, yMn: y, yMd: ed25519_1n }; //  39. return (xn, xd, y, 1)
}
// sgn0(c1) MUST equal 0
const ELL2_C1_EDWARDS = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => FpSqrtEven(Fp, Fp.neg(BigInt(486664))))()));
function map_to_curve_elligator2_edwards25519(u) {
    // 1. (xMn, xMd, yMn, yMd) = map_to_curve_elligator2_curve25519(u)
    const { xMn, xMd, yMn, yMd } = _map_to_curve_elligator2_curve25519(u);
    // map_to_curve_elligator2_curve25519(u)
    let xn = Fp.mul(xMn, yMd); //  2.  xn = xMn * yMd
    xn = Fp.mul(xn, ELL2_C1_EDWARDS); //  3.  xn = xn * c1
    let xd = Fp.mul(xMd, yMn); //  4.  xd = xMd * yMn    # xn / xd = c1 * xM / yM
    let yn = Fp.sub(xMn, xMd); //  5.  yn = xMn - xMd
    // 6. yd = xMn + xMd # (n / d - 1) / (n / d + 1) = (n - d) / (n + d)
    let yd = Fp.add(xMn, xMd);
    let tv1 = Fp.mul(xd, yd); //  7. tv1 = xd * yd
    let e = Fp.eql(tv1, Fp.ZERO); //  8.   e = tv1 == 0
    xn = Fp.cmov(xn, Fp.ZERO, e); //  9.  xn = CMOV(xn, 0, e)
    xd = Fp.cmov(xd, Fp.ONE, e); //  10. xd = CMOV(xd, 1, e)
    yn = Fp.cmov(yn, Fp.ONE, e); //  11. yn = CMOV(yn, 1, e)
    yd = Fp.cmov(yd, Fp.ONE, e); //  12. yd = CMOV(yd, 1, e)
    const [xd_inv, yd_inv] = FpInvertBatch(Fp, [xd, yd], true); // batch division
    // Noble normalizes the RFC rational representation to affine `{ x, y }`
    // before returning from the internal helper.
    return { x: Fp.mul(xn, xd_inv), y: Fp.mul(yn, yd_inv) }; //  13. return (xn, xd, yn, yd)
}
/**
 * Hashing to ed25519 points / field. RFC 9380 methods.
 * Public `mapToCurve()` returns the cofactor-cleared subgroup point; the
 * internal map callback below consumes one field element bigint, not `[bigint]`.
 * @example
 * Hash one message onto the ed25519 curve.
 *
 * ```ts
 * const point = ed25519_hasher.hashToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
const ed25519_hasher = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createHasher(ed25519_Point, (scalars) => map_to_curve_elligator2_edwards25519(scalars[0]), {
    DST: 'edwards25519_XMD:SHA-512_ELL2_RO_',
    encodeDST: 'edwards25519_XMD:SHA-512_ELL2_NU_',
    p: ed25519_CURVE_p,
    m: 1,
    k: 128,
    expand: 'xmd',
    hash: sha512,
}))()));
// √(-1) aka √(a) aka 2^((p-1)/4)
const SQRT_M1 = ED25519_SQRT_M1;
// √(ad - 1)
const SQRT_AD_MINUS_ONE = /* @__PURE__ */ BigInt('25063068953384623474111414158702152701244531502492656460079210482610430750235');
// 1 / √(a-d)
const INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt('54469307008909316920995813868745141605393597292927456921205312896311721017578');
// 1-d²
const ONE_MINUS_D_SQ = /* @__PURE__ */ BigInt('1159843021668779879193775521855586647937357759715417654439879720876111806838');
// (d-1)²
const D_MINUS_ONE_SQ = /* @__PURE__ */ BigInt('40440834346308536858101042469323190826248399146238708352240133220865137265952');
// `SQRT_RATIO_M1(1, number)` specialization. Returns `{ isValid, value }`,
// where non-squares get the nonnegative `sqrt(SQRT_M1 / number)` branch.
const invertSqrt = (number) => uvRatio(ed25519_1n, number);
const MAX_255B = /* @__PURE__ */ BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
// RFC 9496 §4.3.4 MAP parser: masks bit 255 and reduces modulo p for element
// derivation. The decode path has the opposite contract and rejects that bit.
const bytes255ToNumberLE = (bytes) => Fp.create(utils_bytesToNumberLE(bytes) & MAX_255B);
/**
 * Computes Elligator map for Ristretto255.
 * Primary formula source is RFC 9496 §4.3.4 MAP; RFC 9380 Appendix B builds
 * `hash_to_ristretto255` on top of this helper.
 * Returns an internal Edwards representative, not a public `_RistrettoPoint`.
 */
function calcElligatorRistrettoMap(r0) {
    const { d } = ed25519_CURVE;
    const P = ed25519_CURVE_p;
    const mod = (n) => Fp.create(n);
    const r = mod(SQRT_M1 * r0 * r0); // 1
    const Ns = mod((r + ed25519_1n) * ONE_MINUS_D_SQ); // 2
    let c = BigInt(-1); // 3
    const D = mod((c - d * r) * mod(r + d)); // 4
    let { isValid: Ns_D_is_sq, value: s } = uvRatio(Ns, D); // 5
    let s_ = mod(s * r0); // 6
    if (!isNegativeLE(s_, P))
        s_ = mod(-s_);
    if (!Ns_D_is_sq)
        s = s_; // 7
    if (!Ns_D_is_sq)
        c = r; // 8
    const Nt = mod(c * (r - ed25519_1n) * D_MINUS_ONE_SQ - D); // 9
    const s2 = s * s;
    const W0 = mod((s + s) * D); // 10
    const W1 = mod(Nt * SQRT_AD_MINUS_ONE); // 11
    const W2 = mod(ed25519_1n - s2); // 12
    const W3 = mod(ed25519_1n + s2); // 13
    return new ed25519_Point(mod(W0 * W3), mod(W2 * W1), mod(W1 * W3), mod(W0 * W2));
}
/**
 * Wrapper over Edwards Point for ristretto255.
 *
 * Each ed25519/EdwardsPoint has 8 different equivalent points. This can be
 * a source of bugs for protocols like ring signatures. Ristretto was created to solve this.
 * Ristretto point operates in X:Y:Z:T extended coordinates like EdwardsPoint,
 * but it should work in its own namespace: do not combine those two.
 * See [RFC9496](https://www.rfc-editor.org/rfc/rfc9496).
 */
class _RistrettoPoint extends PrimeEdwardsPoint {
    // Do NOT change syntax: the following gymnastics is done,
    // because typescript strips comments, which makes bundlers disable tree-shaking.
    // prettier-ignore
    static BASE = 
    /* @__PURE__ */ (() => new _RistrettoPoint(ed25519_Point.BASE))();
    // prettier-ignore
    static ZERO = 
    /* @__PURE__ */ (() => new _RistrettoPoint(ed25519_Point.ZERO))();
    // prettier-ignore
    static Fp = 
    /* @__PURE__ */ (() => Fp)();
    // prettier-ignore
    static Fn = 
    /* @__PURE__ */ (() => Fn)();
    constructor(ep) {
        super(ep);
    }
    /**
     * Create one Ristretto255 point from affine Edwards coordinates.
     * This wraps the internal Edwards representative directly and is not a
     * canonical ristretto255 decoding path.
     * Use `toBytes()` / `fromBytes()` if canonical ristretto255 bytes matter.
     */
    static fromAffine(ap) {
        return new _RistrettoPoint(ed25519_Point.fromAffine(ap));
    }
    assertSame(other) {
        if (!(other instanceof _RistrettoPoint))
            throw new Error('RistrettoPoint expected');
    }
    init(ep) {
        return new _RistrettoPoint(ep);
    }
    static fromBytes(bytes) {
        utils_abytes(bytes, 32);
        const { a, d } = ed25519_CURVE;
        const P = ed25519_CURVE_p;
        const mod = (n) => Fp.create(n);
        const s = bytes255ToNumberLE(bytes);
        // 1. Check that s_bytes is the canonical encoding of a field element, or else abort.
        // 3. Check that s is non-negative, or else abort
        if (!equalBytes(Fp.toBytes(s), bytes) || isNegativeLE(s, P))
            throw new Error('invalid ristretto255 encoding 1');
        const s2 = mod(s * s);
        const u1 = mod(ed25519_1n + a * s2); // 4 (a is -1)
        const u2 = mod(ed25519_1n - a * s2); // 5
        const u1_2 = mod(u1 * u1);
        const u2_2 = mod(u2 * u2);
        const v = mod(a * d * u1_2 - u2_2); // 6
        const { isValid, value: I } = invertSqrt(mod(v * u2_2)); // 7
        const Dx = mod(I * u2); // 8
        const Dy = mod(I * Dx * v); // 9
        let x = mod((s + s) * Dx); // 10
        if (isNegativeLE(x, P))
            x = mod(-x); // 10
        const y = mod(u1 * Dy); // 11
        const t = mod(x * y); // 12
        if (!isValid || isNegativeLE(t, P) || y === ed25519_0n)
            throw new Error('invalid ristretto255 encoding 2');
        return new _RistrettoPoint(new ed25519_Point(x, y, ed25519_1n, t));
    }
    /**
     * Converts ristretto-encoded string to ristretto point.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
     * @param hex - Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
     */
    static fromHex(hex) {
        return _RistrettoPoint.fromBytes(utils_hexToBytes(hex));
    }
    /**
     * Encodes ristretto point to Uint8Array.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
     */
    toBytes() {
        let { X, Y, Z, T } = this.ep;
        const P = ed25519_CURVE_p;
        const mod = (n) => Fp.create(n);
        const u1 = mod(mod(Z + Y) * mod(Z - Y)); // 1
        const u2 = mod(X * Y); // 2
        // Square root always exists
        const u2sq = mod(u2 * u2);
        const { value: invsqrt } = invertSqrt(mod(u1 * u2sq)); // 3
        const D1 = mod(invsqrt * u1); // 4
        const D2 = mod(invsqrt * u2); // 5
        const zInv = mod(D1 * D2 * T); // 6
        let D; // 7
        if (isNegativeLE(T * zInv, P)) {
            let _x = mod(Y * SQRT_M1);
            let _y = mod(X * SQRT_M1);
            X = _x;
            Y = _y;
            D = mod(D1 * INVSQRT_A_MINUS_D);
        }
        else {
            D = D2; // 8
        }
        if (isNegativeLE(X * zInv, P))
            Y = mod(-Y); // 9
        let s = mod((Z - Y) * D); // 10 (check footer's note, no sqrt(-a))
        if (isNegativeLE(s, P))
            s = mod(-s);
        return Fp.toBytes(s); // 11
    }
    /**
     * Compares two Ristretto points.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
     */
    equals(other) {
        this.assertSame(other);
        const { X: X1, Y: Y1 } = this.ep;
        const { X: X2, Y: Y2 } = other.ep;
        const mod = (n) => Fp.create(n);
        // (x1 * y2 == y1 * x2) | (y1 * y2 == x1 * x2)
        const one = mod(X1 * Y2) === mod(Y1 * X2);
        const two = mod(Y1 * Y2) === mod(X1 * X2);
        return one || two;
    }
    is0() {
        return this.equals(_RistrettoPoint.ZERO);
    }
}
Object.freeze(_RistrettoPoint.BASE);
Object.freeze(_RistrettoPoint.ZERO);
Object.freeze(_RistrettoPoint.prototype);
Object.freeze(_RistrettoPoint);
/** Prime-order Ristretto255 group bundle. */
const ristretto255 = /* @__PURE__ */ Object.freeze({ Point: _RistrettoPoint });
/**
 * Hashing to ristretto255 points / field. RFC 9380 methods.
 * `hashToCurve()` is RFC 9380 Appendix B, `deriveToCurve()` is the RFC 9496
 * §4.3.4 element-derivation building block, and `hashToScalar()` is a
 * library-specific helper for OPRF-style use.
 * @example
 * Hash one message onto ristretto255.
 *
 * ```ts
 * const point = ristretto255_hasher.hashToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
const ristretto255_hasher = Object.freeze({
    Point: _RistrettoPoint,
    /**
    * Spec: https://www.rfc-editor.org/rfc/rfc9380.html#name-hashing-to-ristretto255. Caveats:
    * * There are no test vectors
    * * encodeToCurve / mapToCurve is undefined
    * * mapToCurve would be `calcElligatorRistrettoMap(scalars[0])`, not ristretto255_map!
    * * hashToScalar is undefined too, so we just use OPRF implementation
    * * We cannot re-use 'createHasher', because ristretto255_map is different algorithm/RFC
      (os2ip -> bytes255ToNumberLE)
    * * mapToCurve == calcElligatorRistrettoMap, hashToCurve == ristretto255_map
    * * hashToScalar is undefined in RFC9380 for ristretto, so we use the OPRF
      version here. Using `bytes255ToNumblerLE` will create a different result
      if we use `bytes255ToNumberLE` as os2ip
    * * current version is closest to spec.
    */
    hashToCurve(msg, options) {
        // == 'hash_to_ristretto255'
        // Preserve explicit empty/invalid DST overrides so expand_message_xmd() can reject them.
        const DST = options?.DST === undefined ? 'ristretto255_XMD:SHA-512_R255MAP_RO_' : options.DST;
        const xmd = expand_message_xmd(msg, DST, 64, sha2_sha512);
        // NOTE: RFC 9380 incorrectly calls this function `ristretto255_map`.
        // In RFC 9496, `map` was the per-point function inside the construction.
        // That also led to confusion that `ristretto255_map` is `mapToCurve`.
        // It is not: it is the older hash-to-curve construction.
        return ristretto255_hasher.deriveToCurve(xmd);
    },
    hashToScalar(msg, options = { DST: _DST_scalar }) {
        const xmd = expand_message_xmd(msg, options.DST, 64, sha2_sha512);
        return Fn.create(utils_bytesToNumberLE(xmd));
    },
    /**
     * HashToCurve-like construction based on RFC 9496 (Element Derivation).
     * Converts 64 uniform random bytes into a curve point.
     *
     * WARNING: This represents an older hash-to-curve construction from before
     * RFC 9380 was finalized.
     * It was later reused as a component in the newer
     * `hash_to_ristretto255` function defined in RFC 9380.
     */
    deriveToCurve(bytes) {
        // https://www.rfc-editor.org/rfc/rfc9496.html#name-element-derivation
        utils_abytes(bytes, 64);
        const r1 = bytes255ToNumberLE(bytes.subarray(0, 32));
        const R1 = calcElligatorRistrettoMap(r1);
        const r2 = bytes255ToNumberLE(bytes.subarray(32, 64));
        const R2 = calcElligatorRistrettoMap(r2);
        return new _RistrettoPoint(R1.add(R2));
    },
});
/**
 * ristretto255 OPRF/VOPRF/POPRF bundle, defined in RFC 9497.
 * @example
 * Run one blind/evaluate/finalize OPRF round over ristretto255.
 *
 * ```ts
 * const input = new TextEncoder().encode('hello noble');
 * const keys = ristretto255_oprf.oprf.generateKeyPair();
 * const blind = ristretto255_oprf.oprf.blind(input);
 * const evaluated = ristretto255_oprf.oprf.blindEvaluate(keys.secretKey, blind.blinded);
 * const output = ristretto255_oprf.oprf.finalize(input, blind.blind, evaluated);
 * ```
 */
const ristretto255_oprf = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createOPRF({
    name: 'ristretto255-SHA512',
    Point: _RistrettoPoint,
    hash: sha512,
    hashToGroup: ristretto255_hasher.hashToCurve,
    hashToScalar: ristretto255_hasher.hashToScalar,
}))()));
/**
 * FROST threshold signatures over ristretto255. RFC 9591.
 * @example
 * Create one trusted-dealer package for 2-of-3 ristretto255 signing.
 *
 * ```ts
 * const alice = ristretto255_FROST.Identifier.derive('alice@example.com');
 * const bob = ristretto255_FROST.Identifier.derive('bob@example.com');
 * const carol = ristretto255_FROST.Identifier.derive('carol@example.com');
 * const deal = ristretto255_FROST.trustedDealer({ min: 2, max: 3 }, [alice, bob, carol]);
 * ```
 */
const ristretto255_FROST = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createFROST({
    name: 'FROST-RISTRETTO255-SHA512-v1',
    Point: _RistrettoPoint,
    validatePoint: (p) => {
        // Prime-order wrappers are torsion-free at the abstract-group level.
        p.assertValidity();
    },
    hash: sha512,
}))()));
/**
 * Weird / bogus points, useful for debugging.
 * All 8 ed25519 points of 8-torsion subgroup can be generated from the point
 * T = `26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05`.
 * The subgroup generated by `T` is `{ O, T, 2T, 3T, 4T, 5T, 6T, 7T }`; the
 * array below is that set, not the powers in that exact index order.
 * @example
 * Decode one known torsion point for debugging.
 *
 * ```ts
 * import { ED25519_TORSION_SUBGROUP, ed25519 } from '@noble/curves/ed25519.js';
 * const point = ed25519.Point.fromHex(ED25519_TORSION_SUBGROUP[1]);
 * ```
 */
const ED25519_TORSION_SUBGROUP = /* @__PURE__ */ (/* unused pure expression or super */ null && (Object.freeze([
    '0100000000000000000000000000000000000000000000000000000000000000',
    'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
    '0000000000000000000000000000000000000000000000000000000000000080',
    '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
    'ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f',
    '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85',
    '0000000000000000000000000000000000000000000000000000000000000000',
    'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa',
])));
//# sourceMappingURL=ed25519.js.map
;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/canon.mjs
/**
 * RFC 8785 (JCS) canonicalisation. In ECMAScript this is exact: Number→string is ES Number::toString and
 * key order is UTF-16 code-unit order (Array.prototype.sort default). Other implementations (Python) MUST
 * reproduce both, or restrict themselves to the "signed JSON" subset below.
 *
 * SIGNED JSON SUBSET (spec §4.3): content that is hashed under a FractalAI domain (seal bodies, ACP
 * decisions) may contain only strings, booleans, null, arrays, objects and SAFE INTEGERS. Fractions,
 * exponents beyond 2^53 and lone surrogates are where language runtimes disagree, so they are refused
 * instead of canonicalised (`jcsSigned`). `jcs` (unrestricted) is kept for third-party profiles.
 */


const MAX_DEPTH = 32;
const MAX_NODES = 100_000;

function walk(v, depth, counter, signed) {
  if (++counter.n > MAX_NODES) fail(C.JSON_TOO_LARGE, `jcs: more than ${MAX_NODES} nodes`);
  if (depth > MAX_DEPTH) fail(C.JSON_TOO_DEEP, `jcs: nesting depth exceeds ${MAX_DEPTH}`);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) fail(C.INPUT_SHAPE, 'jcs: non-finite number');
    if (signed && !Number.isSafeInteger(v)) fail(C.SIGNED_JSON_NUMBER, `signed JSON may only contain safe integers (got ${v})`);
    return JSON.stringify(Object.is(v, -0) ? 0 : v);
  }
  if (v === null || typeof v === 'boolean') return JSON.stringify(v);
  if (typeof v === 'string') {
    for (let k = 0; k < v.length; k++) {
      const c = v.charCodeAt(k);
      if (c >= 0xd800 && c <= 0xdbff) { const d = v.charCodeAt(k + 1); if (!(d >= 0xdc00 && d <= 0xdfff)) fail(C.JSON_LONE_SURROGATE, 'jcs: lone surrogate'); k++; }
      else if (c >= 0xdc00 && c <= 0xdfff) fail(C.JSON_LONE_SURROGATE, 'jcs: lone surrogate');
    }
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return '[' + v.map((x) => walk(x, depth + 1, counter, signed)).join(',') + ']';
  if (typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => walk(k, depth + 1, counter, signed) + ':' + walk(v[k], depth + 1, counter, signed)).join(',') + '}';
  }
  return fail(C.INPUT_SHAPE, `jcs: unsupported ${typeof v}`);
}

const jcs = (v) => walk(v, 0, { n: 0 }, false);
const jcsSigned = (v) => walk(v, 0, { n: 0 }, true);
const utf8 = (s) => new TextEncoder().encode(s);

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/crypto.mjs
/**
 * The only cryptographic primitives the kernel uses, all from the @noble family (audited, pure JS):
 *   ML-DSA-65 (FIPS 204) verify — receipts and the key directory,
 *   SHA-256 — content ids, receipt ids, kids, directory roots,
 *   Keccak-256 — EVM runtime code hash,
 *   Ed25519 verify — Solana transaction signer (checked locally, never trusted from the RPC).
 * NOT a CMVP/FIPS 140-3 validated module (spec §2, limits).
 */







const ML_DSA_65_PK_BYTES = 1952;
const ML_DSA_65_SIG_BYTES = 3309;

const toBytes = (d) => (typeof d === 'string' ? utf8(d) : d);
const crypto_sha256 = (d) => sha256(toBytes(d));
const sha256hex = (d) => bytesToHex(crypto_sha256(d));
const keccak256hex = (bytes) => '0x' + bytesToHex(keccak_256(bytes));

/** kid = sha256(canonical base64 text of the public key)[:16 hex] — binds a label to exactly one key. */
const kidForKey = (publicKeyB64) => sha256hex(publicKeyB64).slice(0, 16);

/** ML-DSA-65 verify, pure FIPS 204 (empty context). Never throws: malformed inputs → false. */
function mldsaVerify(sigBytes, message, pkBytes) {
  try {
    if (sigBytes.length !== ML_DSA_65_SIG_BYTES || pkBytes.length !== ML_DSA_65_PK_BYTES) return false;
    return ml_dsa65.verify(sigBytes, toBytes(message), pkBytes) === true;
  } catch {
    return false;
  }
}

/** Ed25519 verify (RFC 8032, strict: noble rejects non-canonical S / small-order keys by default in zip215:false). */
function ed25519Verify(sig64, message, pub32) {
  try {
    return ed25519.verify(sig64, message, pub32, { zip215: false }) === true;
  } catch {
    return false;
  }
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/domains.mjs
/**
 * Normative domain table (spec/TRUST-KERNEL.md §5). The signed message of every receipt kind is
 * RECONSTRUCTED by the kernel from the kind's fixed domain and the signed content — a `domain`,
 * `served_domain` or `signed_message` field carried by the receipt is never used to build the message,
 * only compared byte-for-byte with the reconstruction. A key authorizes a kind only if its directory
 * `use` is listed for that kind.
 */
const SERVED_PREFIX = 'FRACTALAI-x402-served-v1';
const KEY_DIR_DOMAIN = 'FRACTALAI-key-directory-v1';
const SELF_ATTEST_DOMAIN = 'FRACTALAI-x402-self-attest-v1';
const MIDAS_CANON_HEADER = 'FRACTALAI-midas-alert-v1';
const SEAL_SCHEMA = 'fractalai.x402-settlement-seal/0.1';

const domains_USE = Object.freeze({ RECEIPT: 'x402-receipt', GOVERNANCE: 'key-directory-governance' });

/** route ids with a dedicated kind — they can never be presented as a generic served proof. */
const RESERVED_ROUTES = Object.freeze({
  'midas-alert': 'midas-alert',
  'x402-witness': 'x402-seal',
  'x402-attest-decision': 'acp-verdict',
});
const ROUTE_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

const KINDS = Object.freeze({
  'midas-alert': {
    domain: `${SERVED_PREFIX}\nmidas-alert`,
    message: (id) => `${SERVED_PREFIX}\nmidas-alert\n${id}`,
    uses: [domains_USE.RECEIPT], trust: 'directory', signed_time: 'canonical.emitted_at', anchorable: true,
  },
  'x402-seal': {
    domain: `${SERVED_PREFIX}\nx402-witness`,
    message: (cid) => `${SERVED_PREFIX}\nx402-witness\n${cid}`,
    uses: [domains_USE.RECEIPT], trust: 'directory', signed_time: 'body.sealed_at', anchorable: true,
  },
  'acp-verdict': {
    domain: `${SERVED_PREFIX}\nx402-attest-decision`,
    message: (d) => `${SERVED_PREFIX}\nx402-attest-decision\n${d}`,
    uses: [domains_USE.RECEIPT], trust: 'directory', signed_time: null, anchorable: false,
  },
  'served-proof': {
    domain: SERVED_PREFIX,
    message: (route, digest) => `${SERVED_PREFIX}\n${route}\n${digest}`,
    uses: [domains_USE.RECEIPT], trust: 'directory', signed_time: null, anchorable: false,
  },
  'self-attest-seal': {
    domain: SELF_ATTEST_DOMAIN,
    message: (cid) => `${SELF_ATTEST_DOMAIN}\n${cid}`,
    // A seller's own key: FractalAI's directory never authorizes it. Trust only via an explicit pinned key set.
    uses: [], trust: 'pinned-set-only', signed_time: 'body.sealed_at', anchorable: true,
  },
});
const KIND_NAMES = Object.freeze(Object.keys(KINDS));

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/kinds.mjs
/**
 * Receipt kinds → the exact signed bytes and the SIGNED projection (spec/TRUST-KERNEL.md §4, §5).
 * "Only what is signed": each parser rebuilds the signed message from the kind's fixed domain and the
 * signed content, returns the projection taken ONLY from signed bytes, and checks every unsigned field
 * that duplicates signed content (receipt_id, served_message, facts, emitted_at, domain…) for EXACT
 * equality — a mismatch is an integrity failure, never "resolved". Unsigned fields that duplicate nothing
 * are ignored and listed in `ignored_unsigned_fields`; they never influence the verdict.
 */






const MAX_CANONICAL = 8192;
const MIDAS_REQUIRED = ['address', 'chain_id', 'health_factor', 'threshold', 'collateral_usd', 'debt_usd', 'risk_tier', 'observed_at', 'source', 'snapshot_hash', 'emitted_at'];
const ALWAYS_IGNORED = new Set(['anchor', 'anchors']); // anchor references are hints, verified against consensus

const integrity = (code, detail) => new KernelError(code, detail);
const keyAndSig = (r, pkField = 'public_key', sigField = 'signature') => ({
  pk: b64decodeStrict(r[pkField], ML_DSA_65_PK_BYTES, pkField),
  sig: b64decodeStrict(r[sigField], ML_DSA_65_SIG_BYTES, sigField),
  public_key_b64: r[pkField],
});
const checkAlgorithm = (r) => {
  if (own(r, 'algorithm') && r.algorithm !== 'ml-dsa-65') fail(C.ALGORITHM, `algorithm ${JSON.stringify(r.algorithm)} is not ml-dsa-65`);
};
/** RFC 3339 UTC timestamp as produced by Date#toISOString (ms optional) → unix seconds (floor). */
function parseSealedAt(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(s)) fail(C.SIGNED_TIME_MALFORMED, 'sealed_at is not an RFC 3339 UTC timestamp');
  const ms = Date.parse(s);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 19) !== s.slice(0, 19)) fail(C.SIGNED_TIME_MALFORMED, 'sealed_at is not a real calendar time');
  return Math.floor(ms / 1000);
}
const decInt = (s, what) => {
  if (typeof s !== 'string' || !/^(0|[1-9][0-9]{0,15})$/.test(s)) fail(C.CANONICAL_MALFORMED, `${what} is not a canonical decimal integer`);
  const v = Number(s);
  if (!Number.isSafeInteger(v)) fail(C.CANONICAL_MALFORMED, `${what} out of range`);
  return v;
};

/** Parse the MIDAS signed canonical text. Strict: header, `key=value` lines, [a-z_] keys, no duplicates. */
function parseMidasCanonical(canonical) {
  if (typeof canonical !== 'string' || canonical.length === 0 || canonical.length > MAX_CANONICAL) fail(C.CANONICAL_MALFORMED, 'canonical missing or too long');
  if (/[\r\u0000]/.test(canonical)) fail(C.CANONICAL_MALFORMED, 'canonical contains CR/NUL');
  const [header, ...lines] = canonical.split('\n');
  if (header !== MIDAS_CANON_HEADER) fail(C.CANONICAL_MALFORMED, `canonical header is not ${MIDAS_CANON_HEADER}`);
  const out = Object.create(null);
  for (const l of lines) {
    const m = /^([a-z][a-z0-9_]{0,63})=(.*)$/.exec(l);
    if (!m) fail(C.CANONICAL_MALFORMED, `malformed canonical line ${JSON.stringify(l.slice(0, 40))}`);
    if (own(out, m[1])) fail(C.CANONICAL_MALFORMED, `duplicate canonical key ${m[1]}`);
    out[m[1]] = m[2];
  }
  for (const k of MIDAS_REQUIRED) if (!own(out, k)) fail(C.CANONICAL_MALFORMED, `canonical lacks ${k}`);
  return out;
}

/** Does an unsigned JSON fact equal the signed canonical string? Language-neutral rule (spec §4.2). */
function factEquals(v, s) {
  if (typeof v === 'string') return v === s;
  if (typeof v === 'boolean') return s === String(v);
  if (v === null) return s === 'null';
  if (typeof v === 'number') return /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(s) && Number(s) === v;
  return false;
}

function midas(r) {
  const known = new Set(['canonical', 'signature', 'public_key', 'algorithm', 'receipt_id', 'served_message', 'served_domain', 'domain', 'facts', 'emitted_at', 'content_id', 'snapshot']);
  checkAlgorithm(r);
  const fields = parseMidasCanonical(r.canonical);
  const id = sha256hex(r.canonical);
  const spec = KINDS['midas-alert'];
  const message = spec.message(id);
  if (own(r, 'receipt_id') && r.receipt_id !== id) fail(C.RECEIPT_ID_MISMATCH, 'receipt_id != sha256(canonical)');
  if (own(r, 'content_id') && r.content_id !== id) fail(C.RECEIPT_ID_MISMATCH, 'content_id != sha256(canonical)');
  if (own(r, 'served_message') && r.served_message !== message) fail(C.SIGNED_MESSAGE_MISMATCH, 'served_message != reconstructed signed message');
  if (own(r, 'served_domain') && r.served_domain !== spec.domain) fail(C.DOMAIN_MISMATCH, 'served_domain is not the midas-alert domain');
  if (own(r, 'domain') && r.domain !== MIDAS_CANON_HEADER && r.domain !== spec.domain) fail(C.DOMAIN_MISMATCH, 'domain is neither the canonical header nor the signed domain');
  const signedTime = decInt(fields.emitted_at, 'emitted_at');
  if (own(r, 'emitted_at') && r.emitted_at !== signedTime) fail(C.UNSIGNED_FIELD_MISMATCH, `top-level emitted_at ${JSON.stringify(r.emitted_at)} != signed emitted_at ${signedTime}`);
  if (own(r, 'facts')) {
    if (!isPlainObject(r.facts)) fail(C.UNSIGNED_FIELD_MISMATCH, 'facts is not an object');
    const bad = [];
    for (const k of Object.keys(r.facts)) if (!own(fields, k) || !factEquals(r.facts[k], fields[k])) bad.push(k);
    for (const k of Object.keys(fields)) if (!own(r.facts, k)) bad.push(k);
    if (bad.length) fail(C.UNSIGNED_FIELD_MISMATCH, `facts differ from the signed canonical: ${[...new Set(bad)].slice(0, 12).join(', ')}`);
  }
  // `snapshot` is committed by the SIGNED snapshot_hash = sha256(JCS(snapshot)); it is either exactly that or rejected.
  let committedSnapshot;
  if (own(r, 'snapshot')) {
    if (!isHex(fields.snapshot_hash, 64)) fail(C.SNAPSHOT_MISMATCH, 'signed snapshot_hash is not 64 hex');
    if (sha256hex(jcs(r.snapshot)) !== fields.snapshot_hash) fail(C.SNAPSHOT_MISMATCH, 'sha256(JCS(snapshot)) != signed snapshot_hash');
    committedSnapshot = r.snapshot;
  }
  const ks = keyAndSig(r);
  return {
    kind: 'midas-alert', content_id: id, message, ...ks, signed_time: signedTime,
    signed: { receipt_id: id, canonical_header: MIDAS_CANON_HEADER, ...fields, ...(committedSnapshot !== undefined ? { snapshot: committedSnapshot } : {}) },
    ignored: Object.keys(r).filter((k) => !known.has(k) && !ALWAYS_IGNORED.has(k)),
  };
}

function sealLike(r, kindName) {
  const known = new Set(['algorithm', 'domain', 'content_id', 'public_key', 'signature', 'body']);
  checkAlgorithm(r);
  const spec = KINDS[kindName];
  if (r.domain !== spec.domain) fail(C.DOMAIN_MISMATCH, `seal domain is not the ${kindName} domain`);
  if (!isPlainObject(r.body)) fail(C.INPUT_SHAPE, 'seal body missing or not an object');
  if (r.body.schema !== SEAL_SCHEMA) fail(C.SCHEMA_MISMATCH, `body.schema is not ${SEAL_SCHEMA}`);
  const cid = sha256hex(jcsSigned(r.body));
  if (r.content_id !== cid) fail(C.CONTENT_ID_MISMATCH, 'content_id != sha256(JCS(body)) — body altered');
  const signedTime = own(r.body, 'sealed_at') ? parseSealedAt(r.body.sealed_at) : fail(C.SIGNED_TIME_MALFORMED, 'body.sealed_at missing');
  const ks = keyAndSig(r);
  return {
    kind: kindName, content_id: cid, message: spec.message(cid), ...ks, signed_time: signedTime,
    signed: { content_id: cid, ...r.body },
    ignored: Object.keys(r).filter((k) => !known.has(k) && !ALWAYS_IGNORED.has(k)),
  };
}

function acpVerdict(r) {
  const known = new Set(['decision', 'signed_message', 'signature', 'public_key', 'profile', 'algorithm']);
  checkAlgorithm(r);
  if (!isPlainObject(r.decision)) fail(C.INPUT_SHAPE, 'acp-verdict needs a decision object');
  const digest = sha256hex(jcsSigned(r.decision));
  const message = KINDS['acp-verdict'].message(digest);
  if (own(r, 'signed_message') && r.signed_message !== message) fail(C.SIGNED_MESSAGE_MISMATCH, 'signed_message != served proof over sha256(JCS(decision))');
  const ks = keyAndSig(r);
  return { kind: 'acp-verdict', content_id: digest, message, ...ks, signed_time: null, signed: { digest, ...r.decision }, ignored: Object.keys(r).filter((k) => !known.has(k)) };
}

function servedProof(r) {
  const known = new Set(['domain', 'route_id', 'digest', 'signed_message', 'signature', 'public_key', 'profile', 'algorithm']);
  checkAlgorithm(r);
  if (r.domain !== SERVED_PREFIX) fail(C.DOMAIN_MISMATCH, `served-proof domain is not ${SERVED_PREFIX}`);
  if (typeof r.route_id !== 'string' || !ROUTE_RE.test(r.route_id)) fail(C.ROUTE_MALFORMED, 'route_id must match ^[a-z0-9][a-z0-9-]{0,63}$');
  if (own(RESERVED_ROUTES, r.route_id)) fail(C.ROUTE_RESERVED, `route '${r.route_id}' is reserved for kind ${RESERVED_ROUTES[r.route_id]}`);
  if (!isHex(r.digest, 64)) fail(C.DIGEST_MALFORMED, 'digest must be 64 lowercase hex');
  const message = KINDS['served-proof'].message(r.route_id, r.digest);
  if (own(r, 'signed_message') && r.signed_message !== message) fail(C.SIGNED_MESSAGE_MISMATCH, 'signed_message != domain\\nroute\\ndigest');
  const ks = keyAndSig(r);
  return { kind: 'served-proof', content_id: r.digest, message, ...ks, signed_time: null, signed: { route_id: r.route_id, digest: r.digest }, ignored: Object.keys(r).filter((k) => !known.has(k)) };
}

/** Fields that only one kind carries. A document carrying markers of two kinds is AMBIGUOUS and refused:
 * the kind is fixed by the caller's policy, and a field from another kind can never re-route verification. */
const MARKERS = {
  'midas-alert': ['canonical', 'receipt_id', 'served_message', 'served_domain', 'facts', 'snapshot'],
  'x402-seal': ['body'], 'self-attest-seal': ['body'],
  'acp-verdict': ['decision'],
  'served-proof': ['route_id', 'digest'],
};
/** Optional `profile` labels used by the conformance vectors; if present they must name the parsed kind. */
const PROFILE_ALIAS = { 'served-proof': 'x402-served', 'acp-verdict': 'acp-verdict' };

function checkUnambiguous(r, kind) {
  const families = new Set();
  for (const [k, fields] of Object.entries(MARKERS)) if (fields.some((f) => own(r, f))) families.add(k === 'self-attest-seal' ? 'x402-seal' : k);
  const mine = kind === 'self-attest-seal' ? 'x402-seal' : kind;
  for (const f of families) if (f !== mine) fail(C.KIND_AMBIGUOUS, `document carries ${f} fields while being verified as ${kind}`);
  if (own(r, 'profile') && r.profile !== (PROFILE_ALIAS[kind] ?? kind)) fail(C.KIND_AMBIGUOUS, `profile ${JSON.stringify(r.profile).slice(0, 40)} does not name kind ${kind}`);
}

/**
 * Determine the kind. The CALLER's declared kind wins; inference is shape-based and never reads the
 * domain to choose between differently-trusted kinds except the two seal kinds, whose messages are both
 * rebuilt from fixed domains (self-attest is never authorized by the directory).
 */
function inferKind(r) {
  if (!isPlainObject(r)) fail(C.INPUT_SHAPE, 'receipt is not a JSON object');
  if (own(r, 'canonical')) return 'midas-alert';
  if (own(r, 'body')) return r.domain === SELF_ATTEST_DOMAIN ? 'self-attest-seal' : 'x402-seal';
  if (own(r, 'decision')) return 'acp-verdict';
  if (own(r, 'route_id')) return 'served-proof';
  return fail(C.KIND_UNKNOWN, 'cannot determine the receipt kind from its shape');
}

const PARSERS = {
  'midas-alert': midas,
  'x402-seal': (r) => sealLike(r, 'x402-seal'),
  'self-attest-seal': (r) => sealLike(r, 'self-attest-seal'),
  'acp-verdict': acpVerdict,
  'served-proof': servedProof,
};

function parseReceipt(r, declaredKind) {
  if (!isPlainObject(r)) fail(C.INPUT_SHAPE, 'receipt is not a JSON object');
  const kind = declaredKind ?? inferKind(r);
  const p = PARSERS[kind];
  if (!p) fail(C.KIND_UNKNOWN, `unknown kind ${JSON.stringify(kind)}`);
  checkUnambiguous(r, kind);
  return p(r);
}

/** On-chain ids of a parsed receipt (fractalai.pqc-receipt-anchor/1). */
function anchorIds(parsed) {
  return {
    receipt_id: sha256hex(parsed.sig),
    payload_hash: sha256hex(parsed.message),
    kid16: sha256hex(parsed.public_key_b64).slice(0, 16),
  };
}


;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/directory.mjs
/**
 * Key directory (FRACTALAI-key-directory-v1) verification with pinned trust roots, epoch chain and
 * anti-rollback (spec/TRUST-KERNEL.md §6).
 *
 *   root = sha256(JCS({ epoch, prev_root, governance_key, keys: keys sorted by kid }))
 *   signature = ML-DSA-65(governance key, "FRACTALAI-key-directory-v1\n" + root)
 *
 * A directory is ACCEPTED only if it is structurally strict, its root recomputes, its signature verifies,
 * its signer equals the pinned governance key, and its epoch is reachable from the pinned checkpoint:
 *   epoch <  checkpoint.epoch  → DIRECTORY_ROLLBACK
 *   epoch == checkpoint.epoch  → root MUST equal checkpoint.root (else DIRECTORY_EQUIVOCATION)
 *   epoch >  checkpoint.epoch  → every intermediate epoch must be supplied (history), each verified the
 *                                same way, prev_root-linked, and append-only (no kid removed, no key rebound,
 *                                monotone status, immutable not_before / revoked_at).
 */






const ZERO_ROOT = '0'.repeat(64);
const STATUSES = Object.freeze(['reserved', 'active', 'retiring', 'retired', 'revoked']);
const ALLOWED_TRANSITIONS = {
  reserved: ['reserved', 'active', 'revoked'],
  active: ['active', 'retiring', 'retired', 'revoked'],
  retiring: ['retiring', 'retired', 'revoked'],
  retired: ['retired', 'revoked'],
  revoked: ['revoked'],
};
const KEY_FIELDS_TYPED = ['not_before', 'not_after', 'revoked_at', 'added_at'];

function directoryRoot(keys, prevRoot, epoch, governanceKeyB64) {
  const canonicalKeys = [...keys].sort((a, b) => (a.kid < b.kid ? -1 : a.kid > b.kid ? 1 : 0));
  return sha256hex(jcs({ epoch, prev_root: prevRoot || ZERO_ROOT, governance_key: governanceKeyB64 || null, keys: canonicalKeys }));
}

const directory_D = (detail) => new codes_KernelError(C.DIRECTORY_INVALID, detail);

/** Structural + cryptographic check of ONE epoch against ONE governance key. Throws KernelError. */
function checkEpoch(dir, governanceKeyB64) {
  if (!isPlainObject(dir)) throw directory_D('directory is not an object');
  if (dir.spec !== KEY_DIR_DOMAIN) throw directory_D(`spec is not ${KEY_DIR_DOMAIN}`);
  if (!Number.isSafeInteger(dir.epoch) || dir.epoch < 1) throw directory_D('epoch is not a positive integer');
  if (!isHex(dir.root, 64)) throw directory_D('root is not 64 lowercase hex');
  if (own(dir, 'prev_root') && dir.prev_root !== null && !isHex(dir.prev_root, 64)) throw directory_D('prev_root is not 64 lowercase hex');
  if (dir.epoch === 1 && (dir.prev_root ?? ZERO_ROOT) !== ZERO_ROOT) throw directory_D('epoch 1 must have a zero prev_root');
  if (!Array.isArray(dir.keys) || dir.keys.length === 0 || dir.keys.length > 256) throw directory_D('keys[] missing, empty or > 256');
  const asDir = (f) => { try { return f(); } catch (e) { throw directory_D(e instanceof codes_KernelError ? e.detail : String(e)); } };
  const pk = asDir(() => b64decodeStrict(dir.directory_public_key, ML_DSA_65_PK_BYTES, 'directory_public_key'));
  const sig = asDir(() => b64decodeStrict(dir.signature, ML_DSA_65_SIG_BYTES, 'directory signature'));
  const kids = new Set(), pks = new Set();
  for (const k of dir.keys) {
    if (!isPlainObject(k)) throw directory_D('key entry is not an object');
    if (typeof k.public_key_b64 !== 'string') throw directory_D('key entry without public_key_b64');
    asDir(() => b64decodeStrict(k.public_key_b64, ML_DSA_65_PK_BYTES, `key ${String(k.kid).slice(0, 16)} public_key_b64`));
    if (k.kid !== kidForKey(k.public_key_b64)) throw directory_D(`kid ${String(k.kid).slice(0, 20)} != sha256(public_key_b64)[:16] (aliased kid)`);
    if (kids.has(k.kid) || pks.has(k.public_key_b64)) throw directory_D(`key ${k.kid} listed more than once (ambiguous status)`);
    kids.add(k.kid); pks.add(k.public_key_b64);
    if (typeof k.use !== 'string') throw directory_D(`key ${k.kid} has no use`);
    if (!STATUSES.includes(k.status)) throw directory_D(`key ${k.kid} status ${JSON.stringify(k.status)} is not one of ${STATUSES.join('|')}`);
    for (const f of KEY_FIELDS_TYPED) {
      if (own(k, f) && k[f] !== null && !(Number.isSafeInteger(k[f]) && k[f] >= 0)) throw directory_D(`key ${k.kid} ${f} must be a non-negative integer or null`);
    }
  }
  if (pks.has(dir.directory_public_key)) throw directory_D('governance key is also listed as a receipt key (use separation violated)');
  const recomputed = directoryRoot(dir.keys, dir.prev_root, dir.epoch, dir.directory_public_key);
  if (recomputed !== dir.root) throw directory_D('root does not recompute over {epoch, prev_root, governance_key, keys}');
  const message = `${KEY_DIR_DOMAIN}\n${dir.root}`;
  if (own(dir, 'signed_message') && dir.signed_message !== message) throw directory_D('signed_message != "FRACTALAI-key-directory-v1\\n" + root');
  if (!mldsaVerify(sig, utf8(message), pk)) throw directory_D('governance ML-DSA-65 signature does not verify');
  if (governanceKeyB64 !== undefined && dir.directory_public_key !== governanceKeyB64) {
    throw new codes_KernelError(C.DIRECTORY_SIGNER_NOT_PINNED, 'directory is signed by a key that is not the pinned governance key');
  }
  return dir;
}

function checkAppendOnly(prev, next) {
  const nextBy = new Map(next.keys.map((k) => [k.kid, k]));
  for (const a of prev.keys) {
    const b = nextBy.get(a.kid);
    if (!b) fail(C.DIRECTORY_NOT_APPEND_ONLY, `epoch ${next.epoch} removed key ${a.kid}`);
    if (b.public_key_b64 !== a.public_key_b64 || b.use !== a.use) fail(C.DIRECTORY_NOT_APPEND_ONLY, `epoch ${next.epoch} rebound key ${a.kid}`);
    if (!ALLOWED_TRANSITIONS[a.status].includes(b.status)) fail(C.DIRECTORY_NOT_APPEND_ONLY, `key ${a.kid}: status ${a.status} → ${b.status} not allowed`);
    if (a.not_before != null && b.not_before !== a.not_before) fail(C.DIRECTORY_NOT_APPEND_ONLY, `key ${a.kid}: not_before changed`);
    if (a.revoked_at != null && b.revoked_at !== a.revoked_at) fail(C.DIRECTORY_NOT_APPEND_ONLY, `key ${a.kid}: revoked_at changed`);
    if (a.not_after != null && b.not_after != null && b.not_after > a.not_after) fail(C.DIRECTORY_NOT_APPEND_ONLY, `key ${a.kid}: not_after extended`);
  }
}

/**
 * Verify a directory against trust roots.
 * @param {object} dir           latest epoch
 * @param {object} ctx
 * @param {object} ctx.governanceKeyB64   pinned governance key (from roots or override)
 * @param {object} ctx.checkpoint         { epoch, root } pinned checkpoint, or null (override: no anti-rollback)
 * @param {object[]} [ctx.history]        intermediate epochs (checkpoint.epoch+1 … dir.epoch-1), any order
 * @param {boolean} [ctx.unpinnedSigner]  accept any signer (TLS trust); reported, never silent
 * @returns {{ epoch, root, keys, chain_epochs:number[], signer_pinned:boolean }}
 */
function verifyDirectoryChain(dir, ctx) {
  const gk = ctx.unpinnedSigner ? undefined : ctx.governanceKeyB64;
  if (!ctx.unpinnedSigner && typeof gk !== 'string') fail(C.NO_TRUST_SOURCE, 'no pinned governance key');
  checkEpoch(dir, gk);
  const signer = dir.directory_public_key;
  const cp = ctx.checkpoint;
  if (!cp) return { epoch: dir.epoch, root: dir.root, keys: dir.keys, chain_epochs: [dir.epoch], signer_pinned: !ctx.unpinnedSigner };
  if (dir.epoch < cp.epoch) fail(C.DIRECTORY_ROLLBACK, `directory epoch ${dir.epoch} < pinned checkpoint epoch ${cp.epoch}`);
  if (dir.epoch === cp.epoch) {
    if (dir.root !== cp.root) fail(C.DIRECTORY_EQUIVOCATION, `epoch ${dir.epoch} root ${dir.root.slice(0, 12)}… != pinned checkpoint root ${cp.root.slice(0, 12)}…`);
    return { epoch: dir.epoch, root: dir.root, keys: dir.keys, chain_epochs: [dir.epoch], signer_pinned: !ctx.unpinnedSigner };
  }
  // epoch > checkpoint: rebuild the chain checkpoint → … → dir from supplied history.
  const byEpoch = new Map();
  for (const h of ctx.history || []) {
    if (!isPlainObject(h) || !Number.isSafeInteger(h.epoch)) fail(C.DIRECTORY_INVALID, 'history entry is not a directory');
    if (h.epoch <= cp.epoch || h.epoch >= dir.epoch) continue;
    if (byEpoch.has(h.epoch) && byEpoch.get(h.epoch).root !== h.root) fail(C.DIRECTORY_EQUIVOCATION, `two different roots supplied for epoch ${h.epoch}`);
    byEpoch.set(h.epoch, h);
  }
  let prevRoot = cp.root;
  // Full checkpoint body (baked with the roots, or supplied in history) enables append-only checks from the checkpoint.
  let prevDir = null;
  const cpBody = cp.directory ?? (ctx.history || []).find((h) => isPlainObject(h) && h.epoch === cp.epoch);
  if (cpBody) {
    checkEpoch(cpBody, gk);
    if (cpBody.root !== cp.root) fail(C.DIRECTORY_EQUIVOCATION, `supplied checkpoint epoch ${cp.epoch} body does not match the pinned root`);
    prevDir = cpBody;
  }
  const chain = [cp.epoch];
  for (let e = cp.epoch + 1; e <= dir.epoch; e++) {
    const cur = e === dir.epoch ? dir : byEpoch.get(e);
    if (!cur) fail(C.DIRECTORY_CHAIN_GAP, `epoch ${e} missing between pinned checkpoint ${cp.epoch} and ${dir.epoch} — continuity unverifiable`);
    if (cur !== dir) checkEpoch(cur, gk);
    if (cur.directory_public_key !== signer) fail(C.DIRECTORY_SIGNER_NOT_PINNED, `epoch ${e} signed by a different governance key`);
    if ((cur.prev_root ?? ZERO_ROOT) !== prevRoot) fail(C.DIRECTORY_CHAIN_BREAK, `epoch ${e} prev_root does not equal epoch ${e - 1} root`);
    if (prevDir) checkAppendOnly(prevDir, cur);
    prevRoot = cur.root; prevDir = cur; chain.push(e);
  }
  return { epoch: dir.epoch, root: dir.root, keys: dir.keys, chain_epochs: chain, signer_pinned: !ctx.unpinnedSigner };
}

/** Governance-key separation helper for callers that hold a key list without a directory. */
const isReceiptUse = (k) => k && k.use === USE.RECEIPT;

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/lifecycle.mjs
/**
 * Key lifecycle decision (spec/TRUST-KERNEL.md §6.3). Evaluated at the SIGNED time of the receipt
 * (or, for kinds that sign no time, at verification time and only for `active` keys). Pure function.
 *
 *   reserved            → never authorizes anything
 *   active              → not_before ≤ T ≤ (not_after ?? ∞)
 *   retiring | retired  → not_before ≤ T ≤ not_after   (not_after REQUIRED)
 *   revoked             → only if revoked_at is set AND a consensus time proof shows the signed bytes
 *                         existed before revoked_at (anchor_time < revoked_at) AND T ≤ anchor_time + skew.
 *                         A key revoked for compromise can sign any `emitted_at` it likes, so the signed
 *                         time alone can never rescue a revoked key.
 *   use                 → must be one of the kind's allowed uses (domain table)
 */


/**
 * @param {object} key        directory entry (already structurally validated)
 * @param {object} p
 * @param {string[]} p.uses   uses allowed by the kind
 * @param {number|null} p.signedTime   signed time (unix s) or null when the kind signs no time
 * @param {number} p.now      verification time (unix s)
 * @param {number|null} p.anchorTime   earliest consensus-verified anchor time, or null
 * @param {number} p.skew     allowed clock skew (s)
 * @returns {{ ok:boolean, code?:string, detail:string, evaluated_at:number, time_basis:'signed'|'verification-time'|'anchor' }}
 */
function keyAuthorizes(key, { uses, signedTime, now, anchorTime, skew }) {
  const basis = signedTime === null ? 'verification-time' : 'signed';
  const T = signedTime === null ? now : signedTime;
  const R = (ok, code, detail, time_basis = basis) => ({ ok, code, detail, evaluated_at: T, time_basis });
  if (!uses.includes(key.use)) return R(false, C.KEY_USE_MISMATCH, `key use '${key.use}' does not authorize this kind (allowed: ${uses.join(', ') || 'none'})`);
  if (signedTime !== null && signedTime > now + skew) return R(false, C.SIGNED_TIME_IN_FUTURE, `signed time ${signedTime} is after verification time ${now} (+${skew}s)`);
  const nb = key.not_before ?? null, na = key.not_after ?? null;
  switch (key.status) {
    case 'reserved':
      return R(false, C.KEY_STATUS_RESERVED, 'key is reserved (never activated)');
    case 'active':
      if (nb === null) return R(false, C.KEY_WINDOW_MALFORMED, 'active key without not_before');
      if (T < nb) return R(false, C.KEY_NOT_YET_VALID, `T=${T} < not_before ${nb}`);
      if (na !== null && T > na) return R(false, C.KEY_EXPIRED, `T=${T} > not_after ${na}`);
      return R(true, undefined, 'active key inside its window');
    case 'retiring':
    case 'retired':
      if (signedTime === null) return R(false, C.KEY_NEEDS_SIGNED_TIME, `a ${key.status} key only authorizes receipts that carry a signed time`);
      if (nb === null || na === null) return R(false, C.KEY_WINDOW_MALFORMED, `${key.status} key without not_before/not_after`);
      if (T < nb) return R(false, C.KEY_NOT_YET_VALID, `T=${T} < not_before ${nb}`);
      if (T > na) return R(false, C.KEY_EXPIRED, `T=${T} > not_after ${na}`);
      return R(true, undefined, `${key.status} key, signed time inside its window`);
    case 'revoked': {
      const ra = key.revoked_at ?? null;
      if (ra === null) return R(false, C.KEY_REVOKED, 'key revoked without revoked_at — nothing it signed can be trusted');
      if (signedTime === null) return R(false, C.KEY_REVOKED, 'revoked key and the kind signs no time');
      if (anchorTime === null) return R(false, C.KEY_REVOKED, `key revoked at ${ra}; signed time alone cannot prove pre-revocation existence — needs a consensus time anchor before ${ra}`);
      if (anchorTime >= ra) return R(false, C.KEY_REVOKED, `earliest anchor ${anchorTime} is not before revocation ${ra}`);
      if (nb === null || T < nb) return R(false, C.KEY_NOT_YET_VALID, `T=${T} < not_before ${nb}`);
      if (na !== null && T > na) return R(false, C.KEY_EXPIRED, `T=${T} > not_after ${na}`);
      if (T > anchorTime + skew) return R(false, C.ANCHOR_FORWARD_DATED, `signed time ${T} after anchor ${anchorTime}`);
      return { ok: true, detail: `revoked at ${ra}, but anchored at ${anchorTime} (before revocation)`, evaluated_at: anchorTime, time_basis: 'anchor' };
    }
    default:
      return R(false, C.KEY_STATUS_UNKNOWN, `unknown status ${JSON.stringify(key.status)}`);
  }
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/rpc.mjs
/**
 * JSON-RPC over boundedFetch (hard deadline, byte cap, strict JSON). One call → one URL; the anchor
 * verifiers run their whole check independently against every configured URL and require the resulting
 * FACTS to agree (spec §7.4), so a single lying RPC cannot pass and a disagreement fails closed.
 */



let seq = 0;
async function rpcCall(url, method, params, { fetchImpl, timeoutMs = 20_000, maxBytes = 4 * 1024 * 1024 } = {}) {
  const id = ++seq;
  const text = await boundedFetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }), timeoutMs, maxBytes, fetchImpl,
  });
  let j;
  try { j = parseJsonStrict(text, { MAX_JSON_BYTES: maxBytes }); } catch (e) { throw new codes_KernelError(C.RPC_ERROR, `${method}: unparsable response (${e.code ?? 'JSON'})`); }
  if (!isPlainObject(j)) throw new codes_KernelError(C.RPC_ERROR, `${method}: response is not an object`);
  if (j.error !== undefined && j.error !== null) throw new codes_KernelError(C.RPC_ERROR, `${method}: ${oneLine(j.error?.message ?? JSON.stringify(j.error), 160)}`);
  if (!Object.prototype.hasOwnProperty.call(j, 'result')) throw new codes_KernelError(C.RPC_ERROR, `${method}: no result`);
  return j.result;
}

/** Stable comparison of fact objects produced by different RPCs. */
function sameFacts(a, b, fields) {
  return fields.every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/anchors/evm.mjs
/**
 * EVM time proof (PQCReceiptAnchor, scheme fractalai.pqc-receipt-anchor/1) — spec §7.2.
 * Everything that decides comes from the chain and the pinned roots; the anchor reference is a HINT
 * (where to look), never a source of truth:
 *   - contract = roots.anchors.evm[chainId].contract (a reference naming another address is refused);
 *   - keccak256(eth_getCode(contract)) == pinned runtime code hash (a look-alike emitter is refused);
 *   - exactly one ReceiptAnchored(receiptId) log, not removed, 4 topics, 96-byte data;
 *   - payloadHash/kid equal to the values recomputed from the signed bytes (else: SQUATTED, named);
 *   - block header by number: hash == log.blockHash, time := header.timestamp, event anchoredAt == time;
 *   - observedAt == signed time (seconds) and signed time ≤ time + skew;
 *   - confirmations ≥ policy; finalized := RPC `finalized` block ≥ log block.
 * Run independently on every configured RPC; all must succeed and agree.
 */





const RECEIPT_ANCHORED_TOPIC = '0x86069938b925599e2755e87e9b3242e8f6cbd24f2bc3d1ab52bc585d82646184';
const lc = (s) => String(s).toLowerCase();

async function onOneRpc(url, { chainId, dep, ids, signedTime, ref, policy, fetchImpl, timeoutMs }) {
  const call = (m, p) => rpcCall(url, m, p, { fetchImpl, timeoutMs });
  const live = qty(await call('eth_chainId', []), 'eth_chainId');
  if (live !== chainId) fail(C.ANCHOR_WRONG_CHAIN, `RPC serves chain ${live}, not ${chainId}`);
  const code = await call('eth_getCode', [dep.contract, 'latest']);
  if (typeof code !== 'string' || !/^0x[0-9a-fA-F]+$/.test(code) || code.length <= 2) fail(C.ANCHOR_CODEHASH_MISMATCH, `no contract code at ${dep.contract}`);
  const codehash = keccak256hex(hexToBytes(code));
  if (codehash !== dep.runtime_codehash) fail(C.ANCHOR_CODEHASH_MISMATCH, `runtime code hash ${codehash} != pinned ${dep.runtime_codehash}`);

  const rid = '0x' + ids.receipt_id;
  const match = (l) => isPlainObject(l) && lc(l.address) === dep.contract && Array.isArray(l.topics) && lc(l.topics[0]) === RECEIPT_ANCHORED_TOPIC && lc(l.topics[1]) === rid;
  let log;
  if (ref.tx_hash !== undefined) {
    if (!isHex0x(ref.tx_hash, 64)) fail(C.ANCHOR_REF_MALFORMED, 'tx_hash is not 0x + 64 hex');
    const rc = await call('eth_getTransactionReceipt', [ref.tx_hash]);
    if (!isPlainObject(rc)) fail(C.ANCHOR_NOT_FOUND, 'transaction receipt not found');
    if (rc.status !== '0x1') fail(C.ANCHOR_TX_FAILED, 'anchor transaction did not succeed');
    const cands = (Array.isArray(rc.logs) ? rc.logs : []).filter(match);
    const pick = ref.log_index !== undefined ? cands.filter((l) => qty(l.logIndex, 'logIndex') === ref.log_index) : cands;
    if (pick.length === 0) fail(C.ANCHOR_NOT_FOUND, 'no ReceiptAnchored(receiptId) log from the pinned contract in that transaction');
    if (pick.length > 1) fail(C.ANCHOR_AMBIGUOUS, 'more than one matching log');
    log = pick[0];
    if (lc(log.transactionHash ?? ref.tx_hash) !== lc(ref.tx_hash)) fail(C.ANCHOR_LOG_MALFORMED, 'log transactionHash differs from the requested one');
  } else {
    const from = ref.block_number !== undefined ? ref.block_number : dep.from_block;
    const to = ref.block_number !== undefined ? toQty(ref.block_number) : 'latest';
    const logs = await call('eth_getLogs', [{ address: dep.contract, topics: [RECEIPT_ANCHORED_TOPIC, rid], fromBlock: toQty(from), toBlock: to }]);
    if (!Array.isArray(logs)) fail(C.RPC_ERROR, 'eth_getLogs did not return an array');
    const cands = logs.filter(match);
    if (cands.length === 0) fail(C.ANCHOR_NOT_FOUND, 'no ReceiptAnchored(receiptId) event on the pinned contract');
    if (cands.length > 1) fail(C.ANCHOR_AMBIGUOUS, 'several ReceiptAnchored events for one receiptId (write-once invariant broken)');
    log = cands[0];
  }
  if (log.removed === true) fail(C.ANCHOR_LOG_REMOVED, 'log was removed by a reorg');
  if (log.topics.length !== 4 || typeof log.data !== 'string' || !/^0x[0-9a-fA-F]{192}$/.test(log.data)) fail(C.ANCHOR_LOG_MALFORMED, 'event does not have 4 topics and 96 bytes of data');
  if (!isHex0x(log.blockHash, 64)) fail(C.ANCHOR_LOG_MALFORMED, 'log has no blockHash');
  const blockNumber = qty(log.blockNumber, 'log.blockNumber');
  if (ref.block_number !== undefined && ref.block_number !== blockNumber) fail(C.ANCHOR_BLOCK_MISMATCH, `reference says block ${ref.block_number}, log is in ${blockNumber}`);
  const d = log.data.slice(2);
  const observedAt = Number.parseInt(d.slice(0, 64), 16);
  if (!/^0{24}/.test(d.slice(64, 128)) || !/^0{48}/.test(d.slice(0, 64)) || !/^0{48}/.test(d.slice(128))) fail(C.ANCHOR_LOG_MALFORMED, 'event data has non-canonical padding');
  const anchoredBy = '0x' + d.slice(64 + 24, 128).toLowerCase();
  const eventAnchoredAt = Number.parseInt(d.slice(128, 192), 16);
  if (lc(log.topics[2]) !== '0x' + ids.payload_hash) fail(C.ANCHOR_SQUATTED, `receiptId occupied by ${anchoredBy} with a different payloadHash (write-once slot squatted; anchor elsewhere)`);
  if (lc(log.topics[3]) !== '0x' + ids.kid16 + '0'.repeat(48)) fail(C.ANCHOR_KID_MISMATCH, `receiptId anchored by ${anchoredBy} under another key id`);

  const blk = await call('eth_getBlockByNumber', [toQty(blockNumber), false]);
  if (!isPlainObject(blk)) fail(C.ANCHOR_BLOCK_MISMATCH, `block ${blockNumber} not found`);
  if (lc(blk.hash) !== lc(log.blockHash)) fail(C.ANCHOR_BLOCK_MISMATCH, `log blockHash is not the canonical hash of block ${blockNumber} (reorg or lying RPC)`);
  if (qty(blk.number, 'block.number') !== blockNumber) fail(C.ANCHOR_BLOCK_MISMATCH, 'header number mismatch');
  const time = qty(blk.timestamp, 'block.timestamp');
  if (eventAnchoredAt !== time) fail(C.ANCHOR_TIME_MISMATCH, `event anchoredAt ${eventAnchoredAt} != header timestamp ${time}`);
  if (observedAt !== signedTime) fail(C.ANCHOR_OBSERVED_AT_MISMATCH, `on-chain observedAt ${observedAt} != signed time ${signedTime}`);
  if (signedTime > time + policy.skew) fail(C.ANCHOR_FORWARD_DATED, `signed time ${signedTime} is after the anchor block time ${time}`);

  const head = qty(await call('eth_blockNumber', []), 'eth_blockNumber');
  const confirmations = head - blockNumber + 1;
  if (confirmations < policy.minConfirmations) fail(C.ANCHOR_CONFIRMATIONS, `${confirmations} confirmations < ${policy.minConfirmations}`);
  let finalized = false;
  try {
    const f = await call('eth_getBlockByNumber', ['finalized', false]);
    finalized = isPlainObject(f) && qty(f.number, 'finalized.number') >= blockNumber;
  } catch { finalized = false; }
  return {
    chain: `eip155:${chainId}`, contract: dep.contract, tx_hash: lc(log.transactionHash ?? ref.tx_hash ?? ''), log_index: qty(log.logIndex, 'logIndex'),
    block_number: blockNumber, block_hash: lc(log.blockHash), time, observed_at: observedAt, anchored_by: anchoredBy, finalized,
  };
}

/**
 * @param {object} ref       anchor reference (hint)
 * @param {object} ctx       { roots, ids, signedTime, rpcUrls: string[], policy, fetchImpl, timeoutMs, overrideContracts }
 */
async function verifyEvmAnchor(ref, ctx) {
  const chainId = ref.chain_id;
  if (!Number.isSafeInteger(chainId) || chainId <= 0) fail(C.ANCHOR_REF_MALFORMED, 'chain_id is not a positive integer');
  const dep = ctx.roots.anchors?.evm?.[String(chainId)];
  if (!dep) fail(C.ANCHOR_CHAIN_NOT_PINNED, `no pinned PQCReceiptAnchor deployment for chain ${chainId}`);
  if (ref.contract !== undefined && lc(ref.contract) !== dep.contract) fail(C.ANCHOR_CONTRACT_NOT_PINNED, `reference names contract ${lc(ref.contract)}, pinned is ${dep.contract}`);
  for (const f of ['block_number', 'log_index']) if (ref[f] !== undefined && !(Number.isSafeInteger(ref[f]) && ref[f] >= 0)) fail(C.ANCHOR_REF_MALFORMED, `${f} must be a non-negative integer`);
  if (ctx.signedTime === null) fail(C.ANCHOR_REQUIRES_SIGNED_TIME, 'this kind signs no time; observedAt cannot be bound');
  const urls = ctx.rpcUrls?.length ? ctx.rpcUrls : (dep.default_rpc ? [dep.default_rpc] : []);
  if (urls.length === 0) fail(C.ANCHOR_NO_RPC, `no RPC configured for chain ${chainId}`);
  if (urls.length < ctx.policy.rpcQuorum) fail(C.RPC_QUORUM, `policy requires ${ctx.policy.rpcQuorum} independent RPCs, ${urls.length} configured`);
  const results = [];
  for (const url of urls) {
    try { results.push(await onOneRpc(url, { chainId, dep, ids: ctx.ids, signedTime: ctx.signedTime, ref, policy: ctx.policy, fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs })); }
    catch (e) { if (e instanceof codes_KernelError) { e.detail = `${e.detail} [rpc ${results.length + 1}/${urls.length}]`; throw e; } throw new codes_KernelError(C.RPC_ERROR, String(e?.message ?? e)); }
  }
  const fields = ['block_number', 'block_hash', 'time', 'observed_at', 'anchored_by', 'tx_hash', 'log_index'];
  for (const r of results.slice(1)) if (!sameFacts(results[0], r, fields)) fail(C.RPC_DISAGREEMENT, 'independent RPCs disagree on the anchor facts');
  const facts = { ...results[0], finalized: results.every((r) => r.finalized), rpc_count: results.length };
  facts.network_class = dep.network_class;
  facts.anchorer_known = (ctx.roots.known_anchorers?.evm || []).includes(facts.anchored_by);
  return facts;
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/anchors/solana-wire.mjs
/**
 * Solana wire format, base58 and the canonical anchor memo — pure, bounds-checked (spec §7.3).
 * Shared by the verifier (parse) and the issuer tooling (build). No Solana SDK.
 */


const ANCHOR_SCHEME = 'fractalai.pqc-receipt-anchor/1';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58encode(bytes) {
  const b = Uint8Array.from(bytes);
  let n = 0n;
  for (const x of b) n = n * 256n + BigInt(x);
  let s = '';
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  for (const x of b) { if (x !== 0) break; s = '1' + s; }
  return s;
}
function b58decode(str, expectedLen) {
  if (typeof str !== 'string' || str.length === 0 || str.length > 128 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(str)) fail(C.INPUT_SHAPE, 'invalid base58');
  let n = 0n;
  for (const c of str) n = n * 58n + BigInt(B58.indexOf(c));
  const out = [];
  while (n > 0n) { out.unshift(Number(n % 256n)); n /= 256n; }
  for (const c of str) { if (c !== '1') break; out.unshift(0); }
  const r = Uint8Array.from(out);
  if (expectedLen !== undefined && r.length !== expectedLen) fail(C.INPUT_SHAPE, `base58 value is ${r.length} bytes, expected ${expectedLen}`);
  if (b58encode(r) !== str) fail(C.INPUT_SHAPE, 'non-canonical base58');
  return r;
}

/** The ONLY accepted memo: `scheme|rid=<64hex>|ph=<64hex>|kid=<16hex>|obs=<decimal>` (lowercase, no 0x). */
const buildMemo = ({ receipt_id, payload_hash, kid16, observed_at }) =>
  `${ANCHOR_SCHEME}|rid=${receipt_id}|ph=${payload_hash}|kid=${kid16}|obs=${observed_at}`;

function shortvec(n) {
  const out = [];
  for (;;) { const b = n & 0x7f; n >>= 7; if (n === 0) { out.push(b); return out; } out.push(b | 0x80); }
}

/** Parse a legacy or v0 transaction. Every read is bounds-checked; trailing bytes, out-of-range indexes,
 * non-minimal shortvecs and unsupported versions throw SOL_TX_MALFORMED. */
function parseTransaction(wire) {
  const buf = Uint8Array.from(wire);
  let i = 0;
  const bad = (m) => fail(C.SOL_TX_MALFORMED, m);
  const take = (n) => { if (n < 0 || i + n > buf.length) bad('truncated transaction'); const v = buf.slice(i, i + n); i += n; return v; };
  const byte = () => take(1)[0];
  const sv = () => {
    let n = 0;
    for (let k = 0; k < 3; k++) {
      const b = byte();
      n |= (b & 0x7f) << (7 * k);
      if ((b & 0x80) === 0) { if (k > 0 && b === 0) bad('non-minimal shortvec'); return n; }
    }
    return bad('shortvec too long');
  };
  const nsig = sv();
  if (nsig === 0 || nsig > 16) bad('bad signature count');
  const signatures = [];
  for (let k = 0; k < nsig; k++) signatures.push(take(64));
  const msgStart = i;
  let version = 'legacy';
  if (i < buf.length && (buf[i] & 0x80)) { version = byte() & 0x7f; if (version !== 0) bad(`unsupported transaction version ${version}`); }
  const header = { numRequiredSignatures: byte(), numReadonlySigned: byte(), numReadonlyUnsigned: byte() };
  const nkeys = sv();
  if (nkeys === 0 || nkeys > 64) bad('bad account key count');
  const accountKeys = [];
  for (let k = 0; k < nkeys; k++) accountKeys.push(take(32));
  const recentBlockhash = take(32);
  const nix = sv();
  const instructions = [];
  for (let k = 0; k < nix; k++) {
    const programIdIndex = byte();
    const na = sv();
    const accounts = Array.from(take(na));
    const nd = sv();
    const data = take(nd);
    if (programIdIndex >= accountKeys.length || accounts.some((a) => a >= accountKeys.length)) bad('instruction references an account outside the static keys');
    instructions.push({ programIdIndex, accounts, data });
  }
  let addressTableLookups = 0;
  if (version !== 'legacy') {
    addressTableLookups = sv();
    for (let k = 0; k < addressTableLookups; k++) { take(32); take(sv()); take(sv()); }
  }
  if (i !== buf.length) bad('trailing bytes after message');
  if (signatures.length !== header.numRequiredSignatures) bad('signature count != header.numRequiredSignatures');
  if (header.numRequiredSignatures > accountKeys.length) bad('more signers than keys');
  return { signatures, message: buf.slice(msgStart), version, header, accountKeys, recentBlockhash, instructions, addressTableLookups };
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/anchors/solana.mjs
/**
 * Solana time proof (SPL Memo v2, scheme fractalai.pqc-receipt-anchor/1) — spec §7.3.
 *   - the RPC must serve the pinned cluster (getGenesisHash), test clusters are marked;
 *   - the tx must be `finalized` (getTransaction at finalized + getSignatureStatuses, same slot), meta.err null;
 *   - blockTime is REQUIRED (no time → no time proof);
 *   - raw bytes are parsed locally: exactly one signature, signer = an ANNOUNCED anchor key for that cluster,
 *     Ed25519 verified locally over the message, no address lookup tables, exactly ONE instruction, to
 *     Memo v2, listing the signer; memo bytes == memo rebuilt from the SIGNED receipt (incl. obs = signed time);
 *   - signed time ≤ blockTime + skew.
 * Run on every configured RPC; facts (slot, blockTime, raw bytes) must agree.
 */






function b64any(s) {
  // getTransaction(base64) returns standard padded base64; reuse the strict decoder (no length constraint).
  return b64decodeStrict(s, undefined, 'transaction');
}

async function solana_onOneRpc(url, { cluster, sig, sigBytes, signers, expectedMemo, signedTime, policy, fetchImpl, timeoutMs }) {
  const call = (m, p) => rpcCall(url, m, p, { fetchImpl, timeoutMs });
  const genesis = await call('getGenesisHash', []);
  if (genesis !== cluster.genesis_hash) fail(C.SOL_GENESIS_MISMATCH, `RPC genesis ${String(genesis).slice(0, 44)} is not the pinned ${cluster.name} genesis`);
  const tx = await call('getTransaction', [sig, { encoding: 'base64', commitment: 'finalized', maxSupportedTransactionVersion: 0 }]);
  if (!isPlainObject(tx)) fail(C.ANCHOR_NOT_FOUND, 'transaction not found at finalized commitment');
  if (!isPlainObject(tx.meta) || tx.meta.err !== null) fail(C.ANCHOR_TX_FAILED, 'transaction failed or has no meta');
  if (!Number.isSafeInteger(tx.slot) || tx.slot < 0) fail(C.SOL_TX_MALFORMED, 'slot missing');
  if (!Number.isSafeInteger(tx.blockTime) || tx.blockTime <= 0) fail(C.SOL_NO_BLOCKTIME, 'finalized transaction has no blockTime — no time proof');
  const st = await call('getSignatureStatuses', [[sig], { searchTransactionHistory: true }]);
  const s0 = isPlainObject(st) && Array.isArray(st.value) ? st.value[0] : null;
  if (!isPlainObject(s0) || s0.confirmationStatus !== 'finalized' || s0.err !== null) fail(C.SOL_NOT_FINALIZED, 'signature status is not finalized/ok');
  if (s0.slot !== tx.slot) fail(C.SOL_STATUS_SLOT, `status slot ${s0.slot} != transaction slot ${tx.slot}`);
  const t = Array.isArray(tx.transaction) ? tx.transaction : null;
  if (!t || t.length !== 2 || t[1] !== 'base64' || typeof t[0] !== 'string') fail(C.SOL_TX_MALFORMED, 'transaction not returned as [base64, "base64"]');
  const wire = b64any(t[0]);
  const p = parseTransaction(wire);
  if (p.signatures.length !== 1) fail(C.SOL_SIGNER_COUNT, `anchor tx must have exactly one signer, has ${p.signatures.length}`);
  if (!p.signatures[0].every((b, k) => b === sigBytes[k])) fail(C.SOL_SIGNATURE_MISMATCH, 'RPC returned a transaction whose signature is not the requested one');
  if (p.addressTableLookups) fail(C.SOL_LOOKUP_TABLES, 'address lookup tables are not accepted in an anchor tx');
  const signerBytes = p.accountKeys[0];
  const signer = b58encode(signerBytes);
  if (!ed25519Verify(p.signatures[0], p.message, signerBytes)) fail(C.SOL_ED25519_INVALID, 'Ed25519 signature over the message does not verify');
  if (!signers.includes(signer)) fail(C.SOL_SIGNER_NOT_ANNOUNCED, `signer ${signer} is not an announced anchor key for ${cluster.name}`);
  if (p.instructions.length !== 1) fail(C.SOL_INSTRUCTION_COUNT, `anchor tx must carry exactly 1 instruction, has ${p.instructions.length}`);
  const ix = p.instructions[0];
  if (b58encode(p.accountKeys[ix.programIdIndex]) !== MEMO_PROGRAM_ID) fail(C.SOL_NOT_MEMO, 'the instruction is not SPL Memo v2');
  if (!ix.accounts.includes(0)) fail(C.SOL_MEMO_SIGNER, 'memo instruction does not list the signer');
  const expected = new TextEncoder().encode(expectedMemo);
  if (ix.data.length !== expected.length || !ix.data.every((b, k) => b === expected[k])) fail(C.SOL_MEMO_MISMATCH, 'on-chain memo is not byte-identical to the memo rebuilt from the signed receipt');
  if (signedTime > tx.blockTime + policy.skew) fail(C.ANCHOR_FORWARD_DATED, `signed time ${signedTime} after blockTime ${tx.blockTime}`);
  return { slot: tx.slot, time: tx.blockTime, signer, wire_sha256: sha256hex(wire), finalized: true };
}

/**
 * @param {object} ref  { chain:'solana', cluster, signature, signer? }
 * @param {object} ctx  { roots, ids, signedTime, rpcUrls, policy, fetchImpl, timeoutMs, solanaSigners? }
 */
async function verifySolanaAnchor(ref, ctx) {
  const clusters = ctx.roots.anchors?.solana?.clusters || {};
  const name = ref.cluster;
  if (typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(clusters, name)) fail(C.ANCHOR_CHAIN_NOT_PINNED, `Solana cluster ${JSON.stringify(name)} is not pinned`);
  const cluster = { name, ...clusters[name] };
  const sigBytes = b58decode(ref.signature, 64);
  const signers = ctx.solanaSigners ?? (ctx.roots.anchors.solana.announced_signers?.[name] || []);
  if (ref.signer !== undefined && !signers.includes(ref.signer)) fail(C.SOL_SIGNER_NOT_ANNOUNCED, `reference names signer ${String(ref.signer).slice(0, 44)}, not announced for ${name}`);
  if (ctx.signedTime === null) fail(C.ANCHOR_REQUIRES_SIGNED_TIME, 'this kind signs no time; obs cannot be bound');
  const expectedMemo = buildMemo({ ...ctx.ids, observed_at: ctx.signedTime });
  const urls = ctx.rpcUrls?.length ? ctx.rpcUrls : (cluster.default_rpc ? [cluster.default_rpc] : []);
  if (urls.length === 0) fail(C.ANCHOR_NO_RPC, `no RPC configured for Solana ${name}`);
  if (urls.length < ctx.policy.rpcQuorum) fail(C.RPC_QUORUM, `policy requires ${ctx.policy.rpcQuorum} independent RPCs, ${urls.length} configured`);
  const results = [];
  for (const url of urls) {
    try { results.push(await solana_onOneRpc(url, { cluster, sig: ref.signature, sigBytes, signers, expectedMemo, signedTime: ctx.signedTime, policy: ctx.policy, fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs })); }
    catch (e) { if (e instanceof codes_KernelError) { e.detail = `${e.detail} [rpc ${results.length + 1}/${urls.length}]`; throw e; } throw new codes_KernelError(C.RPC_ERROR, String(e?.message ?? e)); }
  }
  for (const r of results.slice(1)) if (!sameFacts(results[0], r, ['slot', 'time', 'signer', 'wire_sha256'])) fail(C.RPC_DISAGREEMENT, 'independent RPCs disagree on the anchor transaction');
  return {
    chain: `solana:${name}`, signature: ref.signature, slot: results[0].slot, time: results[0].time, signer: results[0].signer,
    memo: expectedMemo, finalized: true, rpc_count: results.length, network_class: cluster.network_class,
    anchorer_known: true,
  };
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/selftest.mjs
/**
 * Load-time self-tests (spec/TRUST-KERNEL.md §8.4). The kernel refuses to decide anything if either fails:
 *  1. ML-DSA-65 known-answer test on a real production signature (MIDAS receipt fe62b072…): the backend must
 *     return exactly `true` for the genuine triple and `false` for a flipped signature and a different message.
 *     A stubbed / shadowed / miscompiled backend can therefore never become the verifier.
 *  2. JSON key-cache self-test: after priming the engine's native JSON parser with inputs known to stress its
 *     key cache, the kernel's OWN strict parser (the only parser the kernel uses on untrusted bytes) must still
 *     return the exact code points of every probe key. The native result is recorded for diagnostics only.
 */



const KAT = {
  message: "FRACTALAI-x402-served-v1\nmidas-alert\nfe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee",
  public_key: "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",
  signature: "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",
};

const PRIMERS = ['{" ":{},"\\\\":{}}', '{"\\u2028":{},"\\\\":{}}', '{"profile":"sar","sar":{"amount":"1","\\\\":"w"}}'];
const PROBES = [
  ['{" ":0,"\\ud800\\udc00":1}', [[0x20], [0x10000]]],
  ['{"\\u2028":0,"\\u00e9":1}', [[0x2028], [0xe9]]],
  ['{"amount":"100","\\u0041":"x"}', [[0x61, 0x6d, 0x6f, 0x75, 0x6e, 0x74], [0x41]]],
];
const cps = (k) => Array.from(k, (c) => c.codePointAt(0));
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function katOk() {
  try {
    const pk = b64decodeStrict(KAT.public_key, 1952), sig = b64decodeStrict(KAT.signature, 3309);
    const flipped = sig.slice(); flipped[17] ^= 0x01;
    const msg = new TextEncoder().encode(KAT.message);
    return mldsaVerify(sig, msg, pk) === true && mldsaVerify(flipped, msg, pk) === false
      && mldsaVerify(sig, new TextEncoder().encode(KAT.message + 'x'), pk) === false;
  } catch { return false; }
}

function parserOk() {
  let nativeOk = true;
  for (const p of PRIMERS) { try { JSON.parse(p); } catch { /* ignore */ } }
  for (const [text, want] of PROBES) {
    try { const got = Object.keys(JSON.parse(text)).map(cps); if (!want.every((w, i) => got[i] && same(got[i], w))) nativeOk = false; } catch { nativeOk = false; }
  }
  let strictOk = true;
  for (const p of PRIMERS) { try { parseJsonStrict(p); } catch { /* ignore */ } }
  for (const [text, want] of PROBES) {
    try { const got = Object.keys(parseJsonStrict(text)).map(cps); if (!(got.length === want.length && want.every((w, i) => same(got[i], w)))) strictOk = false; } catch { strictOk = false; }
  }
  return { strictOk, nativeOk };
}

function runSelfTests() {
  const kat = katOk();
  const { strictOk, nativeOk } = parserOk();
  return { ok: kat && strictOk, mldsa_kat: kat, strict_json_parser: strictOk, native_json_key_cache_ok: nativeOk };
}

const SELF_TEST = Object.freeze(runSelfTests());

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/trust-roots.json
const trust_roots_namespaceObject = /*#__PURE__*/JSON.parse('{"format":"fractalai.trust-roots/1","issuer":"FractalAI (FRACTAL AI S.A.S.)","pinned_at":"2026-10-07T04:25:11Z","provenance":"Governance key and epoch-3 checkpoint fetched over TLS from https://fractalai.net.co/.well-known/x402-receipt-keys on 2026-10-07T04:25:11Z, byte-identical to python/tests/fixtures/x402-receipt-keys-epoch3.json (committed earlier); ML-DSA-65 signature and root recomputed locally. This is trust-on-first-use of the governance key, made explicit and auditable here — not an on-chain anchor (FractalCheckpoint on Base is still pending).","governance":{"algorithm":"ML-DSA-65 (FIPS 204)","use":"key-directory-governance","public_key_b64":"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","kid":"8005759019a101f6"},"directory_checkpoint":{"spec":"FRACTALAI-key-directory-v1","epoch":3,"root":"8748d4d6966857adbab6e9f555cc8323f7726c0681b31e9f64df8d989ca088d7","prev_root":"16e916f4351d266c56e29532817fba38207309c2facbb760dfa5f88f8236122a","signature_sha256":"0709c64b9a3f40266a52554cf4556c7c236d559e5356c2f0f98eadfc060b29f5","known_previous_roots":{"1":"a97d9bdb5128817a08ec6449c5a9627bf7c09a932a76a6338e3a0c9d223b8a5a","2":"16e916f4351d266c56e29532817fba38207309c2facbb760dfa5f88f8236122a"},"source":"https://fractalai.net.co/.well-known/x402-receipt-keys"},"anchors":{"evm":{"5042":{"name":"Arc mainnet","network_class":"production","contract":"0x1f0d2774943250a7eb179e960203ea86319a8181","runtime_codehash":"0xe4733ce5c69278cb8072bebfd2500679236551039f896850929d0ceb443f2595","from_block":24072431,"default_rpc":"https://rpc.mainnet.arc.io","time_note":"block.timestamp proposed by the permissioned validator set"},"42161":{"name":"Arbitrum One","network_class":"production","contract":"0x3a23c614033cb22139dc13932524767c5fe841d8","runtime_codehash":"0xe4733ce5c69278cb8072bebfd2500679236551039f896850929d0ceb443f2595","from_block":511335138,"default_rpc":"https://arb1.arbitrum.io/rpc","time_note":"block.timestamp set by the sequencer within SequencerInbox maxTimeVariation (up to 24 h before / 768 s after L1 time, read 2026-10-06)"}},"solana":{"memo_program":"MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr","clusters":{"mainnet-beta":{"genesis_hash":"5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d","network_class":"production","default_rpc":"https://api.mainnet-beta.solana.com"},"devnet":{"genesis_hash":"EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG","network_class":"test","default_rpc":"https://api.devnet.solana.com"},"testnet":{"genesis_hash":"4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY","network_class":"test","default_rpc":"https://api.testnet.solana.com"}},"announced_signers":{"devnet":["7cpTE4C7sRWsHyeGsiqTfwNv9ntyribrRJV3s8vmN624"],"mainnet-beta":[],"testnet":[]}}},"known_anchorers":{"evm":["0xc13789e82661635d9cea38a53a0390cf9939ef4f"]},"verified_live_2026_10_07":{"evm_codehash":"keccak256(eth_getCode) == runtime_codehash on both 42161 (arb1.arbitrum.io) and 5042 (rpc.mainnet.arc.io)","solana_genesis":"getGenesisHash on api.{mainnet-beta,devnet,testnet}.solana.com"}}');
;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/checkpoint-directory.json
const checkpoint_directory_namespaceObject = /*#__PURE__*/JSON.parse('{"spec":"FRACTALAI-key-directory-v1","issuer":"FractalAI","epoch":3,"prev_root":"16e916f4351d266c56e29532817fba38207309c2facbb760dfa5f88f8236122a","root":"8748d4d6966857adbab6e9f555cc8323f7726c0681b31e9f64df8d989ca088d7","keys":[{"kid":"7cf9d6316ba6c628","use":"x402-receipt","algorithm":"ML-DSA-65 (FIPS-204)","public_key_b64":"FMWh8mdZwLeDFXieFNpSSD2+JRvBmii+pVK8gwhWuS4IYcUYV+k+GHhKMr2wx0FW1C89TIjdq2dLeDQafyhyHUFEnUOyb02nO/Q81ku9VPU66OlFEAkAp042iFq6qrrWT0GMVQVTonzvuYRb5KOyMjqmCyLgx/ccWbq57AkIsHbGD1NCLvZNhN4IfXep4GVs0fxOgG/uAvrO6x6KWyA0rOB1Zk1HFJw2T9dtLRhGMhGx1XOZgAHRdrT0vj3EWKrjF6TG3z0Em8s0+G0bS7Hnx/bwVilCqlCAWl7arPB+dPR/2t8cYrYFqgovBypqXGp8IYPPeRuUDIVnLdc5OOS2DOi/7QyTPIsoX8urTPrXDvIMqTcctPzcgjQbGw0tu2lAjTqwjU6MZ5Jlo+nycVPxWDyFY7et9Oea2ZG2k/68vw9wQlLXYcDxnVcsHWAh/IXnXKdPGzc6XTDi47l6AgYQDBZChOGo3txo3N+uZzW+ODfx0me2+LX2AW2m8YMIs7tK4qGizg9xtOWeV7hc680g/t+fsA5Hyx8Fd4GYDN872DrYDjI0bTstg93HuPuG51rdZtRm+2nL+c5WrW5QhiNXyCjchVDONXgVwl2Gme5TCC3LkuqfDbxvAFfikGTwUQS0PyeT+v/TRkxZwSvP7ikPtbIglx59AnmEKxvUY2/pw6GLw56rhGHGBGZTDU06Ylo0EpbRmCrhcOWcGTv/7hwrHb/vYQO9ZnblwqBcxxDcLxqC8p4M9j3aU78Ocki72P7leOM5nv5t1xMmYYA7+mjvqbsgOb8FWp+Nq8I38Uz6d+VLgTxbhZ5PWd2AA5JOmMXXbJ+nVvEAcSzQILksjQ5qS+Fr1arIwFv/KKtsOJtybZGverUY4vc9Qzh3WG6bD4L73KgauS3YKcU/KaKpsGvy0c1cTFY50iFLqkvDvkBcVizO8lHqddqSrYpB8jnAEjBwOz2RpH9kRDaRC1qYmMGTxz4JQlzr2JazLMIyCC+5sNuhD2AvMbzmbx9vAerxFawdKvtyKaEgml00GIAKBFPKK9CJXd/cCFW0cRpK9iEG2h+J/4G+c09V6H3ob5SvFmOwOGr6420b6VDmrUSOZaoaHWZGAxCjLm4a0J2Tu9RZo13lORUOCAMP/9vMMoU2kb7MHG4ZInlES5ACTmNZiFhQK/d+itZgwV2NZFGTSpPUKViTrKmW0vytuA8mfn4qDlENjm00NZZ17lR9FsV7K67+I4ORyZQIhzMp6zdU8VmAD04d2uFmJy7VQi2UIe1UmbXSX0HZ1k8BnMM8ILhDnBdpfA92s5pvu2GGXWdVjh4s25Hm2kmb8o4TmrkbjY4o56rvV25zc+b2ild4GXYj9srykWd2pr5l3myrZWk9GIKAlguoF6K+RvS2AVpa7Ec77Vs8yD7FyUQLQHuuUS1hXP/sl00qJF2SRGjaA4Su6mnGGhEbg+g6jlE/fsmQAO0YQbk4Zmbnk77jZfRt3Yqc9gJOkX92LYUkkMg/oZwAP9oFSORstC6mtvZFnKs1IdOEwAUt9c0mNO7SPGdtv1qWqbTM9xXnRo2946aq9GgH+YWU0rL6m7noJYpE1NiOBHdLbP2x13vdxNfr+JaJb9wjN2tffTx8Pe+0Il9xWiHf1T8Pw+B6OIFnQv8RrQlKSaax1xBtWoHob4E1jqyT4aFwXsaGhcAr3gkzZafsBoenWdVcO50TGWQ83tY4maEtXy5aMNk0ipmguL59bm7EVvmggkDME+xgkZdrLr7llXaEveguPgcRRR3Y/SI+w6BnJii3juDxSTKFsvWHgOOh91b1XaXDithAwsE4Z5JTR4RjKdckHGkQzHlcVHs9THiHOvAWa2gWs1U9XPNOegs4+ObKOBt4K1HrJmyRUk8PDNXBSnPIKpgRexGhkUq0/ze9KUztGIR3cMIPIkvswMYZdH6UJPbGtLRZ+ZWpXQPmmHObz+DRxlpffM11sgPUEMdF4f9ryvrf9k3lzx/dnVQnq73ZUQ56aF6Tb68Vhcpc0XnooZgCuleiV/0KYP11OL8mmcH7mppaoH2zC06A5GVx70AzmMi0WtHkIJbEm4AQ4OVyZqlZQIEXHWdGR59LxYS2N54V4P++1QXyeCPhQYpBHs40/Q+/z7r8wO2DUt77QujLEl2gcPhku8H2H4eZcgwTUijf9JzGLTxzkmnL/LdH3Tg3zjdul1m4zFfmiHmqU/lMGgrPbhMgDOwjCeANhNzoxKvhWmPD0xdl4qhk8EIFc5/P/UDJ1HWxlcRl3aK4Tmxhr7aofRVHNdPv6xAiLaoyPMnmXAMqvPG2vz6v5yG3Lw2jpxy0eDnEI/BI6RlVwzw+tFJN8/bRcskIDA6Mt8/dGGlqBx1ZPDPkyy8MT58LyaSOznQrN/qX1swyOwrQ1v1VhpYYnJItLxmCiIPw1fdq/uoHUX5L2Ecg3/C5DokVPKeqAhSlSKGbc5DPO/VNZS2ifMHL+WQZg37CtUXtjS7/Aan6mlrtBw2WmTwN0fsBQrWL/zYu4lu1nCbhGfLZ17TXVxjhFMHEzpH123IMh+QCKAnlb9FDpvV7BNJ8otHxw9nyq62T48/Y2D9P6IUZ5UKxRsgkwDQ=","added_at":0,"status":"retiring","not_before":0,"not_after":1798246800,"replaced_by":"86c139c960bb274c"},{"kid":"86c139c960bb274c","use":"x402-receipt","algorithm":"ML-DSA-65 (FIPS-204)","public_key_b64":"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","added_at":1790470800,"status":"active","not_before":1790470800,"not_after":null,"replaces":"7cf9d6316ba6c628"},{"kid":"ac7d38d2fbd8d634","use":"x402-receipt","algorithm":"ML-DSA-65 (FIPS-204)","public_key_b64":"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","added_at":1790652000,"status":"reserved","not_before":null,"not_after":null},{"kid":"7d59a7804591a75a","use":"x402-receipt","algorithm":"ML-DSA-65 (FIPS-204)","public_key_b64":"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","added_at":1790652000,"status":"reserved","not_before":null,"not_after":null},{"kid":"ddff8fa9a9e0775e","use":"x402-receipt","algorithm":"ML-DSA-65 (FIPS-204)","public_key_b64":"67NEWTf1RRhwTzhFpPsoxubPeupZsGBzFIrfzkLuUJqXrw7hd4pMwV3U5tDfUd1BfbcksLSFF5OsDb73+pFZhRP9zghrcJf+K6C0wBVL0PfeP2Qcu9Z0GxLeXex5l6LpbjT/WLPwBHVFQzZm9vsC+rMEYB+jlYgKaZUFsIBFptuiew1idfn28EuuZdWICAbVHJMtE7ifwJW+bhMMdj0J1L8xIJ1fUuVygq81lLRDhPvnERf0ORHmuc+Qv6VVGSlh3mWa7b82JhvkC0wOTFw6jfdIW+3VC3oFUbelBlp8GA80GlSFuTvhd+wyqVVeWFRe1Drrs3bKiZfqC5smW37AJnHyxpT49Onuklk6dtZtlFAQxE/sMr+2tJ4IqjYAWMhuh4B/ndKWQGMOsqSqLdPWnPovjEP7xDPUn43kl/BSMJ7f4Wyk8R932HkRv50EU+g/ZHtbs2jbCvktAyDNKKDBHit8UChmd6BZE2sEW78HMnvP7/czF8GAMkxlb008gcVasonYMX9naTXdKe0Hhx566k5ARmdfQQ50WpRbycKqvOGXmLy2isBXeFE03JbN73MMJRMVKaM74lkQcqYr6EXfxwmt+ZsL4lt6i0eAl+Vz0sAPpMMP8gGFWinAGhiQLO7rGgCbJpCdWZr+HsEj4puTAndH+SpYLRf2j/9azBbUo2nysFWu7Z2syLKku2cn/n1T1EmJbaxfqYMjz82UwEZEHwBDPJLJ468N0Zvhu6U/scfPoggbL+/7wvFMeG2tsb8W6Qv68h6CfFu0JT/Ad5STuUz+Kk1szJ8NS7yWd3SsX474Wc53941hmLroBMyAUWONFOpAHx3lqimMnyb4PjOCVIdC+Kps6kTKQHTVnmG+jknzerEaX+bgCY5RnIf7XfKKBDMeKCHcsV9bg73igXuXUlYR/GFwHA1FzQETb7rBmzkjMP2bTOafcJUlB2+JbwFZlf/qDGnqzLgfxTSg1v1IC6DaHGzlNQ1/u5eKM/hxnC5F+gwK4JvFmBeTCojIF7zCtNPGvgnr5shd7xes7RKP4EWiovd6QLqcTK4xPzMpaPQaXWbNinL/N6hR9rRDQDNIuLEoh3Un9yqGZ5yHcbCWfHMWQDtlzCSiNX0nQguY/FMxU79ZZwqOhXO6TrbCJ/nmlhW+EnrjHApPNHO9bi1Kg3NFggryrYZmQK5aCrUKTd0WrhUFeN09D6I86meMXC7NVi1Dr8eUYAso4HBp9/54zqwM/e18J2V4gUIIAE0MGHzgoV3WVD5Xnz1YFgN+n4158XXdcj3i9Cgk/T5iNpYxIe6zAqfSSADLIGLmjINfm0N8uN/ax39E+MQtOmgEA3KwZSgZ352IBRyW8lFGF6Xdss3gIrgy4S+8S2z5292a9o53fVDz2cE9i55QakTeOfU346S6sCOzs67/C7J5rHa4emexEw3AbFguWHkP1h2NbwjVOKh1RXuu6C3HFzKrMJglDDCr6aIx2knogdjxl1kyEYwZb4D8dd+scZj5rZhjgIEyQ7Lwb+qPUoiMO5E4hUAFWRXPhkfTmr6wANyEZ7pEiBmSvAWbB3eaI4nczDWCELAlIaOaqNqabMQ4c3E/dWmoXSiuK1YyMHOp99K4KWTIKWpZXqHAQLcokfC/h161RkFFiwtIcvHUiegMDD87+rF3aGaPwzthDC0+r34O25MUWK8Ms1gG4lp2mjAl+fye0fqfPbkbCPOwsq04jIf6sSL7g44PosGXukqNagOfVoVKV3CO0HUuEDPNGF23hVciYCz4gdJZGmA5rRd/09eft9crba+1yDJ/iOHcN1tWJ7rnuEzGlxiZUdwhhlrh0/Jo+9s/6o6Suy2JsVxZ1mM6BNynjmkngo+z1Tz/A2BjoIr9N5JbAu2vDwLVEBxRMuuO64tAvlD9/8x2y5YeGhTuuIYrCHBTmRjR94WKLsSAw5mYZ/7KozepOAn0INZR6kNrc0PL7c5DcjBIyKVnMBu95fp8DBP+Vv1BWTD8wwjRNJ4smZ97f6fw2sPUqUvqOxG+lGgMTuYeOXA0rzwjTQheePn6NSLvyII8ha8AG8R3+ya0HfmnqSJijysP9DMAI+EKvMuvWa/L7Y0UzVENFj5NYZtFFRMk1eOlzCESMOENG8vLNnL22zghyN2ChKnW6WGVVe3fRN4iNIJNXgp3XX9nK1Tq8itgRnHc9xV//0tFHlcGIb2GKtle/ROCSxj1P3JXD+RnGB1aS2KeUTg8mCSqri80y2R0neeCqscXsjfivEB/LDkczrbYqzc2Zmvj8adC+oTiznuff/8/lRZigEZ6BhKA28PxpqEhEJCqxwG1PV9CZYE3OWm7qepbOk15hd0tppKIF+2LcAbYbZPmLAUOYQvnyt3smfx4IqKddK+mBqQe3a1vSFG4YttvB9EaJVhz/4PNQc1QYbpwnT2myZ1HGSLw+HNfEEnk2tm7G+OpgWAKfKGzi7A2odjYYGVJO95h9YEGLYaBMzUBD0e4A0Ma2XzNkUcyzvLgEDhatyRv1FgxcheTHisQhBsKn+aZW8TD1iKzeRErFc3j05rCSJHk3wd5h/ZadPFi6IIaZ0U4opb+B8pYDYUHOoiNSE+YgtG3IW4=","added_at":1790652000,"status":"reserved","not_before":null,"not_after":null}],"overlap_until":1798246800,"latest_epoch":3,"previous_epochs":[{"epoch":1,"root":"a97d9bdb5128817a08ec6449c5a9627bf7c09a932a76a6338e3a0c9d223b8a5a"},{"epoch":2,"root":"16e916f4351d266c56e29532817fba38207309c2facbb760dfa5f88f8236122a"}],"lifecycle":"keys[] is append-only across epochs. A key with status \\"retiring\\" still verifies receipts signed until `not_after` (= overlap_until); \\"revoked\\" keys stay listed so old receipts remain checkable with an explicit \\"signed before revocation\\" story. New receipts are signed only by the single \\"active\\" key.","verify":"verifyDirectory (@fractalai/pqc-agent-receipts-conformance/key-directory): check the ML-DSA-65 governance signature over `FRACTALAI-key-directory-v1\\\\n<root>`, that root recomputes over keys, that prev_root equals the previous epoch\'s root, and — once anchored — that root equals the on-chain value. Then pin these public_key_b64 as trustedKeys when verifying a receipt.","signed_message":"FRACTALAI-key-directory-v1\\n8748d4d6966857adbab6e9f555cc8323f7726c0681b31e9f64df8d989ca088d7","signature":"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","directory_public_key":"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","anchor":{"status":"tls-only","onchain":"pending","note":"The directory is ML-DSA-65-signed (tamper/equivocation-evident given the governance key). Its `root` is committed on-chain once the FractalCheckpoint anchor on Base is live; this field will then carry {chain:\\"base\\", tx:\\"0x…\\", epoch}. Until then, do NOT claim trustless-of-TLS trust."}}');
;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/roots.mjs
/**
 * Baked trust roots (kernel/trust-roots.json): the pinned governance key, the pinned directory
 * checkpoint, the pinned anchor deployments (chainId → contract + runtime code hash), Solana cluster
 * genesis hashes and announced anchor signers. Anything else a caller supplies is an OVERRIDE and is
 * reported as such in the verdict (trust_basis: "override").
 */



const deepFreeze = (o) => { if (o && typeof o === 'object') { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
const BAKED_ROOTS = deepFreeze(trust_roots_namespaceObject);

/** Full body of the pinned checkpoint epoch: lets the kernel check append-only (no key removed / rebound /
 * un-revoked) from the checkpoint to any later epoch. Accepted only if its root equals the pinned root. */
const BAKED_CHECKPOINT_DIRECTORY = deepFreeze(checkpoint_directory_namespaceObject.root === trust_roots_namespaceObject.directory_checkpoint.root ? checkpoint_directory_namespaceObject : null);

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/verify.mjs
/**
 * The decision algorithm (spec/TRUST-KERNEL.md §9) — the ONLY place in this repository that decides
 * whether a FractalAI receipt is trusted. Every other module (verifier/, conformance/, the GitHub Action,
 * the Python port) either delegates here or reproduces this algorithm against the shared corpus.
 *
 * Never throws: every failure becomes a coded reason in a leveled verdict.
 */












const nowSec = () => Math.floor(Date.now() / 1000);
/** Defensive deep copy through the kernel's own strict parser (no shared references, no prototypes). */
const freeze = (v) => parseJsonStrict(JSON.stringify(v));

function toValue(x, what, allowObject) {
  if (typeof x === 'string' || x instanceof Uint8Array) return parseJsonStrict(x);
  if (!allowObject) throw new codes_KernelError(C.ENGINE_UNSAFE_OBJECT_INPUT, `${what}: this engine failed the native JSON key-cache self-test; pass raw JSON text (or set allowObjectInput, reflected as an override)`);
  assertJsonValue(x);
  return freeze(x);
}

function normalizePolicy(p = {}) {
  const require = Array.isArray(p.require) ? [...p.require] : [...DEFAULT_REQUIRE];
  for (const l of require) if (!LEVELS.includes(l)) throw new codes_KernelError(C.INPUT_SHAPE, `unknown level ${l} in policy.require`);
  if (!require.includes('integrity')) require.unshift('integrity');
  return {
    require,
    allowTestnetAnchors: p.allowTestnetAnchors === true,
    requireKnownAnchorer: p.requireKnownAnchorer === true,
    minConfirmations: Number.isSafeInteger(p.minConfirmations) && p.minConfirmations >= 0 ? p.minConfirmations : 1,
    rpcQuorum: Number.isSafeInteger(p.rpcQuorum) && p.rpcQuorum >= 1 ? p.rpcQuorum : 1,
    skew: Number.isSafeInteger(p.maxClockSkewSec) && p.maxClockSkewSec >= 0 ? p.maxClockSkewSec : 900,
  };
}

/**
 * @param {string|Uint8Array|object} input   the receipt (raw JSON text preferred)
 * @param {object} opts
 *   kind | kinds        REQUIRED policy: the receipt kind(s) the caller expects (never taken from the document)
 *   expectedId          content id the caller asked for (64 hex): binds a fetched receipt to the request
 *   directory           key directory (text or object); directoryHistory: intermediate epochs
 *   trustedKeys         OVERRIDE: pinned base64 key set instead of the directory
 *   governanceKey, roots, allowTlsDirectory   OVERRIDES of the baked trust roots
 *   anchors             anchor references (default: receipt.anchors | receipt.anchor); checkAnchors: evaluate them
 *   rpc                 { 'eip155:42161': [urls], 'solana:devnet': [urls] }; solanaSigners (override)
 *   policy              { require, allowTestnetAnchors, requireKnownAnchorer, minConfirmations, rpcQuorum, maxClockSkewSec }
 *   now, fetchImpl, timeoutMs, allowObjectInput
 */
function* core(input, opts) {
  const v = {
    kernel: KERNEL_ID, spec_version: SPEC_VERSION, kind: null, valid: false,
    levels: { integrity: false, authentic: false, trusted: false, time_anchored: null, finalized: null },
    trust_basis: 'none', policy: null, key: null, directory: null, signed: null, signed_time: null,
    anchors: [], overrides: [], ignored_unsigned_fields: [], reasons: [], exit_code: EXIT.integrity,
    engine: { self_test_ok: SELF_TEST.ok, native_json_key_cache_ok: SELF_TEST.native_json_key_cache_ok },
  };
  const reason = (level, e) => {
    const code = e instanceof codes_KernelError ? e.code : C.INTERNAL;
    const detail = e instanceof codes_KernelError ? e.detail : String(e?.message ?? e);
    v.reasons.push({ level, code, detail });
  };
  const finish = () => {
    v.valid = v.policy ? v.policy.require.every((l) => v.levels[l] === true) : false;
    const firstFail = (v.policy?.require ?? DEFAULT_REQUIRE).find((l) => v.levels[l] !== true);
    v.exit_code = v.valid ? EXIT.VALID : EXIT[firstFail ?? 'integrity'];
    return v;
  };
  try {
    if (!SELF_TEST.ok) { reason('integrity', new codes_KernelError(C.ENGINE_SELFTEST_FAILED, `kernel self-test failed: ${JSON.stringify(SELF_TEST)}`)); return finish(); }
    const policy = normalizePolicy(opts.policy);
    v.policy = policy;
    const now = Number.isSafeInteger(opts.now) ? opts.now : nowSec();
    const allowObject = SELF_TEST.native_json_key_cache_ok || opts.allowObjectInput === true;
    if (opts.allowObjectInput === true && !SELF_TEST.native_json_key_cache_ok) v.overrides.push('allowObjectInput (engine JSON key-cache self-test failed)');

    // ── 1. integrity ────────────────────────────────────────────────────────────────────────────
    let receipt, parsed;
    try {
      receipt = toValue(input, 'receipt', allowObject);
      if (!isPlainObject(receipt)) throw new codes_KernelError(C.INPUT_SHAPE, 'receipt is not a JSON object');
      const allowed = opts.kind !== undefined ? [opts.kind] : Array.isArray(opts.kinds) ? opts.kinds : null;
      if (!allowed || allowed.length === 0) throw new codes_KernelError(C.KIND_UNKNOWN, 'policy must name the expected kind(s) (opts.kind / opts.kinds) — the document never chooses');
      for (const k of allowed) if (!KIND_NAMES.includes(k)) throw new codes_KernelError(C.KIND_UNKNOWN, `unknown kind ${JSON.stringify(k)}`);
      const kind = allowed.length === 1 ? allowed[0] : inferKind(receipt);
      if (!allowed.includes(kind)) throw new codes_KernelError(C.KIND_NOT_ALLOWED, `receipt looks like ${kind}, policy allows ${allowed.join(', ')}`);
      v.kind = kind;
      parsed = parseReceipt(receipt, kind);
      if (opts.expectedId !== undefined && opts.expectedId !== parsed.content_id) throw new codes_KernelError(C.EXPECTED_ID_MISMATCH, 'the receipt is not the one that was requested (content id differs)');
      v.levels.integrity = true;
      v.ignored_unsigned_fields = parsed.ignored;
      v.signed_time = parsed.signed_time;
    } catch (e) { reason('integrity', e); return finish(); }

    // ── 2. authentic ────────────────────────────────────────────────────────────────────────────
    if (!mldsaVerify(parsed.sig, new TextEncoder().encode(parsed.message), parsed.pk)) {
      reason('authentic', new codes_KernelError(C.SIGNATURE_INVALID, `ML-DSA-65 signature does not verify over the reconstructed ${parsed.kind} message`));
      return finish();
    }
    v.levels.authentic = true;
    v.signed = parsed.signed;
    v.key = { kid: kidForKey(parsed.public_key_b64) };

    // ── 3. time proofs (before trust: a revoked key needs one) ──────────────────────────────────
    const wantAnchors = opts.checkAnchors === true || policy.require.includes('time_anchored') || policy.require.includes('finalized');
    let anchorTime = null;
    if (wantAnchors) {
      v.levels.time_anchored = false; v.levels.finalized = false;
      let refs;
      try {
        const raw = opts.anchors !== undefined ? toValue(opts.anchors, 'anchors', true) : own(receipt, 'anchors') ? receipt.anchors : own(receipt, 'anchor') ? [receipt.anchor] : [];
        refs = Array.isArray(raw) ? raw : [raw];
        if (refs.length === 0) throw new codes_KernelError(C.NO_ANCHOR, 'no anchor reference supplied');
        if (refs.length > 8) throw new codes_KernelError(C.ANCHOR_REF_MALFORMED, 'more than 8 anchor references');
      } catch (e) { reason('time_anchored', e); refs = []; }
      if (opts.solanaSigners) v.overrides.push('solanaSigners');
      const roots = opts.roots ?? BAKED_ROOTS;
      const ids = anchorIds(parsed);
      const recs = yield { refs, base: { roots, ids, signedTime: parsed.signed_time, policy, fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs, rpc: opts.rpc, solanaSigners: opts.solanaSigners } };
      if (recs === null) v.reasons.push({ level: 'time_anchored', code: C.NO_ANCHOR, detail: 'offline (synchronous) verification does not evaluate anchors — use verify()' });
      for (const rec of recs || []) {
        if (rec.reason) v.reasons.push({ level: 'time_anchored', code: rec.reason.code, detail: `${rec.ref ?? 'anchor'}: ${rec.reason.detail}` });
        v.anchors.push(rec);
      }
      const counted = v.anchors.filter((a) => a.counts);
      if (counted.length) {
        v.levels.time_anchored = true;
        anchorTime = Math.min(...counted.map((a) => a.facts.time));
        v.levels.finalized = counted.some((a) => a.facts.finalized === true);
        if (!v.levels.finalized) v.reasons.push({ level: 'finalized', code: C.NOT_FINALIZED, detail: 'no counted anchor is in a finalized block yet' });
      }
    }

    // ── 4. trusted ──────────────────────────────────────────────────────────────────────────────
    try {
      const kindSpec = KINDS[parsed.kind];
      if (opts.trustedKeys !== undefined) {
        const set = toValue(opts.trustedKeys, 'trustedKeys', true);
        if (!Array.isArray(set) || set.length === 0 || set.some((k) => typeof k !== 'string')) throw new codes_KernelError(C.NO_TRUST_SOURCE, 'trustedKeys must be a non-empty array of base64 keys');
        v.overrides.push('trustedKeys'); v.trust_basis = 'override';
        if (parsed.signed_time !== null && parsed.signed_time > now + policy.skew) throw new codes_KernelError(C.SIGNED_TIME_IN_FUTURE, `signed time ${parsed.signed_time} is in the future`);
        if (!set.includes(parsed.public_key_b64)) throw new codes_KernelError(C.KEY_NOT_IN_PINNED_SET, 'signing key is not in the pinned trustedKeys set');
        v.key.time_basis = parsed.signed_time === null ? 'verification-time' : 'signed';
        v.levels.trusted = true;
      } else {
        if (kindSpec.trust === 'pinned-set-only') throw new codes_KernelError(C.SELF_ATTEST_NOT_TRUSTED, 'a self-attest seal is signed by the seller; only an explicit trustedKeys set can trust it');
        if (opts.directory === undefined) throw new codes_KernelError(C.NO_TRUST_SOURCE, 'no key directory supplied');
        const roots = opts.roots ?? BAKED_ROOTS;
        if (opts.roots) v.overrides.push('roots');
        let governanceKeyB64 = roots.governance?.public_key_b64;
        let checkpoint = roots.directory_checkpoint ? { epoch: roots.directory_checkpoint.epoch, root: roots.directory_checkpoint.root, directory: roots === BAKED_ROOTS ? BAKED_CHECKPOINT_DIRECTORY : undefined } : null;
        if (opts.governanceKey !== undefined) { v.overrides.push('governanceKey'); governanceKeyB64 = opts.governanceKey; if (opts.governanceKey !== roots.governance?.public_key_b64) checkpoint = opts.checkpoint ?? null; }
        const unpinned = opts.allowTlsDirectory === true;
        if (unpinned) { v.overrides.push('allowTlsDirectory'); checkpoint = null; }
        const dir = toValue(opts.directory, 'directory', allowObject);
        const history = opts.directoryHistory !== undefined ? toValue(opts.directoryHistory, 'directoryHistory', allowObject) : [];
        const d = verifyDirectoryChain(dir, { governanceKeyB64, checkpoint, history, unpinnedSigner: unpinned });
        v.directory = { epoch: d.epoch, root: d.root, chain_epochs: d.chain_epochs, checkpoint_epoch: checkpoint?.epoch ?? null };
        v.trust_basis = unpinned ? 'tls' : (opts.roots || opts.governanceKey !== undefined) ? 'override' : 'pinned-root';
        const entry = d.keys.find((k) => k.public_key_b64 === parsed.public_key_b64);
        if (!entry) throw new codes_KernelError(C.KEY_NOT_LISTED, `key ${v.key.kid} is not in directory epoch ${d.epoch}`);
        Object.assign(v.key, { use: entry.use, status: entry.status, not_before: entry.not_before ?? null, not_after: entry.not_after ?? null, revoked_at: entry.revoked_at ?? null });
        const a = keyAuthorizes(entry, { uses: kindSpec.uses, signedTime: parsed.signed_time, now, anchorTime, skew: policy.skew });
        v.key.evaluated_at = a.evaluated_at; v.key.time_basis = a.time_basis;
        if (!a.ok) throw new codes_KernelError(a.code, a.detail);
        v.levels.trusted = true;
      }
    } catch (e) {
      reason('trusted', e);
    }
    return finish();
  } catch (e) {
    reason('integrity', e);
    return finish();
  }
}

/** Evaluate anchor references (network). Each record: { ref, ok, counts, facts, reason }. */
async function evaluateAnchors({ refs, base }) {
  const out = [];
  for (const ref of refs) {
    const rec = { ref: null, ok: false, counts: false, facts: null, reason: null };
    try {
      if (!isPlainObject(ref)) throw new codes_KernelError(C.ANCHOR_REF_MALFORMED, 'anchor reference is not an object');
      const isSol = ref.chain === 'solana';
      rec.ref = isSol ? `solana:${ref.cluster}` : `eip155:${ref.chain_id}`;
      const ctx = { ...base, rpcUrls: base.rpc?.[rec.ref] };
      const f = isSol ? await verifySolanaAnchor(ref, ctx) : await verifyEvmAnchor(ref, ctx);
      rec.ok = true; rec.facts = f;
      if (f.network_class !== 'production' && !base.policy.allowTestnetAnchors) throw new codes_KernelError(C.ANCHOR_TESTNET_NOT_ALLOWED, `${rec.ref} is a test network; policy.allowTestnetAnchors is false`);
      if (base.policy.requireKnownAnchorer && !f.anchorer_known) throw new codes_KernelError(C.ANCHOR_ANCHORER_UNKNOWN, `anchored by ${f.anchored_by}, not a known FractalAI anchorer`);
      rec.counts = true;
    } catch (e) {
      rec.reason = { code: e instanceof codes_KernelError ? e.code : C.INTERNAL, detail: e instanceof codes_KernelError ? e.detail : String(e?.message ?? e) };
    }
    out.push(rec);
  }
  return out;
}

/** Full verification (anchors evaluated over the network when requested). Never throws. */
async function verify(input, opts = {}) {
  const it = core(input, opts || {});
  let r = it.next();
  while (!r.done) r = it.next(await evaluateAnchors(r.value));
  return r.value;
}

/** Offline, synchronous verification: identical decision, anchors are never evaluated (time levels stay
 * null, or false with NO_ANCHOR when the policy requires them). */
function verifySync(input, opts = {}) {
  const it = core(input, opts || {});
  let r = it.next();
  while (!r.done) r = it.next(null);
  return r.value;
}

;// CONCATENATED MODULE: ./vendor/pqc-receipts-colosseum/kernel/src/index.mjs
/**
 * @fractalai/pqc-trust-kernel — public API (spec/TRUST-KERNEL.md).
 */














;// CONCATENATED MODULE: ./vendor/VENDOR.json
const VENDOR_namespaceObject = /*#__PURE__*/JSON.parse('{"cd":"dab77b00f97e04a117882f1a5bc03f01e4add771"}');
;// CONCATENATED MODULE: ./src/index.js
// SPDX-License-Identifier: Apache-2.0
/**
 * GitHub Action entrypoint: FractalAI PQC Receipt Verify v2.
 *
 * This file makes NO trust decision. It only (1) reads the step inputs and the files/URLs they name with
 * strict hygiene, (2) hands raw bytes + an explicit policy to Trust Kernel v2 (vendored byte-exact from
 * johnInarti/pqc-receipts-colosseum@dab77b0, see vendor/VENDOR.json), and (3) publishes the kernel's
 * leveled verdict as machine-safe outputs, a one-line log and an escaped step summary.
 *
 * Reads INPUT_* as the Actions runner sets them; writes $GITHUB_OUTPUT / $GITHUB_STEP_SUMMARY.
 * No @actions/core dependency on purpose.
 */






const KERNEL_PIN = `${KERNEL_ID}@${String(VENDOR_namespaceObject.cd).slice(0, 7)}`;
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
const src_oneLine = (s, max = 600) => oneLine(s, max);
function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  const v = String(value);
  if (file) {
    const delim = `ghadelim_${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
    if (v.includes(delim)) throw new Error('output value contains its delimiter');
    (0,external_node_fs_namespaceObject.appendFileSync)(file, `${name}<<${delim}\n${v}\n${delim}\n`);
  } else {
    process.stdout.write(`[output] ${name}=${src_oneLine(v)}\n`);
  }
}
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const annotate = (level, msg) => process.stdout.write(`::${level}::${esc(src_oneLine(msg))}\n`);
/** RT-2: a summary table cell must not be able to break the table or inject markdown/HTML. */
const mdCell = (s) => src_oneLine(s, 300).replace(/[\\`*_{}\[\]()#+!|~>-]/g, '\\$&').replace(/&/g, '&amp;').replace(/</g, '&lt;');
function summary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { (0,external_node_fs_namespaceObject.appendFileSync)(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch { /* summary is best-effort */ }
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
  return roots.map((r) => { try { return (0,external_node_fs_namespaceObject.realpathSync)(r); } catch { return null; } }).filter(Boolean);
}
const resolveInWorkspace = (p) => external_node_path_namespaceObject.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), p);
const resolvesToFile = (p) => (0,external_node_fs_namespaceObject.existsSync)(resolveInWorkspace(p));
function safeLocalPath(p) {
  let real;
  try { real = (0,external_node_fs_namespaceObject.realpathSync)(resolveInWorkspace(p)); } catch { throw inputError(`file "${p}" does not exist`); }
  const inside = workspaceRoots().some((r) => real === r || real.startsWith(r + external_node_path_namespaceObject.sep));
  if (!inside) throw inputError(`file "${p}" resolves outside GITHUB_WORKSPACE/RUNNER_TEMP (symlink or path traversal refused)`);
  const st = (0,external_node_fs_namespaceObject.statSync)(real);
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
  const buf = (0,external_node_fs_namespaceObject.readFileSync)(safeLocalPath(p));
  if (buf.length > MAX_BODY_BYTES) throw inputError(`file "${p}" is larger than ${MAX_BODY_BYTES} bytes`, 'JSON_TOO_LARGE');
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buf); } catch { return new Uint8Array(buf); }
}
const isHttpUrl = (s) => /^https?:\/\//i.test(s);
const isReceiptId = (s) => /^[0-9a-fA-F]{64}$/.test(s);

/** GET with the kernel's boundedFetch (one deadline, streamed byte cap, no redirects, https or loopback);
 * up to 3 attempts on transient failures only. A retry can never turn into "valid": the kernel decides. */
async function fetchText(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await boundedFetch(url, { headers: { accept: 'application/json', 'user-agent': 'pqc-receipt-verify-action/2' }, timeoutMs: FETCH_TIMEOUT_MS, maxBytes: MAX_BODY_BYTES });
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
    try { b64decodeStrict(k, ML_DSA_65_PK_BYTES, 'trusted-keys entry'); } catch { throw new UsageError(`trusted-keys entry "${src_oneLine(k.slice(0, 16))}…" is not a canonical base64 ML-DSA-65 public key (${ML_DSA_65_PK_BYTES} bytes)`); }
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
    if (!/^(eip155:[0-9]{1,12}|solana:[a-z][a-z-]{0,31})$/.test(chain) || !isHttpUrl(url)) throw new UsageError(`rpc entry "${src_oneLine(item, 120)}" must look like eip155:5042=https://… or solana:devnet=https://…`);
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
  opts.policy.requireKnownAnchorer = boolInput('require-known-anchorer', false);
  for (const [inp, key] of [['min-confirmations', 'minConfirmations'], ['rpc-quorum', 'rpcQuorum'], ['max-clock-skew-sec', 'maxClockSkewSec']]) {
    const n = intInput(inp); if (n !== undefined) opts.policy[key] = n;
  }
  if (boolInput('anchors', false)) opts.checkAnchors = true;
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
    try { roots = parseJsonStrict(raw); } catch (e) { throw inputError(`trust-roots: ${e?.code ?? 'JSON_INVALID'} ${src_oneLine(e?.detail ?? '', 120)}`, e?.code ?? 'JSON_INVALID'); }
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
  else throw inputError(`receipt "${src_oneLine(receiptInput, 120)}" is neither an existing file, a 64-hex receipt id, nor an https URL`);
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
    opts.directory = isHttpUrl(directoryInput) ? await fetchText(directoryInput) : readRaw(directoryInput);
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
  setOutput('reason', src_oneLine(reason));

  const L = v.levels || {};
  const fmt = (x) => (x === true ? 'yes' : x === false ? 'NO' : '-');
  process.stdout.write(`kernel: ${KERNEL_PIN} (spec ${SPEC_VERSION}, self-test ${SELF_TEST.ok ? 'ok' : 'FAILED'})\n`);
  process.stdout.write(`receipt: ${src_oneLine(source)}\n`);
  for (const n of notes) process.stdout.write(`note: ${src_oneLine(n)}\n`);
  process.stdout.write(`${valid ? 'VALID' : 'INVALID'} kind=${kind || '-'} trust_basis=${basis} integrity=${fmt(L.integrity)} authentic=${fmt(L.authentic)} trusted=${fmt(L.trusted)} time_anchored=${fmt(L.time_anchored)} finalized=${fmt(L.finalized)}\n`);
  if (kid) process.stdout.write(`key: kid=${kid} status=${src_oneLine(v.key?.status ?? '-')} time_basis=${src_oneLine(v.key?.time_basis ?? '-')}${epoch ? ` directory_epoch=${epoch}` : ''}\n`);
  for (const a of v.anchors || []) process.stdout.write(`anchor: ${src_oneLine(a.ref ?? '?', 80)} ${a.counts ? 'counted' : 'refused'}${a.facts ? ` time=${src_oneLine(a.facts.time)} finalized=${src_oneLine(a.facts.finalized)} class=${src_oneLine(a.facts.network_class)}` : ''}\n`);
  if ((v.overrides || []).length) process.stdout.write(`overrides: ${src_oneLine(v.overrides.join(', '))}\n`);
  for (const r of v.reasons || []) process.stdout.write(`reason: [${src_oneLine(r.level, 20)}] ${src_oneLine(r.code, 64)}: ${src_oneLine(r.detail, 300)}\n`);

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
  try { setOutput('valid', 'false'); setOutput('reason', src_oneLine(`internal error: ${e && e.message}`)); } catch { /* ignore */ }
  process.stdout.write(`::error::${esc(src_oneLine(`PQC receipt verify internal error: ${e && e.message}`))}\n`);
  process.exitCode = 1;
});

