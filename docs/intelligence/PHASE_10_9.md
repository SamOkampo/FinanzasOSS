# Phase 10.9 — Concentration and target drift

## Scope

Report portfolio concentration and drift relative to an allocation target explicitly defined by the user.

## Semantics

- All market values must use one currency; mixed-currency inputs fail closed rather than inventing FX.
- User target allocations must sum to exactly 10,000 basis points.
- Actual allocation is derived from current market value.
- Signed drift is actual basis points minus user target basis points.
- Assets absent from the target have a target of zero; target assets with no current position have an actual allocation of zero.
- Concentration is always reported through the top holding.
- A concentration breach is asserted only when the caller provides an explicit user threshold; the system does not invent a universal concentration limit.
- The report is read-only and does not recommend or execute rebalancing, trading, withdrawals or transfers.
- No return guarantee or investment recommendation is produced.

## Gate

10.9 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
