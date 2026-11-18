import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { browserExpense } from "../dist/apps/quick-worker/src/shortcut-direct.js";
import { classifyQuickEconomicMovement } from "../dist/apps/quick-worker/src/economic-review.js";

const sql = new DatabaseSync(":memory:");
sql.exec(`
 CREATE TABLE quick_manual_entries (id TEXT, owner_id TEXT, client_entry_id TEXT,
 amount_minor INTEGER, currency TEXT, payment_method TEXT,kind TEXT,merchant TEXT,bank_label TEXT);
 CREATE TABLE quick_shortcut_expenses(
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, client_entry_id TEXT NOT NULL,
 amount_minor INTEGER, currency TEXT,payment_method TEXT,kind TEXT,occurred_at TEXT,merchant TEXT,bank_label TEXT,
 UNIQUE(owner_id,client_entry_id));
`);
const db = {prepare(text) {
 let values = [];
 return {
  bind(...args){ values=args;return this; },
  async first(){return sql.prepare(text).get(...values)??null;},
  async all(){return {results:sql.prepare(text).all(...values)};}
 };
}};
const owner = "synthetic-user";
const payment = {
 clientEntryId:"loan-repayment-20261103",amount:"30000",concept:"Una amiga",
 paymentMethod:"bank_transfer",bankLabel:"Banco ficticio",
 movementType:"debt_repayment",confirmed:true,
};
let r=await browserExpense(db,owner,payment);
assert.equal(r.status,201);
const {entryId,replayed}=await r.json();
assert.equal(replayed,false);
const saved=sql.prepare("SELECT * FROM quick_shortcut_expenses WHERE id=?").get(entryId);
assert.match(saved.merchant,/^Pago de préstamo: Una amiga$/);
assert.equal(saved.amount_minor,3000000);
assert.equal(classifyQuickEconomicMovement({
 kind:saved.kind,merchant:saved.merchant,paymentMethod:saved.payment_method
}),"debt_payment");
r=await browserExpense(db,owner,payment);
assert.equal(r.status,200);
assert.equal((await r.json()).replayed,true);
r=await browserExpense(db,owner,{...payment,movementType:"expense"});
assert.equal(r.status,409);
await assert.rejects(
 ()=>browserExpense(db,owner,{...payment,movementType:"secret"}),
 /Unsupported movementType/,
);
const legacy = {...payment,clientEntryId:"legacy-entry-20261103",concept:"Almuerzo",
 movementType:undefined};
r=await browserExpense(db,owner,legacy);
assert.equal(r.status,201);
const savedLegacy=sql.prepare("SELECT merchant FROM quick_shortcut_expenses WHERE client_entry_id=?")
 .get(legacy.clientEntryId);
assert.equal(savedLegacy.merchant,"Almuerzo");
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n,2);
console.log("repayment intent: old Shortcuts compatible, type explicit, idempotent and safe");
