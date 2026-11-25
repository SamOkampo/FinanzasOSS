import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleQuickRequest } from "../dist/apps/quick-worker/src/index.js";
import { BALANCES_JS } from "../dist/apps/quick-worker/src/dashboard-balances-js.js";
import { DASH_HTML } from "../dist/apps/quick-worker/src/dashboard-html.js";

const sql=new DatabaseSync(":memory:");
for(const name of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
 "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
 "0013_income_capture","0014_verified_balance_snapshots"]) {
 sql.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+name+".sql",import.meta.url),"utf8"));
}
const db={prepare(query){let args=[];return {bind(...v){args=v;return this;},
 async first(){return sql.prepare(query).get(...args)??null;},
 async all(){return {results:sql.prepare(query).all(...args)};}};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const origin="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:db,ACCESS_AUD:"balance-test",ALLOW_WRITES:"true"};
const principal=owner=>({access:{aud:"balance-test",async getIdentity(){return {user_uuid:owner};}}});
async function call(path,method="GET",body=null,owner=A,customOrigin=origin){
 const r=await handleQuickRequest(new Request(origin+path,{
  method,headers:method==="POST"?{"Content-Type":"application/json",Origin:customOrigin}:undefined,
  body:method==="POST"?JSON.stringify(body):undefined
 }),env,principal(owner));
 return {status:r.status,body:await r.json()};
}
const d=new Date(),earlier=new Date(d.getTime()-72*3600000).toISOString();
const middle=new Date(d.getTime()-48*3600000).toISOString();
const later=new Date(d.getTime()-24*3600000).toISOString();
const first={bankLabel:"Plata Pay",accountType:"deposit",amount:"100000",asOf:earlier,
 requestKey:"balance-snapshot-first-001",confirmed:true};
const second={...first,amount:"110768",asOf:later,requestKey:"balance-snapshot-second-002"};
assert.equal((await call("/api/quick/balances")).body.accounts.length,0,"Never infer bank account from transactions");
assert.equal((await call("/api/quick/balances/verify","POST",{...first,confirmed:false})).status,422);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,owner_id:B})).status,422);
assert.equal((await call("/api/quick/balances/verify","POST",first,A,"https://example.invalid")).status,403);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,amount:"-500"})).status,422);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,amount:"5.500"})).status,422);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,asOf:new Date(Date.now()+24*3600000).toISOString()})).status,422);
assert.equal((await call("/api/quick/balances/verify","POST",first)).status,201);
assert.equal((await call("/api/quick/balances/verify","POST",first)).body.replayed,true);
// Invalid idempotency replay must never manufacture a new bank/account.
const accountCountBeforeConflict=sql.prepare("SELECT COUNT(*) AS n FROM quick_balance_accounts WHERE owner_id=?").get(A).n;
const conflictingAccount={...first,bankLabel:"Banco fantasma de prueba"};
assert.equal((await call("/api/quick/balances/verify","POST",conflictingAccount)).status,409);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM quick_balance_accounts WHERE owner_id=?").get(A).n,
 accountCountBeforeConflict,"Rejected duplicate key must not create a phantom account");
assert.equal((await call("/api/quick/balances")).body.accounts.some(x=>x.label==="Banco fantasma de prueba"),false);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,bankLabel:"PLATA PAY"})).body.replayed,true,
 "Case-insensitive label should preserve balance replay behavior");

assert.equal((await call("/api/quick/balances/verify","POST",{...first,amount:"100001"})).status,409);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,bankLabel:"PLATA PAY",accountType:"credit",requestKey:"balance-different-kind-001"})).status,409);
const p=(query,values)=>sql.prepare(query).run(...values);
// Five entries in period: deposit credit 10168, own transfer credit 4000, expense 3400, bank mismatch expense, no-label expense.
p("INSERT INTO quick_statement_credits(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind,economic_purpose) VALUES(?,?,?,?,?,?,?,?,?,?)",
 ["aaaaaaaa-aaaa-4aaa-8aaa-111111111111",A,"statement-payment-10168",1016800,"COP",middle,"Pago recibido","Plata Pay","received_transfer","income"]);
p("INSERT INTO quick_statement_credits(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind,economic_purpose) VALUES(?,?,?,?,?,?,?,?,?,?)",
 ["aaaaaaaa-aaaa-4aaa-8aaa-222222222222",A,"own-account-transfer-4000",400000,"COP",middle,"Rentabilidad → Cuenta","Plata Pay","transfer","transfer"]);
p("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)",
 ["aaaaaaaa-aaaa-4aaa-8aaa-333333333333",A,"expense-plata-3400",340000,"COP","bank_transfer","purchase",middle,"Comida","Plata Pay"]);
p("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)",
 ["aaaaaaaa-aaaa-4aaa-8aaa-444444444444",A,"expense-nu-14340",1434000,"COP","credit_card","purchase",middle,"D1","Nu Bank"]);
p("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)",
 ["aaaaaaaa-aaaa-4aaa-8aaa-555555555555",B,"another-owner-plata-5000",500000,"COP","bank_transfer","purchase",middle,"Extraño","Plata Pay"]);
const firstResult=(await call("/api/quick/balances")).body.accounts;
assert.equal(firstResult.length,1);
assert.equal(firstResult[0].latest.amountMinor,"10000000");
assert.equal(firstResult[0].reconciliation,null,"One balance cannot prove reconciliation");
assert.equal(firstResult[0].estimate.amountMinor,"11076800","One confirmed balance is enough to estimate");
assert.equal(firstResult[0].estimate.incomingCount,2);
assert.equal(firstResult[0].estimate.outgoingCount,1);
assert.equal((await call("/api/quick/balances", "GET", null,B)).body.accounts.length,0,"Account is tenant private");
assert.equal((await call("/api/quick/balances/verify","POST",second)).status,201);
const matched=(await call("/api/quick/balances")).body.accounts[0];
assert.equal(matched.reconciliation.incomingMinor,"1416800");
assert.equal(matched.reconciliation.outgoingMinor,"340000");
assert.equal(matched.reconciliation.expectedMinor,"11076800");
assert.equal(matched.reconciliation.differenceMinor,"0");
assert.equal(matched.reconciliation.status,"matches_recorded_movements");
assert.equal(matched.reconciliation.incomingCount,2);
assert.equal(matched.reconciliation.outgoingCount,1);
assert.equal(matched.estimate.amountMinor,matched.latest.amountMinor,"New verified balance resets the estimate window");
assert.equal(matched.estimate.incomingCount,0,"Already included movements must never count twice");
const third={...second,amount:"110000",requestKey:"balance-snapshot-third-003",
 asOf:new Date(d.getTime()-12*3600000).toISOString()};
assert.equal((await call("/api/quick/balances/verify","POST",third)).status,201);
const differing=(await call("/api/quick/balances")).body.accounts[0];
assert.equal(differing.reconciliation.status,"difference_requires_review");
assert.equal(differing.reconciliation.differenceMinor,"-76800");
assert.equal(differing.reconciliation.outgoingCount,0);
assert.equal(sql.prepare("SELECT count(*) n FROM quick_shortcut_expenses WHERE owner_id=?").get(A).n,2,"No movements edited");
const credit={bankLabel:"Nu Bank",accountType:"credit",amount:"50000",
 asOf:later,requestKey:"nu-debt-snapshot-001",confirmed:true};
assert.equal((await call("/api/quick/balances/verify","POST",credit)).status,201);
const nu=(await call("/api/quick/balances")).body.accounts.find(x=>x.label==="Nu Bank");
assert.equal(nu.type,"credit");
assert.equal(nu.reconciliation,null,"Credit card debt must not be reconciled as a deposit");
assert.equal(nu.latest.amountMinor,"5000000");
assert.ok(!JSON.stringify((await call("/api/quick/balances", "GET", null,B)).body).includes("Nu Bank"));
assert.equal(nu.estimate,null,"Credit card purchases must never change the reported deposit balance");

const labeledIncome={clientEntryId:"income-for-projection-001",amount:"8500",concept:"Ingreso de prueba",
 paymentMethod:"bank_transfer",bankLabel:"PLATA PAY",incomeCategory:"other",confirmed:true};
assert.equal((await call("/api/quick/studio/income","POST",labeledIncome)).status,201);
assert.equal((await call("/api/quick/studio/income","POST",labeledIncome)).body.replayed,true);
assert.equal((await call("/api/quick/studio/income","POST",{...labeledIncome,amount:"5000"},B)).status,201);
assert.equal((await call("/api/quick/studio/income","POST",{...labeledIncome,clientEntryId:"cash-for-projection-001",
  bankLabel:undefined,paymentMethod:"cash"})).status,201);
const afterIncome=(await call("/api/quick/balances")).body.accounts.find(x=>x.label==="Plata Pay");
assert.equal(afterIncome.latest.amountMinor,"11000000");
assert.equal(afterIncome.estimate.amountMinor,"11850000");
assert.equal(afterIncome.estimate.incomingCount,1);

const localDay=offset=>new Date(Date.now()-(offset*24+5)*3600000).toISOString().slice(0,10);
const cutDay=localDay(10);
assert.equal((await call("/api/quick/balances/verify","POST",{...first,bankLabel:"Cuenta de corte",
  asOf:cutDay+"T20:00:00.000Z",requestKey:"projection-cut-bogota-001"})).status,201);
for(const [id,date,minor] of [["v41_same_day_credit",cutDay+"T17:00:00.000Z",5000],
  ["v41_tomorrow_credit",localDay(9)+"T17:00:00.000Z",10000],
  ["v41_future_credit",localDay(-2)+"T17:00:00.000Z",999999]]){
 p("INSERT INTO quick_statement_credits(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind) VALUES(?,?,?,?,'COP',?,?,?,'received_transfer')",
   [id,A,id,minor,date,"Abono de extracto","Cuenta de corte"]);
}
for(const [id,date,minor,deleted,method] of [
 ["expense_at_cut",cutDay+"T20:00:00.000Z",88800,null,"debit_card"],
 ["expense_after_cut",cutDay+"T21:00:00.000Z",2100,null,"debit_card"],
 ["import_undated_debit",cutDay+"T17:00:00.000Z",9900,null,"debit_card"],
 ["expense_deleted_after_cut",cutDay+"T21:01:00.000Z",5000,later,"debit_card"],
 ["expense_on_card",cutDay+"T21:02:00.000Z",6000,null,"credit_card"],
]){
 p("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,deleted_at) VALUES(?,?,?,?,'COP',?,'purchase',?,?,?,?)",
   [id,A,id,minor,method,date,"Cargo de prueba","Cuenta de corte",deleted]);
}
const atCut=(await call("/api/quick/balances")).body.accounts.find(x=>x.label==="Cuenta de corte");
assert.equal(atCut.estimate.amountMinor,"10007900");
assert.equal(atCut.estimate.uncertainCount,2);
assert.equal(atCut.estimate.outgoingCount,1);

assert.match(DASH_HTML,/id="verify-balance-form"/);
assert.match(DASH_HTML,/\/balances\.js/);
assert.match(BALANCES_JS,/not.*connected|no se|No se/i);
assert.ok(!BALANCES_JS.includes("localStorage")&&!BALANCES_JS.includes("sessionStorage"));
new Function(BALANCES_JS);

 // v42.2: cash + bank historical projection share the same eligibility rules.
 sql.exec(readFileSync(new URL("../docs/quick/v42-own-transfers.sql",import.meta.url),"utf8"));
 sql.exec(readFileSync(new URL("../docs/quick/v42-reconciliation-views.sql",import.meta.url),"utf8"));
 const {saveOwnTransfer}=await import("../dist/apps/quick-worker/src/own-transfer-v42.js");
 const cashBase={...first,bankLabel:"Efectivo",accountType:"cash",amount:"100000",asOf:earlier,requestKey:"cash-audit-baseline-001"};
 assert.equal((await call("/api/quick/balances/verify","POST",cashBase)).status,201);
 p("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,'COP','cash','purchase',?,'Cash audit',NULL)",
 ["cash-audit-expense",A,"cash-audit-expense",250000,middle]);
 p("INSERT INTO quick_income_entries(id,owner_id,client_entry_id,amount_minor,occurred_at,concept,payment_method) VALUES(?,?,?,?,?,'Cash receipt','cash')",
 ["cash-audit-income",A,"cash-audit-income",500000,middle]);
 p("INSERT INTO quick_v42_own_transfers(id,owner_id,client_entry_id,amount_minor,from_bank_label,to_bank_label,occurred_at) VALUES(?,?,?,?,?,?,?)",
 ["cash-audit-transfer",A,"cash-audit-transfer",100000,"Efectivo","Plata Pay",middle]);
 p("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,'COP','credit_card','purchase',?,'Card purchase not deposit','Plata Pay')",
 ["card-audit-exclusion",A,"card-audit-exclusion",990000,middle]);
 const cashAccount=(await call("/api/quick/balances")).body.accounts.find(x=>x.label==="Efectivo");
 // The existing cash shortcut income is 8500 COP, after earlier.
 assert.equal(cashAccount.estimate.amountMinor,"11000000");
 assert.equal(cashAccount.estimate.incomingCount,2);
 assert.equal(cashAccount.estimate.outgoingCount,2);
 assert.equal((await call("/api/quick/balances/verify","POST",{...cashBase,amount:"101500",asOf:later,requestKey:"cash-audit-second-002"})).status,201);
 const cashRec=(await call("/api/quick/balances")).body.accounts.find(x=>x.label==="Efectivo").reconciliation;
 assert.equal(cashRec.expectedMinor,"10150000");
 assert.equal(cashRec.differenceMinor,"0");
 const view=sql.prepare("SELECT calculated_minor,difference_minor FROM quick_v42_reconciliation_history WHERE owner_id=? AND bank_label='Efectivo' AND as_of=?").get(A,later);
 assert.equal(String(view.calculated_minor),cashRec.expectedMinor);
 assert.equal(String(view.difference_minor),cashRec.differenceMinor);
 assert.equal(sql.prepare("SELECT COUNT(*) n FROM quick_v42_reconciliation_movements WHERE id='card-audit-exclusion'").get().n,0);
 assert.equal(sql.prepare("SELECT SUM(signed_minor) n FROM quick_v42_reconciliation_movements WHERE id='cash-audit-transfer'").get().n,0);
 const savedTransfer=await saveOwnTransfer(db,A,{clientEntryId:"audit-own-transfer-002",amount:"10",fromBankLabel:"Plata Pay",toBankLabel:"Efectivo"});
 assert.equal(savedTransfer.status,201);
 const cashAfter=(await call("/api/quick/balances")).body.accounts.find(x=>x.label==="Efectivo");
 assert.equal(cashAfter.estimate.amountMinor,"11001000");
 console.log("v42.2 cash estimates, bank/card isolation, paired legs and historical reconciliation parity passed");

sql.close();
console.log("Verified bank balances: owner isolation, snapshot idempotency, credit separation, matched and unmatched flows PASSED");
