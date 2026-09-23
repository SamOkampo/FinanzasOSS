# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 3.1 — contrato de conectores + access modes**.
- Rama: `feat/phase-3-1-connector-contract`.
- Próximo bloque exacto: **Fase 3.2 — Token Vault abstraction**.

## 3.1 completado

- ConnectorCapability derivado del Finance Core, sin enums duplicados.
- MVP read-only: payments/cards fuera del contrato de conectores.
- ConnectorDescriptor versionado con environment/accessMode/capabilities.
- Página genérica para recursos paginados.
- Contrato de consent/accounts/balances/transactions/positions/activities/snapshots.
- ConnectorError normalizado.
- Runtime validation descriptor ↔ métodos.
- Tests para capabilities falsas, duplicadas y read-write rechazado.

## Gate

No avanzar a 3.2 hasta que el PR de 3.1 pase CI.
