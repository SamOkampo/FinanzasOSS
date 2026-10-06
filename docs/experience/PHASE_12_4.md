# Phase 12.4 — Mobile gestures and PWA

## Scope

Make mobile interaction structural while keeping financial actions explicit and safe.

## Semantics

- Horizontal gestures may navigate only between primary product spaces.
- Gestures starting on interactive controls are ignored by navigation.
- Financial, destructive, payment, transfer, trading and withdrawal actions are never gesture-triggered.
- Gestures require a deliberate horizontal threshold and direction dominance to avoid accidental navigation.
- Safe-area behavior remains part of the navigation contract.
- The PWA is installable/standalone, but its cache policy is fail-closed for financial API responses, sensitive data, secrets and credentials.
- Offline mode is limited to the application shell and non-sensitive guidance; no offline money movement or trading is allowed.

## Gate

12.4 closes when gesture policy, PWA policy/manifest, standalone safe-area behavior and regression coverage merge with CI green.
