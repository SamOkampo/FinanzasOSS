# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 3.3 — capability matrix**.
- Rama: `feat/phase-3-3-capability-matrix`.
- Próximo bloque exacto: **Fase 3.4 — Sync engine incremental e idempotente**.

## 3.3 completado

- Lista canónica de capabilities del Connector SDK.
- Matriz derivada de descriptors, sin hardcode por institución.
- Flags accounts/balances/transactions/positions/activities/snapshots.
- Unicidad por connectorId + environment.
- Descubrimiento por conjunto de capabilities y entorno.
- Tests con conectores heterogéneos.

## Gate

No avanzar a 3.4 hasta que el PR de 3.3 pase CI.
