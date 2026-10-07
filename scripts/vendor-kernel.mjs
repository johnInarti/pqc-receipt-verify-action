#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
/**
 * The Trust Kernel is VENDORED, never re-implemented: vendor/pqc-receipts-colosseum/ is a byte-exact
 * `git archive` of kernel/, corpus/, spec/ and LICENSE from the pinned upstream commit. vendor/VENDOR.json
 * lists every file with its git blob id (as `git ls-tree -r <commit>` prints it).
 *
 *   node scripts/vendor-kernel.mjs --check            offline: vendored tree == VENDOR.json (no extra/missing/changed file)
 *   node scripts/vendor-kernel.mjs --upstream [DIR]   network: clone upstream (or use DIR), check out the pinned commit and
 *                                                     compare `git ls-tree` with VENDOR.json
 *   node scripts/vendor-kernel.mjs --update DIR       regenerate vendor/ + VENDOR.json from a clone at the pinned commit
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, rmSync, mkdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const VDIR = path.join(ROOT, 'vendor', 'pqc-receipts-colosseum');
const MANIFEST = path.join(ROOT, 'vendor', 'VENDOR.json');
const PATHS = ['kernel', 'corpus', 'spec', 'LICENSE'];

const blobId = (buf) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
function walk(dir, rel = '') {
  const out = [];
  for (const e of readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(dir, r));
    else if (e.isFile()) out.push(r);
    else throw new Error(`unexpected non-regular file in vendor tree: ${r}`);
  }
  return out;
}
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 64 << 20 });
function lsTree(clone, commit) {
  const files = {};
  for (const line of git(clone, 'ls-tree', '-r', commit, '--', ...PATHS).split('\n').filter(Boolean)) {
    const m = /^(\d+) blob ([0-9a-f]{40})\t(.+)$/.exec(line);
    if (!m) throw new Error(`unexpected ls-tree line: ${line}`);
    files[m[3]] = m[2];
  }
  return files;
}

export function checkVendored() {
  const man = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const want = man.files; const errs = [];
  const have = walk(VDIR).sort();
  for (const f of have) {
    if (!(f in want)) { errs.push(`extra file ${f}`); continue; }
    const id = blobId(readFileSync(path.join(VDIR, f)));
    if (id !== want[f]) errs.push(`changed file ${f} (${id} != ${want[f]})`);
  }
  for (const f of Object.keys(want)) if (!have.includes(f)) errs.push(`missing file ${f}`);
  if (Object.keys(want).length === 0) errs.push('empty manifest');
  return { man, errs, count: have.length };
}

const isMain = import.meta.url === new URL(`file://${process.argv[1]}`).href;
const [mode, arg] = isMain ? process.argv.slice(2) : ['--library'];
if (mode === '--library') { /* imported by the tests */ }
else if (mode === '--check' || mode === undefined) {
  const { man, errs, count } = checkVendored();
  for (const e of errs) console.log(`FAIL ${e}`);
  console.log(`vendor: ${count} files, ${errs.length ? 'MISMATCH' : 'byte-identical'} to ${man.repository}@${man.commit}`);
  process.exit(errs.length ? 1 : 0);
} else if (mode === '--upstream' || mode === '--update') {
  const man = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  let clone = arg;
  if (!clone) { if (mode === '--update') throw new Error('--update needs a clone directory'); clone = mkdtempSync(path.join(tmpdir(), 'kernel-')); git(clone, 'clone', '-q', man.repository, '.'); }
  const commit = git(clone, 'rev-parse', `${man.commit}^{commit}`).trim();
  if (commit !== man.commit) throw new Error(`pinned commit ${man.commit} resolves to ${commit}`);
  const files = lsTree(clone, commit);
  if (mode === '--update') {
    rmSync(VDIR, { recursive: true, force: true }); mkdirSync(VDIR, { recursive: true });
    execFileSync('sh', ['-c', `git archive ${commit} ${PATHS.join(' ')} | tar -x -C "${VDIR}"`], { cwd: clone });
    writeFileSync(MANIFEST, JSON.stringify({ ...man, files }, null, 1) + '\n');
    console.log(`vendored ${Object.keys(files).length} files from ${commit}`);
  } else {
    const a = JSON.stringify(Object.entries(files).sort()), b = JSON.stringify(Object.entries(man.files).sort());
    console.log(a === b ? `upstream ${commit}: VENDOR.json matches (${Object.keys(files).length} files)` : 'upstream tree DIFFERS from VENDOR.json');
    const { errs } = checkVendored();
    process.exit(a === b && errs.length === 0 ? 0 : 1);
  }
} else { console.error('usage: vendor-kernel.mjs --check | --upstream [DIR] | --update DIR'); process.exit(2); }
