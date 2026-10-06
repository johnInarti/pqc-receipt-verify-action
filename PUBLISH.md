# Publicar `pqc-receipt-verify-action` (pasos para el fundador)

Todo está construido y probado en local. **Nada se ha publicado.** Este repo git local ya tiene
commits en `main`. No tiene remoto.

Requisitos: `gh auth login` con la cuenta **johnInarti**, 2FA activo en GitHub (lo exige Marketplace)
y Node 20 si vas a reconstruir.

## 0. (Opcional) Re-verificar antes de publicar

```bash
cd /private/tmp/claude-501/-Users-johneomo-repositorio-aux-fractal-ai/d290e137-d373-4939-8d45-9b7076a3c1d2/scratchpad/pqc-receipt-verify-action
npm ci && npm test && npm run build && git status --short   # git status debe salir vacío (dist/ al día)
./test/run-action-local.sh                                     # 12/12 escenarios (4 con red a fractalai.net.co)
```

> Ojo: el directorio está en `/private/tmp`. Si prefieres conservarlo, cópialo antes a otra ruta
> (por ejemplo `cp -R … ~/repositorio-aux/pqc-receipt-verify-action`) y ejecuta los pasos desde allí.

## 1. Crear el repo público y empujar

```bash
cd /private/tmp/claude-501/-Users-johneomo-repositorio-aux-fractal-ai/d290e137-d373-4939-8d45-9b7076a3c1d2/scratchpad/pqc-receipt-verify-action
gh repo create johnInarti/pqc-receipt-verify-action --public --source=. --push \
  --description "GitHub Action: verify FractalAI post-quantum (ML-DSA-65 / FIPS 204) signed receipts — fail-closed on tampering or untrusted keys."
```

El workflow `.github/workflows/test.yml` corre solo con el push. Comprueba que salga verde antes de etiquetar:

```bash
gh run watch --repo johnInarti/pqc-receipt-verify-action
```

## 2. Tags `v1.0.0` y `v1` (la etiqueta mayor móvil)

```bash
git tag -a v1.0.0 -m "v1.0.0 — FractalAI PQC Receipt Verify"
git tag -f v1 "v1.0.0^{}"
git push origin v1.0.0
git push -f origin v1
```

En futuras versiones 1.x, vuelve a mover `v1` con `git tag -f v1 "<nuevo-tag>^{}"` y `git push -f origin v1`.

## 3. Release

```bash
gh release create v1.0.0 --repo johnInarti/pqc-receipt-verify-action \
  --title "v1.0.0" \
  --notes "First release. Verifies FractalAI ML-DSA-65 (FIPS 204) receipts fail-closed: integrity (sha256(canonical)==receipt_id, domain-bound served_message, facts == signed canonical), ML-DSA-65 signature, and key trust (pinned keys, or active/retiring-in-window in an integrity-checked key directory). A valid signature proves authorship and integrity, not truth; @noble/post-quantum is not a CMVP-validated module. Usage: uses: johnInarti/pqc-receipt-verify-action@v1"
```

## 4. Marketplace (manual, en la interfaz web; no se puede hacer con `gh`)

1. Abre https://github.com/johnInarti/pqc-receipt-verify-action/releases/tag/v1.0.0 y pulsa **Edit release**.
   También sirve abrir `action.yml` en el repo y pulsar **Draft a release** en el banner.
2. Marca **"Publish this Action to the GitHub Marketplace"**.
3. La primera vez, GitHub pide **aceptar el GitHub Marketplace Developer Agreement**. Acéptalo en la
   interfaz; es un paso legal y solo lo puedes hacer tú.
4. Corrige cualquier aviso de metadatos. El nombre `FractalAI PQC Receipt Verify` debe ser único en
   Marketplace; si choca, cambia `name:` en `action.yml`, haz commit, push y vuelve a etiquetar.
5. Categoría principal sugerida: **Security**. Secundaria: **Continuous integration**.
6. Pulsa **Update release** (o **Publish release**) y confirma con 2FA.

## 5. Comprobación tras publicar

En cualquier repo, un workflow con:

```yaml
- uses: johnInarti/pqc-receipt-verify-action@v1
  with:
    receipt: fe62b072c2740e7a8d10cf7e643905b7d79f3f9b19f1c3970fc8754f18d538ee
```

debe dar `valid=true`, `kid=86c139c960bb274c` y la época actual del directorio (3 al 2026-10-06).
Si el directorio rota la clave `86c139c960bb274c` a `retiring`, el recibo sigue siendo válido mientras
`emitted_at <= not_after`. Si pasa a `revoked`, se rechaza, y la ejecución semanal programada de
`test.yml` lo detectará.

## Qué no afirmar al anunciarla

- No es una "certificación quantum-safe", ni CMVP/FIPS 140-3, ni CNSA 2.0 (es nivel 3 del NIST).
- La firma prueba autoría e integridad, no que el contenido sea verdadero.
- El directorio de claves se confía por TLS hasta que exista el anclaje on-chain (`anchor.status: tls-only`).
