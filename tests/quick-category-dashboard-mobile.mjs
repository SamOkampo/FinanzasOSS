import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {dashboardOverview,dashboardMovements} from "../dist/apps/quick-worker/src/dashboard-data.js";
import {categoryReview,setCategory} from "../dist/apps/quick-worker/src/categorization.js";
import {DASH_JS} from "../dist/apps/quick-worker/src/dashboard-js.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {DASH_CSS} from "../dist/apps/quick-worker/src/dashboard-css.js";
import {INSIGHTS_JS} from "../dist/apps/quick-worker/src/dashboard-insights-js.js";
import {MOBILE_INPUT_JS} from "../dist/apps/quick-worker/src/dashboard-mobile-input-js.js";
const db=new DatabaseSync(":memory:");
db.exec(`
CREATE TABLE quick_manual_entries(owner_id TEXT,id TEXT,account_id TEXT,amount_minor INTEGER,currency TEXT,payment_method TEXT,kind TEXT,occurred_at TEXT,merchant TEXT,bank_label TEXT,revision INTEGER,deleted_at TEXT);
CREATE TABLE quick_shortcut_expenses(owner_id TEXT,id TEXT,amount_minor INTEGER,currency TEXT,payment_method TEXT,kind TEXT,occurred_at TEXT,merchant TEXT,bank_label TEXT,revision INTEGER,deleted_at TEXT);
CREATE TABLE quick_movement_categories(owner_id TEXT,source TEXT,movement_id TEXT,category TEXT,subcategory TEXT,classification_source TEXT);
CREATE TABLE quick_auto_categories(owner_id TEXT,source TEXT,movement_id TEXT,category TEXT,subcategory TEXT,confidence REAL,needs_review INTEGER,question TEXT,classification_source TEXT);
CREATE TABLE quick_statement_credits(owner_id TEXT,id TEXT,amount_minor INTEGER,currency TEXT,occurred_at TEXT,merchant TEXT,bank_label TEXT,kind TEXT);
`);
const rows=db.prepare("INSERT INTO quick_shortcut_expenses(owner_id,id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision) VALUES(?,?,?,?,?,?,?,?,?,0)");
const ids=[
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
  "77777777-7777-4777-8777-777777777777"
];
const add=(owner,id,minor,concept,method="debit_card")=>rows.run(owner,id,minor,"COP",method,"purchase","2026-11-04T20:15:00Z",concept,"Plata Pay");
add("profile-A",ids[0],200000,"Expresso");
add("profile-A",ids[1],100000,"Chokis");
add("profile-A",ids[2],50000,"Poliñas");
add("profile-A",ids[3],3000000,"Pago de prestamo de amiga","bank_transfer");
add("profile-A",ids[4],80000,"Bre-B a tercero","bank_transfer");
add("profile-B",ids[5],99900000,"Chokis");
add("profile-A",ids[6],40000,"Compra no descrita");
db.prepare("INSERT INTO quick_movement_categories VALUES(?,?,?,?,?,?)")
 .run("profile-A","accountless",ids[0],"Alimentación","Café y bebidas","manual");
const suggestion=db.prepare("INSERT INTO quick_auto_categories VALUES(?,?,?,?,?,?,?,?,?)");
suggestion.run("profile-A","accountless",ids[1],"Alimentación","Snacks y dulces",.96,0,null,"qwen");
suggestion.run("profile-A","accountless",ids[2],"Otros","Por revisar",.2,1,"¿Qué compraste?","rules");
suggestion.run("profile-A","accountless",ids[4],"Pagos y transferencias","Transferencias",.4,1,"¿Para qué fue?","qwen");
suggestion.run("profile-A","accountless",ids[6],"Otros","Por revisar",.2,1,"Describe mejor","rules");
const fake={prepare(query){const stmt=db.prepare(query);let params=[];return {
 bind(...values){params=values;return this;},
 async all(){return {results:stmt.all(...params)};},
 async first(){return stmt.get(...params)||null;}
};}};
const overview=await (await dashboardOverview(fake,"profile-A")).json();
const list=await (await dashboardMovements(fake,"profile-A",new URL("https://test.invalid/api/quick/dashboard/movements?page=0"))).json();
assert.equal(overview.movementCount,6);
assert.equal(overview.debtPaymentsMinor,"3000000");
assert.equal(overview.pendingTransferReviewMinor,"80000");
const perCategory={};
for(const x of overview.categoryDaily){
 perCategory[x.category]=String((Number(perCategory[x.category]||0))+Number(x.minor));
}
assert.equal(perCategory["Alimentación"],"300000");
assert.equal(perCategory["Pendiente de clasificar"],"90000");
assert.ok(!perCategory.Otros);
assert.equal(overview.categoryDaily.reduce((total,x)=>total+Number(x.minor),0),
 overview.daily.reduce((total,x)=>total+Number(x.minor),0));
assert.equal(list.entries.length,6);
const byId=Object.fromEntries(list.entries.map(x=>[x.id,x]));
assert.equal(byId[ids[0]].category_status,"confirmed");
assert.equal(byId[ids[0]].subcategory,"Café y bebidas");
assert.equal(byId[ids[1]].category_status,"suggested");
assert.equal(byId[ids[1]].subcategory,"Snacks y dulces");
assert.equal(byId[ids[2]].category_status,"review");
assert.equal(byId[ids[2]].category,"Pendiente de clasificar");
assert.equal(byId[ids[4]].category_status,"review");
assert.ok(!JSON.stringify(overview).includes("99900000"));
const categoryData=await (await categoryReview(fake,"profile-A")).json();
assert.ok(!Object.hasOwn(categoryData.taxonomy,"Otros"));
assert.ok(!categoryData.taxonomy["Alimentación"].includes("Otros"));
assert.ok(categoryData.entries.some(x=>x.id===ids[2]&&x.needsReview));
await assert.rejects(
 ()=>setCategory(fake,"profile-A",{
  source:"accountless",id:ids[2],category:"Otros",subcategory:"Por revisar",confirmed:true
 }),
 /categoría y subcategoría específicas/i);
for(const script of [DASH_JS,INSIGHTS_JS,MOBILE_INPUT_JS])new Function(script);
assert.match(DASH_HTML,/category-spend-list/);
assert.match(DASH_HTML,/mobile-input\.js/);
assert.match(DASH_JS,/history-category-chip/);
assert.match(DASH_CSS,/fos-keyboard-visible/);
assert.match(DASH_CSS,/prefers-reduced-motion/);
console.log("Precise categories, monthly aggregates, privacy, pending review, and keyboard JS passed.");
