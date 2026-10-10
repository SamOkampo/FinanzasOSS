# Phase 15.1 — External evidence handoff and audit checklist

Status: **external evidence pending**. This document does not approve or activate any production connection.

## Provider-by-provider handoff

For each connector, an authorized human reviewer must collect and verify:

1. Provider legal entity, exact product/capability, eligible third-party role and agreement status.
2. The official source and date establishing API access and consent requirements; do not infer endpoints or scopes.
3. A reference to the executed agreement and provider approval (no document with personal data in the repository).
4. A managed reference to access material in an approved secrets manager, not its contents.
5. A managed certificate reference only if the verified provider profile requires one.
6. Reviewer identity, review timestamp and explicit read-only capability verification.
7. A separate legal/privacy review, infrastructure controls, independent security assessment and manual rollout decision under 15.2–15.5.

**Never commit access tokens, certificates, account data, customer information or keys.** References alone do not establish legal eligibility, technical connectivity, consent or authorization to go live.

## Internal audit observation

The 15.1 readiness assessor and assertion should use identical validation rules. Currently, the assessor checks whether agreement/credential references are nonempty, while the assertion additionally rejects whitespace in those references. A malformed reference can therefore appear ready to downstream callers that only use the assessor. An optional certificate reference is also not checked by the assessor when present. This is a testable fail-closed hardening gap; it must be fixed and covered by regression before any production decision.

Recommended regression cases: blank provider, whitespace-containing reference, malformed optional certificate reference, non-production environment, readOnly=false, invalid review timestamp, and a valid opaque-reference control case. Do not use actual secrets or provider credentials in tests.

## Release boundary

Keep 15.1–15.5 unchecked until genuine external evidence is independently verified. Do not start Phase 16 or enable production banking, trading, withdrawals, transfers, or paid infrastructure on the strength of this checklist.
