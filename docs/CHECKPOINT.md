# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.3 — DaviPlata adapter** (`d5551c1`).
- Fase 6.3 integrada mediante PR #33 con CI #80 verde.
- Próximo bloque exacto: **Fase 6.4 — Reconciliación PSE/transferencias internas**.

## 6.3 integrado

- Adapter DaviPlata de Account Information integrado como read-only y fail-closed.
- Exige ruta oficial verificada, consentimiento activo, capabilities explícitas y endpoint HTTPS para cada capability concedida.
- Si falta cualquier gate, el adapter rechaza la configuración en lugar de inventar una integración.
- La revocación del consentimiento bloquea inmediatamente accounts/balances/transactions.
- La regresión usa únicamente `sandbox.example.invalid` y forma parte del comando normal `npm test`/CI.
- No contiene credenciales, datos financieros reales, screen scraping ni endpoints productivos inventados.

## Gate siguiente

Fase 6.3 está cerrada. El siguiente bloque permitido es únicamente **6.4 — Reconciliación PSE/transferencias internas**. No habilitar producción bancaria, pagos, transferencias reales, trading, retiros ni secretos.
