CREATE TABLE IF NOT EXISTS quick_agent_alert_rules (
 owner_id TEXT NOT NULL,
 rule TEXT NOT NULL CHECK(rule IN ('unclassified_movement','unreconciled_balance','hapi_deposit_pending','credit_payment_due')),
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
 PRIMARY KEY(owner_id,rule)
);

CREATE TABLE IF NOT EXISTS quick_agent_alert_state (
 owner_id TEXT NOT NULL,
 alert_key TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 snoozed_until TEXT,
 notified_at TEXT,
 PRIMARY KEY(owner_id,alert_key,fingerprint)
);

CREATE TABLE IF NOT EXISTS quick_agent_credit_due (
 owner_id TEXT NOT NULL,
 account_id TEXT NOT NULL,
 due_on TEXT NOT NULL,
 paid INTEGER NOT NULL DEFAULT 0 CHECK(paid IN (0,1)),
 PRIMARY KEY(owner_id,account_id,due_on),
 FOREIGN KEY(account_id,owner_id) REFERENCES quick_balance_accounts(id,owner_id)
);
