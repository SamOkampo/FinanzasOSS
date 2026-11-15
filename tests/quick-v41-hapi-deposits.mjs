import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {HAPI_JS} from "../dist/apps/quick-worker/src/dashboard-hapi.js";

const sql=new DatabaseSync(":memory:");
const migrations=new URL("../apps/quick-worker/migrations/",import.meta.url);
for(const name of readdirSync(migrations).sort())sql.exec(readFileSync(new URL(name,migrations),"utf8"));
const DB={prepare(query){let args=[];return {
  bind(...params){args=params;return this;},
  async first(){return sql.prepare(query).get(...args)??null;},
  async all(){return {results:sql.prepare(query).all(...args)};},
};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const transfer="11111111-1111-4111-8111-111111111111";
sql.prepare("INSERT INTO quick_statement_review_decisions(id,owner_id,row_key,row_hash,review_digest,bank_label,payment_method,"+
  "direction,occurred_on,amount_minor,description,action,counterparty_label) VALUES(?,?,?,?,?,?,'bank_transfer','debit',?,?,?,'own_transfer','Hapi')")
  .run(transfer,A,"fictitious-row","fictitious-hash","0".repeat(64),"Banco ficticio","2026-10-01",42000000,"Aporte ficticio");
const original=sql.prepare("SELECT * FROM quick_statement_review_decisions").all();
const env={DB,ACCESS_AUD:"hapi-test",ALLOW_WRITES:"true",ALLOW_V41_HAPI:"true"};
async function req(path,data,owner=A,origin="https://qa.example"){
  const init=data?{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(data)}:undefined;
  const ctx=owner?{access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}}:{};
  const r=await handleQuickRequest(new Request("https://qa.example/api/quick/v41/hapi/"+path,init),env,ctx);
  assert.match(r.headers.get("Cache-Control"),/no-store/);
  return {status:r.status,data:await r.json()};
}
const initial=await req("deposits");
assert.equal(initial.data.connection,"manual");
assert.equal(initial.data.currency,"USD");
assert.equal(initial.data.origins[0].id,transfer);
assert.equal((await req("deposits",null,B)).data.origins.length,0);
assert.equal((await req("deposits",null,null)).status,401);
const payload={origin:"statement:"+transfer,requestKey:"hapi-fixture-deposit-01",confirmed:true};
assert.equal((await req("deposits",payload,B)).status,404);
assert.equal((await req("deposits",payload,A,"https://wrong.example")).status,403);
assert.equal((await req("deposits",{...payload,confirmed:false})).status,422);
const pending=await req("deposits",payload);
assert.equal(pending.status,201);
assert.equal(pending.data.status,"pending");
assert.equal(pending.data.copMinor,"42000000");
assert.equal((await req("deposits",payload)).data.id,pending.data.id);
assert.equal((await req("deposits",{...payload,requestKey:"hapi-fixture-deposit-02"})).status,409);
const credit={id:pending.data.id,creditedOn:"2026-10-02",usdAmount:"100",feeCop:"5000",reference:"DEMO-001",confirmed:true};
assert.equal((await req("credit",credit,B)).status,404);
assert.equal((await req("credit",{...credit,creditedOn:"2026-09-30"})).status,422);
const credited=await req("credit",credit);
assert.equal(credited.data.usdMinor,"10000");
assert.equal(credited.data.effectiveCopPerUsd,"4200.0000");
assert.equal(credited.data.feeCopMinor,"500000");
assert.deepEqual(await req("credit",credit),credited);
assert.equal((await req("credit",{...credit,usdAmount:"99.25"})).status,409);
const manual=await req("deposits",{bank:"Banco ficticio",debitedOn:"2026-10-01",copAmount:"100000.50",
  requestKey:"hapi-fixture-deposit-03",confirmed:true});
assert.equal(manual.data.copMinor,"10000050");
assert.equal((await req("credit",{...credit,id:manual.data.id})).status,409);
assert.equal((await req("deposits",null,B)).data.items.length,0);
assert.deepEqual(sql.prepare("SELECT * FROM quick_statement_review_decisions").all(),original);
for(const table of ["quick_manual_entries","quick_shortcut_expenses","quick_statement_credits","quick_income_entries"])
  assert.equal(sql.prepare("SELECT count(*) AS n FROM "+table).get().n,0);
new Function(HAPI_JS);
console.log("v41 Hapi: isolated manual COP/USD transfers, explicit confirmations, exact FX, unique source and receipt, no ledger writes PASSED");
