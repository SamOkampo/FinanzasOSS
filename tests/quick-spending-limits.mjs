import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {readBudgets} from "../dist/apps/quick-worker/src/spending-limits.js";

const sqlite=new DatabaseSync(":memory:");
for(const name of ["0001_quick_d1","0003_accountless_shortcut_expenses","0007_spending_limits","0008_movement_edit_soft_delete"]){
 sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+name+".sql",import.meta.url),"utf8"));
}
const db={prepare(query){let params=[];return {
  bind(...args){params=args;return this;},
  async first(){return sqlite.prepare(query).get(...params)??null;},
  async all(){return {results:sqlite.prepare(query).all(...params)};},
}}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const env={DB:db,ACCESS_AUD:"budgets-test",ALLOW_WRITES:"true"};
const owner=id=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:id};}}});
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
async function call(path,method="GET",body,identity=owner(A),opts={}){
 const response=await handleQuickRequest(new Request(base+path,{
   method,headers:method==="POST"?{"Content-Type":"application/json",
     Origin:opts.origin??base}:undefined,
   ...(method==="POST"?{body:JSON.stringify(body)}:{}),
 }),opts.env??env,identity);
 return {code:response.status,data:await response.json()};
}
// Unconfigured budgets have no fabricated default figures.
const empty=JSON.parse(await (await readBudgets(db,A,Date.parse("2026-10-17T20:00:00Z"))).text());
assert.equal(empty.periods.day.status,"unconfigured");
assert.equal(empty.periods.month.spentMinor,"0");
assert.equal(empty.periods.week.start,"2026-10-12");
assert.equal(empty.periods.day.start,"2026-10-17");
assert.equal(empty.currency,"COP");
assert.equal((await call("/api/quick/budgets","GET",null,{})).code,401);
assert.equal((await call("/api/quick/budgets","POST",{period:"day",amountCOP:"40000"},owner(A),
  {origin:"https://evil.invalid"})).code,403);
assert.equal((await call("/api/quick/budgets","POST",{period:"day",amountCOP:"40000",ownerId:B})).code,422);
for(const amount of ["0","-25","2.50","1e5","0002","1000000001",40000]){
 assert.equal((await call("/api/quick/budgets","POST",{period:"day",amountCOP:amount})).code,422);
}
assert.equal((await call("/api/quick/budgets","POST",{period:"weekly",amountCOP:"10000"})).code,422);
assert.equal((await call("/api/quick/budgets","POST",{period:"day",amountCOP:"40000"})).code,200);
assert.equal((await call("/api/quick/budgets","POST",{period:"week",amountCOP:"60000"})).code,200);
assert.equal((await call("/api/quick/budgets","POST",{period:"month",amountCOP:"105000"})).code,200);
assert.equal((await call("/api/quick/budgets","POST",{period:"year",amountCOP:"500000"})).code,200);
assert.equal((await call("/api/quick/budgets","POST",{period:"day",amountCOP:"100"} ,owner(B))).code,200);
const a=(id,when,amount,who=A)=>sqlite.prepare(
 "INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant) "+
 "VALUES(?,?,?,?,?,?,?,?,?)").run(id,who,"budget-expense-"+id,amount,"COP","cash","purchase",when,"Test ficticio");
a("budgets-today-001","2026-10-18T00:20:00Z",3000000); // Oct 17 in Bogotá
a("budgets-week--001","2026-10-13T02:00:00Z",1000000); // Monday Oct 12 in Bogotá
a("budgets-month-001","2026-10-05T14:00:00Z",5000000);
a("budgets-year--001","2026-07-01T14:00:00Z",8000000);
a("budgets-old---001","2025-10-17T14:00:00Z",9990000);
a("budgets-next--001","2026-10-18T05:10:00Z",9900000); // Oct 18 Bogotá, future
a("budgets-other-001","2026-10-17T14:00:00Z",89000000,B);
const account="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
sqlite.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency) "+
 "VALUES(?,?,?,?,?,?)").run(account,A,"budgets-account-0001","Prueba","cash","COP");
function manual(id,minor,kind,currency,when){
 // USD needs its own proper account.
 const acc=currency==="USD"?"dddddddd-dddd-4ddd-8ddd-dddddddddddd":account;
 sqlite.prepare("INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,"+
 "currency,payment_method,kind,occurred_at,merchant) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run(id,A,acc,"budget-manual-"+id,minor,currency,"cash",kind,when,"Test");
}
sqlite.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency) "+
 "VALUES(?,?,?,?,?,?)").run("dddddddd-dddd-4ddd-8ddd-dddddddddddd",A,"budgets-account-usd1","USD","cash","USD");
manual("budgets-manual-001",1200000,"purchase","COP","2026-10-17T18:30:00Z");
manual("budgets-transfer01",60000000,"transfer","COP","2026-10-17T18:30:00Z");
manual("budgets-usd----01",60000000,"purchase","USD","2026-10-17T18:30:00Z");
const asOf=Date.parse("2026-10-17T20:00:00Z");
const result=JSON.parse(await (await readBudgets(db,A,asOf)).text());
assert.equal(result.periods.day.spentMinor,"4200000");
assert.equal(result.periods.week.spentMinor,"5200000");
assert.equal(result.periods.month.spentMinor,"10200000");
assert.equal(result.periods.year.spentMinor,"18200000");
assert.equal(result.periods.day.status,"over");
assert.equal(result.periods.week.status,"near");
assert.equal(result.periods.month.status,"near");
assert.equal(result.periods.year.status,"ok");
assert.equal(result.periods.day.remainingMinor,"0");
assert.equal(result.periods.week.remainingMinor,"800000");
const other=JSON.parse(await (await readBudgets(db,B,asOf)).text());
assert.equal(other.periods.day.spentMinor,"89000000");
assert.equal(other.periods.day.limitMinor,"10000");
assert.equal((await call("/api/quick/budgets","POST",{period:"week",amountCOP:null},owner(B))).code,200);
assert.equal((await call("/api/quick/budgets","POST",{period:"day",amountCOP:null})).code,200);
assert.equal(JSON.parse(await (await readBudgets(db,A,asOf)).text()).periods.day.status,"unconfigured");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n,7);
const html=await (await handleQuickRequest(new Request(base+"/dashboard"),env,owner(A))).text();
assert.match(html,/budget-input-day/);
assert.match(html,/budget-input-week/);
assert.match(html,/budget-input-month/);
assert.match(html,/budget-input-year/);
const js=await (await handleQuickRequest(new Request(base+"/budgets.js"),env,owner(A))).text();
assert.match(js,/finanzasossBudgetWarning/);
assert.doesNotThrow(()=>new Function(js));
console.log("Budget limits: four periods, Bogota boundaries, privacy, soft alerts and reset passed");
sqlite.close();
