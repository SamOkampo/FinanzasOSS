# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 5.5 — Tests y fixtures** (`8ea4356`).
- PR #27 integrado correctamente mediante squash.
- Próximo bloque exacto: **Fase 6.1 — Discovery Open Finance y acceso como tercero para Nequi + Daviplata**.

## 5.5 integrado

- Fixture Davivienda completamente sintético para accounts/balances/transactions; todos los endpoints usan `sandbox.example.invalid`.
- El fixture declara explícitamente que no contiene clientes, cuentas, tokens, scopes, credenciales, certificados ni datos financieros reales.
- Regresión verifica capabilities read-only, revocación fail-closed y decisiones de recuperación para auth, consent, rate-limit, upstream, invalid-response y configuration.
- La regresión queda incluida en el comando normal `npm test`/CI.
- ROADMAP mantiene 5.1–5.5 cerrados.

## Gate siguiente

Fase 5 está cerrada. El siguiente bloque permitido es únicamente **6.1 — Discovery Open Finance y acceso como tercero para Nequi + Daviplata**. Mantener enfoque fail-closed: no inventar endpoints/scopes/certificados; no usar screen scraping; no habilitar producción, pagos, transferencias, trading, retiros, credenciales bancarias ni datos financieros reales.
