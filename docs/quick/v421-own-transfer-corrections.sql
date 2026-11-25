-- v42.1: archive prior states atomically; active transfers remain the only balance source.
CREATE TABLE IF NOT EXISTS quick_v421_transfer_audit (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id TEXT NOT NULL, transfer_id TEXT NOT NULL, client_entry_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('edit','delete')),
  amount_minor INTEGER NOT NULL, from_bank_label TEXT NOT NULL, to_bank_label TEXT NOT NULL,
  occurred_at TEXT NOT NULL, recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS quick_v421_transfer_audit_revision ON quick_v421_transfer_audit(owner_id,transfer_id);
CREATE INDEX IF NOT EXISTS quick_v421_transfer_audit_client ON quick_v421_transfer_audit(owner_id,client_entry_id,operation);
CREATE TRIGGER IF NOT EXISTS quick_v421_transfer_archive_edit AFTER UPDATE OF amount_minor,from_bank_label,to_bank_label ON quick_v42_own_transfers
BEGIN
  INSERT INTO quick_v421_transfer_audit(owner_id,transfer_id,client_entry_id,operation,amount_minor,from_bank_label,to_bank_label,occurred_at)
  VALUES(OLD.owner_id,OLD.id,OLD.client_entry_id,'edit',OLD.amount_minor,OLD.from_bank_label,OLD.to_bank_label,OLD.occurred_at);
END;
CREATE TRIGGER IF NOT EXISTS quick_v421_transfer_archive_delete AFTER DELETE ON quick_v42_own_transfers
BEGIN
  INSERT INTO quick_v421_transfer_audit(owner_id,transfer_id,client_entry_id,operation,amount_minor,from_bank_label,to_bank_label,occurred_at)
  VALUES(OLD.owner_id,OLD.id,OLD.client_entry_id,'delete',OLD.amount_minor,OLD.from_bank_label,OLD.to_bank_label,OLD.occurred_at);
END;
CREATE TRIGGER IF NOT EXISTS quick_v421_transfer_prevent_replay BEFORE INSERT ON quick_v42_own_transfers
WHEN EXISTS(SELECT 1 FROM quick_v421_transfer_audit WHERE owner_id=NEW.owner_id AND client_entry_id=NEW.client_entry_id AND operation='delete')
BEGIN
  SELECT RAISE(IGNORE);
END;
