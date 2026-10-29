import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleQuickRequest } from "../dist/apps/quick-worker/src/index.js";
import { sendOwnerCategoryQuestion } from "../dist/apps/quick-worker/src/push.js";
import { runScheduledCategoryBackfill } from "../dist/apps/quick-worker/src/category-automation.js";

const sqlite=new DatabaseSync(":memory:");
for(const file of [
 "0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test","0010_categories_ai",
 "0011_category_auto_questions",
])sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+file+".sql",import.meta.url),"utf8"));
const db={prepare(query){
 let params=[];
 return {bind(...args){params=args;return this;},
   async first(){return sqlite.prepare(query).get(...params)??null;},
   async all(){return {results:sqlite.prepare(query).all(...params)};}};
}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
let aiCalls=0,aiText="";
const env={DB:db,ACCESS_AUD:"test-category-auto",ALLOW_WRITES:"true",ALLOW_AI_SUGGESTIONS:"true",
 ALLOW_PUSH_SEND:"false",AI:{async run(model,input){
   assert.equal(model,"@cf/qwen/qwen3-30b-a3b-fp8");
   aiCalls++;aiText=JSON.stringify(input);
   const parsed=JSON.parse(input.messages[1].content);
   if(parsed.clarification){
     assert.ok(!parsed.clarification.includes("12345"),"Qwen must not see long numbers from answers");
     return {response:JSON.stringify({category:"Alimentación",subcategory:"Restaurantes",confidence:0.95})};
   }
   return {response:JSON.stringify({suggestions:parsed.movements.map((m,i)=>({
      index:i,category:"Alimentación",subcategory:"Restaurantes",
      confidence:m.concept.includes("AMBIGUA")?0.41:0.96,question:"¿Qué fue esta compra?"
   }))})};
 }}};
const principal=owner=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}});
async function call(path,method="GET",payload=null,owner=A,customEnv=env){
 const request=new Request(base+path,{method,
   ...(method==="POST"?{headers:{"Content-Type":"application/json",Origin:base},
    body:JSON.stringify(payload)}:{})});
 const response=await handleQuickRequest(request,customEnv,principal(owner));
 return {status:response.status,data:await response.json()};
}
function save(owner,merchant,kind="purchase"){
 const id=crypto.randomUUID();
 sqlite.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) "+
   "VALUES(?,?,?,25000,'COP','cash',?,'2026-10-28T11:30:00.000Z',?,NULL)")
   .run(id,owner,"synthetic-"+id,kind,merchant);
 return id;
}
const first=save(A,"AMBIGUA tienda de prueba");
assert.equal((await call("/api/quick/categories/automation/status")).data.enabled,false);
assert.equal((await call("/api/quick/categories/automation/setting","POST",
 {enabled:true,confirmed:false})).status,422);
assert.equal((await call("/api/quick/categories/automation/setting","POST",
 {enabled:true,confirmed:true,ownerId:B})).status,422);
const ruleOnly=await call("/api/quick/categories/automation/run","POST",{});
assert.equal(ruleOnly.status,200);
assert.equal(ruleOnly.data.processed,1);
assert.equal(aiCalls,0,"Qwen never runs without owner consent");
const savedRule=sqlite.prepare("SELECT needs_review FROM quick_auto_categories WHERE movement_id=?").get(first);
assert.equal(savedRule.needs_review,1);

assert.equal((await call("/api/quick/categories/automation/setting","POST",
 {enabled:true,confirmed:true})).data.enabled,true);
assert.equal((await call("/api/quick/categories/automation/status","GET",null,B)).data.enabled,false);
const ambiguous=save(A,"AMBIGUA comercio sin detalle");
const certain=save(A,"Comida de prueba");
const otherTenant=save(B,"AMBIGUA comercio sin detalle");
const classified=await call("/api/quick/categories/automation/run","POST",{});
assert.equal(classified.status,200);
assert.equal(classified.data.processed,2);
assert.equal(classified.data.aiUsed,true);
assert.equal(aiCalls,1);
assert.ok(!aiText.includes(A) && !aiText.includes(B));
assert.ok(!aiText.includes("25000"));
assert.ok(!aiText.includes("bank_label"));
const uncertain=sqlite.prepare("SELECT * FROM quick_auto_categories WHERE movement_id=?").get(ambiguous);
const confident=sqlite.prepare("SELECT * FROM quick_auto_categories WHERE movement_id=?").get(certain);
assert.equal(uncertain.needs_review,1);
assert.match(uncertain.question,/Qué fue/);
assert.equal(confident.needs_review,0);
assert.equal(confident.classification_source,"qwen");
const listing=(await call("/api/quick/categories")).data;
assert.equal(listing.entries.find(x=>x.id===ambiguous).needsReview,true);
assert.equal(listing.entries.find(x=>x.id===certain).category,"Alimentación");
assert.ok(!JSON.stringify(listing).includes(otherTenant));
const denied=await call("/api/quick/categories/set","POST",
 {source:"accountless",id:ambiguous,category:"Compras",subcategory:"Tecnología",confirmed:true,
 rememberMerchant:true},B);
assert.equal(denied.status,404);
const corrected=await call("/api/quick/categories/set","POST",
 {source:"accountless",id:ambiguous,category:"Compras",subcategory:"Tecnología",confirmed:true,
 rememberMerchant:true});
assert.equal(corrected.status,200);
assert.equal((await call("/api/quick/categories")).data.entries.find(x=>x.id===ambiguous).needsReview,false);
const fresh=save(A,"AMBIGUA comercio sin detalle");
const reused=await call("/api/quick/categories/automation/run","POST",{});
assert.equal(reused.status,200);
assert.equal(reused.data.processed,1);
assert.equal(aiCalls,1,"learned merchant needs no additional Qwen request");
assert.equal(sqlite.prepare("SELECT category,classification_source FROM quick_auto_categories WHERE movement_id=?")
  .get(fresh).classification_source,"learned");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_category_preferences WHERE owner_id=?")
 .get(B).n,0,"learning remains tenant-scoped");
const manual=(await call("/api/quick/categories")).data.entries.find(x=>x.id===ambiguous);
assert.equal(manual.category,"Compras");
assert.equal(manual.subcategory,"Tecnología");

// Existing daily Worker cron must advance opted-in historical batches only.
for(let i=0;i<17;i++)save(A,"Revisión automática comercio "+i);
const beforeCron=aiCalls;
const firstCron=await runScheduledCategoryBackfill(env);
assert.equal(firstCron.owners,1);
assert.equal(firstCron.processed,8);
assert.equal(aiCalls,beforeCron+1);
assert.ok((await call("/api/quick/categories/automation/status")).data.remaining>=9);
assert.equal((await runScheduledCategoryBackfill({...env,ALLOW_AI_SUGGESTIONS:"false"})).processed,0);
const browser=await call("/api/quick/studio/expense","POST",{
 clientEntryId:"auto-browser-synthetic-000001",amount:"12000",concept:"Comercio QR sin descripción",
 paymentMethod:"cash",bankLabel:null,confirmed:true
});
assert.equal(browser.status,201);
assert.equal(browser.data.replayed,false);
assert.ok(sqlite.prepare("SELECT movement_id FROM quick_auto_categories WHERE movement_id=?")
 .get(browser.data.entryId),"A newly created Studio movement should be categorized immediately");

// Qwen should accept plain-language explanations as answers to push questions.
const explained=save(A,"AMBIGUA café sin detalle");
const pending=await call("/api/quick/categories/automation/run","POST",{});
assert.equal(pending.status,200);
const answered=await call("/api/quick/categories/answer","POST",{
 source:"accountless",id:explained,answer:"fue un almuerzo con amigos 12345",
 confirmed:true,rememberMerchant:true,
});
assert.equal(answered.status,200);
assert.equal(answered.data.resolved,true);
assert.equal(answered.data.category,"Alimentación");
assert.equal(sqlite.prepare("SELECT needs_review FROM quick_auto_categories WHERE movement_id=?").get(explained).needs_review,0);
assert.equal((await call("/api/quick/categories/answer","POST",{
 source:"accountless",id:explained,answer:"otra explicación",confirmed:true
},B)).status,403);
assert.equal((await call("/api/quick/categories/answer","POST",{
 source:"accountless",id:explained,answer:"otra explicación",confirmed:false
})).status,422);

const pair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
const key=await crypto.subtle.exportKey("jwk",pair.privateKey);
const publicBytes=new Uint8Array(await crypto.subtle.exportKey("raw",pair.publicKey));
const pushEnv={...env,ALLOW_PUSH_SUBSCRIPTIONS:"true",ALLOW_CATEGORY_PUSH_SEND:"true",ALLOW_PUSH_SEND:"false",
 VAPID_PUBLIC_KEY:Buffer.from(publicBytes).toString("base64url"),
 VAPID_PRIVATE_JWK:JSON.stringify(key),VAPID_SUBJECT:"mailto:tests@example.invalid"};
const endpoint="https://web.push.apple.com/"+ "a".repeat(60);
const registered=await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:true},A,pushEnv);
assert.equal(registered.status,201);
let pushes=0;
const push=await sendOwnerCategoryQuestion(db,A,pushEnv,Date.now(),async (url,options)=>{
 pushes++;
 assert.equal(url,endpoint);assert.equal(options.method,"POST");
 return new Response("",{status:201});
});
assert.equal(push.accepted,1);
assert.equal(pushes,1);
assert.equal((await sendOwnerCategoryQuestion(db,B,pushEnv,Date.now(),async()=>{throw Error("leak") })).accepted,0);
sqlite.close();
console.log("FinanzasOSS Studio: auto Qwen, human feedback, merchant memory, owner isolation, safe push PASSED");
