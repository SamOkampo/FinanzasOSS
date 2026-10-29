-- FinanzasOSS Quick staging: category metadata, user feedback and opt-in web push.
-- Apply after 0001; never mutate amount, kind, account or source financial facts.
CREATE TABLE IF NOT EXISTS quick_entry_categories (
  entry_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'groceries','restaurants','transport','housing','utilities','health','education',
    'entertainment','shopping','travel','fees','taxes','other','transfer','investment'
  )),
  source TEXT NOT NULL CHECK (source IN ('protected','learned','qwen','rules','pending','user')),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  needs_review INTEGER NOT NULL CHECK (needs_review IN (0,1)),
  question TEXT CHECK (question IS NULL OR length(question) <= 140),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (entry_id) REFERENCES quick_manual_entries(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS quick_categories_owner_review ON quick_entry_categories(owner_id,needs_review);
CREATE TABLE IF NOT EXISTS quick_category_preferences (
  owner_id TEXT NOT NULL,
  merchant_key TEXT NOT NULL CHECK (length(merchant_key) BETWEEN 2 AND 120),
  category TEXT NOT NULL CHECK (category IN (
    'groceries','restaurants','transport','housing','utilities','health','education',
    'entertainment','shopping','travel','fees','taxes','other'
  )),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (owner_id,merchant_key)
);
CREATE TABLE IF NOT EXISTS quick_push_subscriptions (
  owner_id TEXT NOT NULL,
  endpoint TEXT NOT NULL CHECK (length(endpoint) BETWEEN 30 AND 2000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (owner_id,endpoint)
);
