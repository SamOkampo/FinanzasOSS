CREATE TABLE IF NOT EXISTS quick_hapi_deposits (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  request_key TEXT NOT NULL,
  bank_label TEXT NOT NULL,
  debited_on TEXT NOT NULL,
  cop_minor INTEGER NOT NULL CHECK(cop_minor BETWEEN 1 AND 1000000000000),
  origin_source TEXT CHECK(origin_source IN ('manual','statement')),
  origin_id TEXT,
  credited_on TEXT,
  usd_minor INTEGER CHECK(usd_minor BETWEEN 1 AND 100000000000),
  fee_cop_minor INTEGER CHECK(fee_cop_minor BETWEEN 0 AND 1000000000000),
  broker_ref TEXT,
  UNIQUE(owner_id,request_key),
  UNIQUE(owner_id,origin_source,origin_id),
  UNIQUE(owner_id,broker_ref),
  CHECK ((origin_id IS NULL)=(origin_source IS NULL)),
  CHECK ((credited_on IS NULL)=(usd_minor IS NULL) AND (usd_minor IS NULL)=(broker_ref IS NULL)),
  CHECK (credited_on IS NULL OR credited_on>=debited_on),
  CHECK (fee_cop_minor IS NULL OR fee_cop_minor<=cop_minor)
);
CREATE INDEX IF NOT EXISTS quick_hapi_deposits_owner ON quick_hapi_deposits(owner_id,debited_on DESC);
