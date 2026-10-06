# Phase 12.3 — Glass/material system with balance privacy

## Scope

Define semantic material roles for financial reading, navigation, floating controls and privacy overlays.

## Semantics

- Sensitive financial numbers are allowed only on the solid financial material.
- Glass is reserved for navigation and floating controls; it is not a general-purpose card decoration.
- Privacy overlays use their own stronger blur role and require masked sensitive values.
- Material roles reuse the shared blur/elevation token system and never introduce arbitrary z-index layers.
- A privacy overlay cannot be used to reveal sensitive values.
- The material system changes presentation only; it does not alter financial data, permissions or connector behavior.

## Gate

12.3 closes when material policies, surface enforcement, CSS mappings and regression coverage merge with CI green.
