-- Owner-isolated subscriptions to privacy-safe reminder notifications (staging only).
CREATE TABLE IF NOT EXISTS quick_push_subscriptions (
  owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
  endpoint_hash TEXT NOT NULL CHECK(length(endpoint_hash)=43),
  endpoint TEXT NOT NULL CHECK(length(endpoint) BETWEEN 50 AND 2048),
  last_sent_day TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(owner_id,endpoint_hash)
);
CREATE INDEX IF NOT EXISTS quick_push_pending_day ON quick_push_subscriptions(last_sent_day,created_at);
