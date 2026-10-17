-- Individual, editable, owner-scoped spending budgets. No automated transactions.
-- Existing financial entries and Access device authorizations are untouched.
CREATE TABLE IF NOT EXISTS quick_spending_limits (
  owner_id TEXT NOT NULL CHECK(length(owner_id) BETWEEN 1 AND 128),
  period TEXT NOT NULL CHECK(period IN ('day','week','month','year')),
  limit_minor INTEGER NOT NULL CHECK(limit_minor BETWEEN 100 AND 100000000000),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id,period)
);
