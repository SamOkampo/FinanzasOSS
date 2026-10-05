# Phase 9.6 — Additional broker/exchange adapter contract

## Scope

Provide a provider-neutral factory for additional broker and exchange adapters. Concrete providers may only be added when the integration source is verified as an official API or an explicitly authorized aggregator.

## Safety boundary

- Read-only only; descriptors are forced to `sandbox` and `dataAccess=read_only`.
- Allowed access modes are OAuth, read-only API key, or authorized aggregator.
- Every adapter requires a non-empty verification reference before it can be represented.
- Trading, withdrawals and transfers remain forbidden by the shared investment policy.
- No provider-specific endpoint, scope, certificate, credential or response field is invented here.
- Tests use synthetic providers and references only.

## Gate

9.6 closes after contract implementation, synthetic regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
