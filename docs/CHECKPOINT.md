# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 7.4 — RappiPay/RappiCard** (`3fa04d5`, PR #44).
- **Fase 7.1 — Matriz API oficial/agregador/import por institución: cerrada e integrada con CI verde.**
- **Fase 7.2 — Lulo Bank: cerrada e integrada con CI verde.**
- **Fase 7.3 — Pibank: cerrada e integrada con CI verde.**
- **Fase 7.4 — RappiPay/RappiCard: cerrada e integrada con CI verde.**
- Próximo bloque exacto: **Fase 7.5 — Nu Colombia**.

## Fase 7.4 integrada

- **RappiCuenta** se modela bajo **RappiPay Compañía de Financiamiento S.A.**.
- **RappiCard** se modela por separado como tarjeta de crédito emitida por **Banco Davivienda S.A.**.
- Evidencia oficial revalidada el 2026-10-02 confirma extractos/estados de cuenta mensuales para ambos productos mediante canales oficiales.
- No se verificó una ruta de Account Information personal consumible por terceros para ninguno; ambos mantienen `official_account_info_route = not_verified`.
- `aggregator_route` permanece `not_verified` para ambos.
- El modo recomendado queda `statement_import` en entorno `local_import`.
- El formato exacto del archivo queda `not_verified`; no se asume PDF/CSV/XLSX/OFX.
- `packages/connector-sdk/src/rappipay.ts` registra perfiles separados y un gate consciente del producto.
- El gate exige ruta oficial verificada + consentimiento + capabilities + endpoints HTTPS; sin esas pruebas falla cerrado.
- Parser universal, detección de formato, preview, provenance e idempotencia pertenecen a Fase 8 y no se adelantan aquí.
- No hay endpoints, scopes, certificados, credenciales, datos reales, screen scraping ni acceso productivo.
- Cierre validado mediante PR #44 con CI #103 verde sobre el head final antes del merge.

## Gate siguiente

El siguiente bloque permitido es únicamente **7.5 — Nu Colombia**. Verificar fuentes oficiales actuales antes de habilitar cualquier ruta; mantener consentimiento primero y `fail_closed` cuando no exista Account Information aplicable verificable. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
