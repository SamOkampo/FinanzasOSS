# Phase 10.6 — Contribution Planner

## Scope

Estimate an upper bound for a planned investment contribution using the conservative safe-to-spend result and the user's own target/cap.

## Semantics

- Never exceeds `safeToSpendMinor`.
- Never exceeds the remaining user-defined contribution target.
- An optional user cap may further lower the estimate.
- A completed target yields a zero suggestion.
- Zero available capacity yields `not_available`; no borrowing or credit capacity is introduced.
- The suggested amount is an estimate, not a guarantee, recommendation or instruction to invest.
- This block never executes a transfer, order, deposit or withdrawal.
- If a later authorized workflow executes a bank-to-broker/exchange/wallet movement, its ledger kind remains `investment_transfer`, never expense.

## Gate

10.6 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
