# Phase 11.2 — Cash flow and budget

## Scope

Expose monthly economic cash flow and category budgets without misclassifying investment contributions as consumer spending.

## Semantics

- Economic cash flow is income minus consumer expense.
- Bank-to-investment contributions are shown separately as `investmentTransferMinor` and never added to consumer expense.
- Budget targets are user-defined by category.
- Actual spending may contain multiple records per category and is aggregated deterministically.
- Categories without a target are marked `unbudgeted`, not silently folded into another category.
- Over-budget and remaining amounts are descriptive only; no payment or investment action is triggered.
- All values use one validated currency supplied by the caller; this view does not invent FX conversion.
- The dashboard is read-only.

## Gate

11.2 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
