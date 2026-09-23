# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.1 — entidades financieras base**.
- Rama: `feat/phase-2-1-financial-entities`.
- Próximo bloque exacto: **Fase 2.2 — Transaction schema universal + categorías/tipos patrimoniales**.

## 2.1 completado

- Tenant, Institution, Connection, Consent, Account, Balance y Transaction normalizados.
- Scope explícito por `tenantId`.
- Referencias opacas a secretos; no tokens/credenciales en Finance Core.
- Repositories tenant-scoped para connections, consents, accounts, balances y transactions.
- Sync checkpoints tenant-scoped y extensibles a inversiones.
- Invariantes y pruebas negativas para impedir cruces tenant/account/connection.
- Documentación de entidades e invariantes.

## Gates antes de continuar

El PR de 2.1 debe pasar lint, typecheck, tests y build/CI antes de merge. Si falla, corregir únicamente la causa antes de avanzar.
