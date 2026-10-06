# Phase 14.2 — Multiple connections and portfolios

## Scope

Allow one tenant to own multiple financial connections and multiple portfolios while preserving explicit ownership and read-only portfolio boundaries.

## Rules

- Every connection, account and portfolio must match the active TenantContext.
- IDs must be unique within each workspace collection.
- Accounts may reference only explicitly supplied same-tenant connections.
- Portfolio-to-connection relationships are derived only from explicit portfolio account membership.
- Portfolios may include only investment/crypto accounts.
- Unknown accounts or connections fail closed.
- No implicit cross-tenant consolidation is allowed.
- No FX conversion is invented by the workspace.
- Multiple connections do not imply shared credentials, consent or provider access.
- Portfolio semantics remain read-only and no trading, withdrawal or money movement is enabled.

## Gate

14.2 closes after regression coverage proves multiple same-tenant connections and portfolios work, invalid/cross-tenant relationships fail closed, global CI is green, merge completes, and ROADMAP/CHECKPOINT are reconciled.
