# Development checkpoint

## Estado actual

- Último bloque integrado en `main` antes de este PR: **Fase 7.3 — Pibank** (`e44d9ce`, PR #42), con reconciliación documental posterior en `b90d50a` (PR #43).
- **Fase 7.4 — RappiPay/RappiCard:** implementación preparada en esta rama; cerrar únicamente al integrar este PR con CI verde.
- Próximo bloque exacto después del merge verde de 7.4: **Fase 7.5 — Nu Colombia**.

## Fase 7.4 — RappiPay / RappiCard

- **RappiCuenta** se modela bajo **RappiPay Compañía de Financiamiento S.A.**.
- **RappiCard** se modela por separado como tarjeta de crédito emitida por **Banco Davivienda S.A.**.
- Evidencia oficial revalidada el 2026-10-02 confirma estados de cuenta/extractos mensuales para ambos productos mediante sus canales oficiales.
- No se verificó una ruta de Account Information personal consumible por terceros para ninguno; ambos mantienen `official_account_info_route = not_verified`.
- `aggregator_route` permanece `not_verified` para ambos; no se infiere soporte institucional.
- El modo recomendado para ambos queda `statement_import` en entorno `local_import`.
- El formato exacto del archivo queda `not_verified`; no se asume PDF/CSV/XLSX/OFX.
- `packages/connector-sdk/src/rappipay.ts` registra perfiles separados y un gate consciente del producto.
- El gate exige ruta oficial verificada + consentimiento + capabilities + endpoints HTTPS; sin esas pruebas falla cerrado.
- Parser universal, detección de formato, preview, provenance e idempotencia pertenecen a Fase 8 y no se adelantan aquí.
- No hay endpoints, scopes, certificados, credenciales, datos reales, screen scraping ni acceso productivo.

## Gate siguiente

Integrar 7.4 únicamente con CI verde. Después el siguiente bloque permitido es **7.5 — Nu Colombia**. Mantener consentimiento primero, read-only/fail-closed y fuentes oficiales. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
