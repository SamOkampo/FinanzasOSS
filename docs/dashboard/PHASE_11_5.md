# Phase 11.5 — Goals and progress

## Scope

Expose deterministic progress for user-defined financial goals without turning the dashboard into automated financial advice.

## Semantics

- Every goal supplies an explicit baseline, current value and target in one validated reporting currency.
- Increase and decrease goals are both supported; progress is measured from baseline toward target and clamped to 0–10000 basis points.
- Moving away from the target is shown explicitly instead of producing negative or misleading completion percentages.
- Reaching or passing the target marks the goal complete.
- Goal dates are optional metadata and do not produce unsupported on-track/off-track forecasts.
- Goals are not summed into a single amount because debt reduction, savings, net worth and investment objectives are not interchangeable economic quantities.
- The dashboard is read-only and non-advisory: it cannot move money, trade, withdraw, change budgets or alter provider connections.

## Gate

11.5 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
