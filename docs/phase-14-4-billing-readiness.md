# Phase 14.4 — Billing and plan readiness

## Scope

Prepare plan/catalog and tenant assignment contracts without activating billing, charging users or inventing commercial terms.

## Rules

- Plans come from an explicit approved catalog reference.
- The shared domain does not invent prices, currencies, checkout URLs or processor identifiers.
- Feature keys and integer limits are validated and deterministic.
- Tenant plan assignment is created only as `pending_activation`.
- Pending assignments apply no entitlements automatically.
- No payment processor call is made.
- No automatic charge, renewal or plan activation exists in the MVP.
- Production billing requires separate explicit authorization and provider configuration.

## Gate

14.4 closes after catalog/assignment regression coverage, global CI green, merge and ROADMAP/CHECKPOINT reconciliation.
