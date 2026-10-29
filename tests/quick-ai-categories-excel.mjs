import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {ruleCategory} from "../dist/apps/quick-worker/src/categorization.js";
const sql=new DatabaseSync(":memory:");
for(const file of [
 "0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test","0010_categories_ai"
])sql.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+file+".sql",import.meta.url),"utf8"));
const db={
 prepare(query){let args=[];return {query,get args(){return args},bind(...x){args=x;return this;},
 async first(){return sql.prepare(query).get(...args)??null;},
 async all(){return {results:sql.prepare(query).all(...args)};}};},
 batch:async stmts=>stmts.map(x=>({meta:{changes:sql.prepare(x.query).run(...x.args).changes}}))
};
const ownerA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",ownerB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const expenseA=crypto.randomUUID(),expenseB=crypto.randomUUID(),transferA=crypto.randomUUID();
for(const [id,owner,concept,minor,day] of [
 [expenseA,ownerA,"OpenAI ChatGPT",3000000,"2026-10-27T17:00:00Z"],
 [expenseB,ownerB,"PRIVADO SOLO B",240000,"2026-10-26T17:00:00Z"],
 [transferA,ownerA,"Bre-B · Luisa Fuentes 3111231234",450000,"2026-10-28T17:00:00Z"],
]){
 sql.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) "+
 "VALUES(?,?,?,?,'COP','bank_transfer','purchase',?,?,'Daviplata')").run(id,owner,"test-"+id,minor,day,concept);
}
let calls=0,externalContent="";
const env={DB:db,ACCESS_AUD:"test-two-users",ALLOW_WRITES:"true",
 ALLOW_AI_SUGGESTIONS:"true",AI:{async run(model,data){
  assert.equal(model,"@cf/qwen/qwen3-30b-a3b-fp8");calls++;
  externalContent=JSON.stringify(data);return {response:'{"suggestions":[{"index":0,"category":"Pagos y transferencias","subcategory":"Pagos a terceros"}]}'};}
 }};
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const ctx=owner=>({access:{aud:env.ACCESS_AUD,getIdentity:async()=>({user_uuid:owner})}});
async function call(path,method="GET",data=null,owner=ownerA,origin=base,custom=env){
 const req=new Request(base+path,{method,headers:method==="POST"?{"Content-Type":"application/json",Origin:origin}:{},
 ...(method==="POST"?{body:JSON.stringify(data)}:{})});
 return handleQuickRequest(req,custom,ctx(owner));
}
assert.deepEqual(ruleCategory("Vending Bogotá").category,"Alimentación");
assert.deepEqual(ruleCategory("Recarga tarjeta transporte").subcategory,"Recargas");
assert.deepEqual(ruleCategory("OpenAI ChatGPT").category,"Suscripciones");
assert.deepEqual(ruleCategory("Bre-B · Bancolombia").category,"Pagos y transferencias");
const categoriesA=await call("/api/quick/categories"),a=await categoriesA.json();
assert.equal(a.entries.length,2);assert.equal(calls,0,"Viewing categories never invokes AI");
assert.ok(a.entries.some(x=>x.category==="Suscripciones"&&x.subcategory==="IA y software"));
const categoriesB=await (await call("/api/quick/categories","GET",null,ownerB)).json();
assert.equal(categoriesB.entries.length,1);
assert.ok(!JSON.stringify(categoriesB).includes("ChatGPT"));
assert.ok(!JSON.stringify(a).includes("PRIVADO SOLO B"));
let response=await call("/api/quick/categories/set","POST",{source:"accountless",id:expenseB,
 category:"Ocio",subcategory:"Salidas",confirmed:true},ownerA);
assert.equal(response.status,404,"Cross-owner assignment denied");
response=await call("/api/quick/categories/set","POST",{source:"accountless",id:expenseA,
 category:"Suscripciones",subcategory:"Servicios digitales"},ownerA);
assert.equal(response.status,422,"Explicit consent required");
response=await call("/api/quick/categories/set","POST",{source:"accountless",id:expenseA,
 category:"Suscripciones",subcategory:"Servicios digitales",confirmed:true},ownerA,"https://evil.example");
assert.equal(response.status,403,"Same-origin CSRF protection");
response=await call("/api/quick/categories/set","POST",{source:"accountless",id:expenseA,
 category:"Suscripciones",subcategory:"Servicios digitales",confirmed:true},ownerA);
assert.equal(response.status,200);
let updated=await (await call("/api/quick/categories")).json();
assert.equal(updated.entries.find(x=>x.id===expenseA).subcategory,"Servicios digitales");
assert.equal(updated.entries.find(x=>x.id===expenseA).manual,true);
let ai=await call("/api/quick/ai/suggest","POST",{
 movements:[{source:"accountless",id:transferA}],confirmed:true},ownerA);
assert.equal(ai.status,200);let ans=await ai.json();
assert.equal(ans.stored,false);assert.equal(ans.suggestions[0].category,"Pagos y transferencias");
assert.equal(calls,1);
assert.ok(!externalContent.includes("Luisa Fuentes"),"Recipient must not leave the Worker");
assert.ok(!externalContent.includes("3111231234"),"Bank key must not leave Worker");
assert.ok(!externalContent.includes("450000"),"Amounts must not leave Worker");
assert.ok(!externalContent.includes(ownerA),"Owner ID must not be shared");
assert.equal(sql.prepare("SELECT COUNT(*) total FROM quick_movement_categories").get().total,1,
 "AI suggestions cannot persist without manual confirmation");
ai=await call("/api/quick/ai/suggest","POST",{
 movements:[{source:"accountless",id:expenseB}],confirmed:true},ownerA);
assert.equal(ai.status,404,"Qwen must not get other owner's movements");
assert.equal(calls,1);
assert.equal((await call("/api/quick/ai/suggest","POST",{
 movements:[{source:"accountless",id:expenseA}],confirmed:true},ownerA,base,
 {...env,ALLOW_AI_SUGGESTIONS:"false"})).status,503,"AI must be switchable off");
// Extract ZIP local entries from the real OOXML workbook.
async function zippedSheets(owner){
 const r=await call("/api/quick/export.xlsx","GET",null,owner);
 assert.equal(r.status,200);
 assert.match(r.headers.get("Content-Type"),/spreadsheetml.sheet/);
 assert.match(r.headers.get("Content-Disposition"),/\.xlsx/);
 const b=new Uint8Array(await r.arrayBuffer()),view=new DataView(b.buffer),items={};
 let pos=0;while(pos+30<b.length&&view.getUint32(pos,true)===0x04034b50){
  const size=view.getUint32(pos+18,true),nameLength=view.getUint16(pos+26,true),extra=view.getUint16(pos+28,true);
  const name=new TextDecoder().decode(b.subarray(pos+30,pos+30+nameLength));
  const start=pos+30+nameLength+extra;
  items[name]=new TextDecoder().decode(b.subarray(start,start+size));pos=start+size;
 }
 assert.ok(items["[Content_Types].xml"]);
 assert.ok(items["xl/worksheets/sheet1.xml"]);
 assert.ok(items["xl/worksheets/sheet2.xml"]);
 assert.ok(items["xl/workbook.xml"]);
 return items;
}
const exportA=await zippedSheets(ownerA),exportB=await zippedSheets(ownerB);
assert.match(exportA["xl/worksheets/sheet1.xml"],/OpenAI ChatGPT/);
assert.match(exportA["xl/worksheets/sheet1.xml"],/Servicios digitales/);
assert.doesNotMatch(JSON.stringify(exportA),/PRIVADO SOLO B/);
assert.match(exportB["xl/worksheets/sheet1.xml"],/PRIVADO SOLO B/);
assert.doesNotMatch(JSON.stringify(exportB),/OpenAI ChatGPT|Luisa Fuentes/);
assert.equal((await call("/api/quick/export.xlsx","GET",null,ownerA,base,{...env,DB:{}})).status>=500,true);
// Protect against unauthenticated and unauthorized paths.
const anonymous=await handleQuickRequest(new Request(base+"/api/quick/export.xlsx"),env,{});
assert.equal(anonymous.status,401);
const page=await (await call("/dashboard")).text();
assert.match(page,/id="categories-list"/);assert.match(page,/Exportar Excel/);
const js=await call("/insights.js");
assert.equal(js.status,200);const code=await js.text();assert.doesNotThrow(()=>new Function(code));
console.log("Qwen consent/redaction/quotas, isolated categories and valid owner-specific XLSX: OK");
sql.close();
