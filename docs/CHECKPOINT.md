# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 7.2 — Lulo Bank** (`86b4017`, PR #40).
- **Fase 7.1 — Matriz API oficial/agregador/import por institución: cerrada e integrada con CI verde.**
- **Fase 7.2 — Lulo Bank: cerrada e integrada con CI verde.**
- Próximo bloque exacto: **Fase 7.3 — Pibank**.

## Fase 7.2 integrada

- Evidencia oficial revalidada el 2026-10-02: Lulo permite descargar extractos de Lulo Cuenta desde la app en **Explora → Ahorro → Cuenta → Ajustes → Extractos y documentos**.
- La evidencia oficial también documenta consulta de historial de ingresos/transacciones y descarga del extracto mensual.
- No se verificó una ruta de Account Information personal consumible por terceros; `official_account_info_route` permanece `not_verified`.
- `aggregator_route` permanece `not_verified`; no se infiere soporte institucional.
- El modo recomendado queda `statement_import` en entorno `local_import`.
- `packages/connector-sdk/src/lulo-bank.ts` registra el perfil de importación y mantiene `parserAvailable = false` hasta la Fase 8.
- El gate de Account Information exige ruta oficial verificada + consentimiento + capabilities + endpoints HTTPS; sin esas pruebas falla cerrado.
- La documentación oficial indica que el PDF puede estar protegido por contraseña; FinanzasOSS registra `persistDocumentPassword = false` y no almacena esa contraseña.
- El parser PDF aislado, decryption handling, preview, provenance e idempotencia pertenecen a Fase 8 y no se adelantan aquí.
- No hay endpoints, scopes, certificados, credenciales, datos reales, screen scraping ni acceso productivo.
- Cierre validado mediante PR #40 con CI #95 verde sobre el head final antes del merge.

## Gate siguiente

El siguiente bloque permitido es únicamente **7.3 — Pibank**. Verificar fuentes oficiales actuales antes de habilitar cualquier ruta; mantener consentimiento primero y `fail_closed` cuando no exista Account Information aplicable verificable. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
