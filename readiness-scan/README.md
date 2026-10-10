# PQC Readiness Scan

**Find the quantum-vulnerable cryptography in your repository and get a CycloneDX CBOM.**
One line in your workflow. Free. Runs entirely in your runner — nothing is uploaded.

```yaml
- uses: johnInarti/pqc-receipt-verify-action/readiness-scan@v2
```

That's it. The scan writes `cbom.json` and prints an inventory in your job summary.

---

## Why you need this before 2030

NIST IR 8547 sets the dates: **RSA, ECDSA, ECDH, finite-field Diffie-Hellman and DSA are
deprecated after 2030 and disallowed after 2035.** CNSA 2.0 pulls the deadline to 2027 for
US national-security systems.

Every migration plan starts with the same question — *where is that cryptography in our
stack?* — and almost nobody can answer it. This Action answers it in your CI, on every
push, for free.

## What it does

- Scans your manifests and source for known quantum-vulnerable primitives: RSA, ECDSA,
  ECDH/X25519, Ed25519/EdDSA, Diffie-Hellman, DSA.
- Also reports what is **already quantum-resistant** (ML-DSA, ML-KEM, SLH-DSA, AES-256,
  SHA-2/3), so the inventory is not one-sided.
- Emits a **CycloneDX 1.6 CBOM** (Cryptographic Bill of Materials, ECMA-424) with
  `cryptographic-asset` components — the format regulators and SBOM tooling already read.
- Writes a table to your GitHub job summary and exposes `findings` / `cbom` as outputs.

## What it is NOT

Stated plainly, because an inventory you can't trust is worse than none:

- **Not a proof of absence.** A static scan misses dynamic loading, vendored binaries,
  hardware security modules, and any cryptography behind an abstraction it does not
  recognise. Zero findings means "nothing matched", not "you are safe".
- **Not a compliance certification.** It is evidence to start a migration from, not a
  clean bill of health, and no auditor should treat it as one.
- **Not a secret collector.** It reads your files in your runner and uploads nothing.
  There is no account, no API key, and no telemetry. Read `scan.mjs` — it is one file.

## Usage

```yaml
name: PQC readiness
on: [push, pull_request]

jobs:
  pqc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: johnInarti/pqc-receipt-verify-action/readiness-scan@v2
        id: pqc
      - uses: actions/upload-artifact@v4
        with:
          name: cbom
          path: ${{ steps.pqc.outputs.cbom }}
```

### Inputs

| Input | Default | What it does |
|---|---|---|
| `path` | `.` | Directory to scan. |
| `output` | `cbom.json` | Where to write the CycloneDX CBOM. |
| `fail-on-findings` | `false` | Exit non-zero if anything vulnerable is found. Leave this off until you have a migration plan, or you will block every PR on day one. |
| `seal` | `false` | Optional, paid. See below. |

### Outputs

| Output | What it is |
|---|---|
| `findings` | Total number of vulnerable occurrences. |
| `cbom` | Path to the CBOM file. |

### Gate a repository once you are ready

```yaml
      - uses: johnInarti/pqc-receipt-verify-action/readiness-scan@v2
        with:
          fail-on-findings: true
```

## Optional: a signed, verifiable inventory

The scan and the CBOM are free forever. If you need a **third party** to verify that a
given inventory was produced at a given time and was not edited afterwards, set
`seal: true`. FractalAI signs the CBOM's canonical hash with **ML-DSA-65 (NIST FIPS 204,
security level 3)** and returns a re-verifiable certificate.

```yaml
      - uses: johnInarti/pqc-receipt-verify-action/readiness-scan@v2
        with:
          seal: true
```

That request is paid in USDC over [x402](https://x402.org) and costs you nothing unless
you choose it: without payment the endpoint answers `402 Payment Required` and the scan
above is unaffected.

**Verification is free, open, and offline.** A seal is a plain ML-DSA-65 signature, so any
FIPS 204 implementation verifies it — you never pay us to check our own work, and you never
run our code to do it:

```js
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';   // third-party, not ours

const { served_signature: s } = JSON.parse(fs.readFileSync('cbom.seal.json', 'utf8'));

const ok = ml_dsa65.verify(
  Buffer.from(s.signature, 'base64'),        // 3309 bytes
  Buffer.from(s.signed_message, 'utf8'),     // domain-separated claim digest
  Buffer.from(s.public_key, 'base64'),       // 1952 bytes
);
```

The public key travels with the seal, so verification needs no network at all. To confirm
the key is ours and not substituted, compare it against the one we serve free at
`https://fractalai.net.co/api/x402/receipt-key`.

**One honest limit:** the public-key directory that lets you resolve our signing key is
served over TLS and is **not yet anchored on-chain**. Verifying a seal therefore means
trusting that TLS endpoint for the key, and the cryptography for everything after. We say
so here rather than let you discover it in an audit.

## Security posture

You are being asked to run someone else's code in your CI, so here is exactly what it does
and what was done to make it safe:

- **Inputs never touch a shell.** Every input reaches the scanner through the environment.
  A composite action that writes `--path="${{ inputs.path }}"` inside a `run:` block lets
  the runner paste raw input text into the script before bash parses it, which hands
  command execution to anyone who can influence that input (a pull-request title, an issue
  body, a dispatch field). This action does not do that, and a CI test asserts it on every
  push by feeding it a hostile input and failing if anything executes.
- **The output path is confined to your workspace.** Traversal, absolute paths and
  symlinks are refused, so the action cannot overwrite a file outside the checkout.
- **Step outputs cannot be forged.** The count is written as a number and the path with a
  random heredoc delimiter, so no input value can inject extra step outputs that a later
  step would trust.
- **Repository content never reaches your log unescaped.** Control characters and ANSI
  escapes coming from scanned filenames are stripped, so a hostile repo cannot spoof your
  CI log.
- **No network calls at all unless you set `seal: true`.** No token is read, no permission
  is requested, nothing is uploaded.

Found something we missed? Open an issue. Security reports are welcome and credited.


## Who made this

[FractalAI S.A.S.](https://fractalai.net.co) (Colombia) runs a layer-1 blockchain whose
consensus signs every block with ML-DSA-65 — post-quantum signatures in production, not a
roadmap. We built this scanner for our own migration and are publishing it because the
inventory problem is everyone's.

Found a false positive or a primitive we miss? Open an issue. That is the fastest way to
make this better for everyone.

## License

MIT. Use it, fork it, vendor it, sell services on top of it.
