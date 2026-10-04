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
- manual records are outside this cross-source reconciliation contract.

Persistence must apply insert/replacement decisions atomically. This module does not read email, connect to production APIs, move money, trade, withdraw, or store secrets.
