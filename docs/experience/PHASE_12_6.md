# Phase 12.6 — Loading, empty and error states

## Scope

Define product-specific loading, empty, error and ready states for financial surfaces.

## Semantics

- Loading never renders fake balances, returns, forecasts or provider values.
- Sensitive values are hidden while a financial surface is loading.
- Empty states explain the next safe step without fabricating activity.
- Error states use normalized product-safe messages; raw provider errors are never rendered.
- Authorization errors direct the user back to consent/connections rather than silently retrying.
- Unsupported sources explicitly state that no invented data will be shown.
- Retry is exposed only for error classes where a safe retry can help.
- Error UI never exposes secrets, credentials, tokens, seed phrases or private keys.

## Gate

12.6 closes when financial view-state models, CSS state handling and regression coverage merge with CI green.
