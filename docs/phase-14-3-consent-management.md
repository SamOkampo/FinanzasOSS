# Phase 14.3 — Consent management

## Scope

Expose tenant-bound consent state and safe management actions without implementing provider transport or inventing provider-specific scopes/endpoints.

## Rules

- Consent access is bound to tenant + connection.
- Active consent may be explicitly revoked.
- Expired consent may be renewed only through a provider-consent flow.
- Revoked/rejected consent may be reauthorized only through a provider-consent flow.
- The management layer never executes provider calls itself.
- Existing capabilities are preserved in renew/reauthorize plans.
- Any capability change requires a fresh explicit consent flow.
- Onboarding never implies financial consent.
- No provider endpoint, OAuth scope, certificate or live credential is invented or enabled here.

## Gate

14.3 closes after regression coverage for status/action rules, tenant isolation, capability-change rejection, global CI green, merge, and ROADMAP/CHECKPOINT reconciliation.
