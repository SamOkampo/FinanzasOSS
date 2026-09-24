# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 4.5 — Normalización/revocación/errores** (`c55498f`).
- Bloque implementado en PR: **Fase 4.6 — Tests y fixtures**.
- Rama: `test/phase-4-6-fixtures`.
- Próximo bloque exacto tras CI verde e integración: **Fase 5.1 — Davivienda: registro y auth sandbox**.

## 4.6 implementado

- Fixture sintético versionado para el contrato Account Information de Bancolombia sandbox, sin datos reales, tokens, scopes ni endpoints productivos.
- Cobertura fixture-driven para accounts, balances y transactions con endpoints `example.invalid`.
- Regresión de revocación: después de revocar consentimiento ninguna capability puede leerse.
- Tabla de fixtures para normalización de errores 401/403/429/5xx/4xx/configuration y política de retry.
- El test de fixtures queda conectado al comando normal `npm test` y por tanto al CI.

## Gate

No avanzar a Fase 5 hasta que CI de este PR quede verde y 4.6 se integre en `main`. Los endpoints reales de Account Information continúan bloqueados hasta verificación oficial. No habilitar producción, pagos, screen scraping, credenciales bancarias ni datos financieros reales.
