import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {sendDailyReminders} from "../dist/apps/quick-worker/src/push.js";

const sqlite=new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/0006_push_subscriptions.sql",import.meta.url),"utf8"));
const db={prepare(query){let args=[];return {
  bind(...values){args=values;return this;},
  async first(){return sqlite.prepare(query).get(...args)??null;},
  async all(){return {results:sqlite.prepare(query).all(...args)};},
}}};
const pair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
const jwk=await crypto.subtle.exportKey("jwk",pair.privateKey);
const publicBytes=new Uint8Array(await crypto.subtle.exportKey("raw",pair.publicKey));
const env={DB:db,ACCESS_AUD:"push-test",ALLOW_WRITES:"true",
  ALLOW_PUSH_SUBSCRIPTIONS:"true",ALLOW_PUSH_SEND:"true",
  VAPID_PUBLIC_KEY:Buffer.from(publicBytes).toString("base64url"),
  VAPID_PRIVATE_JWK:JSON.stringify(jwk),
  VAPID_SUBJECT:"mailto:tests@example.invalid"};
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const ownerA={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"};}}};
const ownerB={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"};}}};
const endpoint="https://web.push.apple.com/"+ "a".repeat(65);
async function call(path,method="GET",data=null,owner=ownerA,opts={}){
  const response=await handleQuickRequest(new Request(base+path,{
    method,headers:method==="POST" ? {"Content-Type":"application/json",
      Origin:opts.origin??base}:undefined,
    ...(method==="POST"?{body:JSON.stringify(data)}:{}),
  }),opts.env??env,owner);
  return {status:response.status,body:await response.json()};
}
assert.equal((await call("/api/quick/push/config","GET",null,{})).status,401);
assert.equal((await call("/api/quick/push/config")).body.enabled,true);
assert.equal((await call("/api/quick/push/config","GET",null,ownerA,{
  env:{...env,ALLOW_PUSH_SUBSCRIPTIONS:"false"}})).body.enabled,false);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:true},
  ownerA,{origin:"https://attacker.invalid"})).status,403);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint:"https://127.0.0.1/private",confirmed:true})).status,422);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:false})).status,422);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:true,ownerId:"b"})).status,422);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:true})).status,201);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:true})).body.replayed,true);
assert.equal((await call("/api/quick/push/unsubscribe","POST",{endpoint},ownerB)).status,200);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_push_subscriptions").get().n,1);
let dispatched=0;
const fakeFetch=async(url,init)=>{
  assert.equal(url,endpoint);
  assert.match(init.headers.Authorization,/^vapid t=[^.]+\.[^.]+\.[^.,]+, k=/);
  assert.equal(init.headers.TTL,"3600");
  dispatched++;
  return new Response(null,{status:201});
};
const time=Date.parse("2026-10-18T01:30:00Z");
const sent=await sendDailyReminders(env,time,fakeFetch);
assert.equal(sent.sent,1);
assert.equal(dispatched,1);
assert.equal(sqlite.prepare("SELECT last_sent_day FROM quick_push_subscriptions").get().last_sent_day,"2026-10-17");
assert.equal((await sendDailyReminders(env,time,fakeFetch)).sent,0);
assert.equal(dispatched,1);
assert.equal((await call("/api/quick/push/unsubscribe","POST",{endpoint})).status,200);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_push_subscriptions").get().n,0);
assert.equal((await sendDailyReminders({...env,ALLOW_PUSH_SEND:"false"},time,fakeFetch)).skipped,true);
const sw=await (await handleQuickRequest(new Request(base+"/dashboard-sw.js"),env,ownerA)).text();
assert.match(sw,/showNotification/);
assert.doesNotMatch(sw,/addEventListener\("fetch"/);
assert.doesNotThrow(()=>new Function(sw));
const html=await (await handleQuickRequest(new Request(base+"/dashboard"),env,ownerA)).text();
assert.match(html,/push-toggle/);
assert.match(html,/install-pwa/);
const client=await (await handleQuickRequest(new Request(base+"/studio.js"),env,ownerA)).text();
assert.match(client,/Notification\.requestPermission/);
assert.doesNotThrow(()=>new Function(client));
console.log("FinanzasOSS PWA: opt-in, owner isolation, invalid endpoint, push send and revoke passed");
sqlite.close();
