# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.5 — Tests y auditoría de cierre de Fase 6** (`1ea139f`).
- **Fase 6 — Nequi + DaviPlata: cerrada e integrada con CI verde.**
- Próximo bloque exacto: **Fase 7.1 — Matriz API oficial/agregador/import por institución**.

## Fase 6 integrada

- 6.1 Discovery Open Finance y acceso como tercero: cerrado con decisión fail-closed donde no existe ruta oficial verificable de Account Information.
- 6.2 Nequi adapter: read-only, consentimiento primero y sin endpoints/scopes inventados.
- 6.3 DaviPlata adapter: read-only, consentimiento primero y sin endpoints/scopes inventados.
- 6.4 Reconciliación PSE/transferencias internas: reutiliza el matcher de cuentas propias, PSE no auto-enlaza por sí solo y referencias contradictorias fallan cerrado.
- 6.5 Tests y auditoría: regresiones individuales + auditoría transversal Nequi/DaviPlata/PSE incluidas en `npm test`/CI.
- La revocación de consentimiento corta inmediatamente accounts/balances/transactions en ambos adapters.
- `investment_transfer` permanece separado de gasto y del reconciliador PSE/interno.
- Todos los endpoints usados por pruebas son sintéticos bajo `sandbox.example.invalid`; no hay credenciales, datos reales, screen scraping ni producción bancaria.
- Cierre validado mediante PR #36 con CI #86 verde.

## Gate siguiente

El siguiente bloque permitido es únicamente **7.1 — Matriz API oficial/agregador/import por institución**. Las rutas reales de Nequi/DaviPlata permanecen fail-closed hasta verificación oficial. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys ni datos financieros reales.
