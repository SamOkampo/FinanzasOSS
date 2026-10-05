# Phase 10.3 — Subscription detector

## Scope

Detect recurring debits conservatively from normalized historical observations without creating charges, cancelling services or changing the financial ledger.

## Semantics

- Requires at least three eligible posted debit observations for the same normalized merchant and currency.
- Pending, reversed, credit, transfer and investment observations do not count.
- Recognized cadence bands are weekly, monthly and yearly.
- Amount stability and interval stability affect confidence independently.
- High confidence requires at least four observations plus stable amount and cadence.
- Medium/low confidence remains reviewable.
- A recurrence with an unrecognized cadence is surfaced as low-confidence rather than forced into a subscription label.
- `nextExpectedAt` is an estimate only and never a guarantee.
- The detector is read-only and cannot create payments, subscriptions, cancellations or money movement.

## Gate

10.3 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
