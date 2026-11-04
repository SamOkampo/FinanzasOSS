import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { classifyQuickEconomicMovement } from "../dist/apps/quick-worker/src/economic-review.js";
import { dashboardOverview } from "../dist/apps/quick-worker/src/dashboard-data.js";
import { readBudgets } from "../dist/apps/quick-worker/src/spending-limits.js";
import { categoryReview, ruleCategory } from "../dist/apps/quick-worker/src/categorization.js";

const kind = (merchant, paymentMethod = "bank_transfer", category = null, subcategory = null) =>
  classifyQuickEconomicMovement({kind:"purchase",merchant,paymentMethod,manualCategory:category,manualSubcategory:subcategory});
assert.equal(kind("Pago de préstamo de una persona"),"debt_payment");
assert.equal(kind("Bre-B · Nequi llave", "bank_transfer"),"review");
assert.equal(kind("Transferencia a X","bank_transfer","Pagos y transferencias","Transferencias"),"internal_transfer");
assert.equal(kind("Bre-B · comercio","bank_transfer","Alimentación","Onces"),"expense");
assert.equal(kind("Chokis","debit_card"),"expense");
assert.equal(classifyQuickEconomicMovement({kind:"investment_transfer",merchant:"Comida",paymentMethod:"other"}),"investment_flow");
assert.equal(ruleCategory("Expresso 1").subcategory,"Café y bebidas");
assert.equal(ruleCategory("Helado Chococono").subcategory,"Onces");
assert.equal(ruleCategory("Plan Móvil Virgin Mobile").subcategory,"Internet y telefonía");

const sql = new DatabaseSync(":memory:");
sql.exec(`
 CREATE TABLE quick_manual_entries (owner_id TEXT, id TEXT, amount_minor INTEGER, currency TEXT,
 payment_method TEXT,kind TEXT, occurred_at TEXT,merchant TEXT,bank_label TEXT,revision INTEGER,
 account_id TEXT,deleted_at TEXT);
 CREATE TABLE quick_shortcut_expenses (owner_id TEXT, id TEXT, amount_minor INTEGER, currency TEXT,
 payment_method TEXT,kind TEXT, occurred_at TEXT,merchant TEXT,bank_label TEXT,revision INTEGER,deleted_at TEXT);
 CREATE TABLE quick_movement_categories (owner_id TEXT,source TEXT,movement_id TEXT,category TEXT,
 subcategory TEXT,classification_source TEXT);
 CREATE TABLE quick_auto_categories (owner_id TEXT,source TEXT,movement_id TEXT,category TEXT,subcategory TEXT,
 confidence REAL,needs_review INTEGER,question TEXT,classification_source TEXT);
 CREATE TABLE quick_spending_limits (owner_id TEXT,period TEXT,limit_minor INTEGER);
`);
const row = sql.prepare("INSERT INTO quick_shortcut_expenses(owner_id,id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision) VALUES(?,?,?,?,?,?,?,?,?,0)");
function add(owner,id,pesos,method,kindValue,merchant) {
 row.run(owner,id,pesos*100,"COP",method,kindValue,"2026-10-24T14:00:00.000Z",merchant,"Banco de prueba");
}
add("A","a1",99900,"debit_card","purchase","Suscripción Mensual Chatgpt");
add("A","a2",30000,"bank_transfer","purchase","Pago de préstamo de Sindy");
add("A","a3",5000,"bank_transfer","purchase","Bre-B · Nequi llave");
add("A","a4",4500,"debit_card","purchase","Helado Chococono");
add("A","a5",15000,"bank_transfer","purchase","Bre-B · compra confirmada");
add("A","a6",20000,"bank_transfer","purchase","Transferencia entre cuentas propias");
add("A","a7",80000,"bank_transfer","investment_transfer","Aporte Hapi");
add("B","b1",900000,"debit_card","purchase","Gasto de otra persona");
const manual=sql.prepare("INSERT INTO quick_movement_categories VALUES(?,?,?,?,?,?)");
manual.run("A","accountless","a5","Alimentación","Onces","manual");
manual.run("A","accountless","a6","Pagos y transferencias","Transferencias","manual");
const db={prepare(query){const statement=sql.prepare(query);let args=[];return {
 bind(...values){args=values;return this;},
 async all(){return {results:statement.all(...args)};},
 async first(){return statement.get(...args)||null;}
};}};
const overview=await (await dashboardOverview(db,"A")).json();
assert.equal(overview.movementCount,7);
assert.equal(overview.debtPaymentsMinor,"3000000");
assert.equal(overview.pendingTransferReviewMinor,"500000");
assert.equal(overview.daily.reduce((sum,x)=>sum+Number(x.minor),0),11940000);
assert.equal(overview.transfersAndInvestments,4);
const budget=await (await readBudgets(db,"A",Date.parse("2026-10-30T12:00:00.000Z"))).json();
assert.equal(budget.periods.month.spentMinor,"11940000");
const review=await (await categoryReview(db,"A")).json();
const byGroup=Object.fromEntries(review.economicSummary.map(v=>[v.group,v.amountCOP]));
assert.equal(byGroup.expense,"119400.00");
assert.equal(byGroup.debt_payment,"30000.00");
assert.equal(byGroup.review,"5000.00");
assert.equal(byGroup.internal_transfer,"20000.00");
assert.equal(byGroup.investment_flow,"80000.00");
assert.ok(review.entries.find(x=>x.id==="a3").economicNeedsReview);
assert.equal(review.entries.find(x=>x.id==="a5").economicGroup,"expense");
assert.ok(!review.entries.some(x=>x.id==="b1"));
console.log("quick economic classification: debt, pending transfers, manual overrides, tenant isolation OK");
