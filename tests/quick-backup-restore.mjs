import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {mkdtempSync,rmSync} from "node:fs";
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
 recovered.close();
 console.log("Synthetic SQLite backup/restore, integrity and profile isolation passed.");
}finally{rmSync(dir,{recursive:true,force:true});}
