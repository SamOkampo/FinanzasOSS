# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 7.1 — Matriz API oficial/agregador/import por institución** (`62504f7`, PR #38).
- **Fase 6 — Nequi + DaviPlata: cerrada e integrada con CI verde.**
- **Fase 7.1 — Cobertura bancaria Colombia: cerrada e integrada con CI verde.**
- Próximo bloque exacto: **Fase 7.2 — Lulo Bank**.

## Fase 7.1 integrada

- La matriz vive en `docs/connectors/colombia-coverage-matrix.md`.
- `official_account_info_route` distingue `verified`, `enterprise_only` y `not_verified`; una marca Open Finance por sí sola no habilita una ruta.
- Las rutas de agregadores permanecen `not_verified` salvo evidencia institucional y consentimiento aplicable.
- Cuando no existe Account Information aplicable verificada, se prefiere importación de extractos oficiales; si tampoco existe evidencia suficiente, el acceso falla cerrado.
- BBVA Colombia se mantiene `enterprise_only` para la evidencia API empresarial/tesorería disponible; no se promueve a agregación personal.
- Lulo, Pibank, RappiPay, Nu, Banco de Bogotá/Aval, Scotiabank Colpatria, Caja Social y Falabella conservan fallbacks de importación documentados cuando existe evidencia oficial.
- Itaú conserva únicamente evidencia de importación empresarial; no se extrapola a consumidor.
- No se codifican endpoints, scopes, certificados, credenciales ni acceso productivo; no hay screen scraping.
- Cierre validado mediante PR #38 con CI verde sobre el head final antes del merge.

## Gate siguiente

El siguiente bloque permitido es únicamente **7.2 — Lulo Bank**. Verificar fuentes oficiales actuales antes de habilitar cualquier ruta; mantener consentimiento primero y `fail_closed` cuando no exista Account Information aplicable verificable. No habilitar producción, pagos reales, transferencias reales, trading, retiros, secretos, private keys, datos financieros reales ni costes sin autorización explícita.
