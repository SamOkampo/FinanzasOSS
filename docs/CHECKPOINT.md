# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.4 — Reconciliación PSE/transferencias internas** (`9d2f2b4`).
- Bloque completado en esta rama: **Fase 6.5 — Tests y auditoría de cierre de Fase 6**.
- Próximo bloque exacto tras CI verde e integración: **Fase 7.1 — Matriz API oficial/agregador/import por institución**.

## Fase 6 cerrada en esta rama

- 6.1 Discovery Open Finance y acceso como tercero: cerrado con decisión fail-closed donde no existe ruta oficial verificable de Account Information.
- 6.2 Nequi adapter: read-only, consentimiento primero y sin endpoints/scopes inventados.
- 6.3 DaviPlata adapter: read-only, consentimiento primero y sin endpoints/scopes inventados.
- 6.4 Reconciliación PSE/transferencias internas: reutiliza el matcher de cuentas propias, PSE no auto-enlaza por sí solo y referencias contradictorias fallan cerrado.
- 6.5 Tests: regresiones individuales + auditoría transversal Nequi/DaviPlata/PSE incluidas en el comando normal `npm test`/CI.
- La revocación de consentimiento corta inmediatamente accounts/balances/transactions en ambos adapters.
- `investment_transfer` permanece separado de gasto y del reconciliador PSE/interno.
- Todos los endpoints usados por pruebas son sintéticos bajo `sandbox.example.invalid`; no hay credenciales, datos reales, screen scraping ni producción bancaria.

## Gate siguiente

No iniciar **7.1** hasta que esta rama pase CI y la Fase 6 se integre en `main`. Las rutas reales de Nequi/DaviPlata permanecen fail-closed hasta verificación oficial. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys ni datos financieros reales.
