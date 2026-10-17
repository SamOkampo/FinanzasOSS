-- FinanzasOSS Quick: account-free iPhone expenses, staging-only.
-- Additive migration: existing quick_manual_accounts/entries are unchanged.
-- DO NOT drop/rebuild the legacy entries table; retain their foreign keys.
CREATE TABLE IF NOT EXISTS quick_shortcut_expenses (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 128),
  client_entry_id TEXT NOT NULL CHECK (length(client_entry_id) BETWEEN 12 AND 96),
  amount_minor INTEGER NOT NULL CHECK (amount_minor BETWEEN 1 AND 1000000000000),
  currency TEXT NOT NULL DEFAULT 'COP' CHECK (currency = 'COP'),
  payment_method TEXT NOT NULL CHECK (payment_method IN
    ('cash','debit_card','credit_card','bank_transfer','digital_wallet','other')),
  kind TEXT NOT NULL DEFAULT 'purchase' CHECK (kind = 'purchase'),
  occurred_at TEXT NOT NULL,
  merchant TEXT NOT NULL CHECK (length(trim(merchant)) BETWEEN 1 AND 120),
  bank_label TEXT CHECK (bank_label IS NULL OR length(trim(bank_label)) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (owner_id, client_entry_id)
);
CREATE INDEX IF NOT EXISTS quick_shortcut_expenses_owner_timeline
  ON quick_shortcut_expenses(owner_id, occurred_at DESC, id DESC);

-- No financial account is stored for these movements. The Access-verified
-- owner and revocable device token remain mandatory in the Worker.
