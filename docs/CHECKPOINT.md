# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 5.1 — Davivienda: registro y auth sandbox** (`e17c8bf`).
- Bloque implementado en PR: **Fase 5.2 — Consentimiento**.
- Rama: `feat/phase-5-2-davivienda-consent`.
- Próximo bloque exacto tras CI verde e integración: **Fase 5.3 — Cuentas/saldos/transacciones**.

## 5.2 implementado

- Gate provider-specific para consentimiento Davivienda sandbox, reutilizable sin acoplar el core a parámetros no verificados.
- Fail-closed: exige endpoint HTTPS, Client ID y scopes suministrados explícitamente antes de considerar listo el consentimiento.
- No se inventan endpoints, scopes, widget parameters ni payloads de Davivienda.
- Regresiones sintéticas cubren configuración ausente/parcial, HTTP inseguro y configuración explícita válida mediante `example.invalid`.
- El test queda incluido en el comando normal de CI.

## Gate

No avanzar a 5.3 hasta que CI de este PR quede verde y 5.2 se integre en `main`. Los valores reales de consentimiento deben provenir exclusivamente del catálogo/sandbox oficial autenticado. Si no pueden verificarse, el conector permanece no disponible/fail-closed; nunca sustituir por screen scraping. No habilitar producción, pagos, transferencias, credenciales bancarias ni datos financieros reales.
