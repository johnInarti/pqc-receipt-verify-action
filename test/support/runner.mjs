// SPDX-License-Identifier: Apache-2.0
// Runs dist/index.js exactly like the GitHub Actions runner: every input declared in action.yml is set as
// INPUT_<NAME> (hyphens kept), with action.yml defaults for the ones the step does not pass; GITHUB_OUTPUT,
// GITHUB_STEP_SUMMARY and GITHUB_WORKSPACE point at a scratch workspace. Optional `preload` modules run
// before the bundle (test clock / JSON priming only — the bundle itself has no test hooks).
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
export const DIST = path.join(ROOT, 'dist', 'index.js');

/** Inputs + defaults declared in action.yml (the runner applies them; so do we). */
export function actionInputs() {
  const lines = readFileSync(path.join(ROOT, 'action.yml'), 'utf8').split('\n');
  const out = {}; let inInputs = false, cur = null;
  for (const l of lines) {
    if (/^inputs:\s*$/.test(l)) { inInputs = true; continue; }
    if (inInputs && /^\S/.test(l)) inInputs = false;
    if (!inInputs) continue;
    let m;
    if ((m = /^ {2}([a-z][a-z0-9_-]*):\s*$/.exec(l))) { cur = m[1]; out[cur] = ''; }
    else if (cur && (m = /^ {4}default:\s*'((?:[^']|'')*)'\s*$/.exec(l))) out[cur] = m[1].replace(/''/g, "'");
  }
  return out;
}
const DEFAULTS = actionInputs();

export function workspace(files = {}) {
  const ws = mkdtempSync(path.join(tmpdir(), 'pqcv-ws-'));
  for (const [f, c] of Object.entries(files)) writeFileSync(path.join(ws, f), typeof c === 'string' || c instanceof Uint8Array ? c : JSON.stringify(c));
  return ws;
}
export function outputs(file) {
  const o = {}; const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^([a-z_-]+)<<(ghadelim_[0-9a-f-]+)$/.exec(lines[i]); if (!m) continue;
    const v = []; i++; while (lines[i] !== m[2]) v.push(lines[i++]); o[m[1]] = v.join('\n'); // last write wins, like the runner
  }
  return o;
}
export function runnerEnv(ws, inputs = {}, extraEnv = {}) {
  for (const k of Object.keys(inputs)) if (!(k in DEFAULTS)) throw new Error(`input "${k}" is not declared in action.yml`);
  const e = { PATH: process.env.PATH, HOME: process.env.HOME, GITHUB_WORKSPACE: ws, GITHUB_OUTPUT: path.join(ws, '.out'), GITHUB_STEP_SUMMARY: path.join(ws, '.sum'), ...extraEnv };
  for (const [k, v] of Object.entries({ ...DEFAULTS, ...inputs })) e[`INPUT_${k.toUpperCase()}`] = v;
  writeFileSync(e.GITHUB_OUTPUT, ''); writeFileSync(e.GITHUB_STEP_SUMMARY, '');
  return e;
}
/** → { code, log, out, sum, ms } */
export function runAction(ws, inputs = {}, { extraEnv = {}, preload = [], node = process.execPath, timeoutMs = 120_000 } = {}) {
  const e = runnerEnv(ws, inputs, extraEnv);
  const args = [...preload.flatMap((p) => ['--import', p]), DIST];
  const t0 = Date.now();
  return new Promise((resolve) => {
    const c = spawn(node, args, { env: e, cwd: ws }); let log = '';
    const kill = setTimeout(() => c.kill('SIGKILL'), timeoutMs);
    c.stdout.on('data', (d) => (log += d)); c.stderr.on('data', (d) => (log += d));
    c.on('close', (code) => { clearTimeout(kill); resolve({ code, log, out: outputs(e.GITHUB_OUTPUT), sum: readFileSync(e.GITHUB_STEP_SUMMARY, 'utf8'), ms: Date.now() - t0 }); });
  });
}
/** Lines the runner would parse as workflow commands, other than the action's own annotations. */
export const injectedCommandLines = (log) => log.split(/\r\n|\r|\n/).filter((l) => /^\s*::/.test(l) && !/^::(error|warning|notice)::PQC receipt/.test(l));
