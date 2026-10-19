import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {sendOwnerTestPush} from "../dist/apps/quick-worker/src/push.js";
const sql=new DatabaseSync(":memory:");
for(const migration of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test"]){
 sql.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+migration+".sql",import.meta.url),"utf8"));
}
const db={prepare(query){
 let args=[];return {query, get args(){return args},bind(...v){args=v;return this;},
 async first(){return sql.prepare(query).get(...args)??null;},
 async all(){return {results:sql.prepare(query).all(...args)};}
 };
},async batch(stmts){
 const results=[];sql.exec("BEGIN");
 try{for(const stmt of stmts){const ret=sql.prepare(stmt.query).run(...stmt.args);
  results.push({meta:{changes:ret.changes}});}sql.exec("COMMIT");return results;}
 catch(e){sql.exec("ROLLBACK");throw e;}
}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const pair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
const key=await crypto.subtle.exportKey("jwk",pair.privateKey);
const pub=new Uint8Array(await crypto.subtle.exportKey("raw",pair.publicKey));
const env={DB:db,ACCESS_AUD:"test-statement",ALLOW_WRITES:"true",
 ALLOW_PUSH_SUBSCRIPTIONS:"true",ALLOW_PUSH_SEND:"false",
 VAPID_PUBLIC_KEY:Buffer.from(pub).toString("base64url"),
 VAPID_PRIVATE_JWK:JSON.stringify(key),VAPID_SUBJECT:"mailto:tests@example.invalid"};
const owner=id=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:id};}}});
async function call(path,method="GET",value=null,identity=owner(A),opts={}){
 const r=await handleQuickRequest(new Request(base+path,{method,
  ...(method==="POST"?{headers:{"Content-Type":"application/json",Origin:opts.origin??base},
   body:JSON.stringify(value)}:{})}),opts.env??env,identity);
 return {status:r.status,body:await r.json()};
}
const data={rows:[
 {fecha:"2026-10-10",detalle:"Café de prueba",importe:"15000",tipo:"debit",moneda:"COP"},
 {fecha:"2026-10-10",detalle:"Pago recibido",importe:"45000",tipo:"credit",moneda:"COP"},
 {fecha:"2026-10-11",detalle:"Transporte",importe:"22000",tipo:"debit",moneda:"COP"},
],mapping:{postedAt:"fecha",description:"detalle",amount:"importe",direction:"tipo",currency:"moneda"},
bankLabel:"Banco de prueba",paymentMethod:"debit_card"};
const preview="/api/quick/import/preview",commit="/api/quick/import/commit";
assert.equal((await call(preview,"POST",data,{})).status,401);
assert.equal((await call(preview,"POST",data,owner(A),{origin:"https://evil.example"})).status,403);
assert.equal((await call(preview,"POST",{...data,ownerId:B})).status,422);
assert.equal((await call(preview,"POST",{...data,rows:[{...data.rows[0],importe:"=SUM(1)"}]})).status,422);
// The first preview must show eligible purchases and a non-expense credit excluded.
const p=await call(preview,"POST",data);
assert.equal(p.status,200);assert.equal(p.body.ready.length,2);
assert.equal(p.body.skipped.length,1);assert.equal(p.body.stored,false);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n,0);
assert.equal((await call(commit,"POST",{...data,selectedIndices:[0,2]})).status,422);
const result=await call(commit,"POST",{...data,selectedIndices:[0,2],confirmed:true});
assert.equal(result.status,200);assert.equal(result.body.inserted,2);
assert.equal((await call(commit,"POST",{...data,selectedIndices:[0,2],confirmed:true})).body.inserted,0);
assert.equal((await call(commit,"POST",{...data,selectedIndices:[1],confirmed:true})).status,422);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n,2);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses WHERE bank_label='Banco de prueba' AND payment_method='debit_card'").get().n,2);
assert.equal((await call("/api/quick/dashboard/movements")).body.entries.length,2);
assert.equal((await call(preview,"POST",data,owner(B))).body.ready.length,2);
assert.equal((await call(preview,"POST",data)).body.possibleDuplicates.length,2);
const e="https://web.push.apple.com/"+ "a".repeat(66);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint:e,confirmed:true})).status,201);
assert.equal((await call("/api/quick/push/test","POST",{endpoint:e,confirmed:false})).status,422);
assert.equal((await call("/api/quick/push/test","POST",{endpoint:e,confirmed:true},owner(B))).status,403);
let sends=0;
const fetchPush=async(url,opts)=>{
 sends++;assert.equal(url,e);assert.equal(opts.method,"POST");
 assert.equal(opts.headers.TTL,"3600");assert.match(opts.headers.Authorization,/^vapid t=/);
 return new Response(null,{status:201});
};
const now=Date.parse("2026-10-19T02:00:00Z");
const r1=await sendOwnerTestPush(db,A,env,{endpoint:e,confirmed:true},now,fetchPush);
assert.equal(r1.status,200);
assert.equal((await r1.json()).providerAccepted,true);
assert.equal(sends,1);
const r2=await sendOwnerTestPush(db,A,env,{endpoint:e,confirmed:true},now+30000,fetchPush);
assert.equal(r2.status,429);assert.equal(sends,1);
const r3=await sendOwnerTestPush(db,A,env,{endpoint:e,confirmed:true},now+600001,fetchPush);
assert.equal(r3.status,200);assert.equal(sends,2);
assert.equal(sql.prepare("SELECT last_sent_day FROM quick_push_subscriptions").get().last_sent_day,null,
 "Testing must not use or alter the automatic reminder deduplication day");
for(const path of ["/statement-import.js","/studio.js"]){
 const js=await handleQuickRequest(new Request(base+path),env,owner(A));
 assert.equal(js.status,200);
 assert.doesNotThrow(()=>new Function(await js.text()),path);
}
const html=await (await handleQuickRequest(new Request(base+"/dashboard"),env,owner(A))).text();
assert.match(html,/import-file/);assert.match(html,/push-test/);
assert.match(html,/statement-import.js/);
console.log("CSV statement preview/confirmed D1 import, owner isolation, Push test and throttle passed");
sql.close();
