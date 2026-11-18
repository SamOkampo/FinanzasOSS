import assert from "node:assert/strict";
import {createDecipheriv,createECDH,hkdfSync,randomBytes} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {sendDailyReminders} from "../dist/apps/quick-worker/src/push.js";

const sqlite=new DatabaseSync(":memory:");
for(const migration of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
  "0006_push_subscriptions","0008_movement_edit_soft_delete","0009_push_test","0012_statement_credits",
  "0013_income_capture","0027_movement_push_keys"]){
  sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+migration+".sql",import.meta.url),"utf8"));
}
const db={prepare(query){let args=[];return {
  bind(...values){args=values;return this;},
  async first(){return sqlite.prepare(query).get(...args)??null;},
  async all(){return {results:sqlite.prepare(query).all(...args)};},
}}};
const pair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
const jwk=await crypto.subtle.exportKey("jwk",pair.privateKey);
const publicBytes=new Uint8Array(await crypto.subtle.exportKey("raw",pair.publicKey));
const env={DB:db,ACCESS_AUD:"push-test",ALLOW_WRITES:"true",
  ALLOW_PUSH_SUBSCRIPTIONS:"true",ALLOW_PUSH_SEND:"true",ALLOW_MOVEMENT_PUSH_SEND:"true",ALLOW_SHORTCUT_WRITES:"true",
  VAPID_PUBLIC_KEY:Buffer.from(publicBytes).toString("base64url"),
  VAPID_PRIVATE_JWK:JSON.stringify(jwk),
  VAPID_SUBJECT:"mailto:tests@example.invalid"};
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const ownerA={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"};}}};
const ownerB={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"};}}};
const endpoint="https://web.push.apple.com/"+ "a".repeat(65);
async function call(path,method="GET",data=null,owner=ownerA,opts={}){
  const background=[];
  const response=await handleQuickRequest(new Request(base+path,{
    method,headers:method==="POST" ? {"Content-Type":"application/json",
      Origin:opts.origin??base,...(opts.bearer?{Authorization:"Bearer "+opts.bearer}:{})}:undefined,
    ...(method==="POST"?{body:JSON.stringify(data)}:{}),
  }),opts.env??env,{...owner,waitUntil:(promise)=>background.push(promise)});
  await Promise.all(background);
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
assert.equal((await call("/api/quick/push/status","POST",{endpoint})).body.registered,true);
assert.equal((await call("/api/quick/push/status","POST",{endpoint},ownerB)).body.registered,false);

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
assert.equal((await call("/api/quick/push/status","POST",{endpoint})).body.registered,false);
assert.equal((await sendDailyReminders({...env,ALLOW_PUSH_SEND:"false"},time,fakeFetch)).skipped,true);

// Existing authorized devices register their browser keys without a second permission prompt.
const recipient=createECDH("prime256v1");
const publicKey=recipient.generateKeys();
const authSecret=randomBytes(16);
const keys={p256dh:publicKey.toString("base64url"),auth:authSecret.toString("base64url")};
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint,confirmed:true})).status,201);
assert.equal((await call("/api/quick/push/status","POST",{endpoint,keys},ownerB)).body.movementReady,false);
assert.equal((await call("/api/quick/push/status","POST",{endpoint,keys})).body.movementReady,true);
assert.equal((await call("/api/quick/push/subscribe","POST",{endpoint: endpoint+"b",confirmed:true,keys},ownerB)).status,201);

function decryptReceipt(body){
  const wire=Buffer.from(body);
  const salt=wire.subarray(0,16);
  assert.equal(wire.readUInt32BE(16),4096);
  assert.equal(wire[20],65);
  const sender=wire.subarray(21,86);
  const ikm=hkdfSync("sha256",recipient.computeSecret(sender),authSecret,
    Buffer.concat([Buffer.from("WebPush: info\0"),publicKey,sender]),32);
  const cek=hkdfSync("sha256",ikm,salt,Buffer.from("Content-Encoding: aes128gcm\0"),16);
  const nonce=hkdfSync("sha256",ikm,salt,Buffer.from("Content-Encoding: nonce\0"),12);
  const decipher=createDecipheriv("aes-128-gcm",Buffer.from(cek),Buffer.from(nonce));
  decipher.setAuthTag(wire.subarray(-16));
  const message=Buffer.concat([decipher.update(wire.subarray(86,-16)),decipher.final()]);
  assert.equal(message.at(-1),2);
  return message.subarray(0,-1).toString();
}
const expenseNotice=JSON.stringify({kind:"expense",amountMinor:500000,concept:"Prueba privada"});
const incomeNotice=JSON.stringify({kind:"income",amountMinor:500000,concept:"Prueba privada"});
const received=[];
const providerErrors=[];
let failDelivery=false;
const originalFetch=globalThis.fetch;
try{
  globalThis.fetch=async(url,init)=>{
    try{
      assert.equal(url,endpoint,"Only the writer's device receives the notification");
      assert.equal(init.headers["Content-Encoding"],"aes128gcm");
      assert.equal(init.headers.Urgency,"high");
      assert.equal(init.redirect,"manual");
      received.push(decryptReceipt(init.body));
    }catch(error){providerErrors.push(error);}
    if(failDelivery)throw new Error("Synthetic network failure");
    return new Response(null,{status:201});
  };
  const device=await call("/api/quick/shortcut/enroll","POST",{label:"Test",confirmed:true});
  assert.equal(device.status,201);
  const movement={clientEntryId:"push-movement-browser",amount:"5000",concept:"Prueba privada",paymentMethod:"cash",confirmed:true};
  assert.equal((await call("/api/quick/studio/expense","POST",movement)).status,201);
  assert.equal((await call("/api/quick/studio/expense","POST",movement)).status,200);
  assert.equal((await call("/api/quick/studio/income","POST",movement)).status,201);
  const {confirmed,...direct}={...movement,clientEntryId:"push-movement-shortcut"};
  const opts={bearer:device.body.token};
  // A service request can have no signed-in browser user. The device owns the write.
  const service={access:{aud:env.ACCESS_AUD,async getIdentity(){return null;}}};
  assert.equal((await call("/api/quick/shortcut/expense","POST",direct,service,opts)).status,201);
  assert.equal((await call("/api/quick/shortcut/income","POST",direct,service,opts)).status,201);
  assert.equal((await call("/api/quick/shortcut/income","POST",direct,service,opts)).status,200);
  assert.equal((await call("/api/quick/studio/income","POST",{...movement,amount:"0"})).status,422);
  assert.deepEqual(received,[expenseNotice,incomeNotice,expenseNotice,incomeNotice]);
  // The response is queued before the server delivers, so the device can leave the app.
  const waitUntil=[];
  const testReq=new Request(base+"/api/quick/push/test",{method:"POST",
    headers:{"Content-Type":"application/json",Origin:base},
    body:JSON.stringify({endpoint,confirmed:true,inBackground:true})});
  const realTimer=globalThis.setTimeout;
  let sendAfterLeaving;
  try{
    globalThis.setTimeout=(callback,delay,...args)=>{
      if(delay!==10000)return realTimer(callback,delay,...args);
      sendAfterLeaving=()=>callback(...args);
    };
    const test=await handleQuickRequest(testReq,env,{...ownerA,waitUntil:task=>waitUntil.push(task)});
    assert.equal(test.status,202);
    assert.deepEqual(await test.json(),{scheduled:true,delaySeconds:10});
    assert.deepEqual(received,[expenseNotice,incomeNotice,expenseNotice,incomeNotice]);
    assert.equal(waitUntil.length,1);
    sendAfterLeaving();
    assert.equal((await waitUntil[0]).status,200);
  }finally{globalThis.setTimeout=realTimer;}
  assert.deepEqual(received,[expenseNotice,incomeNotice,expenseNotice,incomeNotice,"test"]);
  failDelivery=true;
  const another={...movement,clientEntryId:"push-provider-unavailable"};
  assert.equal((await call("/api/quick/studio/income","POST",another)).status,201,"Delivery failures must not roll back entries");
  assert.equal((await call("/api/quick/studio/income","POST",another)).status,200);
  assert.deepEqual(received,[expenseNotice,incomeNotice,expenseNotice,incomeNotice,"test",incomeNotice]);
  assert.deepEqual(providerErrors,[]);
}finally{globalThis.fetch=originalFetch;}

const sw=await (await handleQuickRequest(new Request(base+"/dashboard-sw.js"),env,ownerA)).text();
assert.match(sw,/showNotification/);
assert.doesNotMatch(sw,/addEventListener\("fetch"/);
assert.doesNotThrow(()=>new Function(sw));
const handlers=new Map(), visible=[];
new Function("self",sw)({addEventListener:(type,listener)=>handlers.set(type,listener),
 registration:{showNotification:(name,options)=>visible.push({name,...options})}});
const noticeExamples=[
 JSON.stringify({kind:"expense",amountMinor:2500000,concept:"Transporte"}),
 JSON.stringify({kind:"income",amountMinor:15000000,concept:"Venta"}),
 JSON.stringify({kind:"expense",amountMinor:10000,concept:"Un pago de un concepto realmente demasiado extenso para caber completo en notificaciones"}),
 "expense","income","test",null,JSON.stringify({kind:"expense",amountMinor:-1,concept:"No se debe mostrar"}),
];
for(const payload of noticeExamples)
 handlers.get("push")({data:payload===null?null:{text:()=>payload},waitUntil:()=>{}});
const COP=new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0,maximumFractionDigits:2});
assert.deepEqual(visible.map(x=>[x.name,x.body,x.data.url,x.tag]),[
 ["Gasto registrado",COP.format(25000)+" · Transporte","/dashboard#movement",undefined],
 ["Ingreso registrado",COP.format(150000)+" · Venta","/dashboard#movement",undefined],
 ["Gasto registrado",COP.format(100)+" · Un pago de un concepto realmente demasiado exten…","/dashboard#movement",undefined],
 ["FinanzasOSS","Gasto registrado.","/dashboard#movement",undefined],
 ["FinanzasOSS","Ingreso registrado.","/dashboard#movement",undefined],
 ["FinanzasOSS","Aviso de prueba de FinanzasOSS.","/dashboard#movement",undefined],
 ["FinanzasOSS","Revisa los pendientes de tu perfil en FinanzasOSS.","/dashboard#plan","finanzasoss-finance-review"],
 ["FinanzasOSS","Revisa los pendientes de tu perfil en FinanzasOSS.","/dashboard#plan","finanzasoss-finance-review"],
]);
const html=await (await handleQuickRequest(new Request(base+"/dashboard"),env,ownerA)).text();
assert.match(html,/push-toggle/);
assert.match(html,/install-pwa/);
const client=await (await handleQuickRequest(new Request(base+"/studio.js"),env,ownerA)).text();
assert.match(client,/Notification\.requestPermission/);
assert.doesNotThrow(()=>new Function(client));
console.log("FinanzasOSS PWA: opt-in, owner isolation, invalid endpoint, push send and revoke passed");
sqlite.close();
