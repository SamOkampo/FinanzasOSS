# Phase 13.6 — Pentest checklist and dependency scanning

## Scope

Add an executable dependency-vulnerability gate and a concrete pentest checklist without claiming that an external production pentest has occurred.

## Dependency scanning

- CI generates an ephemeral npm lock representation from the committed package manifest with lifecycle scripts disabled.
- CI runs `npm audit --audit-level=high` and fails on high/critical advisories.
- Dependabot is configured for weekly npm dependency updates.
- Dependency-update pull requests still pass the normal lint, typecheck, regression and security gates.
- No dependency is auto-merged by this phase.
- No package postinstall script is executed by the dependency-audit preparation step.

## Internal pentest checklist

Before any production financial data is authorized, verify at minimum:

- [ ] Cross-tenant/BOLA negative tests at API and persistence boundaries.
- [x] OAuth state mismatch, expiry and replay rejection.
- [x] PKCE/mTLS configuration fails closed when required by a verified provider profile.
- [x] CSRF origin/token/session binding.
- [x] XSS text escaping and restrictive CSP.
- [x] SSRF HTTPS/allowlist/private-network rejection; production DNS/egress controls remain pending.
- [x] Rate-limit exhaustion and reset behavior.
- [x] Audit metadata rejects secret-like fields and hash-chain tampering.
- [x] Consent revocation/expiry is append-only.
- [x] Tenant export rejects cross-tenant records and excludes secret-like fields.
- [ ] Authenticated destructive delete execution in production.
- [ ] Webhook signature/replay validation for providers that actually use webhooks.
- [ ] Production KMS/IAM/secret-manager review.
- [ ] External pentest against production-equivalent infrastructure.

Unchecked items are explicit production gates, not implied completions.

## Production gate

This phase does not authorize production infrastructure, live financial data, provider credentials, destructive deletion, trading, withdrawals, or money movement. An external pentest remains required before production go-live.

## Gate

13.6 closes after the dependency scan is part of CI, Dependabot configuration is present, the checklist is documented, global CI is green and the PR is merged.
