# FractalAI PQC Receipt Verify

A GitHub Action that verifies FractalAI **post-quantum signed receipts** (ML-DSA-65, the FIPS 204
algorithm) and **fails the job** if a receipt was altered or was signed by a key that is not trusted.

It is fail-closed: `valid` is `true` only when every integrity check passes, the ML-DSA-65 signature
verifies, **and** the signing key is trusted. A correct signature from an unknown key is still `false`.

```yaml
- uses: johnInarti/pqc-receipt-verify-action@v1
  id: receipt
  with:
    receipt: fe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee
- run: echo "valid=${{ steps.receipt.outputs.valid }} kid=${{ steps.receipt.outputs.kid }} epoch=${{ steps.receipt.outputs.epoch }}"
```

## Inputs

| input | default | meaning |
|---|---|---|
| `receipt` | (required) | One of: a path to a receipt JSON in the workspace; a 64-hex receipt id, fetched from `<key-directory origin>/api/midas/alerts/receipt/<id>`; or an `https://` URL to a receipt JSON. |
| `key-directory` | `https://fractalai.net.co/.well-known/x402-receipt-keys` | Key directory (`FRACTALAI-key-directory-v1`), as an https URL or a JSON file path. Used only when `trusted-keys` is empty. |
| `trusted-keys` | `''` | Pinned trust set: base64 ML-DSA-65 public keys separated by newlines or commas, or a path to a file that contains them. When set, the directory is **not** consulted, so the check runs offline. |
| `governance-key` | `''` | Optional base64 ML-DSA-65 key that must have signed the key directory. Pins the directory signer instead of trusting TLS. |
| `fail-on-invalid` | `true` | If `false`, an invalid receipt sets `valid=false` and logs a warning, but the step does not fail. |

## Outputs

| output | meaning |
|---|---|
| `valid` | `"true"` or `"false"` (see the checks below). |
| `kid` | Signing key id: `sha256(public_key_b64)[:16]`. Empty if the receipt failed before the signature check. |
| `epoch` | Epoch of the key directory that was used. Empty when `trusted-keys` was used. |
| `reason` | Reason for the verdict, in plain text. |

A short table is also written to the job summary.

## What is checked (in order, stopping at the first failure)

1. `receipt_id` is 64 hex characters. If the receipt was fetched by id, the server must return **that** id.
2. `algorithm` is `ml-dsa-65`.
3. `sha256(canonical) == receipt_id`, so the signed facts cannot be edited.
4. `served_message == "FRACTALAI-x402-served-v1\n<resource>\n<receipt_id>"` (and matches `served_domain` if present).
5. The displayed `facts`, `domain` and top-level `emitted_at` exactly match the signed `canonical` lines.
   Edited values and unsigned extra fields are both rejected.
6. Public key is 1952 bytes and signature is 3309 bytes (ML-DSA-65). Base64 must be canonical. The
   ML-DSA-65 signature must verify over `served_message`.
7. **Key trust** (fail-closed):
   - with `trusted-keys`: the key must be one of the pinned keys;
   - otherwise, the key directory is checked first: its ML-DSA-65 governance signature over
     `FRACTALAI-key-directory-v1\n<root>`, its `root` recomputed over all key objects, epoch,
     `prev_root` and governance key, and `kid == sha256(public_key)[:16]` for every key. After that,
     the receipt key must be listed with `use: x402-receipt` and status `active` (inside
     `not_before`/`not_after`), or `retiring` with the signed `emitted_at <= not_after`. Keys that are
     `reserved`, `revoked`, unknown or out of window are rejected.

It also accepts the bare served-proof shape from the conformance suite (`profile: "x402-served"`:
`domain`, `route_id`, `digest`, `signed_message`, `signature`, `public_key`), with the same
fail-closed trust rule. The route `x402-attest-decision` is reserved and is refused.

## Limits (read these before relying on it)

- **A valid signature proves authorship and integrity, not truth.** It shows that FractalAI's key signed
  these exact bytes. It does not show that the facts are correct. For example, a MIDAS alert is not a
  consensus-verified oracle reading, a liquidation guarantee or proof of delivery.
- **Not a CMVP-validated module.** ML-DSA-65 comes from [`@noble/post-quantum`](https://github.com/paulmillr/noble-post-quantum)
  (FIPS 204 algorithm, pure JS). It is not FIPS 140-3 / CMVP validated and not "quantum-safe certified".
  It is NIST security level 3, not CNSA 2.0.
- **Directory trust is TLS-only by default.** The directory's signature and root are verified, but
  the governance key is not anchored on-chain yet: the live directory reports `anchor.status: tls-only`.
  Without `governance-key` or `trusted-keys`, whoever controls `fractalai.net.co` controls which keys
  are trusted. Pin `trusted-keys` or `governance-key` for stronger guarantees.
- **`snapshot` is not verified.** Only `canonical` is signed, and it commits to `snapshot_hash`.
  This action does not recompute that hash from the `snapshot` object.
- **Receipt by id needs network access** to the directory origin. A file plus `trusted-keys` works fully offline.
- Tested against MIDAS signed-alert receipts (`FRACTALAI-midas-alert-v1`) and the `x402-served`
  conformance vector. Other receipt shapes are rejected (fail-closed). No other shapes are supported.
- No external security audit.

## Local development

```bash
npm ci
npm test                          # 18 offline unit tests (real receipt, real directory snapshot, attacks)
npm run build                     # bundles src/ into dist/ with @vercel/ncc (dist/ is committed)
NODE=node ./test/run-action-local.sh   # runs dist/index.js with INPUT_* env vars like the runner (OFFLINE=1 to skip network)
```

Vectors in `test/vectors/`:

- `genuine-fe62b072.json`: real public receipt `fe62b072…` (expected valid).
- `tampered-fe62b072.json`: same receipt with `debt_usd` changed in both `facts` and `canonical`
  (expected invalid).
- `key-directory-epoch3.json`: snapshot of the live directory (epoch 3).
- `conformance-x402-served.json`: from the PQC agent-receipt conformance suite.

## License

Apache-2.0, the same license as the reference verifier and conformance suite. Copyright 2026 FRACTAL AI S.A.S.
Contact: softnextceo@gmail.com · https://fractalai.net.co
