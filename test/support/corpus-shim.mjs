// SPDX-License-Identifier: Apache-2.0
// Test-only preload (node --import) for the corpus run: it plays the role of the corpus runner's context,
// never of the Action. CORPUS_SHIM_NOW fixes the clock to the vector's `now`; CORPUS_SHIM_PRIME_FILE lists
// strings parsed with the engine's native JSON parser first (vector input.prime_json).
import { readFileSync } from 'node:fs';
const now = process.env.CORPUS_SHIM_NOW;
if (now !== undefined && /^[0-9]{1,12}$/.test(now)) { const ms = Number(now) * 1000; Date.now = () => ms; }
const prime = process.env.CORPUS_SHIM_PRIME_FILE;
if (prime) for (const s of JSON.parse(readFileSync(prime, 'utf8'))) { try { JSON.parse(s); } catch { /* priming only */ } }
