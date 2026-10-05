# Phase 9.3 — Interactive Brokers read-only

## Scope

Implement a strictly read-only Interactive Brokers adapter for accounts, positions and account activity, using only officially documented Web API capabilities after provider details are verified.

## Safety boundary

- Read-only portfolio ingestion only; no order placement, modification or cancellation.
- No withdrawals, deposits, transfers or other money movement.
- Never persist broker passwords, session credentials, private keys or equivalent human secrets in financial domain data.
- Do not invent endpoints, scopes, authentication flows, certificates or response fields.
- Provider transport stays disabled until official documentation has been verified and represented by tests/fixtures.
- Normalize only validated provider data into finance-core models.
- Synthetic fixtures only in repository tests; no real account or financial data.
- Fail closed on unsupported or ambiguous provider payloads.

## Gate

Phase 9.3 closes only after implementation, synthetic regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
