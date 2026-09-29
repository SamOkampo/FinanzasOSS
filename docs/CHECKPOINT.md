# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.1 — Discovery Open Finance y acceso como tercero para Nequi + DaviPlata** (`640c961`).
- Bloque completado en esta rama: **Fase 6.2 — Nequi adapter**.
- Próximo bloque exacto tras CI verde e integración: **Fase 6.3 — DaviPlata adapter**.

## 6.2 completado

- Adapter Nequi de Account Information implementado con comportamiento read-only y fail-closed.
- Requiere `officialRouteVerified === true`, consentimiento verificado, capabilities explícitas y endpoint HTTPS para cada capability concedida.
- Si falta una ruta oficial verificable, consentimiento, capability o endpoint, el adapter rechaza la configuración.
- La revocación del consentimiento corta inmediatamente accounts/balances/transactions.
- Las pruebas usan exclusivamente `sandbox.example.invalid`; no contienen credenciales, datos financieros reales ni endpoints productivos.
- La regresión de Nequi está incluida en el comando normal `npm test`/CI.

## Gate siguiente

No iniciar 6.3 hasta que esta rama pase CI y 6.2 se integre en `main`. Mantener Nequi fail-closed hasta verificar una ruta oficial aplicable de account-information. No habilitar producción, pagos, transferencias, trading, retiros, credenciales bancarias ni datos financieros reales.
