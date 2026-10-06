# Phase 13.3 — Rate limits, CSRF, XSS and SSRF

## Scope

Turn the request-security baseline into executable, provider-neutral controls without enabling production networking.

## Rate limiting

- Fixed-window evaluation is deterministic and testable.
- Policies require explicit positive limits and bounded windows.
- Exhausted windows fail closed and expose a retry delay.
- Rate-limit keys are required by policy to be derived server-side rather than trusted from user input.
- Distributed production enforcement remains an infrastructure concern for the production phase.

## CSRF

- State-changing HTTP methods require a session-bound CSRF binding, token and allowed Origin.
- Bindings store hashes rather than raw session IDs or CSRF tokens.
- Bindings expire.
- Allowed origins are exact origins; wildcard behavior is not supported.
- Safe methods do not require a CSRF token.

## XSS

- Provider descriptions and other untrusted strings are treated as text and escaped before any HTML context.
- Rendering provider HTML is prohibited by policy.
- Baseline response headers include a restrictive CSP, nosniff, no-referrer and frame denial.
- No `unsafe-inline` or `unsafe-eval` is introduced.

## SSRF

- Outbound URLs must use HTTPS.
- URLs containing credentials or fragments are rejected.
- Localhost, loopback, link-local, common private IPv4 ranges, ULA/link-local IPv6 and non-allowlisted origins are rejected.
- Connector calls must use an explicit allowlist derived from verified provider configuration; arbitrary user-supplied URLs are never accepted.
- Redirect targets must be revalidated.
- DNS resolution and egress enforcement remain mandatory at production infrastructure because application parsing alone cannot defeat DNS rebinding.

## Production gate

No network egress policy, distributed rate-limit store or production provider allowlist is activated here. Those require explicit production infrastructure authorization.

## Gate

13.3 closes after regression coverage, global CI green, merge, and ROADMAP/CHECKPOINT reconciliation.
