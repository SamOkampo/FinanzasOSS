import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {runCategoryAutomation} from "../dist/apps/quick-worker/src/category-automation.js";
import {categoryReview} from "../dist/apps/quick-worker/src/categorization.js";
import {dashboardOverview} from "../dist/apps/quick-worker/src/dashboard-data.js";
import {readBudgets} from "../dist/apps/quick-worker/src/spending-limits.js";

const sqlite=new DatabaseSync(":memory:");
for(const file of ["0001_quick_d1","0003_accountless_shortcut_expenses",
  "0007_spending_limits","0008_movement_edit_soft_delete","0010_categories_ai",
  "0011_category_auto_questions","0012_statement_credits"]){
 sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+file+".sql",import.meta.url),"utf8"));
}
const db={prepare(query){let values=[];return {
 bind(...args){values=args;return this;},
 async first(){return sqlite.prepare(query).get(...values)??null;},
 async all(){return {results:sqlite.prepare(query).all(...values)};},
};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
sqlite.prepare("INSERT INTO quick_category_ai_settings(owner_id,enabled,updated_at) VALUES(?,1,'2026-11-04')").run(A);
const write=sqlite.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)");
function add(id,merchant,method,owner=A){
 write.run(id,owner,"test-"+id,1000000,"COP",method,"purchase",
  "2026-11-04T12:15:00.000Z",merchant,method==="bank_transfer"?"Banco ficticio":null);
}
add("11111111-1111-4111-8111-111111111111","Le devolví a una amiga lo que me prestó","bank_transfer");
add("22222222-2222-4222-8222-222222222222","Transferí de mi Bancolombia a mi Plata","bank_transfer");
add("33333333-3333-4333-8333-333333333333","Bre-B a Juan 10000","bank_transfer");
add("44444444-4444-4444-8444-444444444444","Compré unas Chokis","debit_card");
add("55555555-5555-4555-8555-555555555555","Compré un portátil","debit_card",B);
let calls=0,rawInput="";
const env={DB:db,ALLOW_AI_SUGGESTIONS:"true",ALLOW_PUSH_SEND:"false",AI:{async run(model,input){
 calls++;rawInput=JSON.stringify(input);
 assert.equal(model,"@cf/qwen/qwen3-30b-a3b-fp8");
 assert.ok(input.messages[0].content.includes("/no_think"),"Qwen must be instructed to return JSON without consuming tokens in reasoning");
 const request=JSON.parse(input.messages[1].content);
 const suggestions=request.movements.map(({index,concept})=>{
   if(concept.includes("devolví")||concept.includes("devolvi"))return {
     index,category:"Deudas y obligaciones",subcategory:"Abonos a préstamos",
     confidence:0.97,question:null,movementType:"debt_payment"
   };
   if(concept.includes("propia"))return {
     index,category:"Pagos y transferencias",subcategory:"Entre cuentas propias",
     confidence:0.96,question:null,movementType:"internal_transfer"
   };
   if(concept.includes("Chokis"))return {
     index,category:"Alimentación",subcategory:"Onces",
     confidence:0.98,question:null,movementType:"expense"
   };
   return {
     index,category:"Pagos y transferencias",subcategory:"Transferencias",
     confidence:0.4,question:"¿Fue una compra o un pago de deuda?",movementType:"review"
   };
 });
 return {response:JSON.stringify({suggestions})};
}}};
const result=await (await runCategoryAutomation(db,A,env)).json();
assert.equal(calls,1);
assert.equal(result.processed,4);
assert.ok(!rawInput.includes("10000"),"No send amounts to Qwen");
assert.ok(!rawInput.includes("Juan"),"No send payee names to Qwen");
const review=await (await categoryReview(db,A)).json();
const types=Object.fromEntries(review.entries.map(x=>[x.concept,x.economicGroup]));
assert.equal(types["Le devolví a una amiga lo que me prestó"],"debt_payment");
assert.equal(types["Transferí de mi Bancolombia a mi Plata"],"internal_transfer");
assert.equal(types["Bre-B a Juan 10000"],"review");
assert.equal(types["Compré unas Chokis"],"expense");
assert.ok(review.entries.find(x=>x.concept.includes("Bre-B")).needsReview);
assert.equal(review.entries.length,4,"No other profile may leak");
const overview=await (await dashboardOverview(db,A)).json();
assert.equal(overview.daily.reduce((sum,x)=>sum+Number(x.minor),0),1000000);
assert.equal(overview.debtPaymentsMinor,"1000000");
assert.equal(overview.pendingTransferReviewMinor,"1000000");
const budget=await (await readBudgets(db,A,Date.parse("2026-11-04T20:00:00Z"))).json();
assert.equal(budget.periods.month.spentMinor,"1000000");
const target=sqlite.prepare("SELECT id FROM quick_shortcut_expenses WHERE owner_id=? AND merchant LIKE '%Chokis%'").get(A).id;
sqlite.prepare("INSERT INTO quick_movement_categories(owner_id,source,movement_id,category,subcategory,classification_source,updated_at) VALUES(?,'accountless',?,'Deudas y obligaciones','Abonos a préstamos','manual','2026-11-04')").run(A,target);
const after=await (await categoryReview(db,A)).json();
assert.equal(after.entries.find(x=>x.id===target).economicGroup,"debt_payment");
assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM quick_shortcut_expenses WHERE owner_id=?").get(A).n,4);
console.log("Qwen economic intent: AI groups, confidentiality, manual precedence, budgets and owner isolation passed");
