# Phase 10.4 — Spending anomalies and cash-flow forecast

## Scope

Surface conservative spending outliers and produce an explainable monthly cash-flow estimate from completed historical months.

## Semantics

- Spending anomalies consider posted debit expenses only.
- Internal transfers, investment flows and investment activity are excluded even if their raw labels resemble merchants.
- An anomaly requires at least three prior merchant observations plus a latest observation at least 2x the historical median.
- All anomaly results remain reviewable; this block never mutates categories or transactions.
- Cash-flow forecast uses only completed months and only income/expense economic classes.
- Multi-currency histories fail closed rather than inventing FX conversion.
- At least two completed months are required; three or more only raise confidence to medium.
- Forecasts are estimates, never guarantees or financial advice.
- No money movement, trading, payments or production-bank access is introduced.

## Gate

10.4 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
