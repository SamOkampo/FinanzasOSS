# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.5 — investment transfer matching banco ↔ broker/exchange/wallet**.
- Rama: `feat/phase-2-5-investment-transfers`.
- Próximo bloque exacto: **Fase 2.6 — Portfolio domain**.

## 2.5 completado

- Contribution y withdrawal.
- Account-domain validation cash ↔ investment/crypto.
- Matching same-money y cross-currency mediante `originalMoney`.
- Ventana temporal configurable.
- Scoring y señales explícitas.
- Auto-link conservador.
- `invxfer1_` transferGroupId.
- Categorías contribution/withdrawal.
- Pruebas de COP→USD, retiro, candidato débil y cuentas no compatibles.

## Gate

No avanzar a 2.6 hasta que el PR de 2.5 pase CI.
