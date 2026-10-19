import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleQuickRequest } from "../dist/apps/quick-worker/src/index.js";
const sql=new DatabaseSync(":memory:");
for(const n of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
  "0004_staging_reset_challenges","0005_scoped_reset_confirmation",
  "0006_push_subscriptions","0007_spending_limits","0008_movement_edit_soft_delete"]){
 sql.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+n+".sql",import.meta.url),"utf8"));
}
const db={prepare(q){let args=[];return {bind(...v){args=v;return this;},
 async first(){return sql.prepare(q).get(...args)??null;},
 async all(){return {results:sql.prepare(q).all(...args)};}}}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:db,ACCESS_AUD:"edit-test-access",ALLOW_WRITES:"true"};
const owner=id=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:id};}}});
async function call(path,method="GET",payload,user=owner(A),opts={}){
 const response=await handleQuickRequest(new Request(base+path,{method,
  ...(method==="POST"?{headers:{"Content-Type":"application/json","Origin":opts.origin??base},
   body:JSON.stringify(payload)}:{})}),opts.env??env,user);
 return {status:response.status,data:await response.json()};
}
const aId="11111111-1111-4111-8111-111111111111";
const bId="22222222-2222-4222-8222-222222222222";
const manualId="33333333-3333-4333-8333-333333333333";
const accountId="44444444-4444-4444-8444-444444444444";
sql.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant) VALUES(?,?,?,?,?,?,?,?,?)")
 .run(aId,A,"accountfree-expense-one",100000,"COP","cash","purchase","2026-10-18T13:00:00.000Z","Café");
sql.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant) VALUES(?,?,?,?,?,?,?,?,?)")
 .run(bId,B,"accountfree-expense-two",990000,"COP","cash","purchase","2026-10-18T13:00:00.000Z","Otro usuario");
sql.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency) VALUES(?,?,?,?,?,?)")
 .run(accountId,A,"account-edit-ledger-0001","Test","cash","COP");
sql.prepare("INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run(manualId,A,accountId,"manually-logged-entry",300000,"COP","cash","purchase","2026-10-18T13:00:00.000Z","Transporte");
const change="/api/quick/studio/movement/change",overview="/api/quick/dashboard/overview";
const initial=await call(overview);assert.equal(initial.data.daily[0].minor,"400000");
const edit={operation:"edit",source:"accountless",id:aId,expectedRevision:0,confirmed:true,
 amount:"12.50",concept:"Mercado corregido",paymentMethod:"debit_card",bankLabel:"Banco ficticio"};
assert.equal((await call(change,"POST",edit,owner(B))).status,404);
assert.equal((await call(change,"POST",{...edit,owner_id:B})).status,422);
assert.equal((await call(change,"POST",edit,owner(A),{origin:"https://evil.example"})).status,403);
assert.equal((await call(change,"POST",{...edit,confirmed:false})).status,422);
assert.equal((await call(change,"POST",{...edit,paymentMethod:"debit_card",bankLabel:null})).status,422);
assert.equal((await call(change,"POST",{...edit,amount:"-1"})).status,422);
assert.equal((await call(change,"POST",{...edit,amount:"1e4"})).status,422);
assert.equal((await call(change,"POST",{...edit,amount:"0"})).status,422);
const edited=await call(change,"POST",edit);
assert.equal(edited.status,200);assert.equal(edited.data.saved,true);assert.equal(edited.data.revision,1);
const row=sql.prepare("SELECT amount_minor,merchant,payment_method,bank_label,revision FROM quick_shortcut_expenses WHERE id=?").get(aId);
assert.equal(row.amount_minor,1250);assert.equal(row.merchant,"Mercado corregido");
assert.equal(row.payment_method,"debit_card");assert.equal(row.bank_label,"Banco ficticio");
assert.equal(row.revision,1);
assert.equal((await call(change,"POST",edit)).status,409,"Old revision cannot overwrite");
const history=await call("/api/quick/dashboard/movements");
assert.equal(history.status,200);
assert.equal(history.data.entries.length,2);
assert.equal(history.data.entries.find(x=>x.id===aId).revision,1);
assert.equal((await call(overview)).data.daily[0].minor,"301250");
const mEdit={...edit,source:"manual",id:manualId,amount:"35",concept:"Taxi",
 expectedRevision:0,paymentMethod:"cash",bankLabel:null};
assert.equal((await call(change,"POST",mEdit)).status,200);
assert.equal(sql.prepare("SELECT account_id FROM quick_manual_entries WHERE id=?").get(manualId).account_id,accountId);
assert.equal((await call(overview)).data.daily[0].minor,"4750");
const removal={operation:"delete",source:"accountless",id:aId,expectedRevision:1,confirmed:true};
assert.equal((await call(change,"POST",removal,owner(B))).status,404);
assert.equal((await call(change,"POST",{...removal,amount:"1"})).status,422);
const deleted=await call(change,"POST",removal);
assert.equal(deleted.status,200);assert.equal(deleted.data.deleted,true);assert.equal(deleted.data.revision,2);
assert.equal((await call(change,"POST",removal)).status,409);
assert.ok(sql.prepare("SELECT deleted_at FROM quick_shortcut_expenses WHERE id=?").get(aId).deleted_at);
assert.equal((await call(overview)).data.daily[0].minor,"3500");
assert.equal((await call("/api/quick/dashboard/movements")).data.entries.length,1);
assert.equal((await call("/api/quick/entries")).data.entries.length,1);
const staleEdit=await call(change,"POST",{...edit,expectedRevision:2});
assert.equal(staleEdit.status,409,"Deleted rows cannot be restored by editing");
const full=sql.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses WHERE id=?").get(aId);
assert.equal(full.n,1,"Soft delete retains original row for idempotency");
const other=await call("/api/quick/dashboard/movements","GET",undefined,owner(B));
assert.equal(other.data.entries.length,1);assert.equal(other.data.entries[0].id,bId);
const noAccess=await call(change,"POST",edit,{});
assert.equal(noAccess.status,401);
const noWrite=await call(change,"POST",mEdit,owner(A),{env:{...env,ALLOW_WRITES:"false"}});
assert.equal(noWrite.status,503);
// All browser source assets are authenticated and parseable.
for(const path of ["/movement-editor.js","/dashboard.js","/studio.js"]){
 const source=await handleQuickRequest(new Request(base+path),env,owner(A));
 assert.equal(source.status,200);
 assert.doesNotThrow(()=>new Function(await source.text()),path);
}
const html=await (await handleQuickRequest(new Request(base+"/dashboard"),env,owner(A))).text();
assert.match(html,/movement-edit-dialog/);
assert.match(html,/movement-editor.js/);
console.log("Edit/delete: owner-scoped soft deletion, revisions, ledger totals, UI, CSRF passed");
sql.close();
