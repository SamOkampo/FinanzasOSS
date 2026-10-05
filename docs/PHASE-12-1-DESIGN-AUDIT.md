# Phase 12.1 — Design system audit

## Objective

Audit the existing FinanzasOSS visual foundation before adding new premium motion or materials. The goal is a product-specific financial interface, not a generic AI-generated dashboard.

## Existing primitives verified

- `packages/ui/src/materials.ts` centralizes radii, blur and elevation roles.
- `packages/ui/src/motion.ts` centralizes durations, springs and privacy/balance interaction timing.
- `packages/ui/src/index.ts` exposes typography and touch-target primitives.
- `apps/web/src/theme.css` maps shared concepts to CSS custom properties and includes focus-visible, mobile safe-area navigation and reduced-motion behavior.
- Monetary values use tabular numerals and the UI already defines explicit privacy-related motion rather than treating balances as ordinary text.

## Anti-template criteria

All new Phase 12 surfaces MUST satisfy these rules:

1. **Financial hierarchy before decoration.** Net worth, cash flow, portfolio and obligations determine hierarchy; cards are not repeated merely to fill a grid.
2. **No decorative dashboard noise.** Avoid gratuitous gradients, glow blobs, fake charts, placeholder metrics, generic icon tiles and excessive pill badges.
3. **Purposeful materials.** Glass/blur is reserved for navigation, floating controls and privacy-aware overlays. Dense financial reading surfaces prefer stable, legible materials.
4. **Numbers are first-class.** Monetary values retain tabular numerals, clear sign semantics, explicit currency and privacy masking where applicable.
5. **Motion communicates state.** Motion is for navigation, disclosure, privacy transitions and data-state changes; never continuous decoration. Reduced-motion remains equivalent in meaning.
6. **Mobile is structural.** Bottom navigation, safe areas, touch targets and narrow-screen information order are part of the component contract, not responsive afterthoughts.
7. **No invented finance.** Visual polish must never imply unavailable balances, FX conversion, forecasts, returns or provider relationships.
8. **Accessibility is a design constraint.** Keyboard focus, minimum targets, contrast-compatible materials and non-motion state cues are mandatory.

## Findings

### Keep

- Distinct radius hierarchy: capsule controls, cards and panels.
- Explicit elevation roles instead of arbitrary z-index values.
- 44px minimum target and mobile safe-area navigation.
- Reduced-motion override and short, bounded interaction timings.
- Privacy morph timing as a named financial interaction.
- Tabular numeric treatment for money.

### Consolidate during 12.2–12.7

- Keep motion values sourced from the UI package and CSS variables semantically aligned; do not introduce one-off durations.
- Keep blur/material roles aligned with `materials.ts`; avoid arbitrary backdrop blur.
- Add state-specific interaction primitives only when a real product state requires them.
- Validate premium surfaces against narrow/mobile layouts, keyboard navigation and reduced motion.

### Reject

- Generic “AI SaaS” card mosaics with equal visual weight.
- Decorative glass on every card.
- Animated balance/count-up effects that obscure exact financial values.
- Hover-only affordances.
- Unbounded animation loops or motion without a reduced-motion equivalent.
- UI that makes read-only connectors look actionable for trading, withdrawal or money movement.

## Gate for 12.1

Phase 12.1 is complete when this audit is merged with CI green. It intentionally changes no financial behavior, connector capability, production access, secrets, payments, trading or withdrawals.

## Next exact block

**12.2 — Motion/morphing/microinteractions.** Implement product-state motion from the audited primitives, preserving reduced-motion equivalence and read-only financial semantics.
