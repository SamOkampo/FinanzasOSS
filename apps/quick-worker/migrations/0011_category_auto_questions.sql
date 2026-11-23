-- Additive Studio category automation. Existing confirmed manual classifications remain authoritative.
CREATE TABLE IF NOT EXISTS quick_auto_categories (
 owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
 source TEXT NOT NULL CHECK(source IN ('manual','accountless')),
 movement_id TEXT NOT NULL,
 category TEXT NOT NULL,
 subcategory TEXT NOT NULL,
 confidence REAL NOT NULL CHECK(confidence>=0 AND confidence<=1),
 needs_review INTEGER NOT NULL CHECK(needs_review IN (0,1)),
 question TEXT CHECK(question IS NULL OR length(question)<=150),
 classification_source TEXT NOT NULL CHECK(classification_source IN ('qwen','rules','learned','protected')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,source,movement_id)
);
CREATE INDEX IF NOT EXISTS quick_auto_category_review ON quick_auto_categories(owner_id,needs_review);
CREATE TABLE IF NOT EXISTS quick_category_preferences (
 owner_id TEXT NOT NULL,
 merchant_key TEXT NOT NULL CHECK(length(merchant_key) BETWEEN 2 AND 120),
 category TEXT NOT NULL,
 subcategory TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,merchant_key)
);
CREATE TABLE IF NOT EXISTS quick_category_ai_settings (
 owner_id TEXT NOT NULL PRIMARY KEY,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quick_category_push_events (
 owner_id TEXT NOT NULL,
 hour_bucket TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,hour_bucket)
);
