# Development checkpoint

## Estado actual

- Último bloque integrado en `main` antes de este PR: **Fase 7.2 — Lulo Bank** (`86b4017`, PR #40), con reconciliación documental posterior en `26c8f49` (PR #41).
- **Fase 7.3 — Pibank:** implementación preparada en esta rama; cerrar únicamente al integrar este PR con CI verde.
- Próximo bloque exacto después del merge verde de 7.3: **Fase 7.4 — RappiPay/RappiCard según acceso disponible**.

## Fase 7.3 — Pibank

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

## Gate siguiente

Integrar 7.3 únicamente con CI verde. Después el siguiente bloque permitido es **7.4 — RappiPay/RappiCard según acceso disponible**. Mantener consentimiento primero, read-only/fail-closed y fuentes oficiales. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
