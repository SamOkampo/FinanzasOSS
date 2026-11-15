import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {TRANSFER_LINKS_JS} from "../dist/apps/quick-worker/src/dashboard-transfer-links-js.js";

const sqlite=new DatabaseSync(":memory:");
const migrations=new URL("../apps/quick-worker/migrations/",import.meta.url);
for(const name of readdirSync(migrations).sort())sqlite.exec(readFileSync(new URL(name,migrations),"utf8"));
const DB={prepare(query){let args=[];return {
  bind(...params){args=params;return this;},
  async first(){return sqlite.prepare(query).get(...args)??null;},
  async all(){return {results:sqlite.prepare(query).all(...args)};},
};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const env={DB,ACCESS_AUD:"link-test",ALLOW_WRITES:"true",ALLOW_V41_TRANSFER_LINKS:"true"};
const path="/api/quick/v41/reconcile/links";
async function request(data,owner=A,config=env,origin="https://finanzasoss.example"){
  const ctx=owner?{access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}}:{};
  const init=data?{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(data)}:undefined;
  const r=await handleQuickRequest(new Request("https://finanzasoss.example"+path,init),config,ctx);
  return {status:r.status,data:await r.json()};
}
function seed(owner,details){
  const id=crypto.randomUUID();
  const [from,to,direction,amount,date,method="bank_transfer"]=details;
  sqlite.prepare("INSERT INTO quick_statement_review_decisions(id,owner_id,row_key,row_hash,review_digest,"+
    "bank_label,payment_method,direction,occurred_on,amount_minor,description,action,counterparty_label) "+
    "VALUES(?,?,?,?,?,?,?,?,?,?,?,'own_transfer',?)")
    .run(id,owner,id,id,"0".repeat(64),from,method,direction,date,amount,"Prueba "+direction,to);
  return id;
}
const debit=seed(A,["Banco Uno","Banco Dos","debit",2000000,"2026-10-01"]);
const credit=seed(A,["banco dos"," BANCO UNO ","credit",2000000,"2026-10-03"]);
const repeated=seed(A,["Banco Dos","Banco Uno","credit",2000000,"2026-10-04"]);
const other=seed(B,["Banco Dos","Banco Uno","credit",2000000,"2026-10-03"]);
const wrongAmount=seed(A,["Banco Dos","Banco Uno","credit",2000001,"2026-10-03"]);
const stale=seed(A,["Banco Dos","Banco Uno","credit",2000000,"2026-10-08"]);
const wrongDirection=seed(A,["Banco Dos","Banco Uno","debit",2000000,"2026-10-03"]);
const oneSided=seed(A,["Banco Dos","Otro banco","credit",2000000,"2026-10-03"]);
const cardDebit=seed(A,["Banco Uno","Tarjeta Nu","debit",3500000,"2026-10-10"]);
const cardCredit=seed(A,["Tarjeta Nu","Banco Uno","credit",3500000,"2026-10-09","credit_card"]);
const hapi=seed(A,["Banco Uno","Hapi","debit",42000000,"2026-10-07"]);
seed(A,["Hapi","Banco Uno","credit",42000000,"2026-10-08"]);
const originalCount=sqlite.prepare("SELECT count(*) n FROM quick_statement_review_decisions").get().n;
const patch=(creditId=credit)=>({debitId:debit,creditId,confirmed:true});
assert.equal((await request(null,null)).status,401);
assert.equal((await request(null,A,{...env,ALLOW_V41_TRANSFER_LINKS:"false"})).status,503);
assert.equal((await request(patch(),A,{...env,ALLOW_WRITES:"false"})).status,503);
assert.equal((await request(patch(),A,env,"https://wrong.example")).status,403);
assert.deepEqual((await request()).data.candidates.map(row=>row.credit_id).sort(),[credit,repeated,cardCredit].sort());
assert.ok(!(await request()).data.pending.some(row=>row.id===hapi));
assert.equal((await request(null,B)).data.candidates.length,0);
for(const id of [wrongAmount,stale,wrongDirection,other,oneSided])assert.equal((await request(patch(id))).status,409);
assert.equal((await request(patch(),B)).status,409);
assert.equal((await request({...patch(),confirmed:false})).status,422);
const saved=await request(patch());
assert.equal(saved.status,201);
assert.equal(saved.data.kind,"own_transfer");
assert.equal((await request(patch())).data.id,saved.data.id);
assert.equal((await request(patch(repeated))).status,409);
assert.equal((await request({debitId:cardDebit,creditId:cardCredit,confirmed:true})).data.kind,"card_payment");
const final=await request();
assert.equal(final.data.candidates.length,0);
assert.equal(final.data.history.length,2);
assert.ok(final.data.pending.some(row=>row.id===repeated));
assert.equal((await request(null,B)).data.history.length,0);
assert.equal(sqlite.prepare("SELECT count(*) n FROM quick_statement_review_decisions").get().n,originalCount);
for(const table of ["quick_manual_entries","quick_shortcut_expenses","quick_statement_credits","quick_income_entries"])
  assert.equal(sqlite.prepare("SELECT count(*) n FROM "+table).get().n,0);
new Function(TRANSFER_LINKS_JS);
console.log("v41 transfer pairing: reciprocal evidence, ambiguous candidates, idempotence, card payments, owner isolation, unchanged ledger PASSED");
