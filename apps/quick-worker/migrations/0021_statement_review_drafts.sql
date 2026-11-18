CREATE TABLE IF NOT EXISTS quick_statement_review_drafts (
 owner_id TEXT NOT NULL,
 id TEXT NOT NULL CHECK(length(id)=64),
 bank_label TEXT NOT NULL,
 input_json TEXT NOT NULL CHECK(json_valid(input_json)),
 rows_json TEXT NOT NULL CHECK(json_valid(rows_json)),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,id)
);
CREATE INDEX IF NOT EXISTS quick_statement_drafts_owner
 ON quick_statement_review_drafts(owner_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS quick_agent_review_notification_rules (
 owner_id TEXT NOT NULL,
 rule TEXT NOT NULL CHECK(rule IN ('possible_duplicate','unmatched_internal_transfer','import_unreviewed')),
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
 PRIMARY KEY(owner_id,rule)
);
