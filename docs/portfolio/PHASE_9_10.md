# Phase 9.10 — TWR, XIRR and contribution separation

## Scope

Calculate portfolio returns from validated snapshot history while keeping external contributions/withdrawals separate from investment performance.

## Semantics

- Every snapshot must include cumulative `netContributions`; missing contribution data fails closed.
- Absolute performance is `ending value - starting value - change in net contributions`.
- TWR removes each interval's contribution delta before calculating the subperiod return, then geometrically links subperiods.
- With snapshot-only data, contribution deltas are treated at the ending timestamp of their snapshot interval.
- XIRR uses the starting portfolio value as the opening investor outflow, contribution deltas as external investor cash flows, and ending value as the terminal inflow.
- TWR is unavailable when an interval has no positive starting value or an impossible negative flow-adjusted ending value.
- XIRR returns null when the cash-flow series has no valid sign-changing root.
- All values must use the snapshot-history currency; oversized values that cannot be converted safely for rate math fail closed.
- No contribution is counted as investment return.

## Gate

9.10 closes after implementation, synthetic regression coverage, global CI green, PR integration, ROADMAP/CHECKPOINT reconciliation and a final Phase 9 audit.
