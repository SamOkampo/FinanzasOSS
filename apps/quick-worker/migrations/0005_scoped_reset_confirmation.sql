-- Existing staging migration 0004 created the reset challenge table.
-- Add scope without deleting or rewriting any historical entries.
ALTER TABLE quick_reset_challenges
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'all'
  CHECK(scope IN ('month','all'));
ALTER TABLE quick_reset_challenges
  ADD COLUMN month_key TEXT CHECK(month_key IS NULL OR
    (length(month_key)=7 AND substr(month_key,5,1)='-'));
ALTER TABLE quick_reset_challenges
  ADD COLUMN confirmation_nonce TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS quick_reset_confirmation_nonce
  ON quick_reset_challenges(confirmation_nonce);
