-- Device credentials for the iPhone direct-expense Shortcut.
-- Apply after 0001_quick_d1.sql; migrate ONLY the dedicated staging D1.
-- Tokens are SHA-256 digests, scoped by the Access-authenticated owner.
CREATE TABLE IF NOT EXISTS quick_shortcut_devices (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 128),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 50),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS quick_shortcut_devices_owner
  ON quick_shortcut_devices(owner_id, created_at DESC);
-- No Access bypass routes. Enrollment requires the human Access identity,
-- and direct expenses require Access Service Auth AND a revocable bearer.
