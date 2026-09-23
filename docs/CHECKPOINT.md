# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.3 — dedupe y fingerprints**.
- Rama: `feat/phase-2-3-dedupe-fingerprints`.
- Próximo bloque exacto: **Fase 2.4 — transfer matching entre cuentas propias**.

## 2.3 completado

- Fingerprint estable y versionado.
- Normalización de descripción.
- Exact identity por externalId/sourceRecordId.
- Evaluación `exact / likely / possible / none`.
- Auto-merge limitado exclusivamente a identidad exacta.
- Scope por cuenta/cuenta canónica para evitar falsos positivos.
- Repository lookups para externalId y fingerprint.
- Pruebas de duplicado exacto, heurístico, tenant distinto y cuenta distinta.

## Gate

No avanzar a 2.4 hasta que el PR de 2.3 pase CI.
