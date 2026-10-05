# Phase 11.6 — Net-worth history and sources of change

## Scope

Expose chronological net-worth snapshots and explain changes only from explicit, normalized source events.

## Semantics

- Net worth is derived as cash assets + investment assets - credit liabilities for every snapshot.
- Snapshots and source events must use one validated reporting currency; no implicit FX conversion is invented.
- Each interval reports actual change, explicitly explained change and any unexplained remainder.
- Source attribution is never fabricated: a non-zero remainder stays visible as `unexplainedChangeMinor`.
- `investment_transfer` events are internal wealth relocation and must have exactly zero net-worth impact.
- Events outside the covered snapshot intervals are listed as unassigned and make the history incomplete.
- An interval is fully explained only when explicit source impacts exactly reconcile to the observed net-worth delta.
- The view is read-only and cannot move money, trade, withdraw or mutate provider data.

## Gate

11.6 closes after regression coverage, global CI green, PR integration and final Phase 11 ROADMAP/CHECKPOINT reconciliation.
