# Development checkpoint

## Estado actual

- Último bloque implementado en PR: **Fase 4.2 — OAuth/consent sandbox**.
- Rama: `feat/phase-4-2-oauth-consent-sandbox`.
- Próximo bloque exacto tras CI verde e integración: **Fase 4.3 — Cuentas/saldos**.

## 4.2 implementado

- Constructor OAuth Authorization Code + PKCE S256 con `state` criptográficamente aleatorio.
- Verificación estricta de `state` al callback.
- Configuración fail-closed: no se infieren endpoint, client id, redirect URI ni scopes de Bancolombia.
- HTTPS obligatorio para authorization endpoint; HTTP permitido solo para callback localhost de desarrollo.
- Ningún client secret, credencial bancaria, token real, dato financiero real ni endpoint inventado queda en el repositorio.
- Fixture de pruebas usa exclusivamente `example.invalid` y scopes ficticios.

## Gate

No avanzar a 4.3 hasta que CI de este PR quede verde y se integre en `main`. 4.3 debe seguir fail-closed mientras producto/scopes/endpoints oficiales de Account Information no estén confirmados en el portal autorizado. No habilitar producción, pagos ni screen scraping.
