-- FinanzasOSS: private statement CREDIT lines, not purchase debits.
-- Additive: preserving all existing expenses and legacy direction constraints.
-- Owner is always derived from authenticated Cloudflare Access by existing reads.
CREATE TABLE IF NOT EXISTS quick_statement_credits (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
  client_entry_id TEXT NOT NULL CHECK(length(client_entry_id) BETWEEN 12 AND 96),
  amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000000),
  currency TEXT NOT NULL DEFAULT 'COP' CHECK(currency='COP'),
  occurred_at TEXT NOT NULL,
  merchant TEXT NOT NULL CHECK(length(trim(merchant)) BETWEEN 1 AND 120),
  bank_label TEXT NOT NULL CHECK(length(trim(bank_label)) BETWEEN 1 AND 80),
  kind TEXT NOT NULL CHECK(kind IN ('transfer','received_transfer')),
  direction TEXT NOT NULL DEFAULT 'credit' CHECK(direction='credit'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(owner_id,client_entry_id)
);
CREATE INDEX IF NOT EXISTS quick_statement_credits_owner_timeline
  ON quick_statement_credits(owner_id,occurred_at DESC,id DESC);
