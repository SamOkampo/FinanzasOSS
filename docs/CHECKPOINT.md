# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.6 — Portfolio domain**.
- Rama: `feat/phase-2-6-portfolio-domain-v2`.
- Próximo bloque exacto: **Fase 2.7 — métricas de aportes vs rendimiento, realized/unrealized P&L, income/fees/tax**.

## 2.6 completado

- Portfolio, Asset, Position, InvestmentActivity y PortfolioSnapshot tenant-scoped.
- Identificadores múltiples de activos con namespace.
- Cantidades como DecimalString para evitar precisión binaria.
- Soporte de posiciones fraccionarias y negativas.
- Invariantes portfolio/account/asset/tenant.
- Contratos de persistencia específicos para portafolios.
- Pruebas de pertenencia, precisión decimal, actividad y snapshots.
- Cobertura histórica 2.4/2.5 reparada previamente en PR dedicado.

## Gate

No avanzar a 2.7 hasta que el PR de 2.6 pase lint, typecheck y tests.
