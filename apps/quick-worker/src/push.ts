// FinanzasOSS: owner-isolated, opt-in Web Push (staging only).
// Sensitive endpoints are never returned to clients other than their own browser's PushManager.
import type {QuickD1,QuickWorkerContext,QuickWorkerEnv} from "./index.js";
import {encryptPushReceipt} from "./push-encryption.js";
const encoder=new TextEncoder();
const providers=new Set(["fcm.googleapis.com","updates.push.services.mozilla.com",
  "push.services.mozilla.com","web.push.apple.com"]);
export class PushInputError extends Error {
  constructor(message:string,readonly status=422){super(message);}
}
function reply(value:unknown,status=200):Response {
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
    "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  }});
}
function endpointOf(value:unknown):string {
  if(typeof value!=="string"||value.length<50||value.length>2048)
    throw new PushInputError("Invalid push endpoint");
  let url:URL;
  try {url=new URL(value);}catch{throw new PushInputError("Invalid push endpoint");}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||url.port||url.username||url.password||url.search||url.hash||
    url.pathname==="/"||!(providers.has(host)||host.endsWith(".push.apple.com")))
    throw new PushInputError("Unrecognized push provider");
  return url.href;
}
function strict(input:unknown,keys:string[]):Record<string,unknown>{
  if(!input||typeof input!=="object"||Array.isArray(input))
    throw new PushInputError("Expected object");
  const obj=input as Record<string,unknown>;
  if(Object.keys(obj).some(k=>!keys.includes(k)))throw new PushInputError("Unsupported field");
  return obj;
}
function b64(bytes:Uint8Array):string{
  let raw="";for(const byte of bytes)raw+=String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function digest(endpoint:string):Promise<string>{
  return b64(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(endpoint))));
}
function enabled(env:QuickWorkerEnv):boolean{
  return env.ALLOW_WRITES==="true"&&env.ALLOW_PUSH_SUBSCRIPTIONS==="true"&&
    /^[a-zA-Z0-9_-]{86,88}$/.test(env.VAPID_PUBLIC_KEY??"")&&
    Boolean(env.VAPID_PRIVATE_JWK)&&Boolean(env.VAPID_SUBJECT?.startsWith("mailto:"));
}
export function categoryPushConfigured(env:QuickWorkerEnv):boolean{
  return enabled(env)&&env.ALLOW_CATEGORY_PUSH_SEND==="true";
}
function movementPushConfigured(env:QuickWorkerEnv):boolean{
  return enabled(env)&&env.ALLOW_MOVEMENT_PUSH_SEND==="true";
}
export function pushConfig(env:QuickWorkerEnv):Response{
  return reply({enabled:enabled(env),publicKey:enabled(env)?env.VAPID_PUBLIC_KEY:null,
    dailyTime:"20:30",timezone:"America/Bogota",deliveryEnabled:env.ALLOW_PUSH_SEND==="true",
    movementDeliveryEnabled:movementPushConfigured(env)});
}
function subscriptionKeys(value:unknown){
  if(value===undefined)return null;
  const {p256dh,auth}=strict(value,["p256dh","auth"]);
  if(typeof p256dh!=="string"||!/^B[A-Za-z0-9_-]{86}$/.test(p256dh)||
     typeof auth!=="string"||!/^[A-Za-z0-9_-]{22}$/.test(auth))
    throw new PushInputError("Invalid push encryption keys");
  return {p256dh,auth};
}
async function saveSubscriptionKeys(db:QuickD1,owner:string,hash:string,keys:NonNullable<ReturnType<typeof subscriptionKeys>>){
  await db.prepare("UPDATE quick_push_subscriptions SET p256dh=?,auth_secret=? " +
    "WHERE owner_id=? AND endpoint_hash=? AND (p256dh IS NOT ? OR auth_secret IS NOT ?) RETURNING endpoint_hash")
    .bind(keys.p256dh,keys.auth,owner,hash,keys.p256dh,keys.auth).first();
}
export async function subscribe(db:QuickD1,owner:string,env:QuickWorkerEnv,body:unknown):Promise<Response>{
  if(!enabled(env))return reply({error:"Notifications not configured"},503);
  const obj=strict(body,["endpoint","confirmed","keys"]);
  if(obj.confirmed!==true)throw new PushInputError("Explicit opt-in required");
  const keys=subscriptionKeys(obj.keys);
  const endpoint=endpointOf(obj.endpoint),hash=await digest(endpoint);
  const existing=await db.prepare("SELECT endpoint_hash FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?")
    .bind(owner,hash).first<{endpoint_hash:string}>();
  const count=await db.prepare("SELECT COUNT(*) AS n FROM quick_push_subscriptions WHERE owner_id=?")
    .bind(owner).first<{n:number}>();
  if(!existing&&(count?.n??0)>=5)return reply({error:"Five devices maximum"},409);
  await db.prepare("INSERT INTO quick_push_subscriptions(owner_id,endpoint_hash,endpoint,created_at) "+
    "VALUES(?,?,?,?) ON CONFLICT(owner_id,endpoint_hash) DO UPDATE SET endpoint=excluded.endpoint "+
    "RETURNING endpoint_hash").bind(owner,hash,endpoint,new Date().toISOString()).first();
  if(keys)await saveSubscriptionKeys(db,owner,hash,keys);
  return reply({subscribed:true,replayed:!!existing},existing?200:201);
}
export async function subscriptionStatus(db:QuickD1,owner:string,body:unknown):Promise<Response>{
  const obj=strict(body,["endpoint","keys"]);
  const hash=await digest(endpointOf(obj.endpoint));
  const keys=subscriptionKeys(obj.keys);
  const found=await db.prepare("SELECT endpoint_hash FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?")
    .bind(owner,hash).first<{endpoint_hash:string}>();
  if(found&&keys)await saveSubscriptionKeys(db,owner,hash,keys);
  return reply({registered:Boolean(found),movementReady:Boolean(found&&keys)});
}
export async function unsubscribe(db:QuickD1,owner:string,body:unknown):Promise<Response>{
  const obj=strict(body,["endpoint"]);
  const hash=await digest(endpointOf(obj.endpoint));
  await db.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? RETURNING endpoint_hash")
    .bind(owner,hash).first();
  return reply({subscribed:false});
}
function dayBogota(ts:number):string{
  const obj=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Bogota",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(ts)).map(x=>[x.type,x.value]));
  return obj.year+"-"+obj.month+"-"+obj.day;
}
async function jwt(env:QuickWorkerEnv,origin:string,now:number):Promise<string>{
  const key=await crypto.subtle.importKey("jwk",JSON.parse(env.VAPID_PRIVATE_JWK??""),
    {name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
  const head=b64(encoder.encode(JSON.stringify({typ:"JWT",alg:"ES256"})));
  const payload=b64(encoder.encode(JSON.stringify({aud:origin,
    exp:Math.floor(now/1000)+3600,sub:env.VAPID_SUBJECT})));
  const base=head+"."+payload;
  const signature=new Uint8Array(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},key,encoder.encode(base)));
  return base+"."+b64(signature);
}
export async function sendDailyReminders(env:QuickWorkerEnv,now=Date.now(),
  send:typeof fetch=fetch):Promise<{sent:number;retired:number;skipped:boolean}>{
  if(!env.DB||!enabled(env)||env.ALLOW_PUSH_SEND!=="true")
    return {sent:0,retired:0,skipped:true};
  const day=dayBogota(now);
  const rows=await env.DB.prepare("SELECT owner_id,endpoint_hash,endpoint FROM quick_push_subscriptions "+
    "WHERE last_sent_day IS NULL OR last_sent_day<>? ORDER BY created_at LIMIT 100")
    .bind(day).all<{owner_id:string;endpoint_hash:string;endpoint:string}>();
  let sent=0,retired=0;
  for(const row of rows.results){
    let endpoint:string;
    try{endpoint=endpointOf(row.endpoint);}catch{continue;}
    let result:Response;
    try{
      const token=await jwt(env,new URL(endpoint).origin,now);
      result=await send(endpoint,{method:"POST",headers:{
        Authorization:"vapid t="+token+", k="+env.VAPID_PUBLIC_KEY,
        TTL:"3600",Urgency:"normal",
      }});
    }catch{continue;}
    if(result.status===404||result.status===410){
      await env.DB.prepare("DELETE FROM quick_push_subscriptions "+
        "WHERE owner_id=? AND endpoint_hash=? RETURNING endpoint_hash")
        .bind(row.owner_id,row.endpoint_hash).first();
      retired++;continue;
    }
    if(result.ok){
      await env.DB.prepare("UPDATE quick_push_subscriptions SET last_sent_day=? "+
        "WHERE owner_id=? AND endpoint_hash=? AND (last_sent_day IS NULL OR last_sent_day<>?) "+
        "RETURNING endpoint_hash").bind(day,row.owner_id,row.endpoint_hash,day).first();
      sent++;
    }
  }
  return {sent,retired,skipped:false};
}

export async function sendOwnerTestPush(
 db:QuickD1,owner:string,env:QuickWorkerEnv,body:unknown,
 now=Date.now(),send:typeof fetch=fetch,ctx?:QuickWorkerContext,
):Promise<Response>{
 if(!enabled(env))return reply({error:"Push is not configured"},503);
 const obj=strict(body,["endpoint","confirmed","inBackground"]);
 if(obj.confirmed!==true)throw new PushInputError("Explicit test confirmation required");
 if(obj.inBackground!==undefined&&typeof obj.inBackground!=="boolean")throw new PushInputError("Invalid test mode");
 if(obj.inBackground&&!ctx?.waitUntil)return reply({error:"La prueba en segundo plano no está disponible."},503);
 const endpoint=endpointOf(obj.endpoint),hash=await digest(endpoint);
 const keyColumns=movementPushConfigured(env)?", p256dh, auth_secret":"";
 const row=await db.prepare("SELECT endpoint"+keyColumns+" FROM quick_push_subscriptions "+
   "WHERE owner_id=? AND endpoint_hash=?").bind(owner,hash)
   .first<{endpoint:string;p256dh?:string|null;auth_secret?:string|null}>();
 if(!row||row.endpoint!==endpoint)return reply({error:"Authorize this device before testing"},403);
 // DB-enforced 10-minute cooldown; do not let retries send many notifications.
 const cutoff=new Date(now-600000).toISOString(),stamp=new Date(now).toISOString();
 const claimed=await db.prepare("UPDATE quick_push_subscriptions SET last_test_at=? "+
  "WHERE owner_id=? AND endpoint_hash=? AND (last_test_at IS NULL OR last_test_at<=?) "+
  "RETURNING endpoint_hash").bind(stamp,owner,hash,cutoff).first<{endpoint_hash:string}>();
 if(!claimed)return reply({error:"Espera 10 minutos entre avisos de prueba."},429);
 const deliver=async()=>{
 try{
   const result=await sendDeviceNotice(env,row,"test",now,send);
   if(result.status===404||result.status===410){
     await db.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? "+
       "RETURNING endpoint_hash").bind(owner,hash).first();
     return reply({error:"Subscription expired; re-enable notifications"},409);
   }
   if(!result.ok)return reply({error:"Apple o el navegador rechazó el aviso (HTTP "+result.status+").",providerStatus:result.status},502);
   // Provider accepted the request. Final delivery must be confirmed on device.
   return reply({providerAccepted:true,deliveryConfirmed:false});
 }catch{
   return reply({error:"FinanzasOSS no pudo enviar el aviso al proveedor de notificaciones."},502);
 }
 };
 if(obj.inBackground&&ctx?.waitUntil){
  const delaySeconds=10;
  ctx.waitUntil(new Promise<void>(resolve=>setTimeout(resolve,delaySeconds*1000)).then(deliver));
  return reply({scheduled:true,delaySeconds},202);
 }
 return await deliver();
}

/** Deliver a privacy-preserving empty Push to at most five subscribed devices per owner. */
export async function sendOwnerCategoryQuestion(
 db:QuickD1,owner:string,env:QuickWorkerEnv,now=Date.now(),send:typeof fetch=fetch,
):Promise<{accepted:number;configured:boolean}>{
 if(!categoryPushConfigured(env))return {accepted:0,configured:false};
 const devices=await db.prepare(
  "SELECT endpoint_hash,endpoint FROM quick_push_subscriptions WHERE owner_id=? ORDER BY created_at DESC LIMIT 5"
 ).bind(owner).all<{endpoint_hash:string;endpoint:string}>();
 let accepted=0;
 for(const device of devices.results){
   let endpoint:string;
   try{endpoint=endpointOf(device.endpoint);}catch{continue;}
   try{
     const token=await jwt(env,new URL(endpoint).origin,now);
     const response=await send(endpoint,{method:"POST",headers:{
       Authorization:"vapid t="+token+", k="+env.VAPID_PUBLIC_KEY,
       TTL:"600",Urgency:"normal",
     }});
     if(response.status===404||response.status===410){
       await db.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? RETURNING endpoint_hash")
         .bind(owner,device.endpoint_hash).first();
     }else if(response.ok)accepted++;
   }catch{ /* No notification failure can affect financial data. */ }
 }
 return {accepted,configured:true};
}

async function sendDeviceNotice(env:QuickWorkerEnv,device:{endpoint:string;p256dh?:string|null;auth_secret?:string|null},
 receipt:"income"|"expense"|"transfer"|"test",now=Date.now(),send:typeof fetch=fetch,payload:string=receipt):Promise<Response>{
 let stage="prepare";
 try{
  const endpoint=endpointOf(device.endpoint);
  const [token,body]=await Promise.all([
   jwt(env,new URL(endpoint).origin,now),
   device.p256dh&&device.auth_secret?encryptPushReceipt(device.p256dh,device.auth_secret,payload):undefined,
  ]);
  stage="provider";
  const result=await send(endpoint,{method:"POST",redirect:"manual",headers:{
   Authorization:"vapid t="+token+", k="+env.VAPID_PUBLIC_KEY,
   ...(body?{"Content-Encoding":"aes128gcm","Content-Type":"application/octet-stream"}:{}),
   TTL:receipt==="test"?"3600":"600",Urgency:"high",
  },...(body?{body}:{})});
  console.info({event:"finanzasoss_push_delivery",receipt,outcome:result.ok?"accepted":"rejected",status:result.status});
  return result;
 }catch(error){
  console.warn({event:"finanzasoss_push_delivery",receipt,outcome:stage+"_failed"});
  throw error;
 }
}

type MovementDetails={amount_minor:number;concept:string|null};

// Use persisted amounts and concepts, scoped to the authenticated owner.
async function movementPayload(env:QuickWorkerEnv,owner:string,entryId:string,
 receipt:"expense"|"income"):Promise<string>{
 const income=receipt==="income";
 const query=env.DB.prepare(income?
   "SELECT amount_minor,concept FROM quick_income_entries WHERE owner_id=? AND id=? LIMIT 1":
   "SELECT amount_minor,merchant AS concept FROM quick_shortcut_expenses WHERE owner_id=? AND id=? AND deleted_at IS NULL "+
   "UNION ALL SELECT amount_minor,merchant AS concept FROM quick_manual_entries "+
   "WHERE owner_id=? AND id=? AND deleted_at IS NULL LIMIT 1");
 const row=await (income?query.bind(owner,entryId):query.bind(owner,entryId,owner,entryId))
   .first<MovementDetails>();
 const concept=typeof row?.concept==="string"?
   row.concept.replace(/[\u0000-\u001f\u007f-\u009f]/g," ").trim().slice(0,120).trim():"";
 if(!row||!Number.isSafeInteger(row.amount_minor)||row.amount_minor<=0||!concept)return receipt;
 return JSON.stringify({kind:receipt,amountMinor:row.amount_minor,concept});
}

async function sendMovementReceipt(env:QuickWorkerEnv,owner:string,receipt:"expense"|"income"|"transfer",payload:string=receipt){
 const devices=await env.DB.prepare(
  "SELECT endpoint_hash,endpoint,p256dh,auth_secret FROM quick_push_subscriptions " +
  "WHERE owner_id=? AND p256dh IS NOT NULL AND auth_secret IS NOT NULL ORDER BY created_at LIMIT 5"
 ).bind(owner).all<{endpoint_hash:string;endpoint:string;p256dh:string;auth_secret:string}>();
 if(!devices.results.length)console.info({event:"finanzasoss_push_delivery",receipt,outcome:"no_ready_device"});
 await Promise.all(devices.results.map(async device=>{
  try{
   const result=await sendDeviceNotice(env,device,receipt,Date.now(),fetch,payload);
   if(result.status===404||result.status===410){
    await env.DB.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? "+
      "AND p256dh=? AND auth_secret=? RETURNING endpoint_hash")
      .bind(owner,device.endpoint_hash,device.p256dh,device.auth_secret).first();
   }
  }catch{ /* A push failure must never be treated as a failed ledger write. */ }
 }));
}

export async function notifyCreatedMovement(
 response:Response,env:QuickWorkerEnv,ctx:QuickWorkerContext,owner:string,receipt:"expense"|"income",
):Promise<Response>{
 // Only the request that inserted the row returns 201. A replay or edit must not send again.
 if(response.status===201&&movementPushConfigured(env)){
  const delivery=(async()=>{
   let payload:string=receipt;
   try{
    const created=await response.clone().json() as {entryId?:unknown};
    if(typeof created.entryId==="string")
     payload=await movementPayload(env,owner,created.entryId,receipt);
   }catch{ /* Notification formatting must not roll back financial writes. */ }
   await sendMovementReceipt(env,owner,receipt,payload);
  })().catch(()=>{
   console.warn({event:"finanzasoss_push_delivery",receipt,outcome:"subscription_lookup_failed"});
  });
  if(ctx.waitUntil)ctx.waitUntil(delivery);
  else await delivery;
 }
 return response;
}

export async function notifyOwnTransfer(response:Response,env:QuickWorkerEnv,ctx:QuickWorkerContext,owner:string):Promise<Response>{
 if(response.status===201&&movementPushConfigured(env)){
  const delivery=(async()=>{
   const created=await response.clone().json() as {amountMinor:number;fromBankLabel:string;toBankLabel:string};
   await sendMovementReceipt(env,owner,"transfer",JSON.stringify({kind:"transfer",amountMinor:created.amountMinor,concept:created.fromBankLabel+" → "+created.toBankLabel}));
  })().catch(()=>{console.warn({event:"finanzasoss_push_delivery",receipt:"transfer",outcome:"subscription_lookup_failed"});});
  if(ctx.waitUntil)ctx.waitUntil(delivery);else await delivery;
 }
 return response;
}
