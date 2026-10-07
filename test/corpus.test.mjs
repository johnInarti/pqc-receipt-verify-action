// SPDX-License-Identifier: Apache-2.0
// The full Trust Kernel v2 corpus (129 vectors, manifest-checked) executed through dist/index.js with
// runner-emulated INPUT_* (see test/corpus-through-action.mjs). 100 % or fail.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCorpus } from './corpus-through-action.mjs';

test('Trust Kernel v2 corpus through the Action: every vector meets its expected per-level verdict', async () => {
  const r = await runCorpus({ jobs: 8 });
  const fails = r.results.filter((x) => !x.ok).map((x) => `${x.id}: ${x.errs.join('; ')}`);
  assert.equal(r.total, 129, 'corpus size changed (re-vendor and review)');
  assert.deepEqual(fails, []);
  assert.equal(r.pass, r.total);
});
