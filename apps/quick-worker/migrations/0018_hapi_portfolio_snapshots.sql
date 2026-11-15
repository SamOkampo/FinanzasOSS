CREATE TABLE IF NOT EXISTS quick_hapi_portfolio_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  as_of TEXT NOT NULL,
  cash_minor INTEGER NOT NULL CHECK(cash_minor BETWEEN -100000000000 AND 100000000000),
  positions_json TEXT NOT NULL CHECK(json_valid(positions_json)),
  UNIQUE(owner_id,as_of)
);
