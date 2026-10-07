#!/usr/bin/env bash
# Run dist/index.js exactly as the Actions runner would: every input of action.yml set as INPUT_* (hyphens kept,
# defaults applied by test/support/runner.mjs), GITHUB_OUTPUT, GITHUB_STEP_SUMMARY, GITHUB_WORKSPACE.
# Uses $NODE (default: node) so it can be pinned to Node 20. Live scenarios hit https://fractalai.net.co and the
# public Arc / Arbitrum One RPCs (read-only); set OFFLINE=1 to skip them.
set -u
cd "$(dirname "$0")/.."
NODE="${NODE:-node}"
exec "$NODE" --input-type=module -e '
import { workspace, runAction } from "./test/support/runner.mjs";
import { copyFileSync, readFileSync } from "node:fs";
const ID = "fe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee";
const ALL = "integrity,authentic,trusted,time_anchored,finalized";
const ws = workspace();
for (const f of ["genuine-fe62b072.json", "tampered-fe62b072.json", "key-directory-epoch3.json", "anchor-record-arc-fe62b072.json", "trusted-keys.txt"]) copyFileSync(`test/vectors/${f}`, `${ws}/${f}`);
const PIN = JSON.parse(readFileSync("test/vectors/genuine-fe62b072.json", "utf8")).public_key;
const off = process.env.OFFLINE === "1";
// [name, live?, inputs, expected outputs]
const S = [
  ["live: receipt id -> public directory (pinned roots)", true, { receipt: ID }, { valid: "true", "trust-basis": "pinned-root", kid: "86c139c960bb274c", epoch: "3", trusted: "true", time_anchored: "" }],
  ["live: receipt id + Arc anchor, require ..finalized", true, { receipt: ID, anchors: "true", "anchor-refs": "[{\"chain_id\":5042,\"block_number\":24072596}]", require: ALL }, { valid: "true", time_anchored: "true", finalized: "true", "trust-basis": "pinned-root" }],
  ["live: Arc anchor record file, require ..finalized", true, { receipt: "anchor-record-arc-fe62b072.json", anchors: "true", require: ALL }, { valid: "true", time_anchored: "true", finalized: "true" }],
  ["live: Arbitrum One anchor, require ..finalized", true, { receipt: ID, anchors: "true", "anchor-refs": "[{\"chain_id\":42161,\"tx_hash\":\"0x37f0254389deed3953aa44333e32eaeb466f28ff41ac9299eb5285599a7a1174\",\"log_index\":5}]", require: ALL }, { valid: "true", finalized: "true" }],
  ["live: Arc anchor at the WRONG block (must fail)", true, { receipt: ID, anchors: "true", "anchor-refs": "[{\"chain_id\":5042,\"block_number\":24072597}]", require: ALL }, { valid: "false", trusted: "true", time_anchored: "false", "exit-code": "13" }],
  ["live: unknown receipt id (must fail)", true, { receipt: "a".repeat(64) }, { valid: "false", "exit-code": "3" }],
  ["live: tampered file -> public directory (must fail)", true, { receipt: "tampered-fe62b072.json" }, { valid: "false", integrity: "false" }],
  ["offline: genuine + directory snapshot file (pinned roots, no governance-key)", false, { receipt: "genuine-fe62b072.json", "key-directory": "key-directory-epoch3.json" }, { valid: "true", "trust-basis": "pinned-root", epoch: "3" }],
  ["offline: genuine + trusted-keys file (override)", false, { receipt: "genuine-fe62b072.json", "trusted-keys": "trusted-keys.txt", "key-directory": "" }, { valid: "true", "trust-basis": "override" }],
  ["offline: tampered + pinned key (must fail)", false, { receipt: "tampered-fe62b072.json", "trusted-keys": PIN, "key-directory": "" }, { valid: "false" }],
  ["offline: tampered, fail-on-invalid=false (soft)", false, { receipt: "tampered-fe62b072.json", "trusted-keys": PIN, "key-directory": "", "fail-on-invalid": "false" }, { valid: "false" }],
  ["offline: missing receipt input (must fail)", false, { "key-directory": "" }, { valid: "false", "exit-code": "2" }],
  ["offline: nonexistent file (must fail)", false, { receipt: "nope.json", "key-directory": "" }, { valid: "false", "exit-code": "3" }],
];
let pass = 0, fail = 0;
for (const [name, live, inputs, want] of S) {
  if (live && off) continue;
  const r = await runAction(ws, inputs);
  const soft = inputs["fail-on-invalid"] === "false";
  const wantExit = want.valid === "true" || soft ? 0 : 1;
  const bad = Object.entries(want).filter(([k, v]) => r.out[k] !== v).map(([k, v]) => `${k}=${r.out[k]} (want ${v})`);
  if (r.code !== wantExit) bad.push(`exit=${r.code} (want ${wantExit})`);
  if (bad.length) { fail++; console.log(`FAIL  ${name}: ${bad.join(", ")}\n      reason: ${r.out.reason}`); }
  else { pass++; console.log(`PASS  ${name.padEnd(76)} valid=${r.out.valid} levels=${["integrity","authentic","trusted","time_anchored","finalized"].map((l) => r.out[l] || "-").join("/")} basis=${r.out["trust-basis"]} ${r.ms}ms`); }
}
console.log(`local action runs: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
'
