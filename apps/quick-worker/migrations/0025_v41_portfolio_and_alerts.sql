ALTER TABLE quick_hapi_portfolio_snapshots ADD COLUMN fx_cop_per_usd TEXT;
ALTER TABLE quick_hapi_portfolio_snapshots ADD COLUMN fx_source TEXT;
ALTER TABLE quick_hapi_portfolio_snapshots ADD COLUMN fx_observed_at TEXT;

ALTER TABLE quick_agent_alert_state ADD COLUMN acknowledged_at TEXT;

CREATE TABLE quick_hapi_activity_details (
 owner_id TEXT NOT NULL,
 activity_id TEXT NOT NULL,
 cost_minor INTEGER CHECK(cost_minor BETWEEN 0 AND 100000000000),
 dividend_id TEXT,
 bank_credit_id TEXT,
 updated_at TEXT NOT NULL,
 CHECK((cost_minor IS NOT NULL)+(dividend_id IS NOT NULL)+(bank_credit_id IS NOT NULL)=1),
 PRIMARY KEY(owner_id,activity_id),
 UNIQUE(owner_id,dividend_id),
 UNIQUE(owner_id,bank_credit_id),
 FOREIGN KEY(owner_id,activity_id) REFERENCES quick_hapi_activity(owner_id,id),
 FOREIGN KEY(owner_id,dividend_id) REFERENCES quick_hapi_activity(owner_id,id)
);
