# Phase 9.9 — Cost basis and portfolio accounting fields

## Scope

Aggregate cost basis, realized/unrealized P&L, dividends, interest, fees and taxes only when the source data needed for each metric is present.

## Rules

- Missing provider fields are never treated as zero.
- Cost basis and unrealized P&L require the corresponding value for every included position.
- Realized P&L becomes unavailable when a sell lacks a realized-P&L value.
- Dividend, interest, fee and tax activities require an amount when their activity kind says the event occurred.
- Currency mismatches make the affected aggregate unavailable and are surfaced explicitly.
- Cost basis, dividends, interest, fees and taxes use non-negative absolute amounts; P&L may be signed.
- Scope is strictly tenant + portfolio and tests use synthetic data only.

## Gate

9.9 closes after implementation, regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
