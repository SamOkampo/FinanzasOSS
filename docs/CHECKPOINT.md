# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 7.3 — Pibank** (`e44d9ce`, PR #42).
- **Fase 7.1 — Matriz API oficial/agregador/import por institución: cerrada e integrada con CI verde.**
- **Fase 7.2 — Lulo Bank: cerrada e integrada con CI verde.**
- **Fase 7.3 — Pibank: cerrada e integrada con CI verde.**
- Próximo bloque exacto: **Fase 7.4 — RappiPay/RappiCard según acceso disponible**.

## Fase 7.3 integrada

- Pibank se trata como marca digital de Banco Pichincha S.A.; el alcance de este bloque es únicamente **Cuenta Pibank**.
- El reglamento oficial revalidado el 2026-10-02 confirma extractos mensuales y acceso por canales oficiales.
- No se verificó una ruta de Account Information personal consumible por terceros; `official_account_info_route` permanece `not_verified`.
- `aggregator_route` permanece `not_verified`; no se infiere soporte institucional.
- El modo recomendado queda `statement_import` en entorno `local_import`.
- El formato exacto del extracto queda `not_verified`; no se asume PDF/CSV/XLSX/OFX.
- `packages/connector-sdk/src/pibank.ts` registra el perfil y mantiene `parserAvailable = false` hasta Fase 8.
- El gate de Account Information exige ruta oficial verificada + consentimiento + capabilities + endpoints HTTPS; sin esas pruebas falla cerrado.
- Parser universal, detección de formato, preview, provenance e idempotencia pertenecen a Fase 8 y no se adelantan aquí.
- No hay endpoints, scopes, certificados, credenciales, datos reales, screen scraping ni acceso productivo.
- Cierre validado mediante PR #42 con CI #99 verde sobre el head final antes del merge.

## Gate siguiente

El siguiente bloque permitido es únicamente **7.4 — RappiPay/RappiCard según acceso disponible**. Verificar fuentes oficiales actuales antes de habilitar cualquier ruta; mantener consentimiento primero y `fail_closed` cuando no exista Account Information aplicable verificable. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
