# Phase 11.3 — Provider-separated and consolidated portfolios

## Scope

Expose investment portfolios grouped by explicitly supplied provider identity while preserving the existing consolidated portfolio wealth total.

## Semantics

- Provider relationships are supplied explicitly by the caller; the dashboard never guesses which broker, exchange or wallet owns a portfolio.
- The consolidated totals reuse the validated `PortfolioWealthAggregation` result.
- Provider groups include only portfolios already eligible for the consolidated reporting currency.
- Portfolios excluded by missing metrics or currency mismatch remain visible through the aggregation exclusion lists; no implicit FX conversion is invented.
- Included portfolios without an explicit provider assignment are reported as `unassignedPortfolioIds` and make the provider breakdown incomplete.
- Duplicate portfolio assignments, unknown portfolio IDs and conflicting names for the same provider ID fail closed.
- Archived or otherwise non-included portfolios do not contribute to provider totals.
- The view is read-only and cannot trade, withdraw, transfer or mutate provider connections.

## Gate

11.3 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
