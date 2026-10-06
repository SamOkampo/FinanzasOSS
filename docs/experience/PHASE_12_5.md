# Phase 12.5 — Dark/light/system and reduced motion

## Scope

Resolve appearance and motion preferences without mixing visual preference with financial state.

## Semantics

- Color scheme supports explicit light, explicit dark and system-following modes.
- System-following mode resolves from the platform color scheme and records that source.
- Motion preference supports system behavior or an explicit reduced option.
- If the platform requests reduced motion, the application never overrides that request back to full motion.
- Preference state stores presentation choices only and never financial values, credentials, secrets or connector state.
- CSS exposes light/dark/system color-scheme semantics without coupling finance logic to arbitrary visual colors.

## Gate

12.5 closes when preference resolution, CSS selectors, reduced-motion enforcement and regression coverage merge with CI green.
