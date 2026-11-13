import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { dashboardOverview, dashboardMovements } from "../dist/apps/quick-worker/src/dashboard-data.js";
import { DASH_JS } from "../dist/apps/quick-worker/src/dashboard-js.js";

const sqlite = new DatabaseSync(":memory:");
for (const m of [
  "0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
  "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
  "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
  "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
]) sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+m+".sql",import.meta.url),"utf8"));

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const expenses=sqlite.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)");
expenses.run("11111111-1111-4111-8111-111111111111",A,"nu-purchase-unique-001",1434000,"COP","credit_card","purchase","2026-11-12T16:41:00Z","Tienda D1 Manzana","Nu Bank");
const credits=sqlite.prepare("INSERT INTO quick_statement_credits(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind) VALUES(?,?,?,?,?,?,?,?,?)");
credits.run("22222222-2222-4222-8222-222222222222",A,"plata-credited-own-0001",340000,"COP","2026-11-13T10:00:00Z","Rentabilidad → Cuenta","Plata Pay","transfer");
credits.run("33333333-3333-4333-8333-333333333333",A,"plata-credited-incoming-0001",1016800,"COP","2026-11-09T12:00:00Z","Transfer by account number","Plata Pay","received_transfer");
credits.run("44444444-4444-4444-8444-444444444444",B,"plata-another-profile-credit",90000000,"COP","2026-11-13T10:00:00Z","Otro perfil privado","Plata Pay","received_transfer");
assert.throws(()=>credits.run("55555555-5555-4555-8555-555555555555",A,"plata-credited-own-0001",340000,"COP","2026-11-13T10:00:00Z","Rentabilidad → Cuenta","Plata Pay","transfer"),/UNIQUE/);

const db={prepare(query){let args=[];return {bind(...params){args=params;return this;},async first(){return sqlite.prepare(query).get(...args)??null;},async all(){return {results:sqlite.prepare(query).all(...args)};}};}};
const overview=await (await dashboardOverview(db,A)).json();
assert.equal(overview.movementCount,3,"Credit lines count as movements");
assert.equal(overview.transfersAndInvestments,2,"Credits excluded from expense flow");
assert.equal(overview.daily.length,1);
assert.equal(overview.daily[0].minor,"1434000","Only the Nu purchase counts toward spending");
assert.equal(overview.bankDaily.length,1);
assert.equal(overview.bankDaily[0].bank,"Nu Bank");
assert.ok(!JSON.stringify(overview).includes("Otro perfil privado"));
assert.equal(overview.categoryDaily.length,1);
const movement=await (await dashboardMovements(db,A,new URL("https://test.invalid/api/quick/dashboard/movements?page=0"))).json();
assert.equal(movement.entries.length,3);
const own=movement.entries.find(x=>x.kind==="transfer");
const received=movement.entries.find(x=>x.kind==="received_transfer");
assert.equal(own.direction,"credit");
assert.equal(own.source,"statement_credit");
assert.equal(own.category_status,"nonexpense");
assert.equal(own.account_id,null);
assert.equal(received.direction,"credit");
assert.equal(received.category_status,"nonexpense");
assert.equal(received.bank_label,"Plata Pay");
assert.equal(received.amount_minor,"1016800");
assert.ok(!JSON.stringify(movement).includes("Otro perfil privado"));
assert.match(DASH_JS,/x.direction === "credit" \? "\+ "/);
assert.match(DASH_JS,/x.source==="statement_credit"/);
sqlite.close();
console.log("Private positive statement credits: income/transfer direction, spending exclusion, isolation, idempotency PASSED");
