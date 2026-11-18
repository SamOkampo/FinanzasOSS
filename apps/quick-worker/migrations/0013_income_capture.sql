-- FinanzasOSS: genuine income as positive, separate from purchase and internal transfers.
-- Additive to existing bank-credit table; no amount, account or expense mutation.
ALTER TABLE quick_statement_credits ADD COLUMN economic_purpose TEXT NOT NULL DEFAULT 'transfer'
  CHECK (economic_purpose IN ('income','transfer','pending'));

CREATE TABLE IF NOT EXISTS quick_income_entries (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
  client_entry_id TEXT NOT NULL CHECK(length(client_entry_id) BETWEEN 12 AND 96),
  amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000000),
  currency TEXT NOT NULL DEFAULT 'COP' CHECK(currency='COP'),
  occurred_at TEXT NOT NULL,
  concept TEXT NOT NULL CHECK(length(trim(concept)) BETWEEN 1 AND 120),
  income_category TEXT NOT NULL DEFAULT 'other' CHECK(income_category IN
    ('payment','salary','sales','commission','interest','refund','other')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','bank_transfer','digital_wallet','other')),
  bank_label TEXT,
  kind TEXT NOT NULL DEFAULT 'income' CHECK(kind='income'),
  direction TEXT NOT NULL DEFAULT 'credit' CHECK(direction='credit'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(owner_id,client_entry_id),
  CHECK((payment_method IN ('bank_transfer','digital_wallet') AND bank_label IS NOT NULL AND
    length(trim(bank_label)) BETWEEN 1 AND 80) OR
    (payment_method IN ('cash','other') AND bank_label IS NULL))
);
CREATE INDEX IF NOT EXISTS quick_incomes_owner_timeline
 ON quick_income_entries(owner_id,occurred_at DESC,id DESC);
