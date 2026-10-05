# Phase 10.5 — Safe-to-spend

## Scope

Estimate a conservative amount that may be available for discretionary spending after known reserves, obligations and a safety buffer.

## Semantics

- Uses one currency at a time; no implicit FX conversion.
- Starts from available cash, not total account balance or portfolio value.
- Explicit reserves, known obligations and the safety buffer are always subtracted.
- Negative cash-flow forecast further reduces the estimate.
- Positive forecast is ignored by default and may only increase the estimate through an explicit caller opt-in.
- The result is floored at zero.
- The output is an estimate and never a liquidity guarantee, credit decision or recommendation to spend.
- Investment assets, credit limits, pending transfers and unrealized gains are not treated as available cash.
- This block never initiates payments, transfers, withdrawals or trading.

## Gate

10.5 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
