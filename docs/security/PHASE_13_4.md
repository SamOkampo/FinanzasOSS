# Phase 13.4 — Audit log and consent ledger

## Scope
Add provider-neutral, append-only audit and consent primitives without enabling production storage or financial access.

## Audit log
- Events are tenant-bound, ordered and hash-chained so tampering is detectable.
- Event time cannot move backwards inside a chain.
- Metadata is canonicalized and rejects secret-like keys such as tokens, passwords, credentials, cookies, seed phrases and private keys.
- Audit events describe security-relevant actions only; they never store bank credentials or raw authorization material.
- Production persistence remains gated on immutable retention/access controls and approved infrastructure.

## Consent ledger
- A ledger starts with an explicit active grant and records provider, purpose and references to verified scopes.
- Revocation/expiry append a new entry rather than rewriting history.
- Terminal consent cannot be silently reactivated; a future authorization must create a new consent identity.
- Tenant, consent and provider identity cannot change within a ledger.
- No provider endpoint, real scope, certificate or credential is invented by this phase.

## Gate
13.4 closes after regression coverage, global CI green, merge and ROADMAP/CHECKPOINT reconciliation.
