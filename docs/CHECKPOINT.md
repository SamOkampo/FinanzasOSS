# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 4.2 — OAuth/consent sandbox** (`0e05a3b`).
- Bloque implementado en PR: **Fase 4.3 — Cuentas/saldos**.
- Rama: `feat/phase-4-3-accounts-balances`.
- Próximo bloque exacto tras CI verde e integración: **Fase 4.4 — Transacciones**.

## 4.3 implementado

- Contrato provider-neutral para cuentas y saldos read-only.
- Gate fail-closed: una capability solo se habilita cuando existe tanto grant explícito como endpoint HTTPS explícitamente configurado.
- No se infieren endpoints, scopes ni productos de Bancolombia.
- Modelos mínimos de cuenta y saldo evitan almacenar credenciales y separan identificadores externos de datos de autenticación.
- Fixtures exclusivamente con `example.invalid`; no hay datos financieros reales.
- Regresiones para endpoint sin grant, grant sin endpoint, configuración ausente y rechazo de HTTP.

## Gate

No avanzar a 4.4 hasta que CI de este PR quede verde y se integre en `main`. Los endpoints reales de Account Information continúan bloqueados hasta verificación oficial en el portal autorizado. No habilitar producción, pagos, screen scraping ni credenciales bancarias.
