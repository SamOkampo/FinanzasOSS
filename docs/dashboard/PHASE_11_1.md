# Phase 11.1 — Total net worth dashboard

## Scope

Aggregate cash assets, explicit credit liabilities and read-only investment wealth into a single dashboard net-worth view.

## Semantics

- Cash balances in the reporting currency are counted as assets.
- Portfolio market value comes from the existing read-only portfolio aggregation layer.
- Explicit outstanding credit liability is subtracted from assets.
- Credit limits are never counted as assets or available wealth.
- Currency mismatches are excluded and make the dashboard incomplete; no implicit FX conversion is invented.
- Incomplete portfolio aggregation propagates to dashboard completeness.
- Bank-to-investment transfers are not added or subtracted separately; current cash and portfolio values already represent the location of wealth, avoiding double counting.
- The dashboard is read-only and does not execute payments, transfers, withdrawals or trades.

## Gate

11.1 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
