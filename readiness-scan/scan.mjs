#!/usr/bin/env node
/**
 * PQC Readiness Scan — finds quantum-vulnerable cryptography in a repository and emits a
 * CycloneDX CBOM (Cryptographic Bill of Materials, ECMA-424).
 *
 * Why this exists: NIST IR 8547 deprecates RSA, ECDSA, ECDH, DH and DSA after 2030 and disallows
 * them after 2035. Before anyone can migrate, they need to know where those algorithms actually
 * live in their stack. That inventory is the first deliverable of every migration, and almost
 * nobody has it.
 *
 * What this is, honestly:
 *   - A STATIC scan of manifests and source for known quantum-vulnerable primitives.
 *   - It runs entirely in your runner. Nothing is uploaded. No account, no key, no payment.
 *
 * What this is NOT:
 *   - Not a proof of absence: a static scan misses dynamic loading, vendored binaries,
 *     hardware modules and anything behind an abstraction it does not recognise.
 *   - Not a compliance certification. It is evidence to start from, not a clean bill of health.
 *
 * Optional: `seal: true` asks FractalAI to sign the CBOM with ML-DSA-65 (FIPS 204) so a third
 * party can verify the inventory was produced at a given time and not edited afterwards. That
 * costs USDC over x402 and is strictly optional — the scan and the CBOM are free forever.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const arg = (n, d) => {
  const f = process.argv.find((a) => a.startsWith(`--${n}=`));
  const v = f ? f.slice(n.length + 3) : undefined;
  // Un `--output=` presente pero vacío NO debe ganarle al valor por defecto: antes devolvía la
  // cadena vacía y el pase moría con ENOENT después de haber hecho todo el trabajo.
  return v === undefined || v === '' ? d : v;
};
/** La acción pasa las entradas por el entorno. argv queda para uso local desde la terminal. */
const input = (envName, argName, d) => {
  const e = process.env[envName];
  return e === undefined || e === '' ? arg(argName, d) : e;
};

const ROOT = path.resolve(input('PQC_PATH', 'path', '.'));
const OUT_RAW = input('PQC_OUTPUT', 'output', 'cbom.json');
const FAIL = input('PQC_FAIL_ON_FINDINGS', 'fail-on-findings', 'false') === 'true';
const SEAL = input('PQC_SEAL', 'seal', 'false') === 'true';
const API = process.env.FRACTALAI_BASE_URL || 'https://fractalai.net.co';

/**
 * La ruta de salida es la única que escribimos, así que se valida como tal. Sin esto era una
 * primitiva de escritura arbitraria: `../..` salía del espacio de trabajo, una ruta absoluta
 * pisaba cualquier archivo, un enlace simbólico machacaba su destino, y un salto de línea dentro
 * del valor inyectaba variables falsas en $GITHUB_OUTPUT.
 */
function safeOutPath(raw) {
  if (/[\r\n\0]/.test(raw)) {
    console.error('  output: no puede contener saltos de línea ni bytes nulos.');
    process.exit(2);
  }
  const base = process.env.GITHUB_WORKSPACE ? path.resolve(process.env.GITHUB_WORKSPACE) : process.cwd();
  const abs = path.resolve(base, raw);
  if (abs !== base && !abs.startsWith(base + path.sep)) {
    console.error(`  output: debe quedar dentro del espacio de trabajo (${base}). Recibido: ${abs}`);
    process.exit(2);
  }
  try {
    // lstat, no stat: lo que importa es si la ENTRADA es un enlace, no a dónde apunta.
    if (fs.lstatSync(abs).isSymbolicLink()) {
      console.error('  output: apunta a un enlace simbólico; escribir ahí pisaría su destino.');
      process.exit(2);
    }
  } catch { /* no existe todavía: es el caso normal */ }
  return abs;
}
const OUT = safeOutPath(OUT_RAW);

/**
 * Todo lo que venga del repositorio escaneado (nombres de archivo, contenido de líneas) es dato
 * ajeno y puede traer escapes ANSI o retornos de carro. Impreso en crudo en un log de CI, eso
 * permite falsificar colores, mover el cursor y tapar líneas reales del propio pase.
 */
const clean = (s) => String(s).replace(/[\u0000-\u001f\u007f-\u009f]/g, '?');

/**
 * Quantum-vulnerable primitives per NIST IR 8547. `why` is what the reader actually needs:
 * not "this is bad" but which deadline applies and what replaces it.
 */
const VULNERABLE = [
  { id: 'rsa', name: 'RSA', re: /\b(RSA-?(?:1024|2048|3072|4096)?|rsaEncryption|PKCS1|RSASSA|RSA_PKCS1|rsa_pkcs1|createSign\(\s*['"]RSA)/i,
    why: 'Signature and key transport. Deprecated after 2030, disallowed after 2035 (NIST IR 8547). Replace signatures with ML-DSA (FIPS 204), key transport with ML-KEM (FIPS 203).' },
  { id: 'ecdsa', name: 'ECDSA', re: /\b(ECDSA|secp256k1|secp256r1|prime256v1|P-256|P-384|P-521|ES256|ES384|ES512)\b/i,
    why: 'Elliptic-curve signature. Deprecated after 2030, disallowed after 2035. Replace with ML-DSA (FIPS 204) or SLH-DSA (FIPS 205).' },
  { id: 'ecdh', name: 'ECDH / X25519', re: /\b(ECDH|X25519|curve25519|ecdhe|ECDHE)\b/i,
    why: 'Key agreement. Harvest-now-decrypt-later applies: traffic captured today can be decrypted after a quantum computer exists. Replace with ML-KEM (FIPS 203), hybrid during transition.' },
  { id: 'eddsa', name: 'Ed25519 / EdDSA', re: /\b(Ed25519|Ed448|EdDSA)\b/i,
    why: 'Edwards-curve signature. Same quantum exposure as ECDSA. Replace with ML-DSA (FIPS 204).' },
  { id: 'dh', name: 'Diffie-Hellman (finite field)', re: /\b(DHE?-RSA|diffie[- ]?hellman|dhparam|MODP)\b/i,
    why: 'Finite-field key agreement. Deprecated after 2030. Replace with ML-KEM (FIPS 203).' },
  // El lookbehind es obligatorio: sin él "DSA" casa DENTRO de "ML-DSA" y "SLH-DSA", que son
  // precisamente los algoritmos post-cuánticos. Reportar ML-DSA como vulnerable es el error que
  // haría que un criptógrafo tirara la herramienta a la basura en diez segundos.
  { id: 'dsa', name: 'DSA', re: /(?<!ML-)(?<!SLH-)(?<!ml-)(?<!slh-)\b(DSA-?(?:1024|2048|3072)?|dsaEncryption)\b/i,
    why: 'Legacy signature, already discouraged pre-quantum. Replace with ML-DSA (FIPS 204).' },
];

/** Primitives that are already quantum-resistant: reported so the inventory is not one-sided. */
const RESISTANT = [
  { id: 'ml-dsa', name: 'ML-DSA (FIPS 204)', re: /\b(ML-?DSA|Dilithium|dilithium[2-5]?|fips204)\b/i },
  { id: 'ml-kem', name: 'ML-KEM (FIPS 203)', re: /\b(ML-?KEM|Kyber|kyber(?:512|768|1024)?|fips203)\b/i },
  { id: 'slh-dsa', name: 'SLH-DSA (FIPS 205)', re: /\b(SLH-?DSA|SPHINCS\+?|sphincsplus)\b/i },
  { id: 'aes', name: 'AES (symmetric, 256-bit recommended)', re: /\b(AES-?256|aes256|AES_256)\b/i },
  { id: 'sha2', name: 'SHA-2 / SHA-3 (hash)', re: /\b(SHA-?256|SHA-?384|SHA-?512|SHA3-?(?:256|512)|sha256|sha512)\b/i },
];

const MANIFESTS = new Set([
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'requirements.txt', 'Pipfile', 'pyproject.toml', 'poetry.lock',
  'Cargo.toml', 'Cargo.lock', 'go.mod', 'go.sum',
  'pom.xml', 'build.gradle', 'build.gradle.kts', 'Gemfile', 'Gemfile.lock',
  'composer.json', '*.csproj', 'Podfile', 'pubspec.yaml',
]);
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.rs', '.go', '.java', '.kt',
  '.rb', '.php', '.cs', '.c', '.h', '.cpp', '.hpp', '.swift', '.m', '.scala', '.ex', '.sol', '.tf', '.yaml', '.yml', '.conf']);
const SKIP_DIR = new Set(['node_modules', '.git', 'target', 'dist', 'build', 'vendor', '.next', '__pycache__',
  '.venv', 'venv', 'coverage', '.cache', 'out']);
const MAX_FILES = 20000;
const MAX_BYTES = 2 * 1024 * 1024;

function walk(dir, acc = [], depth = 0) {
  if (depth > 14 || acc.length >= MAX_FILES) return acc;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (acc.length >= MAX_FILES) break;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name) || e.name.startsWith('.') && e.name !== '.github') continue;
      walk(p, acc, depth + 1);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (MANIFESTS.has(e.name) || CODE_EXT.has(ext)) acc.push(p);
    }
  }
  return acc;
}

const files = walk(ROOT);
const found = new Map();   // id -> {name, why, hits:[{file,line,snippet}]}
const resistant = new Map();

for (const f of files) {
  let text = '';
  try {
    if (fs.statSync(f).size > MAX_BYTES) continue;
    text = fs.readFileSync(f, 'utf8');
  } catch { continue; }
  const rel = path.relative(ROOT, f) || path.basename(f);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 1000) continue;
    for (const v of VULNERABLE) {
      if (v.re.test(line)) {
        if (!found.has(v.id)) found.set(v.id, { name: v.name, why: v.why, hits: [] });
        const e = found.get(v.id);
        if (e.hits.length < 25) e.hits.push({ file: rel, line: i + 1, snippet: line.trim().slice(0, 160) });
      }
    }
    for (const r of RESISTANT) {
      if (r.re.test(line)) {
        if (!resistant.has(r.id)) resistant.set(r.id, { name: r.name, count: 0 });
        resistant.get(r.id).count++;
      }
    }
  }
}

const totalHits = [...found.values()].reduce((n, e) => n + e.hits.length, 0);
const serial = 'urn:uuid:' + crypto.randomUUID();
const now = new Date().toISOString();

// CycloneDX 1.6 with cryptographic-asset components (CBOM / ECMA-424).
const cbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: serial,
  version: 1,
  metadata: {
    timestamp: now,
    tools: { components: [{ type: 'application', name: 'pqc-readiness-scan', publisher: 'FractalAI', version: '1.0.0' }] },
    properties: [
      { name: 'fractalai:scope', value: 'Static scan of manifests and source for quantum-vulnerable primitives. NOT a proof of absence: misses dynamic loading, vendored binaries, hardware modules and unrecognised abstractions. NOT a compliance certification.' },
      { name: 'fractalai:deadline', value: 'NIST IR 8547: RSA/ECDSA/ECDH/DH/DSA deprecated after 2030, disallowed after 2035.' },
      { name: 'fractalai:files_scanned', value: String(files.length) },
    ],
  },
  components: [
    ...[...found.entries()].map(([id, e]) => ({
      type: 'cryptographic-asset',
      'bom-ref': `crypto/vulnerable/${id}`,
      name: e.name,
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: { primitive: 'unknown', executionEnvironment: 'software-plain-ram', cryptoFunctions: ['sign', 'keygen'] },
        oid: '',
      },
      properties: [
        { name: 'fractalai:quantum_vulnerable', value: 'true' },
        { name: 'fractalai:why', value: e.why },
        { name: 'fractalai:occurrences', value: String(e.hits.length) },
        ...e.hits.slice(0, 10).map((h) => ({ name: 'fractalai:location', value: `${h.file}:${h.line}` })),
      ],
    })),
    ...[...resistant.entries()].map(([id, e]) => ({
      type: 'cryptographic-asset',
      'bom-ref': `crypto/resistant/${id}`,
      name: e.name,
      cryptoProperties: { assetType: 'algorithm', algorithmProperties: { primitive: 'unknown', executionEnvironment: 'software-plain-ram' }, oid: '' },
      properties: [
        { name: 'fractalai:quantum_vulnerable', value: 'false' },
        { name: 'fractalai:occurrences', value: String(e.count) },
      ],
    })),
  ],
};

fs.writeFileSync(OUT, JSON.stringify(cbom, null, 2) + '\n');

// ── Report (this is what a human reads in the CI log) ──
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const grn = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
console.log('');
console.log('  PQC Readiness Scan — quantum-vulnerable cryptography in this repository');
console.log(dim(`  ${files.length} files scanned · CycloneDX CBOM written to ${clean(OUT)}`));
console.log('');
if (found.size === 0) {
  console.log(grn('  No quantum-vulnerable primitives matched.'));
  console.log(dim('  That is not a proof of absence: a static scan misses dynamic loading, vendored'));
  console.log(dim('  binaries, hardware modules and anything behind an abstraction it cannot see.'));
} else {
  console.log(red(`  ${found.size} quantum-vulnerable algorithm family(ies), ${totalHits} occurrence(s):`));
  console.log('');
  for (const [, e] of found) {
    console.log(`  ${red('✗')} ${e.name} — ${e.hits.length} occurrence(s)`);
    console.log(dim(`      ${e.why}`));
    for (const h of e.hits.slice(0, 3)) console.log(dim(`      ${clean(h.file)}:${h.line}`));
    if (e.hits.length > 3) console.log(dim(`      … and ${e.hits.length - 3} more (full list in ${clean(OUT)})`));
    console.log('');
  }
}
if (resistant.size) {
  console.log(grn(`  Already quantum-resistant: ${[...resistant.values()].map((r) => r.name).join(', ')}`));
  console.log('');
}
console.log(dim('  Deadline: NIST IR 8547 deprecates these after 2030 and disallows them after 2035.'));
console.log(dim('  This inventory is free and runs entirely in your runner. Nothing was uploaded.'));
console.log('');

if (SEAL) {
  console.log(dim('  seal: true — requesting an ML-DSA-65 (FIPS 204) signature over this CBOM…'));
  try {
    const r = await fetch(`${API}/api/x402/seal-cbom`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cbom }), signal: AbortSignal.timeout(30000),
    });
    if (r.status === 402) {
      console.log(dim('  402 Payment Required: sealing costs USDC over x402. The scan above is unaffected.'));
    } else if (r.ok) {
      const j = await r.json();
      fs.writeFileSync(OUT.replace(/\.json$/, '') + '.seal.json', JSON.stringify(j, null, 2) + '\n');
      console.log(grn('  Sealed. Signature written next to the CBOM.'));
    } else {
      console.log(dim(`  Sealing unavailable (HTTP ${r.status}). The scan above is unaffected.`));
    }
  } catch (e) {
    console.log(dim(`  Sealing failed (${String(e.message).slice(0, 60)}). The scan above is unaffected.`));
  }
}

const gh = process.env.GITHUB_OUTPUT;
if (gh) {
  // `findings` se fuerza a número y `cbom` va en el formato de delimitador aleatorio que exige
  // GitHub para valores multilínea. Concatenar `nombre=valor` a pelo deja que el valor declare
  // variables adicionales que un paso posterior se creería.
  const delim = 'PQC_EOF_' + crypto.randomBytes(16).toString('hex');
  fs.appendFileSync(gh, `findings=${Number(totalHits) || 0}\ncbom<<${delim}\n${OUT}\n${delim}\n`);
}
const sum = process.env.GITHUB_STEP_SUMMARY;
if (sum) {
  fs.appendFileSync(sum, [
    '## PQC Readiness Scan',
    '',
    `${files.length} files scanned. **${found.size} quantum-vulnerable algorithm families, ${totalHits} occurrences.**`,
    '',
    ...(found.size ? ['| Algorithm | Occurrences | Why it matters |', '|---|---:|---|',
      ...[...found.values()].map((e) => `| ${e.name} | ${e.hits.length} | ${e.why} |`)] : ['No vulnerable primitives matched (not a proof of absence).']),
    '',
    '_NIST IR 8547: deprecated after 2030, disallowed after 2035. Static scan, not a certification._',
    '',
  ].join('\n'));
}

if (FAIL && totalHits > 0) process.exit(1);
