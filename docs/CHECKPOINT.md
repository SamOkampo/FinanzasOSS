# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.7 — métricas patrimoniales y de rendimiento**.
- Rama: `feat/phase-2-7-portfolio-metrics`.
- Próximo bloque exacto: **Fase 3.1 — contrato de conectores + access modes**.

## 2.7 completado

- Separación estricta de netContributions y performance.
- marketValue, cashValue y totalValue.
- realized/unrealized P&L signed.
- dividendos/intereses como income.
- fees e impuestos separados.
- netPerformance explicable.
- Consolidación únicamente en moneda base; sin FX implícito.
- Completeness report para datos faltantes o monedas excluidas.
- Tests de aportes, rendimiento positivo/negativo y FX incompleto.

## Gate

No iniciar Fase 3 hasta que el PR de 2.7 pase lint, typecheck y tests.
