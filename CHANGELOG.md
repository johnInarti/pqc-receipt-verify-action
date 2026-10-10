# Changelog

This repository publishes **two independent GitHub Actions** that share one tag namespace:

| Action | `uses:` |
|---|---|
| **PQC Receipt Verify** (repository root) | `johnInarti/pqc-receipt-verify-action@<ref>` |
| **PQC Readiness Scan** (subdirectory) | `johnInarti/pqc-receipt-verify-action/readiness-scan@<ref>` |

Because they share tags, every entry below says which action changed. A release that touches only
one of them leaves the other byte-identical, and that is stated explicitly rather than implied.

Pin a full commit SHA rather than a moving tag. Both actions are small and dependency-free, so the
SHA is the entire trust boundary.

---

## v2.2.0

**PQC Receipt Verify — vendors Trust Kernel 2.3** (`johnInarti/pqc-receipts-colosseum@df081e8`, 272 files,
byte-exact; `npm run vendor:check`).

- **Key directory relocation.** The x402 delivery-receipt spec reserves `/.well-known/x402-receipt-keys` for its
  own format. When that URL no longer serves `FRACTALAI-key-directory-v1`, the kernel's `fetchLegacyDirectory`
  reads `/.well-known/fractalai-key-directory` on the same origin. No document-supplied pointer is followed and
  the pinned roots are unchanged. The in-Action copy of this rule from the previous commit was removed: the
  kernel owns it, so `src/` keeps no trust logic of its own. Its black-box tests (`test/relocation.test.mjs`) stay.
- **New level `onchain`** (kernel 2.1/2.2): new input `onchain`, new input `allow-unfinalized-payment`, new
  output `onchain`. The summary table has one more row.
- **Corpus 129 → 217 vectors**, all executed through `dist/`. The harness now takes the level list from the
  kernel and refuses any corpus policy option it does not map, so a new level or flag can no longer be
  skipped silently.

Tests: 55/55 on Node 20.20.2 and 26.5.0.

**PQC Readiness Scan — unchanged** (byte-identical to v2.1.0).

---

## v2.1.0

**PQC Readiness Scan — first release.** A second, independent Action that scans any repository for
quantum-vulnerable cryptography and emits a CycloneDX 1.6 CBOM (ECMA-424). Free, runs entirely in
the caller's runner, uploads nothing, needs no account and no key.

```yaml
- uses: johnInarti/pqc-receipt-verify-action/readiness-scan@v2.1.0
```

**PQC Receipt Verify — unchanged.** The root `action.yml`, `dist/`, `src/`, `vendor/` and
`package.json` are byte-identical to v2.0.0. Consumers on `@v2` get the same `node20` entrypoint
and the same vendored Trust Kernel; the only difference on disk is files they do not reference.

### Before release, an adversarial pass found 18 real defects

Six independent agents attacked the scanner, each reproducing its findings with a real command,
before the Action was tagged and therefore before anyone could adopt it. All eighteen are fixed
and all eighteen are now regression tests. The record is kept here because a tool that asks you to
trust its inventory owes you the list of things it got wrong.

**Security**

- **Command execution on the adopter's runner.** The composite step interpolated `${{ inputs.* }}`
  into its `run:` body, so the runner pasted raw input text into the script before bash parsed it.
  Any workflow wiring an input from a pull-request title, an issue body or a dispatch field handed
  command execution to whoever wrote that text, with the job's secrets in scope. Inputs now travel
  through `env:`, which bash never re-parses.
- **Forged step outputs.** The output path was concatenated into `$GITHUB_OUTPUT` unescaped, so a
  newline in it declared extra outputs the runner parses as real, including a second `findings=`
  that overrode the true count.
- **Arbitrary file overwrite.** The output path was unvalidated: `../..` escaped the workspace, an
  absolute path clobbered any file, and a symlink destroyed its target.
- **CI log spoofing.** Filenames from the scanned repository were printed raw, so a hostile repo
  could ship ANSI escapes and carriage returns into the adopter's log and overwrite real lines.

**Accuracy**

- **It missed 61% of the cryptography it claims to inventory.** The cause was one character: the
  word boundary treats an underscore as a word character, so `EVP_PKEY_RSA`, `ed25519_dalek`,
  `ECDSA_P256` and `OPENSSL_KEYTYPE_RSA` never matched — most of the OpenSSL, Rust, C and PHP
  surface. A letter-only boundary recovers them and removes six false positives at the same time:
  `rsaCount`, `PKCS11` and `PKCS12` were being reported as RSA.
- Added the JWT algorithm identifiers including `ES256K`, committed key material and certificates,
  and a manifest-only dependency layer, without which an entire blockchain wallet (secp256k1 end
  to end) read as clean.
- Minified single-line bundles and single-line lockfiles were skipped by a 1000-character line
  limit — exactly where vendored cryptography hides.

**Honest numbers**

- The occurrence count was really the minimum of matching lines and 25, printed as a total. Ten
  mentions on one line counted as one; forty lines reported twenty-five. It is now the real
  uncapped count, with matching lines reported separately.
- A line that **forbids** an algorithm was counted as a finding, inverting the meaning of a
  hardening file. Comments, documentation, test vectors and prohibitions are now classified by the
  position of each match, reported in the CBOM, and excluded from the headline count.

**Honest coverage**

- A truncated scan printed a green pass. A repository whose only cryptography sat in one oversize
  file was told no vulnerable primitives matched, and a UTF-16 source file produced zero matches
  while the CBOM asserted full coverage. Truncation is now loud in the log, annotated on the run
  page, and recorded in the document itself.

**Standards conformance**

- The CBOM validated against the schema but asserted untrue things: every algorithm primitive
  declared `unknown`, and ECDH and Diffie-Hellman declared with `cryptoFunctions: ["sign"]` when
  they do not sign. Real primitives, functions and OIDs now.
- Locations moved to the standard `evidence.occurrences` block, so ordinary SBOM tooling renders
  them instead of requiring a custom property to be re-parsed.
- POSIX path separators always, so the same repository yields the same document on Windows.
- Explicit NIST security levels, because a protobuf round-trip turns an absent integer into zero,
  which the specification defines as meeting none of the categories — the file would otherwise
  have denied that ML-DSA is post-quantum.

**Honest offer**

- `seal: true` could never succeed: there is no x402 payment client in the Action, so the endpoint
  always answers `402 Payment Required`. It is now labelled a preview that only prints the price.
- When it does send, it sends a **redacted** document. Every file-and-line location is stripped
  first, so no path from a private repository crosses the wire, and the exact redacted document is
  written next to the CBOM so the adopter can read and keep what was sent.

**Reliability**

- The seal response was buffered whole and only then size-checked, reaching 1.42 GiB of measured
  resident memory against a hostile peer — enough to kill a 2 GB runner. It is now bounded while
  reading.
- Added a total work budget and a deadline: the per-file caps multiplied out to 39 GiB and over an
  hour of billed CI with no warning.
- A missing or non-directory `path` passed green with exit 0, silently disabling the
  `fail-on-findings` gate.

**Documentation**

- The README claimed MIT while this repository is Apache-2.0, and told adopters to use a tag that
  did not contain the Action.

**What the pass did not find:** no ReDoS (worst adversarial line 7.93 microseconds across every
regex), no hang, no OOM in the scanner itself, and symlink handling was already correct — they are
skipped, so a symlink loop cannot be followed out of the tree.

### Tests

33 regression checks run on ubuntu, windows and macos, covering every defect above. A separate job
validates three generated CBOMs against the published CycloneDX 1.6 schema, with the RFC 3339
format checker installed — without it the timestamp format is silently skipped and the validation
passes without having validated that. A third job consumes the Action by `uses:` reference exactly
as a stranger would, on all three operating systems, including a hostile input that must not
execute.

---

## v2.0.0

**PQC Receipt Verify.** Every trust decision delegated to the vendored Trust Kernel v2, byte-exact
from `johnInarti/pqc-receipts-colosseum`. Leveled verdict: integrity → authentic → trusted →
time_anchored → finalized. The kernel's full adversarial corpus (129 vectors) runs through the
Action in CI.

## v1.1.0

**PQC Receipt Verify.** Security hardening.

## v1.0.0

**PQC Receipt Verify.** First release: fail-closed verification of FractalAI post-quantum
(ML-DSA-65 / NIST FIPS 204) signed receipts.
