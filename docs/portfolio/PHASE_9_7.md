# Phase 9.7 — Monthly contribution matcher

## Scope

Match monthly cash-account outflows to investment/crypto account inflows as portfolio contributions, reusing the conservative investment-transfer evaluator.

## Rules

- The requested month is anchored to the cash/bank side.
- Only posted transactions participate.
- Matching remains same-tenant, cash ↔ investment/crypto, amount-aware and date-tolerant through the existing evaluator.
- Withdrawals are excluded from the contribution result.
- Matching is deterministic and one-to-one; the highest-scoring pair wins.
- Ambiguous/non-auto-link candidates remain reviewable instead of being silently mutated.
- Applying an eligible match must preserve `kind=investment_transfer`; contributions can never become spending.
- No real financial data or provider credentials are used in tests.

## Gate

9.7 closes after matcher implementation, regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
