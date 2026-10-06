# Phase 14.5 — Safe administration and support

## Scope

Provide a least-privilege support/admin access boundary for non-sensitive operational metadata without enabling impersonation, secret access or financial actions.

## Rules

- Every support grant is tenant-bound and requires an operator, tenant authorizer, case reference and reason.
- Grants are time-limited to at most one hour.
- Support scopes are allowlisted and limited to tenant metadata, connection health, sync status and import status.
- Admin may additionally inspect billing status and pending plan-assignment review metadata.
- Raw balances, transactions and portfolio positions are not accessible through this support boundary.
- Secret/token/credential material is never accessible.
- User impersonation is prohibited.
- Provider consent mutation and money movement are prohibited.
- Support access must be auditable; audit metadata excludes free-form reason text and financial/credential payloads.
- Production identity/RBAC infrastructure remains a later production concern.

## Gate

14.5 closes after role/scope, expiry, tenant-isolation and audit-metadata regressions pass, global CI is green, merge completes, and Phase 14 is audited/reconciled.
