# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 4.4 — Transacciones** (`3ff3ebc`).
- Bloque implementado en PR: **Fase 4.5 — Normalización/revocación/errores**.
- Rama: `feat/phase-4-5-normalization-revocation-errors`.
- Próximo bloque exacto tras CI verde e integración: **Fase 4.6 — Tests y fixtures**.

## 4.5 implementado

- Revocación local de consentimiento con cierre inmediato de todas las capacidades Account Information.
- El gate permanece fail-closed: un consentimiento revocado no puede leer cuentas, saldos ni transacciones.
- Normalización provider-neutral de fallos HTTP: auth, consent, rate limit, upstream, invalid response y configuration.
- Política de retry explícita: 401/403 no reintentables, 429/5xx reintentables; `retryAfterMs` y `providerCode` se preservan cuando existen.
- Regresiones sin datos reales y endpoints únicamente `example.invalid`.
- No se infieren endpoints, scopes ni productos de Bancolombia.

## Gate

No avanzar a 4.6 hasta que CI de este PR quede verde y se integre en `main`. Los endpoints reales de Account Information continúan bloqueados hasta verificación oficial. No habilitar producción, pagos, screen scraping ni credenciales bancarias.
