CREATE TABLE IF NOT EXISTS quick_hapi_activity (
 owner_id TEXT NOT NULL,
 id TEXT NOT NULL CHECK(length(id)=64),
 occurred_on TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('deposit','withdrawal','buy','sell','dividend','fee','interest','tax','reinvestment')),
 description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 160),
 amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 1 AND 100000000000),
 symbol TEXT,
 quantity TEXT,
 broker_ref TEXT,
 created_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,id)
);
CREATE INDEX IF NOT EXISTS quick_hapi_activity_timeline
 ON quick_hapi_activity(owner_id,occurred_on DESC,id);
