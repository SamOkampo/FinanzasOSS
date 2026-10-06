# Phase 13.2 — OAuth/state/PKCE/mTLS según proveedor

## Scope

Harden OAuth authorization intents without inventing provider-specific endpoints, scopes, certificates or credentials.

## Security model

- OAuth state protection is mandatory.
- When PKCE is required by the verified provider profile, only S256 is accepted.
- Raw PKCE verifier material is not persisted in the intent; the intent keeps only an opaque vault reference.
- OAuth intents are short-lived and single-use.
- Redirect URI is bound to the intent and must match on callback.
- Nonce is enforced when the verified provider profile requires it.
- Provider ID is bound to the intent and callback validation.
- mTLS is enabled only when the verified provider profile requires or permits it.
- mTLS uses opaque certificate references and external KMS/HSM key handles; raw certificate/key material is rejected by the application boundary.
- Provider-specific security values must cite a verified official source. This layer deliberately does not invent endpoints, scopes, certificate paths or provider requirements.

## Fail-closed behavior

The flow rejects:
- missing or mismatched state;
- expired or already-consumed intents;
- redirect URI mismatch;
- missing PKCE verifier reference when S256 PKCE is required;
- missing/mismatched nonce when nonce is required;
- missing mTLS binding when mTLS is required;
- raw certificate/private-key material instead of opaque references;
- profiles without an official verification source.

## Production gate

This phase does not activate any production OAuth client, certificate, KMS signer, live scope or bank endpoint. Those remain blocked until provider-specific official configuration and explicit production authorization exist.

## Gate

13.2 closes after regression coverage, global CI green, merge, and ROADMAP/CHECKPOINT reconciliation.
