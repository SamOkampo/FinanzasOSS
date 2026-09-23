# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.4 — transfer matching entre cuentas propias**.
- Rama: `feat/phase-2-4-own-account-transfers`.
- Próximo bloque exacto: **Fase 2.5 — investment transfer matching: banco ↔ broker/exchange/wallet**.

## 2.4 completado

- Matching debit ↔ credit entre cuentas propias.
- Validación same-tenant/different-account.
- Monto/moneda exactos y tolerancia temporal.
- Scoring de señales explícitas.
- Auto-link solo en confianza alta con señales suficientes.
- `transferGroupId` determinista.
- Clasificación como `transfers.internal`.
- Investment transfers delegadas explícitamente a 2.5.

## Gate

No avanzar a 2.5 hasta que el PR de 2.4 pase CI.
