# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 4.6 — Tests y fixtures** (`c7a15c6`).
- Bloque implementado en PR: **Fase 5.1 — Davivienda: registro y auth sandbox**.
- Rama: `feat/phase-5-1-davivienda-auth-discovery`.
- Próximo bloque exacto tras CI verde e integración: **Fase 5.2 — Consentimiento**.

## 5.1 implementado

- Discovery contrastado únicamente contra documentación pública oficial del Developer Portal Davivienda.
- Confirmado: registro de cuenta de desarrollador, aplicación con Client ID/Client Secret, suscripción a plan y ambiente Sandbox.
- Confirmado: Client ID separado por ambiente y certificado de pruebas distinto del certificado de producción.
- Confirmada la existencia pública del producto `Autenticación Web`, descrito por Davivienda como integración con el widget de autenticación de Open Banking.
- Los detalles técnicos del producto están detrás del login/registro del portal; por ello no se inventan authorization/token URLs, scopes, parámetros del widget ni endpoints de Account Information.
- `docs/connectors/davivienda-sandbox.md` documenta la evidencia, límites y política fail-closed.

## Gate

No avanzar a 5.2 hasta que CI de este PR quede verde y 5.1 se integre en `main`. Para 5.2, cualquier consentimiento real debe derivarse de parámetros oficiales del sandbox/producto aplicable. Si no existe un producto read-only apto, el conector permanece no disponible/fail-closed; nunca sustituirlo por screen scraping. No habilitar producción, pagos, transferencias, credenciales bancarias ni datos financieros reales.
