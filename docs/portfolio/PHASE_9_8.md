# Phase 9.8 — Portfolio snapshots and history

## Scope

Provide deterministic, read-only portfolio snapshot history over the existing `PortfolioSnapshot` model.

## Rules

- Every snapshot must belong to the same tenant and portfolio.
- `asOf` must be a valid timestamp.
- Market value, cash value and net contributions must use the portfolio base currency.
- Duplicate snapshot IDs or identical timestamps fail closed.
- History is sorted chronologically and remains immutable to callers.
- Appends rebuild the validated history rather than mutating prior entries.
- No provider calls, trading or money movement are introduced.

## Gate

9.8 closes after implementation, synthetic regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
