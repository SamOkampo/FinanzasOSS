import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {mkdtempSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
// Synthetic-only restore drill. NEVER copy the user's D1 rows into CI artifacts.
const dir=mkdtempSync(join(tmpdir(),"finanzasoss-restore-"));
const source=join(dir,"fixture.sqlite"),backup=join(dir,"snapshot.sqlite");
try{
 const db=new DatabaseSync(source);
 db.exec("CREATE TABLE entries(owner_id TEXT,id TEXT PRIMARY KEY,amount_minor INTEGER NOT NULL,category TEXT);");
 const add=db.prepare("INSERT INTO entries(owner_id,id,amount_minor,category) VALUES (?,?,?,?)");
 add.run("profile-one","known-expense",1234500,"Alimentación");
 add.run("profile-two","private-expense",9800000,"Educación");
 const expected=db.prepare("SELECT COUNT(*) n,SUM(amount_minor) amount FROM entries").get();
 db.exec(readFileSync(new URL("../docs/quick/v42-own-transfers.sql",import.meta.url),"utf8"));
 const addTransfer=db.prepare("INSERT INTO quick_v42_own_transfers(id,owner_id,client_entry_id,amount_minor,from_bank_label,to_bank_label,occurred_at) VALUES(?,?,?,?,?,?,?)");
 addTransfer.run("backup-transfer-1","profile-one","restore-fixture-0001",5500,"Bancolombia","Daviplata","2026-11-23T12:00:00.000Z");
 addTransfer.run("backup-transfer-2","profile-two","restore-fixture-0002",6600,"Bancolombia","Daviplata","2026-11-23T12:00:00.000Z");
 db.exec("UPDATE quick_v42_own_transfers SET amount_minor=7525 WHERE id='backup-transfer-1'");
 db.exec("DELETE FROM quick_v42_own_transfers WHERE id='backup-transfer-2'");
 db.exec("VACUUM INTO '"+backup.replace(/'/g,"''")+"'");
 db.close();
 // Verify restore opens independently without modifying the original.
 const recovered=new DatabaseSync(backup,{readOnly:true});
 assert.deepEqual(recovered.prepare("SELECT COUNT(*) n,SUM(amount_minor) amount FROM entries").get(),expected);
 const own=recovered.prepare("SELECT id,amount_minor FROM entries WHERE owner_id=?").all("profile-one");
 assert.equal(own.length,1);
 assert.equal(own[0].amount_minor,1234500);
 assert.equal(recovered.prepare("SELECT COUNT(*) n FROM entries WHERE owner_id=?").get("profile-two").n,1);
 assert.equal(recovered.prepare("PRAGMA integrity_check").get().integrity_check,"ok");
 assert.deepEqual(recovered.prepare("SELECT signed_minor FROM quick_v42_own_transfer_legs WHERE owner_id='profile-one' ORDER BY signed_minor").all().map(r=>r.signed_minor),[-7525,7525]);
 assert.equal(recovered.prepare("SELECT COUNT(*) n FROM quick_v42_own_transfers WHERE owner_id='profile-two'").get().n,0);
 assert.equal(recovered.prepare("SELECT COUNT(*) n FROM quick_v421_transfer_audit").get().n,2);
 recovered.close();
 const writable=new DatabaseSync(backup);
 const replay=writable.prepare("INSERT INTO quick_v42_own_transfers(id,owner_id,client_entry_id,amount_minor,from_bank_label,to_bank_label,occurred_at) VALUES(?,?,?,?,?,?,?)").run("backup-replayed","profile-two","restore-fixture-0002",6600,"Bancolombia","Daviplata","2026-11-23T12:00:00.000Z");
 assert.equal(replay.changes,0);writable.close();
 console.log("v42.2 recovered transfer audit and replay protection passed");
 console.log("Synthetic SQLite backup/restore, integrity and profile isolation passed.");
}finally{rmSync(dir,{recursive:true,force:true});}
