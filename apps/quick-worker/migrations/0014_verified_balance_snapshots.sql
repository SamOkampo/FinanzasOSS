-- FinanzasOSS verified balances / movements reconciliation (no bank API, no invented balances).
-- Owner Access identity is enforced at every read/write. No existing ledger edits.
CREATE TABLE IF NOT EXISTS quick_balance_accounts (
 id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
 bank_label TEXT NOT NULL CHECK(length(trim(bank_label)) BETWEEN 1 AND 80),
 account_type TEXT NOT NULL CHECK(account_type IN ('deposit','cash','credit')),
 currency TEXT NOT NULL DEFAULT 'COP' CHECK(currency='COP'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(owner_id,bank_label COLLATE NOCASE),
 UNIQUE(id,owner_id)
);
CREATE INDEX IF NOT EXISTS quick_balance_accounts_owner ON quick_balance_accounts(owner_id,bank_label);
CREATE TABLE IF NOT EXISTS quick_balance_snapshots (
 id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
 account_id TEXT NOT NULL,
 request_key TEXT NOT NULL CHECK(length(request_key) BETWEEN 12 AND 96),
 amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 0 AND 1000000000000),
 currency TEXT NOT NULL DEFAULT 'COP' CHECK(currency='COP'),
 as_of TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT 'user_verified' CHECK(source='user_verified'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(owner_id,request_key),
 UNIQUE(owner_id,account_id,as_of),
 FOREIGN KEY(account_id,owner_id) REFERENCES quick_balance_accounts(id,owner_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS quick_balance_snapshots_timeline
 ON quick_balance_snapshots(owner_id,account_id,as_of DESC);
