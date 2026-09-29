# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.2 — Nequi adapter** (`2efd815`).
- Fase 6.2 integrada correctamente mediante PR #31 con CI verde.
- Próximo bloque exacto: **Fase 6.3 — DaviPlata adapter**.

## 6.2 integrado

- Adapter Nequi de Account Information implementado con comportamiento read-only y fail-closed.
- Requiere `officialRouteVerified === true`, consentimiento verificado, capabilities explícitas y endpoint HTTPS para cada capability concedida.
- Si falta una ruta oficial verificable, consentimiento, capability o endpoint, el adapter rechaza la configuración.
- La revocación del consentimiento corta inmediatamente accounts/balances/transactions.
- Las pruebas usan exclusivamente `sandbox.example.invalid`; no contienen credenciales, datos financieros reales ni endpoints productivos.
- La regresión de Nequi está incluida en el comando normal `npm test`/CI.

## Gate siguiente

Fase 6.2 está cerrada. El siguiente bloque permitido es únicamente **6.3 — DaviPlata adapter**. Mantener Nequi y DaviPlata fail-closed hasta verificar rutas oficiales aplicables de account-information. No habilitar producción, pagos, transferencias, trading, retiros, credenciales bancarias ni datos financieros reales.
