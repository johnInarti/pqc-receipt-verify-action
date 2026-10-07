#!/usr/bin/env bash
# Run dist/index.js exactly as the Actions runner would: INPUT_* env vars (hyphens kept), GITHUB_OUTPUT,
# GITHUB_STEP_SUMMARY, GITHUB_WORKSPACE. Uses $NODE (default: node) so it can be pinned to Node 20.
# Network scenarios (receipt id / default directory) hit https://fractalai.net.co; set OFFLINE=1 to skip them.
set -u
cd "$(dirname "$0")/.."
NODE="${NODE:-node}"
ROOT="$(pwd)"
TMP="$(mktemp -d)"
pass=0; fail=0
GENUINE_ID=fe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee
PINNED_KEY="$(${NODE} -e 'process.stdout.write(require("./test/vectors/genuine-fe62b072.json").public_key)')"

# scenario <name> <expected-exit> <expected-valid> [VAR=value ...]
scenario() {
  local name="$1" want_exit="$2" want_valid="$3"; shift 3
  : > "$TMP/out"; : > "$TMP/summary"
  env -i PATH="$PATH" HOME="$HOME" GITHUB_WORKSPACE="$ROOT" GITHUB_OUTPUT="$TMP/out" GITHUB_STEP_SUMMARY="$TMP/summary" \
    "INPUT_KEY-DIRECTORY=https://fractalai.net.co/.well-known/x402-receipt-keys" "INPUT_FAIL-ON-INVALID=true" \
    "INPUT_TRUSTED-KEYS=" "INPUT_GOVERNANCE-KEY=" "$@" "$NODE" dist/index.js > "$TMP/log" 2>&1
  local code=$?
  # last write of an output name wins (the action writes valid=false first, fail-closed)
  local valid; valid="$(awk '/^valid<</{getline; v=$0} END{print v}' "$TMP/out")"
  local kid; kid="$(awk '/^kid<</{getline; v=$0} END{print v}' "$TMP/out")"
  local epoch; epoch="$(awk '/^epoch<</{getline; v=$0} END{print v}' "$TMP/out")"
  if [[ "$code" == "$want_exit" && "$valid" == "$want_valid" ]]; then
    pass=$((pass+1)); printf 'PASS  %-58s exit=%s valid=%s kid=%s epoch=%s\n' "$name" "$code" "$valid" "${kid:--}" "${epoch:--}"
  else
    fail=$((fail+1)); printf 'FAIL  %-58s exit=%s(want %s) valid=%s(want %s)\n' "$name" "$code" "$want_exit" "$valid" "$want_valid"; sed 's/^/      /' "$TMP/log"
  fi
}

if [[ "${OFFLINE:-0}" != "1" ]]; then
  scenario "live: receipt id -> live directory"                  0 true  "INPUT_RECEIPT=$GENUINE_ID"
  scenario "live: genuine file -> live directory"                0 true  "INPUT_RECEIPT=test/vectors/genuine-fe62b072.json"
  scenario "live: tampered file -> live directory (must fail)"   1 false "INPUT_RECEIPT=test/vectors/tampered-fe62b072.json"
  scenario "live: unknown receipt id (must fail)"                1 false "INPUT_RECEIPT=$(printf 'a%.0s' {1..64})"
fi
GOV_KEY="$(${NODE} -e 'process.stdout.write(require("./test/vectors/key-directory-epoch3.json").directory_public_key)')"
scenario "offline: genuine + directory snapshot file + governance pin" 0 true  "INPUT_RECEIPT=test/vectors/genuine-fe62b072.json" "INPUT_KEY-DIRECTORY=test/vectors/key-directory-epoch3.json" "INPUT_GOVERNANCE-KEY=$GOV_KEY"
scenario "offline: directory snapshot file WITHOUT governance pin (must fail)" 1 false "INPUT_RECEIPT=test/vectors/genuine-fe62b072.json" "INPUT_KEY-DIRECTORY=test/vectors/key-directory-epoch3.json"
scenario "offline: genuine + pinned trusted-keys"                0 true  "INPUT_RECEIPT=test/vectors/genuine-fe62b072.json" "INPUT_TRUSTED-KEYS=$PINNED_KEY"
scenario "offline: tampered + pinned trusted-keys (must fail)"   1 false "INPUT_RECEIPT=test/vectors/tampered-fe62b072.json" "INPUT_TRUSTED-KEYS=$PINNED_KEY"
scenario "offline: tampered, fail-on-invalid=false (soft)"       0 false "INPUT_RECEIPT=test/vectors/tampered-fe62b072.json" "INPUT_TRUSTED-KEYS=$PINNED_KEY" "INPUT_FAIL-ON-INVALID=false"
scenario "offline: genuine, wrong pinned key (must fail)"        1 false "INPUT_RECEIPT=test/vectors/genuine-fe62b072.json" "INPUT_TRUSTED-KEYS=$(${NODE} -e 'process.stdout.write(require("./test/vectors/conformance-x402-served.json").trusted_public_key)')"
scenario "offline: governance-key mismatch (must fail)"          1 false "INPUT_RECEIPT=test/vectors/genuine-fe62b072.json" "INPUT_KEY-DIRECTORY=test/vectors/key-directory-epoch3.json" "INPUT_GOVERNANCE-KEY=$PINNED_KEY"
scenario "offline: missing receipt input (must fail)"            1 false
scenario "offline: nonexistent file (must fail)"                 1 false "INPUT_RECEIPT=test/vectors/nope.json"
echo "---- summary of last scenario written to GITHUB_STEP_SUMMARY:"; head -3 "$TMP/summary"
echo "local action runs: $pass passed, $fail failed"
rm -rf "$TMP"
[[ $fail -eq 0 ]]
