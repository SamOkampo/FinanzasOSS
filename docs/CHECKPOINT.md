# Development checkpoint

## Estado actual

- Último bloque integrado en `main` antes de este PR: **Fase 7.1 — Matriz API oficial/agregador/import por institución** (`62504f7`, PR #38), con reconciliación documental posterior en `3458c16` (PR #39).
- **Fase 7.2 — Lulo Bank:** implementación preparada en esta rama; cerrar únicamente al integrar este PR con CI verde.
- Próximo bloque exacto después del merge verde de 7.2: **Fase 7.3 — Pibank**.

## Fase 7.2 — Lulo Bank

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

## Gate siguiente

Integrar 7.2 únicamente con CI verde. Después el siguiente bloque permitido es **7.3 — Pibank**. Mantener consentimiento primero, read-only/fail-closed y fuentes oficiales. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
