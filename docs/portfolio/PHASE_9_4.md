# Phase 9.4 — Hapi statement adapter

## Scope

Provide a local, read-only statement normalization boundary for official Hapi statements, confirmations and reports. The MVP adapter accepts already-extracted structured statement records; PDF extraction remains isolated from the financial domain.

## Safety boundary

- Official/user-authorized statements only.
- Input is untrusted and must be validated before normalization.
- No network access, credentials, trading, withdrawals or transfers.
- No invented Hapi endpoints, scopes, certificates or undocumented PDF layout assumptions.
- PDF text/layout extraction is a separate isolated parser concern; this adapter consumes explicit structured records.
- Unknown document kinds, malformed dates, currencies or amounts fail closed.
- Repository tests use synthetic fixtures only.

## Gate

9.4 closes after adapter + synthetic regression + global CI green + PR integration + ROADMAP/CHECKPOINT reconciliation.
