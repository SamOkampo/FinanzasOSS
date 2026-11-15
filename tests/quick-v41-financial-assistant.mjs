import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import worker,{handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {ASSISTANT_DAILY_CRON,sendAssistantDigest} from "../dist/apps/quick-worker/src/financial-assistant.js";
import {ASSISTANT_JS} from "../dist/apps/quick-worker/src/dashboard-assistant.js";

const sql=new DatabaseSync(":memory:");
const migrations=new URL("../apps/quick-worker/migrations/",import.meta.url);
for(const f of readdirSync(migrations).sort())sql.exec(readFileSync(new URL(f,migrations),"utf8"));
const DB={
  prepare(query){let values=[];return {
    query,get params(){return values;},bind(...params){values=params;return this;},
    async first(){return sql.prepare(query).get(...values)??null;},
    async all(){return {results:sql.prepare(query).all(...values)};},
  };},
  async batch(statements){
    sql.exec("BEGIN");
    try{
      const output=statements.map(s=>({meta:{changes:sql.prepare(s.query).run(...s.params).changes}}));
      sql.exec("COMMIT");return output;
    }catch(e){sql.exec("ROLLBACK");throw e;}
  },
};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ids=["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333","v41_"+"a".repeat(64)];
function seed(owner,id,merchant){
  sql.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) "+
   "VALUES(?,?,?,?,?,'debit_card','purchase','2026-10-02T17:00:00Z',?,'Banco Ficticio')")
    .run(id,owner,"seed-qa-"+id,150000,"COP",merchant);
}
seed(A,ids[0],"Wompi SAS");seed(B,ids[1],"Perfil B");seed(A,ids[2],"Cafetería Demo");seed(A,ids[3],"Extracto Demo");
const original=sql.prepare("SELECT * FROM quick_shortcut_expenses ORDER BY id").all();
let calls=0;
const env={DB,ACCESS_AUD:"agent-qa",ALLOW_WRITES:"true",ALLOW_V41_ASSISTANT:"true",ALLOW_V41_ASSISTANT_AI:"true",
  ALLOW_PUSH_SEND:"false",ALLOW_CATEGORY_PUSH_SEND:"true",ALLOW_PUSH_SUBSCRIPTIONS:"true",
  VAPID_PUBLIC_KEY:"a".repeat(87),VAPID_PRIVATE_JWK:"test-signing-key",VAPID_SUBJECT:"mailto:qa@example.com",
  AI:{async run(model,input){calls++;assert.doesNotMatch(JSON.stringify(input),/123456789|secret@example\.com/);
    return {response:{category:"Alimentación",subcategory:"Onces"}};}},
};
async function request(path,data,owner=A,origin="https://qa.example"){
  const init=data?{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(data)}:undefined;
  const ctx=owner?{access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}}:{};
  const response=await handleQuickRequest(new Request("https://qa.example/api/quick/v41/agent/"+path,init),env,ctx);
  return {status:response.status,body:await response.json()};
}
const answer=(id,data,owner=A)=>request("answer",{source:"accountless",id,...data},owner);
const confirm=(id,data)=>request("confirm",{source:"accountless",id,confirmed:true,rememberMerchant:false,...data});
assert.equal((await request("inbox",null,null)).status,401);
assert.equal((await request("inbox")).body.pushConfigured,true);
assert.equal((await request("inbox")).body.noticeSchedule,"20:00");
assert.equal((await request("answer",{answer:"food"},A,"https://wrong.example")).status,403);
assert.deepEqual((await request("inbox")).body.items.map(x=>x.id).sort(),[ids[0],ids[2],ids[3]].sort());
assert.equal((await answer(ids[0],{answer:"food"},B)).status,404);
let proposal=(await answer(ids[0],{answer:"food"})).body;
assert.equal(proposal.category,"Alimentación");
assert.equal(proposal.subcategory,null);
assert.equal(proposal.options.length,8);
assert.equal(calls,0);
assert.equal((await confirm(ids[0],{token:proposal.token})).status,409);
assert.equal(sql.prepare("SELECT count(*) n FROM quick_movement_categories").get().n,0);
proposal=(await answer(ids[0],{category:"Alimentación",subcategory:"Onces"})).body;
const result=(await confirm(ids[0],{token:proposal.token,rememberMerchant:true})).body;
assert.equal(result.saved,true);
assert.equal(result.learningBlocked,true);
assert.equal((await confirm(ids[0],{token:proposal.token})).body.replayed,true);
assert.equal(sql.prepare("SELECT count(*) n FROM quick_category_preferences").get().n,0);
assert.equal(sql.prepare("SELECT answer_alias FROM quick_agent_category_drafts WHERE movement_id=?").get(ids[0]).answer_alias,"food");
assert.equal((await answer(ids[2],{answer:"Fue un refrigerio"})).status,422);
proposal=(await answer(ids[2],{answer:"Refrigerio 123456789 secret@example.com",allowAI:true})).body;
assert.equal(calls,1);
assert.equal(proposal.subcategory,"Onces");
assert.equal((await confirm(ids[2],{token:proposal.token,rememberMerchant:true})).body.learned,true);
assert.equal(sql.prepare("SELECT merchant_key FROM quick_category_preferences WHERE owner_id=?").get(A).merchant_key,"cafeteria demo");
assert.equal(sql.prepare("SELECT count(*) n FROM quick_category_preferences WHERE owner_id=?").get(B).n,0);
proposal=(await answer(ids[3],{category:"Compras",subcategory:"Hogar"})).body;
sql.prepare("UPDATE quick_shortcut_expenses SET revision=revision+1 WHERE id=?").run(ids[3]);
assert.equal((await confirm(ids[3],{token:proposal.token})).status,409);
sql.prepare("UPDATE quick_shortcut_expenses SET revision=revision-1 WHERE id=?").run(ids[3]);
assert.deepEqual(sql.prepare("SELECT * FROM quick_shortcut_expenses ORDER BY id").all(),original);
assert.equal((await request("preferences",{enabled:true})).status,422);
assert.equal((await request("preferences",{enabled:true,confirmed:true})).status,200);
sql.prepare("INSERT INTO quick_push_subscriptions(owner_id,endpoint_hash,endpoint,created_at) VALUES(?,?,?,?)")
  .run(A,"b".repeat(43),"https://push.example/fictitious/endpoint-for-test-only","2026-11-01T12:00:00Z");
const delivered=[];
const dispatch=async(_,owner)=>{delivered.push(owner);return {accepted:1,configured:true};};
await sendAssistantDigest(env,Date.parse("2026-11-10T01:30:00Z"),dispatch);
await sendAssistantDigest(env,Date.parse("2026-11-10T01:30:00Z"),dispatch);
await sendAssistantDigest(env,Date.parse("2026-11-11T01:30:00Z"),dispatch);
assert.deepEqual(delivered,[A],"No repeat on the same day or with the same unresolved set");
await sendAssistantDigest({...env,ALLOW_CATEGORY_PUSH_SEND:"false"},Date.parse("2026-11-12T01:00:00Z"),dispatch);
assert.deepEqual(delivered,[A]);
assert.equal(sql.prepare("SELECT last_day FROM quick_agent_notice_settings WHERE owner_id=?").get(A).last_day,"2026-11-10");
await worker.scheduled({cron:ASSISTANT_DAILY_CRON,scheduledTime:Date.parse("2026-11-12T01:00:00Z")},env);
assert.equal(sql.prepare("SELECT last_day FROM quick_agent_notice_settings WHERE owner_id=?").get(A).last_day,"2026-11-11");
const session={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:A};}}};
const serviceWorker=new Request("https://qa.example/dashboard-sw.js");
const script=await (await handleQuickRequest(serviceWorker,env,session)).text();
assert.match(script,/data:\{url:"\/dashboard#qwen"\}/);
const fallback=await (await handleQuickRequest(serviceWorker,{...env,ALLOW_V41_ASSISTANT:"false"},session)).text();
assert.match(fallback,/data:\{url:"\/dashboard#plan"\}/);

const creditAccount="44444444-4444-4444-8444-444444444444",balanceAccount="55555555-5555-4555-8555-555555555555";
const insertAccount=sql.prepare("INSERT INTO quick_balance_accounts(id,owner_id,bank_label,account_type) VALUES(?,?,?,?)");
insertAccount.run(creditAccount,A,"Tarjeta de prueba","credit");
insertAccount.run(balanceAccount,A,"Banco conciliado","deposit");
const putSnapshot=sql.prepare("INSERT INTO quick_balance_snapshots(id,owner_id,account_id,request_key,amount_minor,as_of) VALUES(?,?,?,?,?,?)");
putSnapshot.run("snapshot-test-1",A,balanceAccount,"first-test-snapshot",500000,"2026-10-02T12:00:00Z");
putSnapshot.run("snapshot-test-2",A,balanceAccount,"second-test-snapshot",600000,"2026-10-03T12:00:00Z");
sql.prepare("INSERT INTO quick_hapi_deposits(id,owner_id,request_key,bank_label,debited_on,cop_minor) VALUES(?,?,?,?,?,?)")
  .run("hapi-test-alert",A,"deposit-key","Banco ficticio","2026-10-01",42000000);
const due={account:creditAccount,dueOn:"2026-11-12",paid:false,confirmed:true};
assert.equal((await request("credit-due",due,B)).status,404);
assert.equal((await request("credit-due",{...due,dueOn:"2026-02-31"})).status,422);
assert.equal((await request("credit-due",due)).status,200);
let alerts=(await request("inbox")).body.alerts;
assert.ok(alerts.some(a=>a.rule==="unreconciled_balance"));
assert.ok(alerts.some(a=>a.rule==="hapi_deposit_pending"));
assert.ok(alerts.some(a=>a.rule==="credit_payment_due"));
assert.equal((await request("inbox",null,B)).body.alerts.length,0);
assert.equal((await request("snooze",{key:"hapi:hapi-test-alert"},B)).status,404);
assert.equal((await request("snooze",{key:"hapi:hapi-test-alert"})).status,200);
assert.ok(!(await request("inbox")).body.alerts.some(a=>a.rule==="hapi_deposit_pending"));
await request("credit-due",{...due,paid:true});
assert.ok(!(await request("inbox")).body.alerts.some(a=>a.rule==="credit_payment_due"));
await request("preferences",{enabled:true,confirmed:true,rules:{hapi_deposit_pending:false}});
assert.equal((await request("inbox")).body.rules.hapi_deposit_pending,false);
await sendAssistantDigest(env,Date.parse("2026-11-20T01:00:00Z"),dispatch);
await sendAssistantDigest(env,Date.parse("2026-11-21T01:00:00Z"),dispatch);
assert.deepEqual(delivered,[A,A],"The new balance alert is sent once and disabled Hapi alerts do not push");
assert.equal(sql.prepare("SELECT count(*) AS n FROM quick_agent_alert_state WHERE notified_at IS NOT NULL").get().n,1);
new Function(ASSISTANT_JS);
console.log("v41 financial assistant: persisted drafts, explicit confirmation, tenant isolation, exact merchant learning and daily digest PASSED");
