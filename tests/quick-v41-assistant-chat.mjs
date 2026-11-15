import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {ASSISTANT_JS} from "../dist/apps/quick-worker/src/dashboard-assistant.js";
const sql=new DatabaseSync(":memory:");
const dir=new URL("../apps/quick-worker/migrations/",import.meta.url);
for(const file of readdirSync(dir).sort())sql.exec(readFileSync(new URL(file,dir),"utf8"));
const DB={
 prepare(query){let args=[];return {query,get args(){return args;},bind(...values){args=values;return this;},
   async first(){return sql.prepare(query).get(...args)??null;},async all(){return {results:sql.prepare(query).all(...args)};}};},
 async batch(statements){
  sql.exec("BEGIN");
  try{const result=statements.map(s=>({meta:{changes:sql.prepare(s.query).run(...s.args).changes}}));sql.exec("COMMIT");return result;}
  catch(error){sql.exec("ROLLBACK");throw error;}
 },
};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let aiCount=0;
const env={DB,ACCESS_AUD:"chat-test",ALLOW_WRITES:"true",ALLOW_V41_ASSISTANT:"true",ALLOW_V41_ASSISTANT_CHAT:"true",
 ALLOW_V41_ASSISTANT_AI:"true",AI:{async run(_model,input){aiCount++;assert.doesNotMatch(JSON.stringify(input),/123456789|person@example\.com|9200000/);
   return {response:{topic:"spending",text:"<script>anything</script>"}};}}};
const date="2026-10-01";
const rid=crypto.randomUUID();
function expense(owner,id,amount,merchant,at){
 sql.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) "+
  "VALUES(?,?,?,?,'COP','debit_card','purchase',?,?,'Banco ficticio')").run(id,owner,"seed-"+id,amount,at,merchant);
}
expense(A,crypto.randomUUID(),700000,"Café ficticio",date+"T05:01:00Z");
expense(A,crypto.randomUUID(),290000,"Farmacia ficticia",date+"T04:59:00Z");
expense(B,crypto.randomUUID(),9200000,"Café privado de B",date+"T06:00:00Z");
sql.prepare("INSERT INTO quick_hapi_portfolio_snapshots(id,owner_id,as_of,cash_minor,positions_json) VALUES(?,?,?,?,?)")
 .run(crypto.randomUUID(),A,"2026-10-01",12345,'[]');
function ctx(owner){return owner?{access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}}:{};}
async function call(path,body,owner=A,origin="https://qa.example",config=env){
 const r=await handleQuickRequest(new Request("https://qa.example/api/quick/v41/agent/"+path,body?
   {method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(body)}:undefined),config,ctx(owner));
 assert.match(r.headers.get("Cache-Control"),/no-store/);
 return {status:r.status,data:await r.json()};
}
const ask={id:rid,turnId:crypto.randomUUID(),question:"¿Cuánto gasté por categoría en 2026-10?"};
assert.equal((await call("chat",null,null)).status,401);
assert.equal((await call("chat",null,A,undefined,{...env,ALLOW_V41_ASSISTANT_CHAT:"false"})).status,503);
assert.equal((await call("chat",ask,A,"https://other.example")).status,403);
const spending=await call("chat",ask);
assert.equal(spending.status,200);
assert.equal(spending.data.turn.answer.totalMinor,"700000");
assert.equal(spending.data.turn.answer.points[0].label,"Alimentación");
assert.equal(spending.data.turn.answer.month,"2026-10");
assert.equal((await call("chat",{id:rid,turnId:crypto.randomUUID(),question:"¿Y ese mes?"})).data.turn.answer.totalMinor,"700000");
assert.equal(aiCount,0);
assert.deepEqual(await call("chat",ask),spending);
assert.equal((await call("chat",{...ask,question:"Otra pregunta"})).status,409);
assert.equal((await call("chat?id="+rid,null,B)).status,404);
assert.equal((await call("chat",null,B)).data.items.length,0);
const model=await call("chat",{id:rid,turnId:crypto.randomUUID(),question:"Revisa referencia 123456789 person@example.com",allowAI:true});
assert.equal(aiCount,1);assert.equal(model.status,200);
assert.doesNotMatch(JSON.stringify(model.data.turn.answer),/<script>/);
const hapi=await call("chat",{id:rid,turnId:crypto.randomUUID(),question:"¿Cómo va mi portafolio en Hapi?"});
assert.equal(hapi.data.turn.answer.totalMinor,"12345");
assert.equal(hapi.data.turn.answer.points.length,1);
sql.prepare("INSERT INTO quick_hapi_deposits(id,owner_id,request_key,bank_label,debited_on,cop_minor,credited_on,usd_minor,broker_ref) "+
 "VALUES(?,?,?,?,?,?,?,?,?)").run(crypto.randomUUID(),A,"hapi-reference-a","Plata Pay","2026-10-01",42000000,"2026-10-02",10000,"receipt-a");
const deposits=await call("chat",{id:rid,turnId:crypto.randomUUID(),question:"¿Llegó mi depósito desde Plata Pay a Hapi?"});
assert.equal(deposits.data.turn.answer.totalMinor,"10000");
assert.equal(deposits.data.turn.answer.points[0].label,"Plata Pay");
assert.match((await call("chat",{id:rid,turnId:crypto.randomUUID(),question:"¿Llegó mi depósito desde Otro Banco a Hapi?"})).data.turn.answer.text,/No encontré aportes/);
const activity=sql.prepare("INSERT INTO quick_hapi_activity(owner_id,id,occurred_on,kind,description,amount_minor,symbol,created_at) VALUES(?,?,?,?,?,?,?,?)");
for(const [owner,day,kind,minor,symbol] of [
 [A,"2026-10-02","buy",4600,"VT"],[A,"2026-10-03","reinvestment",300,"VT"],
 [A,"2026-10-04","buy",1200,"SCHD"],[A,"2026-10-05","dividend",300,"VT"],
 [A,"2026-10-06","sell",500,"VT"],[A,"2026-09-30","buy",800,"VT"],[B,"2026-10-05","buy",9200000,"VT"],
])activity.run(owner,crypto.randomUUID().replace(/-/g,"").repeat(2),day,kind,"Actividad ficticia",minor,symbol,day+"T12:00:00Z");
const purchaseQuestion={id:rid,turnId:crypto.randomUUID(),question:"¿Qué compré en Hapi en 2026-10?"};
const purchases=(await call("chat",purchaseQuestion)).data.turn.answer;
assert.equal(purchases.target,"/dashboard#portfolio");
assert.equal(purchases.totalMinor,"6100");
assert.deepEqual(purchases.points,[{label:"VT",minor:"4900"},{label:"SCHD",minor:"1200"}]);
assert.equal((await call("chat",{...purchaseQuestion,turnId:crypto.randomUUID(),question:"¿Y en 2026-09?"})).data.turn.answer.totalMinor,"800");
assert.equal((await call("chat",purchaseQuestion,B)).data.turn.answer.totalMinor,"9200000");
assert.equal(aiCount,1,"Hapi activity queries do not use model inference");
const portfolio=async()=>await (await handleQuickRequest(new Request("https://qa.example/api/quick/v41/hapi/portfolio"),
  {...env,ALLOW_V41_HAPI:"true"},ctx(A))).json();
assert.equal((await portfolio()).creditedAtLatestCutMinor,null,"Deposit credited after the report is excluded");
sql.prepare("UPDATE quick_hapi_portfolio_snapshots SET as_of=? WHERE owner_id=?").run("2026-10-02",A);
assert.equal((await portfolio()).creditedAtLatestCutMinor,"10000");
assert.equal((await portfolio()).latest.totalMinor,"12345","Comparison never changes the value of the portfolio");
assert.equal((await call("chat?id="+rid)).data.turns.length,8);
assert.equal((await call("chat/delete",{id:rid,confirmed:true},B)).status,200);
assert.equal((await call("chat?id="+rid)).status,200);
assert.equal((await call("chat/delete",{id:rid,confirmed:false})).status,422);
assert.equal((await call("chat/delete",{id:rid,confirmed:true})).status,200);
assert.equal((await call("chat?id="+rid)).status,404);
assert.equal(sql.prepare("SELECT count(*) n FROM quick_shortcut_expenses").get().n,3);
new Function(ASSISTANT_JS);
console.log("Qwen conversations: Colombian month, exact chart totals, model input minimized, idempotent history and profile isolation PASSED");
