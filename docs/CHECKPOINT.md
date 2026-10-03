# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 7.5 — Nu Colombia** (`c6dd81d`, PR #46).
- **Fase 7.1 — Matriz API oficial/agregador/import por institución: cerrada e integrada con CI verde.**
- **Fase 7.2 — Lulo Bank: cerrada e integrada con CI verde.**
- **Fase 7.3 — Pibank: cerrada e integrada con CI verde.**
- **Fase 7.4 — RappiPay/RappiCard: cerrada e integrada con CI verde.**
- **Fase 7.5 — Nu Colombia: cerrada e integrada con CI verde.**
- Próximo bloque exacto: **Fase 7.6 — BBVA Colombia**.

## Fase 7.5 integrada

- El alcance es **Cuenta de ahorros Nu / Cuenta Nu** bajo **Nu Colombia Compañía de Financiamiento S.A.**.
- Evidencia oficial revalidada el 2026-10-02 confirma que el cliente solicita el extracto desde App Nu y lo recibe por correo en **PDF**.
- No se verificó una ruta de Account Information personal consumible por terceros; `official_account_info_route` permanece `not_verified`.
- El contenido educativo oficial de Open Finance no se interpreta como autorización ni como evidencia de una API utilizable.
- `aggregator_route` permanece `not_verified`.
- El modo recomendado queda `statement_import` en entorno `local_import`.
- `statementFormat = pdf` queda verificado oficialmente y `parserAvailable = false` hasta Fase 8.
- `packages/connector-sdk/src/nu-colombia.ts` registra el perfil y un gate fail-closed.
- El gate exige ruta oficial verificada + consentimiento + capabilities + endpoints HTTPS; sin esas pruebas falla cerrado.
- Parser PDF aislado, decryption/password handling, preview, provenance e idempotencia pertenecen a Fase 8 y no se adelantan aquí.
- No hay endpoints, scopes, certificados, credenciales, datos reales, screen scraping ni acceso productivo.
- Cierre validado mediante PR #46 con CI #107 verde sobre el head final antes del merge.

## Gate siguiente

El siguiente bloque permitido es únicamente **7.6 — BBVA Colombia**. Revalidar API Market y canales oficiales; mantener `enterprise_only` para rutas privadas/tesorería y no promover evidencia empresarial a Account Information personal. Mantener consentimiento primero y `fail_closed` cuando no exista una ruta aplicable verificable. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
