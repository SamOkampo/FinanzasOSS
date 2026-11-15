-- v41.3: decisions and audit only. Additive, no backfill or changes to existing entries.
-- Idempotency is owner-scoped; an external reference is never trusted globally.
CREATE TABLE IF NOT EXISTS quick_statement_review_decisions (
 id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL,
 row_key TEXT NOT NULL,
 row_hash TEXT NOT NULL,
 review_digest TEXT NOT NULL CHECK(length(review_digest)=64),
 bank_label TEXT NOT NULL,
 payment_method TEXT NOT NULL CHECK(payment_method IN ('bank_transfer','debit_card','credit_card')),
 direction TEXT NOT NULL CHECK(direction IN ('credit','debit')),
 occurred_on TEXT NOT NULL,
 amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000000),
 description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 120),
 action TEXT NOT NULL CHECK(action IN ('import','already_exists','own_transfer','skip')),
 existing_source TEXT,
 existing_id TEXT,
 counterparty_label TEXT,
 ledger_entry_id TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(owner_id,row_key),
 CHECK ((action = 'already_exists' AND existing_id IS NOT NULL AND existing_source IS NOT NULL)
    OR (action <> 'already_exists' AND existing_id IS NULL AND existing_source IS NULL)),
 CHECK ((action = 'own_transfer' AND counterparty_label IS NOT NULL)
    OR (action <> 'own_transfer' AND counterparty_label IS NULL)),
 CHECK ((action = 'import' AND ledger_entry_id IS NOT NULL)
    OR (action <> 'import' AND ledger_entry_id IS NULL))
);
CREATE INDEX IF NOT EXISTS quick_statement_review_decisions_owner
 ON quick_statement_review_decisions(owner_id,created_at DESC);
-- Immutable audit: inserts only in code; unique per reviewed row (replays create no new event).
CREATE TABLE IF NOT EXISTS quick_statement_review_audit (
 id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL,
 row_key TEXT NOT NULL,
 decision_id TEXT NOT NULL,
 event TEXT NOT NULL DEFAULT 'confirmed' CHECK(event='confirmed'),
 recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(owner_id,row_key),
 FOREIGN KEY(decision_id) REFERENCES quick_statement_review_decisions(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS quick_statement_review_audit_owner
 ON quick_statement_review_audit(owner_id,recorded_at DESC);
