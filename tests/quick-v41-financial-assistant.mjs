import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import worker,{handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {ASSISTANT_DAILY_CRON,ASSISTANT_HOURLY_CRON,sendAssistantDigest} from "../dist/apps/quick-worker/src/financial-assistant.js";
import {runCategoryAutomation} from "../dist/apps/quick-worker/src/category-automation.js";
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
const env={DB,ALLOW_V41_CONFIRM_WRITES:"true",ALLOW_V41_REVIEW_DRAFTS:"true",ALLOW_V41_TRANSFER_LINKS:"true",ACCESS_AUD:"agent-qa",ALLOW_WRITES:"true",ALLOW_V41_ASSISTANT:"true",ALLOW_V41_ASSISTANT_AI:"true",
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
const [merchant]=(await request("merchants")).body.items;
assert.equal(merchant.merchant,"cafeteria demo");
assert.equal((await request("merchants",null,B)).body.items.length,0);
assert.equal((await request("merchants",null,null)).status,401);
const forget={merchant:merchant.merchant,updatedAt:merchant.updatedAt,confirmed:true};
assert.equal((await request("merchants/forget",forget,B)).body.removed,false);
assert.equal((await request("merchants/forget",{...forget,updatedAt:"old"})).status,409);
assert.equal((await request("merchants/forget",{...forget,confirmed:false})).status,422);
assert.equal((await request("merchants/forget",forget,A,"https://wrong.example")).status,403);
const before=sql.prepare("SELECT * FROM quick_movement_categories WHERE movement_id=?").get(ids[2]);
assert.equal((await request("merchants/forget",forget)).body.removed,true);
assert.equal((await request("merchants/forget",forget)).body.removed,false);
assert.equal((await request("merchants")).body.items.length,0);
assert.deepEqual(sql.prepare("SELECT * FROM quick_movement_categories WHERE movement_id=?").get(ids[2]),before);
const futureId="22222222-1111-4111-8111-222222222222";
seed(A,futureId,"CAFETERÍA DEMO");
await runCategoryAutomation(DB,A,env,{source:"accountless",id:futureId});
assert.notEqual(sql.prepare("SELECT classification_source FROM quick_auto_categories WHERE movement_id=?").get(futureId).classification_source,"learned");
sql.prepare("DELETE FROM quick_auto_categories WHERE movement_id=?").run(futureId);
sql.prepare("DELETE FROM quick_shortcut_expenses WHERE id=?").run(futureId);
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
assert.match(script,/data:\{url:"\/dashboard#qwen-pending"\}/);
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
const draftInput={bankLabel:"Banco Ficticio",paymentMethod:"debit_card",
  mapping:{postedAt:"Fecha",description:"Concepto",amount:"Importe",direction:"Tipo"},
  rows:[{Fecha:"2026-10-02",Concepto:"Wompi SAS",Importe:"1500",Tipo:"debit"}]};
async function reconcile(path,data,owner=A){
 const ctx={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}};
 const response=await handleQuickRequest(new Request("https://qa.example/api/quick/v41/reconcile/"+path,
   {method:"POST",headers:{Origin:"https://qa.example","Content-Type":"application/json"},body:JSON.stringify(data)}),env,ctx);
 return {status:response.status,body:await response.json()};
}
const draft=await reconcile("draft",draftInput);
assert.equal(draft.status,200);
assert.ok((await request("inbox")).body.alerts.some(a=>a.rule==="possible_duplicate"&&a.targetId===draft.body.id));
assert.ok(!(await request("inbox",null,B)).body.alerts.some(a=>a.targetId===draft.body.id));
await request("preferences",{enabled:true,confirmed:true,rules:{possible_duplicate:false}});
assert.ok((await request("inbox")).body.alerts.some(a=>a.rule==="possible_duplicate"),"Push settings do not hide inbox items");
const transferId="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const destination="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeef";
const insertTransfer=sql.prepare("INSERT INTO quick_statement_review_decisions(id,owner_id,row_key,row_hash,review_digest,bank_label,"+
  "payment_method,direction,occurred_on,amount_minor,description,action,counterparty_label) "+
  "VALUES(?,?,?,?,?,?,'bank_transfer',?,'2026-10-01',100000,'Prueba','own_transfer',?)");
insertTransfer.run(transferId,A,transferId,"test-hash","0".repeat(64),"Banco Uno","debit","Banco Dos");
assert.ok((await request("inbox")).body.alerts.some(a=>a.rule==="unmatched_internal_transfer"&&a.targetId===transferId));
insertTransfer.run(destination,A,destination,"test-hash","0".repeat(64),"Banco Dos","credit","Banco Uno");
assert.equal((await reconcile("links",{debitId:transferId,creditId:destination,confirmed:true})).status,201);
assert.ok(!(await request("inbox")).body.alerts.some(a=>a.rule==="unmatched_internal_transfer"));
await reconcile("draft/discard",{id:draft.body.id,confirmed:true});
assert.ok(!(await request("inbox")).body.alerts.some(a=>a.targetId===draft.body.id));
const hours={digestHour:23,quietStart:22,quietEnd:7};
const schedule={enabled:true,confirmed:true,hours,rules:{hapi_deposit_pending:true,unreconciled_balance:false}};
assert.equal((await request("preferences",{...schedule,hours:{...hours,quietEnd:22}})).status,422);
assert.equal((await request("preferences",{...schedule,hours:{...hours,digestHour:24}})).status,422);
assert.equal((await request("preferences",schedule)).status,200);
assert.equal((await request("inbox")).body.noticeSchedule,"07:00");
assert.deepEqual((await request("inbox")).body.noticeHours,hours);
assert.equal((await request("inbox",null,B)).body.noticeSchedule,"20:00");
await worker.scheduled({cron:ASSISTANT_HOURLY_CRON,scheduledTime:Date.parse("2026-11-23T04:00:00Z")},env);
assert.equal(sql.prepare("SELECT last_day FROM quick_agent_notice_settings WHERE owner_id=?").get(A).last_day,"2026-11-20");
await sendAssistantDigest(env,Date.parse("2026-11-23T12:00:00Z"),dispatch);
await sendAssistantDigest(env,Date.parse("2026-11-23T12:00:00Z"),dispatch);
assert.deepEqual(delivered,[A,A,A],"The deferred 07:00 Bogotá digest sends once");
assert.equal((await request("preferences",{...schedule,enabled:false,hours:{digestHour:8,quietStart:null,quietEnd:null}})).status,200);
assert.equal((await request("inbox")).body.noticeSchedule,"08:00");
await sendAssistantDigest(env,Date.parse("2026-11-24T13:00:00Z"),dispatch);
assert.deepEqual(delivered,[A,A,A],"Opt-out stops scheduled push");
new Function(ASSISTANT_JS);
console.log("v41 financial assistant: owner-only merchant revocation, exact learning, digest hours, silence, opt-out and isolation PASSED");
