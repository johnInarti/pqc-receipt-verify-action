// SPDX-License-Identifier: Apache-2.0
// The kernel is vendored byte-exact at the pinned commit and the Action delegates every trust decision to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { checkVendored } from '../scripts/vendor-kernel.mjs';
import { ROOT } from './support/runner.mjs';

test('vendor/pqc-receipts-colosseum is byte-identical to johnInarti/pqc-receipts-colosseum@dab77b0 (git blob ids)', () => {
  const { man, errs, count } = checkVendored();
  assert.equal(man.commit, 'dab77b00f97e04a117882f1a5bc03f01e4add771');
  assert.deepEqual(errs, []); assert.ok(count >= 170);
});
test('src/ contains no cryptography or trust logic of its own: only the vendored kernel decides', () => {
  const src = readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const imports = [...src.matchAll(/^import [^;]*? from '([^']+)'/gm)].map((m) => m[1]).sort();
  assert.deepEqual(imports, ['../vendor/VENDOR.json', '../vendor/pqc-receipts-colosseum/kernel/src/index.mjs', 'node:crypto', 'node:fs', 'node:path'].sort());
  for (const banned of [/ml_dsa65/, /@noble\//, /\.verify\(/, /directoryRoot/, /keyAuthorizes/, /status === '(active|retiring|revoked)'/]) assert.doesNotMatch(src, banned);
  assert.match(src, /await verify\(call\.receipt, call\.opts\)/);
});
test('package.json pins the exact @noble versions of the kernel lockfile', () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(path.join(ROOT, 'vendor/pqc-receipts-colosseum/kernel/package-lock.json'), 'utf8'));
  for (const n of ['@noble/post-quantum', '@noble/hashes', '@noble/curves']) assert.equal(pkg.dependencies[n], lock.packages[`node_modules/${n}`].version, n);
});
