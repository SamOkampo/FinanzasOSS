# Phase 10.8 — Connection, sync and import alerts

## Scope

Surface reviewable data-health alerts when a connection requires attention, a sync fails/is partial/stale, or an import is incomplete.

## Semantics

- Uses provider-neutral connection states already present in the architecture; it does not invent provider endpoints, scopes or certificates.
- Connected/pending states do not generate connection-action alerts.
- Reauth, expired consent, revoked, disconnected and degraded states are surfaced for review.
- Failed and partial syncs are explicit alerts.
- Staleness is based on a configurable time threshold and an observed last-success timestamp.
- Imports that are partial, failed or need review are considered incomplete.
- Alerts are read-only product signals; they do not automatically reconnect, reauthenticate, retry imports or alter consent.
- No credentials, secrets, production banking or real customer data are required.

## Gate

10.8 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
