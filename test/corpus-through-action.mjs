#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
/**
 * The Trust Kernel v2 corpus (vendored, manifest-checked, 129 vectors) executed THROUGH THE ACTION:
 * every vector becomes a workspace (receipt file with the exact bytes, directory / history / roots /
 * anchor-ref files) plus INPUT_* step inputs, dist/index.js runs as the runner would, and the verdict is
 * rebuilt from $GITHUB_OUTPUT only (valid, the five level outputs, trust-basis, exit-code, codes). It must
 * meet the corpus's own pass criteria (vendored corpus/run.mjs `compare`).
 *
 * JSON-RPC transcripts are served by a loopback HTTP server (replay://NAME -> http://127.0.0.1:PORT/<vector>/NAME,
 * matched on url+method+JCS(params) as in corpus/README.md §3); the vector's clock is fixed by a test preload.
 *
 *   node test/corpus-through-action.mjs [--only ID] [--jobs N]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT, workspace, runAction, injectedCommandLines } from './support/runner.mjs';
import { resolveRefs, compare } from '../vendor/pqc-receipts-colosseum/corpus/run.mjs';
import { parseJsonStrict, sha256hex, jcs } from '../vendor/pqc-receipts-colosseum/kernel/src/index.mjs';

const CORPUS = path.join(ROOT, 'vendor', 'pqc-receipts-colosseum', 'corpus');
const SHIM = new URL('./support/corpus-shim.mjs', import.meta.url).href;
const LEVELS = ['integrity', 'authentic', 'trusted', 'time_anchored', 'finalized'];

export function loadCorpus() {
  const manifest = parseJsonStrict(readFileSync(path.join(CORPUS, 'manifest.json'), 'utf8'));
  const files = readdirSync(path.join(CORPUS, 'vectors')).filter((f) => f.endsWith('.json')).sort();
  const ids = Object.keys(manifest.vectors || {}).sort();
  if (files.length === 0 || ids.length === 0 || manifest.count !== ids.length) throw new Error('empty corpus or manifest count mismatch');
  if (files.length !== ids.length || ids.some((i) => !files.includes(`${i}.json`))) throw new Error('vectors/ and manifest.json disagree');
  return ids.map((id) => {
    const raw = readFileSync(path.join(CORPUS, 'vectors', `${id}.json`));
    if (sha256hex(raw) !== manifest.vectors[id]) throw new Error(`${id}: vector file hash != manifest`);
    return resolveRefs(parseJsonStrict(raw.toString('utf8')));
  });
}

/** One loopback JSON-RPC server for all vectors: /<slot>/<name> answers from that vector's transcript. */
export async function replayServer() {
  const slots = new Map();
  const key = (url, method, params) => `${url}\u0000${method}\u0000${jcs(params ?? [])}`;
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      const m = /^\/([0-9]+)\/([A-Za-z0-9._-]+)$/.exec(req.url || '');
      let rpc; try { rpc = JSON.parse(body); } catch { rpc = {}; }
      const map = m ? slots.get(m[1]) : undefined;
      const hit = map?.get(key(`replay://${m[2]}`, rpc.method, rpc.params));
      const out = !hit ? { jsonrpc: '2.0', id: rpc.id ?? null, error: { code: -32601, message: `not in transcript: ${rpc.method}` } }
        : hit.error !== undefined ? { jsonrpc: '2.0', id: rpc.id, error: hit.error } : { jsonrpc: '2.0', id: rpc.id, result: hit.result };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(out));
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  return {
    port,
    register(slot, transcript) { const map = new Map(); for (const t of transcript || []) map.set(key(t.url, t.method, t.params), t); slots.set(String(slot), map); },
    url: (slot, replayUrl) => { const m = /^replay:\/\/([A-Za-z0-9._-]+)$/.exec(replayUrl); if (!m) throw new Error(`unexpected rpc url ${replayUrl}`); return `http://127.0.0.1:${port}/${slot}/${m[1]}`; },
    close: () => new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); }),
  };
}

/** Vector context -> workspace files + step inputs (the only channel into the Action). */
export function vectorToStep(vec, slot, server) {
  const ctx = vec.context || {}; const o = ctx.options || {}; const p = o.policy || {};
  const files = {};
  const inputs = {};
  files['receipt.json'] = vec.input.receipt_text !== undefined ? vec.input.receipt_text : JSON.stringify(vec.input.receipt);
  inputs.receipt = 'receipt.json';
  inputs.kind = o.kind !== undefined ? o.kind : Array.isArray(o.kinds) ? o.kinds.join(',') : '';
  if (o.expected_id !== undefined) inputs['expected-id'] = o.expected_id;
  if (ctx.directory !== undefined) { files['directory.json'] = JSON.stringify(ctx.directory); inputs['key-directory'] = 'directory.json'; }
  else inputs['key-directory'] = '';
  if (ctx.directory_history !== undefined) { files['history.json'] = JSON.stringify(ctx.directory_history); inputs['directory-history'] = 'history.json'; }
  if (ctx.roots !== undefined) { files['trust-roots.json'] = JSON.stringify(ctx.roots); inputs['trust-roots'] = 'trust-roots.json'; }
  if (o.trusted_keys !== undefined) { files['trusted-keys.txt'] = o.trusted_keys.length ? o.trusted_keys.join('\n') + '\n' : '# (empty pinned set)\n'; inputs['trusted-keys'] = 'trusted-keys.txt'; }
  if (o.governance_key !== undefined) inputs['governance-key'] = o.governance_key;
  if (o.allow_tls_directory === true) inputs['allow-tls-directory'] = 'true';
  if (o.check_anchors === true) inputs.anchors = 'true';
  if (o.anchors !== undefined) { files['anchor-refs.json'] = JSON.stringify(o.anchors); inputs['anchor-refs'] = 'anchor-refs.json'; }
  if (o.rpc !== undefined) inputs.rpc = Object.entries(o.rpc).flatMap(([chain, urls]) => urls.map((u) => `${chain}=${server.url(slot, u)}`)).join('\n');
  if (o.solana_signers !== undefined) inputs['solana-signers'] = o.solana_signers.join(',');
  if (p.require !== undefined) inputs.require = p.require.join(',');
  if (p.allow_testnet_anchors !== undefined) inputs['allow-testnet-anchors'] = String(p.allow_testnet_anchors);
  if (p.require_known_anchorer !== undefined) inputs['require-known-anchorer'] = String(p.require_known_anchorer);
  if (p.min_confirmations !== undefined) inputs['min-confirmations'] = String(p.min_confirmations);
  if (p.rpc_quorum !== undefined) inputs['rpc-quorum'] = String(p.rpc_quorum);
  if (p.max_clock_skew_sec !== undefined) inputs['max-clock-skew-sec'] = String(p.max_clock_skew_sec);
  const known = new Set(['kind', 'kinds', 'expected_id', 'trusted_keys', 'governance_key', 'allow_tls_directory', 'check_anchors', 'anchors', 'rpc', 'solana_signers', 'policy']);
  for (const k of Object.keys(o)) if (!known.has(k)) throw new Error(`${vec.id}: corpus option ${k} has no Action input mapping`);
  const extraEnv = { CORPUS_SHIM_NOW: String(ctx.now) };
  if (vec.input.prime_json) { files['.prime.json'] = JSON.stringify(vec.input.prime_json); }
  return { files, inputs, extraEnv };
}

/** Verdict as seen from the step outputs alone. */
export function verdictFromOutputs(out) {
  const lv = (s) => (s === 'true' ? true : s === 'false' ? false : s === '' ? null : `?${s}`);
  return {
    valid: out.valid === 'true' ? true : out.valid === 'false' ? false : `?${out.valid}`,
    levels: Object.fromEntries(LEVELS.map((l) => [l, lv(out[l])])),
    trust_basis: out['trust-basis'],
    exit_code: Number(out['exit-code']),
    reasons: (out.codes || '').split(',').filter(Boolean).map((code) => ({ code })),
  };
}

export async function runCorpus({ only = null, jobs = 8, onResult = () => {} } = {}) {
  const vectors = loadCorpus().filter((v) => !only || v.id === only);
  const server = await replayServer();
  const results = [];
  let next = 0;
  async function worker() {
    while (next < vectors.length) {
      const slot = next++; const vec = vectors[slot];
      server.register(slot, vec.context.rpc_transcript);
      const step = vectorToStep(vec, slot, server);
      const ws = workspace(step.files);
      if (step.files['.prime.json']) step.extraEnv.CORPUS_SHIM_PRIME_FILE = path.join(ws, '.prime.json');
      const r = await runAction(ws, step.inputs, { extraEnv: step.extraEnv, preload: [SHIM] });
      const v = verdictFromOutputs(r.out);
      const errs = compare(v, vec.expect);
      const wantExit = vec.expect.valid ? 0 : 1;
      if (r.code !== wantExit) errs.push(`process exit ${r.code} != ${wantExit}`);
      const inj = injectedCommandLines(r.log);
      if (inj.length) errs.push(`workflow-command lines in log: ${JSON.stringify(inj).slice(0, 200)}`);
      if (!/^[0-9]+$/.test(r.out['exit-code'] ?? '')) errs.push('exit-code output missing');
      const res = { id: vec.id, ok: errs.length === 0, errs, out: r.out, ms: r.ms, log: r.log };
      results.push(res); onResult(res);
    }
  }
  try { await Promise.all(Array.from({ length: Math.max(1, jobs) }, worker)); } finally { await server.close(); }
  results.sort((a, b) => a.id.localeCompare(b.id));
  return { total: vectors.length, pass: results.filter((r) => r.ok).length, results };
}

const isMain = import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  const jobs = args.includes('--jobs') ? Number(args[args.indexOf('--jobs') + 1]) : 8;
  const t0 = Date.now();
  const r = await runCorpus({ only, jobs });
  const rows = [];
  for (const x of r.results) {
    if (!x.ok) console.log(`FAIL ${x.id}: ${x.errs.join('; ')}\n     reason: ${x.out.reason ?? '(none)'}`);
    rows.push({ id: x.id, ok: x.ok, valid: x.out.valid, levels: LEVELS.map((l) => x.out[l] || '-').join('/'), trust_basis: x.out['trust-basis'], exit_code: x.out['exit-code'], codes: x.out.codes });
  }
  if (args.includes('--table')) writeFileSync(args[args.indexOf('--table') + 1], JSON.stringify(rows, null, 1));
  console.log(`corpus through the Action (dist/index.js, runner-emulated): ${r.pass}/${r.total} vectors pass  [${((Date.now() - t0) / 1000).toFixed(1)} s]`);
  process.exit(r.pass === r.total && r.total > 0 ? 0 : 1);
}
