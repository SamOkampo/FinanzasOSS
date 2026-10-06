# Phase 12.7 — Performance and accessibility

## Scope

Close the premium-experience phase with explicit performance budgets and accessibility gates.

## Semantics

- Experience performance has product budgets for initial script, critical CSS, interaction latency and layout shift.
- Deferred rendering is allowed only for secondary sections; the primary net-worth summary cannot be deferred away.
- Interactive controls require a 44px minimum target, accessible name, keyboard reachability and visible focus.
- Positive/negative meaning must retain a non-color cue.
- Reduced motion remains mandatory.
- Async financial updates use a status region with fixed, privacy-safe announcements.
- Accessibility announcements never include sensitive monetary amounts.
- Performance optimization must never cache secrets or relax privacy/security boundaries.

## Gate

12.7 closes when performance/accessibility policy, web styling hooks, regression coverage and the Phase 12 audit merge with CI green.
