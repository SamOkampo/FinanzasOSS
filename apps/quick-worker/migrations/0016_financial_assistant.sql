CREATE TABLE IF NOT EXISTS quick_agent_category_drafts (
  owner_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('manual','accountless')),
  movement_id TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  token TEXT NOT NULL,
  movement_version TEXT NOT NULL,
  answer_alias TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','confirmed')),
  learning TEXT CHECK(learning IN ('remembered','blocked','individual')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id,source,movement_id)
);

CREATE TABLE IF NOT EXISTS quick_agent_chat_quotas (
  owner_id TEXT NOT NULL,
  day TEXT NOT NULL,
  hits INTEGER NOT NULL CHECK(hits BETWEEN 1 AND 5),
  PRIMARY KEY(owner_id,day)
);

CREATE TABLE IF NOT EXISTS quick_agent_notice_settings (
  owner_id TEXT PRIMARY KEY NOT NULL,
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  last_fingerprint TEXT,
  last_day TEXT
);
