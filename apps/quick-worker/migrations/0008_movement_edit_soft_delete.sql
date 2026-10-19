-- Soft deletion and optimistic revision control: preserves original expense identity
-- for iPhone Shortcut retry/idempotency and audit. No data rows are deleted.
ALTER TABLE quick_manual_entries ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quick_manual_entries ADD COLUMN edited_at TEXT;
ALTER TABLE quick_manual_entries ADD COLUMN deleted_at TEXT;
ALTER TABLE quick_shortcut_expenses ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quick_shortcut_expenses ADD COLUMN edited_at TEXT;
ALTER TABLE quick_shortcut_expenses ADD COLUMN deleted_at TEXT;
