-- FinanzasOSS staging: explicit, expiring, owner-bound reset authorization.
-- Does not mutate financial entries until a second confirmed POST.
CREATE TABLE IF NOT EXISTS quick_reset_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
  expires_at TEXT NOT NULL,
  expected_manual_entries INTEGER NOT NULL CHECK(expected_manual_entries >= 0),
  expected_shortcut_expenses INTEGER NOT NULL CHECK(expected_shortcut_expenses >= 0),
  expected_accounts INTEGER NOT NULL CHECK(expected_accounts >= 0),
  expected_devices INTEGER NOT NULL CHECK(expected_devices >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS quick_reset_challenges_owner ON quick_reset_challenges(owner_id,expires_at);
