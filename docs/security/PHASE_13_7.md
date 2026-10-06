# Phase 13.7 — Read-only investment credential enforcement

## Scope

Fail closed before binding any broker/exchange credential to a read-only adapter if the effective provider permissions can trade, withdraw or transfer money.

## Enforcement

- Credential material remains behind an opaque reference; raw keys/tokens are not stored in connector configuration.
- A provider-permission attestation is required before credential binding.
- The attestation provider must match the connector institution.
- The verification must point to a non-empty provider/official verification reference.
- Effective read access must be positively verified.
- Any effective trading, withdrawal or transfer permission rejects the credential.
- Provider-specific scope/permission names are deliberately not invented by this shared layer.
- Permission verification must be repeated after credential rotation or reauthorization.
- Public-address wallet adapters do not use credential binding and therefore cannot request seed phrases/private keys through this path.

## Safety boundary

This phase validates permission state only. It does not create provider credentials, request live scopes, enable production connections, place orders, withdraw assets, transfer funds or move money.

## Gate

13.7 closes after regression coverage for allowed read-only credentials and rejected trade/withdraw/transfer permissions, global CI green, merge, and Phase 13 documentation reconciliation.
