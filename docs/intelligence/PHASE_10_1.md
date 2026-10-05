# Phase 10.1 — Merchant normalization and categorization

## Scope

Provide a deterministic, local Finance Core boundary that normalizes merchant labels and proposes conservative spending categories without mutating the source ledger.

## Semantics

- Merchant normalization strips accents, punctuation noise and repeated whitespace before matching.
- Explicit `merchantName` is preferred over free-form descriptions.
- Provider category metadata may contribute a signal but does not create high confidence by itself.
- Unknown or description-only classifications remain reviewable instead of being silently accepted.
- `investment_transfer`, `internal_transfer` and `transfer` are protected transaction types and bypass merchant spending rules.
- An `investment_transfer` is always classified as the protected investment category, never as consumption even if merchant text resembles a shop or delivery service.
- No bank credentials, provider endpoints, financial secrets or real customer data are required by this block.

## Gate

10.1 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
