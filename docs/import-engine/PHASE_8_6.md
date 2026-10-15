# Universal Import Engine — Fase 8.6

Scope: duplicate-safe reconciliation across API, statement imports and Gmail-derived auxiliary records.

The reconciler operates only on already-normalized `FinancialTransaction` records. It does not connect to Gmail or any bank by itself.

Supported source authority, highest to lowest:
1. `open_finance_api`
2. `provider_api`
3. `aggregator_api`
4. `statement_import`
5. `email_auxiliary`

Rules:
- exact duplicates are never double-counted;
- if an exact duplicate arrives from a higher-authority source, the plan replaces the lower-authority canonical record;
- exact duplicates from equal/lower authority are suppressed;
- likely/possible matches are held for review and are not auto-inserted;
- unrelated records are inserted with a Finance Core fingerprint;
- retries remain idempotent once replacements/inserts have been committed;
- **existing** manually confirmed records can participate as comparison anchors; exact and ambiguous overlaps with imports are held for user review, never silently replaced, suppressed or inserted as duplicate charges;
- **candidate** manual records are rejected by the importer and must use an explicitly confirmed, authenticated Quick recording path;
- different tenant IDs in one batch fail closed before planning any writes;
- imported expenses and manual investment transfers have distinct economic classes and must not be treated as the same charge.

Persistence must apply insert/replacement decisions atomically. This module does not read email, connect to production APIs, move money, trade, withdraw, or store secrets.
