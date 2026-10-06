# Phase 13.1 — Encryption, token vault and secret rotation

## Scope

Harden the existing TokenVault abstraction without enabling production credentials.

## Security model

- Connector secret material is persisted only as authenticated-encryption envelopes.
- The vault requires a pluggable crypto provider and rejects envelopes that are not explicitly marked as AEAD.
- Tenant ID, connection ID and opaque secret reference are bound as additional authenticated data (AAD).
- Finance Core continues to persist only opaque secret references.
- Secret records carry versions; rotation and revocation require optimistic-concurrency replacement.
- Rotation encrypts replacement material before atomically replacing the previous record.
- Revoked records cannot be read or rotated.
- Envelope validation rejects unexpected fields such as accidental plaintext.
- Production crypto must use an approved KMS/HSM/secret-manager backed AEAD implementation.
- No live bank credentials or real provider secrets are introduced by this phase.

## Rotation

Rotation keeps the same opaque reference while resolving the active key identifier, encrypting replacement material with the same scope-bound AAD, incrementing the record version, and atomically replacing only the expected previous version.

Concurrent stale rotations fail closed with a rotation conflict.

## Production gate

Real financial secrets remain forbidden until a concrete production KMS or secret manager, IAM policy, key lifecycle and provider-specific authorization are explicitly approved. This phase provides the hardened application boundary only.

## Gate

13.1 closes after hardened vault behavior, rotation/revocation regression coverage, global CI green, merge, and ROADMAP/CHECKPOINT reconciliation.
