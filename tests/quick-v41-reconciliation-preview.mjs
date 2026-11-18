import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleQuickRequest } from "../dist/apps/quick-worker/src/index.js";
import { DASH_HTML } from "../dist/apps/quick-worker/src/dashboard-html.js";
import { IMPORT_JS } from "../dist/apps/quick-worker/src/dashboard-import-js.js";
const sqlite=new DatabaseSync(":memory:");
const migrations=["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
 "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
 "0013_income_capture","0014_verified_balance_snapshots"];
for(const name of migrations)sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+name+".sql",import.meta.url),"utf8"));
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
sqlite.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("11111111-1111-4111-8111-111111111111",A,"demo-coffee-original-01",250000,"COP","debit_card","purchase","2026-10-10T17:00:00Z","CAFETERIA","Banco Demo");
sqlite.prepare("INSERT INTO quick_income_entries(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,concept,income_category,payment_method,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("22222222-2222-4222-8222-222222222222",A,"demo-income-original-01",120000,"COP","2026-10-11T18:00:00Z","Pago clientes","sales","bank_transfer","Banco Demo");
sqlite.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("33333333-3333-4333-8333-333333333333",B,"other-owner-sensitive-01",850000,"COP","debit_card","purchase","2026-10-10T17:00:00Z","PRIVADO OTRO PERFIL","Banco Demo");
const queries=[];
const db={
 prepare(query){
  queries.push(query);let params=[];
  return {bind(...a){params=a;return this;},
    async first(){return sqlite.prepare(query).get(...params)??null;},
    async all(){return {results:sqlite.prepare(query).all(...params)};}};
 }
};
const env={DB:db,ACCESS_AUD:"v41-preview-test",ALLOW_WRITES:"true"};
const origin="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const principal=id=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:id};}}});
const data={rows:[
 {fecha:"2026-10-10",detalle:"CAFETERIA",importe:"2500",tipo:"debit",moneda:"COP"},
 {fecha:"2026-10-11",detalle:"Pago clientes",importe:"1200",tipo:"credit",moneda:"COP"},
 {fecha:"2026-10-12",detalle:"ABONO EXTERNO",importe:"5000",tipo:"credit",moneda:"COP"},
 {fecha:"2026-10-12",detalle:"Transferencia Hapi",importe:"10000",tipo:"debit",moneda:"COP"},
 {fecha:"2026-10-12",detalle:"Empanada fresca",importe:"7000",tipo:"debit",moneda:"COP"},
 {fecha:"2026-10-12",detalle:"Empanada fresca",importe:"7000",tipo:"debit",moneda:"COP"},
 {fecha:"2026-10-12",detalle:"Compra EUR",importe:"55",tipo:"debit",moneda:"EUR"},
 {fecha:"2027-01-01",detalle:"Compra futura",importe:"55",tipo:"debit",moneda:"COP"},
],mapping:{postedAt:"fecha",description:"detalle",amount:"importe",direction:"tipo",currency:"moneda"},
bankLabel:"Banco Demo",paymentMethod:"debit_card"};
const endpoint="/api/quick/v41/reconcile/preview";
async function call(body=data,user=A,base=origin,settings=env){
 const r=await handleQuickRequest(new Request(origin+endpoint,{method:"POST",
  headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify(body)}),settings,principal(user));
 return {status:r.status,body:await r.json()};
}
const counts=()=>{
 const t=["quick_shortcut_expenses","quick_manual_entries","quick_statement_credits","quick_income_entries",
   "quick_movement_categories","quick_auto_categories","quick_category_preferences","quick_balance_snapshots"];
 return Object.fromEntries(t.map(name=>[name,sqlite.prepare("SELECT COUNT(*) AS n FROM "+name).get().n]));
};
const before=counts();
assert.equal((await call({...data,owner_id:B})).status,422,"Cannot supply owner in request");
assert.equal((await call(data,A,"https://evil.invalid")).status,403,"CSRF same-origin enforced");
const unauthorized=await handleQuickRequest(new Request(origin+endpoint,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify(data)}),env,{access:{aud:"bad-aud",async getIdentity(){return {user_uuid:A};}}});
assert.equal(unauthorized.status,401);
const p=await call();
assert.equal(p.status,200,JSON.stringify(p.body));
assert.equal(p.body.version,"v41.1-preview");
assert.equal(p.body.canCommit,false);
assert.equal(p.body.stored,false);
assert.equal(p.body.persistenceAllowed,false);
assert.equal(p.body.connectionStatus,"not_connected");
assert.equal(p.body.count,8);
assert.deepEqual(p.body.rows.map(r=>r.status),[
  "possible_match","possible_match","needs_purpose","possible_transfer",
  "needs_type","repeated_in_file","needs_correction","needs_correction"]);
assert.equal(p.body.rows[0].existing[0].source,"accountless");
assert.equal(p.body.rows[1].existing[0].source,"income");
assert.equal(p.body.rows[5].repeatOfIndex,4);
assert.ok(!JSON.stringify(p.body).includes("PRIVADO OTRO PERFIL"));
assert.deepEqual(counts(),before,"Preview never alters the financial tables");
assert.ok(queries.every(q=>q.trim().toUpperCase().startsWith("SELECT")),
 "Preview must only execute SELECT queries");
const other=await call(data,B);
assert.equal(other.status,200);
assert.equal(other.body.rows[0].status,"needs_type");
assert.equal(other.body.rows[1].status,"needs_purpose");
assert.equal(other.body.rows[0].existing.length,0,"Tenant isolation");
assert.deepEqual(counts(),before);
assert.match(DASH_HTML,/id="import-v41-preview"/);
assert.match(DASH_HTML,/id="import-v41-review"/);
assert.match(IMPORT_JS,/\/api\/quick\/v41\/reconcile\/preview/);
new Function(IMPORT_JS);
sqlite.close();
console.log("v41.1 preview: isolation, read-only, credit/debit, repeat safety, validation, iPhone panel PASSED");
