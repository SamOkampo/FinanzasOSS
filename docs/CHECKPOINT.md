# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 5.3 — Cuentas/saldos/transacciones** (`a83f923`).
- Bloque implementado en PR: **Fase 5.4 — Normalización/reconexión**.
- Rama: `feat/phase-5-4-davivienda-normalization-reconnect`.
- Próximo bloque exacto tras CI verde e integración: **Fase 5.5 — Tests y fixtures**.

## 5.4 implementado

- Normalización Davivienda reutiliza el contrato provider-neutral de Account Information; no inventa códigos, estados ni semántica del proveedor.
- 401/auth y 403/consent quedan fail-closed y requieren acción explícita del usuario (`reauthorize` / `renew_consent`), nunca reintento automático.
- 429 y 5xx conservan la política genérica de retry seguro; `retryAfterMs` se propaga cuando existe.
- 4xx no autenticación y configuración inválida permanecen no retryable.
- Regresión sintética añadida al comando normal de CI; no usa endpoints, credenciales ni datos financieros reales.

## Gate

No avanzar a 5.5 hasta que CI de este PR quede verde y 5.4 se integre en `main`. Los endpoints/códigos reales siguen dependiendo de verificación en la documentación/sandbox oficial; nunca sustituir por screen scraping. No habilitar producción, pagos, transferencias, trading, retiros, credenciales bancarias ni datos financieros reales.
