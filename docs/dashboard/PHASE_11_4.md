# Phase 11.4 — Financial calendar and recurring contributions

## Scope

Expose a monthly read-only calendar for recurring income, obligations, subscriptions and user-defined investment contributions.

## Semantics

- Recurring items are explicit caller inputs; the calendar does not infer or create charges.
- Monthly dates use an explicit day-of-month. When a requested day does not exist in the month, the occurrence is clamped to month-end and flagged with `adjustedToMonthEnd=true`.
- All items must use the dashboard currency; mismatches fail closed and no implicit FX conversion is invented.
- Obligations and subscriptions count as consumer commitments.
- Investment contributions are shown separately, never counted as consumer spending, and are marked to preserve `investment_transfer` classification if a matching transaction is later observed.
- Disabled items are omitted from the month view.
- The calendar is read-only and cannot schedule payments, transfer money, trade, withdraw or alter a provider connection.

## Gate

11.4 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
