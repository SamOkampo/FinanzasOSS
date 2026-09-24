# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 4.3 — Cuentas/saldos** (`3024221`).
- Bloque implementado en PR: **Fase 4.4 — Transacciones**.
- Rama: `feat/phase-4-4-transactions`.
- Próximo bloque exacto tras CI verde e integración: **Fase 4.5 — Normalización/revocación/errores**.

## 4.4 implementado

- Extensión provider-neutral del Account Information gate para transacciones read-only.
- `transactions` exige simultáneamente grant explícito y endpoint HTTPS explícitamente configurado.
- Modelo mínimo `ReadOnlyTransaction` separado de credenciales/autenticación.
- No se infieren endpoints, scopes ni productos de Bancolombia.
- Fixtures exclusivamente con `example.invalid`; no hay datos financieros reales.
- Regresiones para endpoint sin grant, grant sin endpoint, configuración ausente y rechazo de HTTP también para transacciones.

## Gate

No avanzar a 4.5 hasta que CI de este PR quede verde y se integre en `main`. Los endpoints reales de Account Information continúan bloqueados hasta verificación oficial en el portal autorizado. No habilitar producción, pagos, screen scraping ni credenciales bancarias.
