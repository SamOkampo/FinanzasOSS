# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.2 — Nequi adapter** (`2efd815`).
- Bloque completado en esta rama: **Fase 6.3 — DaviPlata adapter**.
- Próximo bloque exacto tras CI verde e integración: **Fase 6.4 — Reconciliación PSE/transferencias internas**.

## 6.3 completado

- Adapter DaviPlata de Account Information implementado como read-only y fail-closed.
- Exige ruta oficial verificada, consentimiento activo, capabilities explícitas y endpoint HTTPS para cada capability concedida.
- Si falta cualquier gate, el adapter rechaza la configuración en lugar de inventar una integración.
- La revocación del consentimiento bloquea inmediatamente accounts/balances/transactions.
- La regresión usa únicamente `sandbox.example.invalid` y forma parte del comando normal `npm test`/CI.
- No contiene credenciales, datos financieros reales, screen scraping ni endpoints productivos inventados.

## Gate siguiente

No iniciar 6.4 hasta que esta rama pase CI y 6.3 se integre en `main`. No habilitar producción bancaria, pagos, transferencias reales, trading, retiros ni secretos.
