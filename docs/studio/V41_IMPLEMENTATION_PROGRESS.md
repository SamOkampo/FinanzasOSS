# FinanzasOSS v41 — implementation progress

## Iteration v41.1-A: safe read-only statement reconciliation

**Status:** first implementation in a feature PR. This milestone is intentionally **preview-only**. It does not persist imports, change any transactions, or trigger a financial migration. Do not equate it with completion of all v41.

### Added
- Worker module `apps/quick-worker/src/statement-reconcile-v41.ts`, `POST /api/quick/v41/reconcile/preview`.
- Uses existing `previewMappedImport` model and same-origin authenticated request controls. Validates CSV rows, explicit mapping, date, COP amount, direction and bank label. Maximum 50 rows.
- Reads **owner-scoped** recorded debits (`quick_shortcut_expenses`, `quick_manual_entries`) and credits (`quick_income_entries`, `quick_statement_credits`) for potential matches with same bank/date/COP amount and optional description similarity; each suggestion is explicitly **not** automatically confirmed.
- Detects repeated rows **within the same import** as a review signal, never auto-deletes a legitimate purchase because the merchant, day and amount match.
- Separates `possible_match`, `needs_purpose` (credits), `needs_type` (debits), `possible_transfer`, `repeated_in_file`, `needs_correction`.
- Read-only v41 card inside the existing **Importar** Studio screen on iPhone. The original debit-only importer and its commit button remain unchanged.
- `cache: no-store`, no local-storage persistence of financial data, no file uploads to a third party, no new DB tables in this increment.
- The new preview continues working if `ALLOW_WRITES=false`; all other mutation endpoints remain guarded.

### Tests
- `tests/quick-v41-reconciliation-preview.mjs` tests Cloudflare Access owner enforcement, same-origin restriction, unknown fields, two-profile isolation, debit and credit matches, ambiguity, repeating purchases, EUR rejection, future date rejection, read-only SQL and unchanged SQLite row counts.
- Included in `npm test` with the existing 40+ regression modules.

### Not yet done — subsequent v41 milestones
- Persisted import batches and decisions, user confirmation/commit of credit and debit lines with idempotency, recoverable upload, richer statement matching, transfer links, certified economic purpose and XLSX/PDF parser.
- Qwen floating chatbot, category `food` learning workflow and daily assistant notifications.
- Hapi as portfolio USD, with manual statements and later authorized read-only connection.

### Safety and rollout
- Never test against, reset, delete or correct real user transactions as part of a feature deployment.
- Staging release must require successful CI and evidence of compiled bundle; no automatic migration (this increment needs none).
- This is account data already entered into FinanzasOSS, not live bank synchronization; all matches are *possible* and require confirmation in a later increment.
