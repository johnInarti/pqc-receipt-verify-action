# FractalAI PQC Receipt Verify — v2 (Trust Kernel v2)

A GitHub Action that verifies FractalAI **post-quantum signed receipts** (ML-DSA-65, the FIPS 204 algorithm)
and reports a **leveled verdict**: `integrity → authentic → trusted → time_anchored → finalized`.
It fails the job unless every level you `require` holds.

v2 makes **no trust decision of its own.** Every decision is taken by
[Trust Kernel v2](https://github.com/johnInarti/pqc-receipts-colosseum/blob/b9e1967e9d6c6825e025f701a6752eac95c2f2e7/spec/TRUST-KERNEL.md),
the single reference implementation, **vendored byte-exact** at commit
[`b9e1967`](https://github.com/johnInarti/pqc-receipts-colosseum/tree/b9e1967e9d6c6825e025f701a6752eac95c2f2e7)
(`vendor/pqc-receipts-colosseum/`, listed file by file with git blob ids in `vendor/VENDOR.json`) and bundled into
`dist/index.js` with ncc. `src/index.js` only reads inputs, hands raw bytes and an explicit policy to the kernel,
and publishes its verdict. The kernel's whole adversarial corpus (129 vectors) is run **through the Action** in CI.

```yaml
- uses: johnInarti/pqc-receipt-verify-action@<full-commit-sha> # v2.x — pin the SHA, not the movable v2 tag
  id: receipt
  with:
    receipt: fe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee
- env:            # pass outputs through env, never interpolate ${{ }} into the script
    VALID: ${{ steps.receipt.outputs.valid }}
    BASIS: ${{ steps.receipt.outputs.trust-basis }}
    KID: ${{ steps.receipt.outputs.kid }}
  run: |
    echo "valid=$VALID trust_basis=$BASIS kid=$KID"
    test "$VALID" = "true"        # gate on == "true"; never on != "false"
    test "$BASIS" = "pinned-root" # optional: refuse verdicts that rest on an override
```

With an on-chain time proof (the receipt existed by a finalized block time on Arc mainnet):

```yaml
- uses: johnInarti/pqc-receipt-verify-action@<full-commit-sha>
  with:
    receipt: fe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee
    anchors: 'true'
    anchor-refs: '[{"chain_id":5042,"block_number":24072596}]'
    require: integrity,authentic,trusted,time_anchored,finalized
```

## Levels (what each one proves)

| level | true means | typical failure codes |
|---|---|---|
| `integrity` | Strict JSON (no duplicate keys, BOM, NaN, lone surrogates, > 2 MiB, depth > 32); the kind **you** chose; every unsigned duplicate (`receipt_id`, `served_message`, `facts`, `emitted_at`, `snapshot`…) equals the signed content | `JSON_*`, `KIND_*`, `RECEIPT_ID_MISMATCH`, `UNSIGNED_FIELD_MISMATCH`, `EXPECTED_ID_MISMATCH` |
| `authentic` | ML-DSA-65 verifies over the message **rebuilt by the kernel** from the kind's fixed domain | `SIGNATURE_INVALID` |
| `trusted` | The key is listed in a directory signed by the **pinned governance key**, chained to the **pinned epoch-3 checkpoint** (anti-rollback, append-only), with the right `use`, and authorized **at the signed time** (revoked keys only with an anchor older than the revocation) — or it is in your `trusted-keys` override | `DIRECTORY_SIGNER_NOT_PINNED`, `DIRECTORY_ROLLBACK`, `KEY_NOT_LISTED`, `KEY_REVOKED`, `KEY_NEEDS_SIGNED_TIME`, `NO_TRUST_SOURCE` |
| `time_anchored` | A `ReceiptAnchored` event from the **pinned** contract + runtime code hash (Arc 5042, Arbitrum One 42161) or an SPL Memo from an announced Solana signer binds this receipt's signature, payload hash, kid and signed time to a block whose **header** time is ≥ the signed time | `ANCHOR_*`, `RPC_DISAGREEMENT`, `SOL_*` |
| `finalized` | That anchor is in a finalized block (every configured RPC agrees) | `NOT_FINALIZED` |

`time_anchored` / `finalized` are `""` (not evaluated) unless `anchors: true` or `require` names them.

## Inputs

| input | default | meaning |
|---|---|---|
| `receipt` | (required) | Workspace file (≤ 2 MiB, symlinks resolved, must stay in `GITHUB_WORKSPACE`/`RUNNER_TEMP`); a 64-hex id (always fetched by id from `<key-directory origin>/api/midas/alerts/receipt/<id>` and bound to it); or an `https://` URL. An anchor record `{ "seal": …, "anchor"?: … }` is unwrapped to its seal. |
| `kind` | `midas-alert` | Expected kind(s), comma-separated: `midas-alert`, `x402-seal`, `acp-verdict`, `served-proof`, `self-attest-seal`. **Policy, never read from the document.** `''` → refused (`KIND_UNKNOWN`). |
| `require` | `integrity,authentic,trusted` | Levels that must all be true for `valid=true`. `integrity` is always added. |
| `anchors` | `false` | Evaluate time proofs (implied by `require` containing `time_anchored`/`finalized`). |
| `anchor-refs` | `''` | Anchor hints: inline JSON or a workspace file (object or array ≤ 8). Default: the receipt's `anchor`/`anchors`. Hints only — every fact comes from the chain. |
| `rpc` | `''` | `CHAIN=URL` per line (`eip155:5042=https://…`, `solana:devnet=https://…`). Several URLs per chain are cross-checked and must agree. Default: the pinned `default_rpc` of each deployment. |
| `allow-testnet-anchors` | `false` | Count test-network anchors (they stay `network_class=test`). |
| `require-known-anchorer` | `false` | Count an EVM anchor only if sent by a known FractalAI anchorer. |
| `min-confirmations` / `rpc-quorum` / `max-clock-skew-sec` | kernel defaults (1 / 1 / 900) | Policy knobs. |
| `expected-id` | `''` | 64-hex content id the receipt must have (binds a file/URL to the receipt you meant). |
| `key-directory` | public FractalAI directory | https URL or workspace file. **Verified against the pinned roots either way.** `''` → no directory (only `trusted-keys` can then establish trust). |
| `directory-history` | `''` | Intermediate epochs between the checkpoint and `key-directory` (workspace files). |
| `trust-roots` | `''` | **Override**: a file replacing the baked `kernel/trust-roots.json` → `trust-basis=override`. |
| `trusted-keys` | `''` | **Override**: pinned base64 ML-DSA-65 keys (inline or file, `#` comments) → `trust-basis=override`; the directory is not consulted. An empty set is refused (`NO_TRUST_SOURCE`), never a fallback. |
| `governance-key` | `''` | **Override**: another directory signer → `trust-basis=override`; the baked checkpoint (anti-rollback) no longer applies. |
| `allow-tls-directory` | `false` | **Override**: accept a directory signed by any key (v1 behaviour) → `trust-basis=tls`. Not recommended. |
| `solana-signers` | `''` | **Override**: Solana anchor signers instead of the announced ones. |
| `timeout-seconds` | `300` | Hard deadline for the whole step (5–900 s); on expiry `valid=false`. Each HTTP request also has a 20 s deadline covering headers **and** body, and a streamed 2 MiB cap. |
| `fail-on-invalid` | `true` | Only `false`/`0`/`no`/`off` soften it (step passes, `valid=false`, warning). |

Booleans that widen trust accept only `true/false/1/0/yes/no/on/off`; anything else is a usage error (`valid=false`).

## Outputs

| output | values |
|---|---|
| `valid` | `"true"` only if every required level is true. Written as `"false"` **first**, so a crash never leaves it empty. |
| `integrity`, `authentic`, `trusted`, `time_anchored`, `finalized` | `"true"` / `"false"` / `""` (not evaluated) |
| `trust-basis` | `pinned-root` · `override` · `tls` · `none` |
| `kid` | 16 hex (`sha256(public_key_b64)[:16]`), empty unless the signature verified |
| `epoch` | directory epoch (digits), empty with `trusted-keys` or a refused directory |
| `kind` | the kind the kernel verified |
| `codes` | comma-separated kernel reason codes (`[A-Z0-9_]`) |
| `exit-code` | kernel exit code: 0 valid · 10 integrity · 11 authentic · 12 trusted · 13 time_anchored · 14 finalized · 2 usage · 3 input |
| `reason` | one line, escaped |

Every output is validated before it is written (enums, hex, digits); untrusted text reaches the log and the job
summary only as one escaped line (no workflow commands, no Markdown/HTML injection, no bidi overrides).

## Migrating from v1

v2 is a **major** version. What changes for an existing `@v1` step:

| v1 | v2 |
|---|---|
| Any supported shape was accepted (MIDAS alert or bare served proof). | The kind is policy: default `midas-alert`. For served proofs / notary seals / ACP verdicts set `kind:`. |
| Directory trusted if its own signature verified (**TLS-only** trust in the host). | Directory must be signed by the **pinned governance key** and chain to the **pinned epoch-3 checkpoint** (no rollback, append-only). `trust-basis=pinned-root`. |
| A `key-directory` **file** required `governance-key`. | Not needed: a file is verified against the pinned roots. `governance-key` is now an explicit **override** (`trust-basis=override`, disables the checkpoint). |
| `trusted-keys` → `valid=true` silently. | Same behaviour, now reported as `trust-basis=override` + a `::notice::`. Gate on `trust-basis == 'pinned-root'` if you need the pinned roots. |
| Lifecycle: `active` in window or `retiring` with signed `emitted_at ≤ not_after`; `revoked` always refused. | Kernel §6.3: key `use` must match the kind; `active` needs `not_before`; `retiring`/`retired` only with a signed time inside `[not_before, not_after]`; `revoked` accepted only with a counted anchor older than `revoked_at`; signed time in the future refused. |
| `JSON.parse` (duplicate keys: last wins). | Strict parser: duplicate keys, BOM, NaN/Infinity, lone surrogates, depth > 32 → `integrity=false`. |
| `snapshot` not checked. | `snapshot` must hash to the signed `snapshot_hash`. |
| Outputs `valid`, `kid`, `epoch`, `reason`. | Same four (same formats), plus the five level outputs, `trust-basis`, `kind`, `codes`, `exit-code`. `reason` wording changed (now `[level] CODE: detail`). |
| — | New: `require`, `anchors`, `anchor-refs`, `rpc`, `allow-testnet-anchors`, `require-known-anchorer`, `min-confirmations`, `rpc-quorum`, `max-clock-skew-sec`, `expected-id`, `directory-history`, `trust-roots`, `allow-tls-directory`, `solana-signers`, `timeout-seconds`. |

To reproduce v1's TLS-only trust explicitly: `allow-tls-directory: true` (reported as `trust-basis=tls`).

### Security notes for workflow authors

- **Pin by commit SHA.** `@v2` is a movable tag; `@<sha>` is immutable.
- **Overrides must not come from the code under test.** On `pull_request`, files in the checkout (and the workflow)
  come from the PR. A `trust-roots`, `trusted-keys`, `key-directory` or receipt file in the PR tree is
  attacker-controlled. Without overrides a PR can only supply data that the **pinned** roots then judge; overrides
  belong inline in a workflow on the protected branch. Treat a PR run as advisory.
- **A 64-hex `receipt` is always fetched by id** and bound to that id, even if a file with that name exists.

## Limits (honest — read before relying on it)

- **A verdict states facts about bytes, keys and time — not truth.** A valid MIDAS alert proves FractalAI's key
  signed those numbers (and, with an anchor, that they existed by a block time). It is not a consensus-verified
  oracle reading, a liquidation guarantee, or proof of delivery.
- **The pinned roots are trust-on-first-use.** The governance key and the epoch-3 checkpoint were pinned on
  2026-10-07 from the TLS-served directory (explicit and versioned in `kernel/trust-roots.json`); the on-chain
  anchor of the directory (FractalCheckpoint) is still pending. The roots file in this bundle is the root of trust.
- **Governance key rotation is not specified in Trust Kernel 2.0.** If FractalAI rotates it, this Action refuses
  every directory (fails closed) until a new kernel version is vendored and a new Action release is cut.
- **Later epochs:** the public endpoint serves only the latest epoch. Epochs beyond 4 need intermediate epochs
  (`directory-history`), otherwise `DIRECTORY_CHAIN_GAP`.
- **RPC trust:** there is no light client. The Action believes the configured RPCs about logs, headers and
  finality; several URLs per chain raise the bar to "all of them collude". Arbitrum block time is set by the
  sequencer within protocol bounds; Arc block time by its permissioned validators; Solana `blockTime` is an estimate.
- **Retired keys** are trusted for receipts whose *signed* time falls inside their window; a leaked retired key
  could back-date. Requiring an anchor for such keys is a policy left open by the kernel spec.
- **Cryptography:** `@noble/post-quantum` 0.6.1, `@noble/hashes` 2.2.0, `@noble/curves` 2.2.0 (pure JS). Not a
  CMVP / FIPS 140-3 validated module, not "quantum-safe certified", NIST security level 3 (not CNSA 2.0).
- **No external audit** of the kernel or of this Action; internal adversarial review only.
- **Network:** a receipt id or the default directory needs network access to `fractalai.net.co`; anchors need the
  chain RPCs. A receipt file + `key-directory` file (or `trusted-keys`) runs fully offline.
- Known kernel nits found while integrating (to be reported upstream; not patched here because the kernel is vendored
  unmodified): `parseJsonStrict(Uint8Array)` and `boundedFetch` decode with a BOM-stripping `TextDecoder`, so a
  UTF-8 BOM is tolerated on those two paths (spec §8.1 says refuse). The Action hands workspace files to the kernel
  as text with the BOM kept, so files are refused; a network-fetched receipt with a BOM is tolerated (the BOM is
  outside the signed content and cannot change any level).

## Local development

```bash
npm ci                                       # Node 20; exact @noble versions = the kernel's lockfile
npm run vendor:check                         # vendored kernel == VENDOR.json (git blob ids of b9e1967)
node scripts/vendor-kernel.mjs --upstream    # same, against a fresh clone of the upstream commit (network)
npm test                                     # 53 tests, offline: migrated v1 unit tests, RT-1..RT-13, red-team PoCs,
                                             # and the 129-vector corpus THROUGH dist/index.js
npm run corpus -- --table out.json           # corpus through the Action, per-vector table
npm run build                                # ncc bundle -> dist/ (committed; reproducible on Node 20)
NODE=node ./test/run-action-local.sh         # runner-emulated scenarios, live ones included (OFFLINE=1 to skip)
```

How the corpus runs through the Action (`test/corpus-through-action.mjs`): each vector becomes a workspace (receipt
file with the exact bytes, directory/history/roots/anchor-ref files) plus `INPUT_*` inputs, with action.yml defaults
applied as the runner does; JSON-RPC transcripts are served by a loopback server; the vector clock is fixed by a
test-only `--import` preload (the bundle has no test hooks). The verdict is rebuilt from `$GITHUB_OUTPUT` alone and
judged by the corpus's own `compare`.

To move to a newer kernel: `git clone` upstream, check out the new commit, set `commit` in `vendor/VENDOR.json`,
`node scripts/vendor-kernel.mjs --update <clone>`, `npm run build`, `npm test`.

Vectors in `test/vectors/`: `genuine-fe62b072.json` (real public receipt), `tampered-fe62b072.json`,
`key-directory-epoch3.json` (real directory snapshot), `anchor-record-arc-fe62b072.json` (Arc mainnet anchor record),
`conformance-x402-served.json`, `rt-poc/` (the 2026-10-06 red-team PoC inputs, verbatim).

## License

Apache-2.0. The vendored kernel, corpus and spec are Apache-2.0 (`vendor/pqc-receipts-colosseum/LICENSE`).
Copyright 2026 FRACTAL AI S.A.S. Contact: softnextceo@gmail.com · https://fractalai.net.co

---

## PQC Readiness Scan has moved to its own repository

The second action in this repository, which scans any repository for quantum-vulnerable
cryptography and emits a CycloneDX CBOM, now lives at the root of
**[johnInarti/pqc-readiness-action](https://github.com/johnInarti/pqc-readiness-action)**:

```yaml
- uses: johnInarti/pqc-readiness-action@v1
```

The `uses:` line is shorter, and the GitHub Marketplace lists only one action per repository and
only from its root, so a subdirectory action can never appear there.

The old path still works. `readiness-scan/` keeps a forwarder with the same inputs and outputs, so
a workflow already pinned to `…/readiness-scan@v2.1.0` keeps running and keeps receiving
improvements. See [`readiness-scan/README.md`](readiness-scan/README.md).
