# Phase 10.7 — Contribution alerts

## Scope

Surface reviewable alerts for monthly investment contributions that are below the user's target, duplicated by transfer identity, or still unreconciled.

## Semantics

- Works on one month and currency at a time.
- A contribution is counted toward the target only when it is reconciled.
- Multiple records sharing the same non-empty `transferGroupId` are treated as a duplicate-review condition and counted once toward the target.
- Unreconciled contribution-like records generate a warning and do not silently satisfy the target.
- A target shortfall generates an informational `missing` alert for the remaining amount.
- Alerts do not initiate transfers, orders, deposits, retries or notifications outside the application boundary.
- Bank-to-investment movements remain `investment_transfer`, never expense.
- Targets and alerts are user-planning signals, not guarantees or investment advice.

## Gate

10.7 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
