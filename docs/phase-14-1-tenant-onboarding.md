# Phase 14.1 — Onboarding and tenant isolation

## Scope

Define the MVP gate for multi-user onboarding without enabling live financial providers or production identity infrastructure.

## Isolation invariants

- Every financial resource remains owned by exactly one tenant identifier.
- Repository operations require an explicit tenant context and actor identifier.
- Cross-tenant reads and writes must fail closed before persistence or disclosure.
- Onboarding creates only application tenancy metadata; it never creates bank credentials, provider secrets, seed phrases or private keys.
- Connector consent remains a separate explicit step; onboarding alone grants no financial-data access.
- No global or implicit fallback tenant is allowed.
- Production identity provisioning is outside this block.

## Gate

14.1 closes only after executable regression coverage proves same-tenant access is accepted, cross-tenant access is rejected, global CI is green, the change is merged, and ROADMAP/CHECKPOINT are reconciled.
