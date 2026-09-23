# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 3.2 — Token Vault abstraction**.
- Rama: `feat/phase-3-2-token-vault`.
- Próximo bloque exacto: **Fase 3.3 — capability matrix**.

## 3.2 completado

- VaultScope obligatorio tenant + connection.
- OAuth y API-key secret material tipados.
- Seed/private key/password no representados y rechazados en runtime.
- SecretReference opaco.
- put/get/rotate/revoke.
- Redacción recursiva de secretos en logs.
- Tests de scope, secretos válidos/prohibidos y redaction.

## Gate

No avanzar a 3.3 hasta que el PR de 3.2 pase CI.
