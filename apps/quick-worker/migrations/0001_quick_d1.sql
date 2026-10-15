-- FinanzasOSS Quick: Cloudflare D1 (SQLite) staging-only migration.
-- This is NOT the PostgreSQL/Supabase migration. Do not deploy without
-- Cloudflare Access protection, an authenticated Worker and explicit approval.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS quick_manual_accounts (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 128),
  client_account_id TEXT NOT NULL CHECK (length(client_account_id) BETWEEN 12 AND 96),
  label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 100),
  account_kind TEXT NOT NULL CHECK (account_kind IN ('cash','bank_manual','credit_manual','wallet_manual')),
  currency TEXT NOT NULL CHECK (currency IN ('COP','USD')),
  bank_label TEXT CHECK (bank_label IS NULL OR length(trim(bank_label)) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (owner_id, client_account_id),
  UNIQUE (id, owner_id, currency)
);

CREATE TABLE IF NOT EXISTS quick_manual_entries (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 128),
  account_id TEXT NOT NULL,
  client_entry_id TEXT NOT NULL CHECK (length(client_entry_id) BETWEEN 12 AND 96),
  amount_minor INTEGER NOT NULL CHECK (amount_minor BETWEEN 1 AND 1000000000000),
  currency TEXT NOT NULL CHECK (currency IN ('COP','USD')),
  payment_method TEXT NOT NULL CHECK (payment_method IN
    ('cash','debit_card','credit_card','bank_transfer','digital_wallet','other')),
  kind TEXT NOT NULL CHECK (kind IN ('purchase','transfer','investment_transfer')),
  occurred_at TEXT NOT NULL,
  merchant TEXT CHECK (merchant IS NULL OR length(trim(merchant)) BETWEEN 1 AND 120),
  bank_label TEXT CHECK (bank_label IS NULL OR length(trim(bank_label)) BETWEEN 1 AND 80),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source = 'manual'),
  direction TEXT NOT NULL DEFAULT 'debit' CHECK (direction = 'debit'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (owner_id, client_entry_id),
  FOREIGN KEY (account_id, owner_id, currency)
    REFERENCES quick_manual_accounts(id, owner_id, currency)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS quick_entries_owner_timeline
  ON quick_manual_entries(owner_id, occurred_at DESC, id DESC);

-- Important: D1/SQLite does NOT implement PostgreSQL row-level security.
-- Tenant enforcement must be performed by the Access-protected Worker on
-- EVERY query with owner_id derived from ctx.access identity, never payload.
-- No direct public D1 API credentials or Worker bypass routes.
