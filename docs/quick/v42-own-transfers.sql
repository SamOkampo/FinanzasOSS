CREATE TABLE IF NOT EXISTS quick_v42_own_transfers (
id TEXT PRIMARY KEY NOT NULL,
owner_id TEXT NOT NULL,
client_entry_id TEXT NOT NULL,
amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000000),
from_bank_label TEXT NOT NULL CHECK(length(trim(from_bank_label)) BETWEEN 1 AND 80),
to_bank_label TEXT NOT NULL CHECK(length(trim(to_bank_label)) BETWEEN 1 AND 80),
occurred_at TEXT NOT NULL,
created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
CHECK(lower(trim(from_bank_label))<>lower(trim(to_bank_label))),
UNIQUE(owner_id,client_entry_id)
);
CREATE INDEX IF NOT EXISTS quick_v42_own_transfers_owner_date ON quick_v42_own_transfers(owner_id,occurred_at);
CREATE VIEW IF NOT EXISTS quick_v42_own_transfer_legs AS
SELECT owner_id,id,from_bank_label AS bank_label,occurred_at,-amount_minor AS signed_minor FROM quick_v42_own_transfers
UNION ALL SELECT owner_id,id,to_bank_label,occurred_at,amount_minor FROM quick_v42_own_transfers;
