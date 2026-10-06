# Phase 13.5 — Data export and delete

## Scope

Define tenant-scoped export and deletion boundaries without executing destructive production operations.

## Export

- Exports accept only an explicit tenant identifier and fail closed if any record carries another tenant ID.
- Secret-like fields, including token/credential/password/private-key/API-key material and opaque secret references, are excluded.
- Supported MVP datasets are enumerated rather than discovered dynamically.
- BigInt monetary values are rendered as decimal strings for portable output.
- Export generation does not contact providers and does not enable real financial access.

## Delete

- A deterministic dependency-aware deletion order is defined for tenant business data.
- The MVP creates deletion plans only; production destructive execution remains disabled.
- Any retention exception must include an approved policy reference and reason.
- No legal retention period or obligation is invented by application code.
- Audit/consent retention must be decided by an approved policy before production handling.

## Production gate

Real customer export delivery and destructive deletion require authenticated authorization, verified tenant ownership, approved retention/legal policy, production persistence controls and explicit production authorization.

## Gate

13.5 closes after regression coverage, global CI green and merge. ROADMAP/CHECKPOINT reconciliation may be batched with the Phase 13 closeout after 13.7.
