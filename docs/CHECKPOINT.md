# Development checkpoint

## Estado actual

- Último bloque integrado en `main` antes de este PR: **Fase 7.4 — RappiPay/RappiCard** (`3fa04d5`, PR #44), con reconciliación documental posterior en `37781d1` (PR #45).
- **Fase 7.5 — Nu Colombia:** implementación preparada en esta rama; cerrar únicamente al integrar este PR con CI verde.
- Próximo bloque exacto después del merge verde de 7.5: **Fase 7.6 — BBVA Colombia**.

## Fase 7.5 — Nu Colombia

- El alcance de este bloque es **Cuenta de ahorros Nu / Cuenta Nu** bajo **Nu Colombia Compañía de Financiamiento S.A.**.
- Evidencia oficial revalidada el 2026-10-02 confirma que el cliente solicita el extracto desde App Nu y lo recibe por correo en **PDF**.
- No se verificó una ruta de Account Information personal consumible por terceros; `official_account_info_route` permanece `not_verified`.
- El contenido educativo oficial de Open Finance no se interpreta como autorización ni como evidencia de una API utilizable.
- `aggregator_route` permanece `not_verified`.
- El modo recomendado queda `statement_import` en entorno `local_import`.
- `statementFormat = pdf` queda verificado oficialmente, pero `parserAvailable = false` hasta Fase 8.
- `packages/connector-sdk/src/nu-colombia.ts` registra el perfil y un gate fail-closed.
- El gate exige ruta oficial verificada + consentimiento + capabilities + endpoints HTTPS; sin esas pruebas falla cerrado.
- Parser PDF aislado, decryption/password handling, preview, provenance e idempotencia pertenecen a Fase 8 y no se adelantan aquí.
- No hay endpoints, scopes, certificados, credenciales, datos reales, screen scraping ni acceso productivo.

## Gate siguiente

Integrar 7.5 únicamente con CI verde. Después el siguiente bloque permitido es **7.6 — BBVA Colombia**. Mantener consentimiento primero, read-only/fail-closed y fuentes oficiales. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
