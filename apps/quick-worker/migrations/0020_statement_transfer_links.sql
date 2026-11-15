CREATE UNIQUE INDEX IF NOT EXISTS quick_statement_review_owner_id
  ON quick_statement_review_decisions(owner_id,id);
CREATE INDEX IF NOT EXISTS quick_statement_review_transfer_lookup
  ON quick_statement_review_decisions(owner_id,direction,amount_minor,occurred_on)
  WHERE action='own_transfer';

CREATE TABLE IF NOT EXISTS quick_statement_transfer_links (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  debit_id TEXT NOT NULL,
  credit_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('own_transfer','card_payment')),
  confirmed_at TEXT NOT NULL,
  CHECK(debit_id<>credit_id),
  UNIQUE(owner_id,debit_id),
  UNIQUE(owner_id,credit_id),
  FOREIGN KEY(owner_id,debit_id) REFERENCES quick_statement_review_decisions(owner_id,id),
  FOREIGN KEY(owner_id,credit_id) REFERENCES quick_statement_review_decisions(owner_id,id)
);
CREATE INDEX IF NOT EXISTS quick_statement_transfer_link_history
  ON quick_statement_transfer_links(owner_id,confirmed_at DESC,id);
