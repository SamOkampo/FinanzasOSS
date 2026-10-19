-- Retain a per-device test throttle without affecting the daily reminder schedule.
ALTER TABLE quick_push_subscriptions ADD COLUMN last_test_at TEXT;
