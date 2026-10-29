-- Both Access profiles remain isolated through owner_id. No financial
-- entries are rewritten; category choices are independent from amounts.
CREATE TABLE IF NOT EXISTS quick_movement_categories (
 owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
 source TEXT NOT NULL CHECK(source IN ('manual','accountless')),
 movement_id TEXT NOT NULL,
 category TEXT NOT NULL CHECK(length(category) BETWEEN 1 AND 60),
 subcategory TEXT NOT NULL CHECK(length(subcategory) BETWEEN 1 AND 60),
 classification_source TEXT NOT NULL CHECK(classification_source='manual'),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,source,movement_id)
);
CREATE INDEX IF NOT EXISTS quick_movement_categories_owner
 ON quick_movement_categories(owner_id,category,subcategory);
-- Limit model requests to avoid unexpected inference charges for either owner.
CREATE TABLE IF NOT EXISTS quick_ai_daily_quotas (
 owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
 day TEXT NOT NULL,
 hits INTEGER NOT NULL CHECK(hits BETWEEN 1 AND 5),
 PRIMARY KEY(owner_id,day)
);
