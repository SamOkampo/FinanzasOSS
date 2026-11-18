import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleQuickRequest } from "../dist/apps/quick-worker/src/index.js";
import { INCOME_JS } from "../dist/apps/quick-worker/src/dashboard-income-js.js";
import { DASH_HTML } from "../dist/apps/quick-worker/src/dashboard-html.js";

const sql=new DatabaseSync(":memory:");
for(const name of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
 "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
 "0013_income_capture"]){
  sql.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+name+".sql",import.meta.url),"utf8"));
}
const db={prepare(query){let args=[];return {
 bind(...values){args=values;return this;},
 async first(){return sql.prepare(query).get(...args)??null;},
 async all(){return {results:sql.prepare(query).all(...args)};}
};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:db,ACCESS_AUD:"income-test-aud",ALLOW_WRITES:"true",ALLOW_SHORTCUT_WRITES:"true"};
const owner=id=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:id};}}});
async function call(path,method="GET",body=null,identity=owner(A),options={}){
 const req=new Request(base+path,{method,headers:{
   ...(method==="POST"?{"Content-Type":options.contentType??"application/json",...(options.authorization?{}:{Origin:options.origin??base})}:{}),
   ...(options.authorization?{Authorization:options.authorization}:{}),
 },...(method==="POST"?{body:JSON.stringify(body)}:{})});
 const res=await handleQuickRequest(req,env,identity);
 return {status:res.status,body:await res.json()};
}
const key="income-browser-test-0001";
const income={clientEntryId:key,amount:"25000",concept:"Pago por desarrollo",
 paymentMethod:"bank_transfer",bankLabel:"Plata Pay",incomeCategory:"payment",confirmed:true};
assert.equal((await call("/api/quick/studio/income","POST",{...income,confirmed:false})).status,422);
assert.equal((await call("/api/quick/studio/income","POST",{...income,ownerId:B})).status,422);
assert.equal((await call("/api/quick/studio/income","POST",income,owner(A),{origin:"https://fake.invalid"})).status,403);
assert.equal((await call("/api/quick/studio/income","POST",{...income,bankLabel:null})).status,422);
assert.equal((await call("/api/quick/studio/income","POST",{...income,paymentMethod:"credit_card"})).status,422);
const created=await call("/api/quick/studio/income","POST",income);
assert.equal(created.status,201);
assert.equal(created.body.kind,"income");
assert.equal(created.body.direction,"credit");
assert.equal((await call("/api/quick/studio/income","POST",income)).body.replayed,true);
assert.equal((await call("/api/quick/studio/income","POST",{...income,amount:"26000"})).status,409);
const stranger=await call("/api/quick/dashboard/movements","GET",null,owner(B));
assert.equal(stranger.body.entries.length,0,"Other owners cannot read the new income");
const enroll=await call("/api/quick/shortcut/enroll","POST",{label:"iPhone test",confirmed:true});
assert.equal(enroll.status,201);
assert.ok(enroll.body.token.startsWith("fosq_"));
const authorization="Bearer "+enroll.body.token;
const shortcutIncome={clientEntryId:"ios-income-cash-20261114",amount:12000,
 concept:"Pago en efectivo",paymentMethod:"Efectivo",bankLabel:"No aplica",incomeCategory:"Pago recibido"};
assert.equal((await call("/api/quick/shortcut/income","POST",shortcutIncome,owner(A))).status,401);
assert.equal((await call("/api/quick/shortcut/income","POST",shortcutIncome,{access:{aud:"bad",getIdentity:async()=>({user_uuid:A})}},{authorization})).status,401);
const cashIncome=await call("/api/quick/shortcut/income","POST",shortcutIncome,owner(A),{authorization});
assert.equal(cashIncome.status,201);
assert.equal(cashIncome.body.direction,"credit");
assert.equal(cashIncome.body.kind,"income");
for(const [paymentMethod,amount] of [["cash","12000"],["  EFECTIVO  ","COP $ 12.000,00"]]){
 const replay=await call("/api/quick/shortcut/income","POST",{...shortcutIncome,paymentMethod,amount,bankLabel:null,incomeCategory:"payment"},owner(A),{authorization});
 assert.equal(replay.status,200);
 assert.equal(replay.body.entryId,cashIncome.body.entryId);
 assert.equal(replay.body.replayed,true);
}
const incomePath="/api/quick/shortcut/income";
for(const [patch,code] of [
 [{bankLabel:"Banco de prueba"},"invalid_bank"], [{paymentMethod:"Tarjeta crédito"},"invalid_method"],
 [{amount:"1,234"},"invalid_amount"], [{incomeCategory:"Desconocida"},"invalid_category"],
 [{clientEntryId:""},"invalid_entry_id"], [{concept:""},"invalid_concept"],
 [{movementType:"debt_repayment"},"wrong_endpoint"], [{ownerId:B},"invalid_body"],
]){
 const invalid=await call(incomePath,"POST",{...shortcutIncome,...patch},owner(A),{authorization});
 assert.equal(invalid.status,422);
 assert.equal(invalid.body.code,code);
 assert.match(invalid.body.reference,/^[0-9a-f-]{36}$/);
 assert.equal(typeof invalid.body.message,"string");
}
assert.equal((await call(incomePath,"GET",null,owner(A),{authorization})).status,405);
assert.equal((await call(incomePath,"POST",shortcutIncome,owner(A),{authorization,contentType:"text/plain"})).status,415);
assert.equal((await call("/api/quick/shortcut/expense","POST",shortcutIncome,owner(A),{authorization})).body.code,"wrong_endpoint");
assert.equal((await call(incomePath,"POST",shortcutIncome,owner(A),{authorization:"Bearer fosq_"+"0".repeat(64)})).body.code,"device_token_inactive");
const unexpectedOwner=await call("/api/quick/dashboard/movements","GET",null,owner(B));
assert.equal(unexpectedOwner.body.entries.length,0);
// A real payment received in a statement must keep its immutable source row and amount.
sql.prepare("INSERT INTO quick_statement_credits(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind,economic_purpose) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("dddddddd-dddd-4ddd-8ddd-dddddddddddd",A,"plata-previous-payment-10168",1016800,"COP",
 "2026-11-09T05:00:00Z","Transfer by account number","Plata Pay","received_transfer","income");
sql.prepare("INSERT INTO quick_statement_credits(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind,economic_purpose) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",A,"plata-internal-transfer-0001",400000,"COP",
 "2026-11-09T05:00:00Z","Rentabilidad → Cuenta","Plata Pay","transfer","transfer");
const overview=(await call("/api/quick/dashboard/overview")).body;
assert.equal(overview.incomeMinor,"4716800","25k + 12k + 10.168k genuine income");
assert.equal(overview.incomeCount,3);
assert.equal(overview.transfersAndInvestments,1);
assert.equal(overview.daily.length,0,"Income is not a negative expense");
assert.equal(overview.bankDaily.length,0,"Income must not contaminate spending by bank");
assert.equal(overview.incomeDaily.reduce((sum,x)=>sum+Number(x.minor),0),4716800);
const entries=(await call("/api/quick/dashboard/movements")).body.entries;
assert.equal(entries.length,4);
assert.equal(entries.filter(x=>x.economic_purpose==="income").length,3);
assert.ok(entries.every(x=>x.direction==="credit"));
const cashMovement=entries.find(x=>x.id===cashIncome.body.entryId);
assert.equal(cashMovement.source,"income");
assert.equal(cashMovement.payment_method,"cash");
assert.equal(cashMovement.amount_minor,"1200000");
assert.equal(cashMovement.bank_label,null);
assert.equal(entries.find(x=>x.source==="statement_credit"&&x.kind==="income").subcategory,"Pago recibido");
assert.ok(!JSON.stringify(entries).includes(B));
assert.match(DASH_HTML,/id="income-dialog"/);
assert.match(DASH_HTML,/id="add-income-top"/);
assert.match(DASH_HTML,/id="add-income-movement"/);
assert.match(INCOME_JS,/#income/);
assert.ok(!INCOME_JS.includes("localStorage")&&!INCOME_JS.includes("sessionStorage"));
new Function(INCOME_JS);
sql.close();
console.log("Income capture: human confirmation, iPhone token, owner isolation, idempotency, positive credit, no expense contamination PASSED");
