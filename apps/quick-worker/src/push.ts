// FinanzasOSS: owner-isolated, opt-in, empty-payload Web Push (staging only).
// Sensitive endpoints are never returned to clients other than their own browser's PushManager.
import type {QuickD1,QuickWorkerEnv} from "./index.js";
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
export function pushConfig(env:QuickWorkerEnv):Response{
  return reply({enabled:enabled(env),publicKey:enabled(env)?env.VAPID_PUBLIC_KEY:null,
    dailyTime:"20:30",timezone:"America/Bogota",deliveryEnabled:env.ALLOW_PUSH_SEND==="true"});
}
export async function subscribe(db:QuickD1,owner:string,env:QuickWorkerEnv,body:unknown):Promise<Response>{
  if(!enabled(env))return reply({error:"Notifications not configured"},503);
  const obj=strict(body,["endpoint","confirmed"]);
  if(obj.confirmed!==true)throw new PushInputError("Explicit opt-in required");
  const endpoint=endpointOf(obj.endpoint),hash=await digest(endpoint);
  const existing=await db.prepare("SELECT endpoint_hash FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?")
    .bind(owner,hash).first<{endpoint_hash:string}>();
  const count=await db.prepare("SELECT COUNT(*) AS n FROM quick_push_subscriptions WHERE owner_id=?")
    .bind(owner).first<{n:number}>();
  if(!existing&&(count?.n??0)>=5)return reply({error:"Five devices maximum"},409);
  await db.prepare("INSERT INTO quick_push_subscriptions(owner_id,endpoint_hash,endpoint,created_at) "+
    "VALUES(?,?,?,?) ON CONFLICT(owner_id,endpoint_hash) DO UPDATE SET endpoint=excluded.endpoint "+
    "RETURNING endpoint_hash").bind(owner,hash,endpoint,new Date().toISOString()).first();
  return reply({subscribed:true,replayed:!!existing},existing?200:201);
}
export async function subscriptionStatus(db:QuickD1,owner:string,body:unknown):Promise<Response>{
  const obj=strict(body,["endpoint"]);
  const hash=await digest(endpointOf(obj.endpoint));
  const found=await db.prepare("SELECT endpoint_hash FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?")
    .bind(owner,hash).first<{endpoint_hash:string}>();
  return reply({registered:Boolean(found)});
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
 now=Date.now(),send:typeof fetch=fetch,
):Promise<Response>{
 if(!enabled(env))return reply({error:"Push is not configured"},503);
 const obj=strict(body,["endpoint","confirmed"]);
 if(obj.confirmed!==true)throw new PushInputError("Explicit test confirmation required");
 const endpoint=endpointOf(obj.endpoint),hash=await digest(endpoint);
 const row=await db.prepare("SELECT endpoint,last_test_at FROM quick_push_subscriptions "+
   "WHERE owner_id=? AND endpoint_hash=?").bind(owner,hash)
   .first<{endpoint:string;last_test_at:string|null}>();
 if(!row||row.endpoint!==endpoint)return reply({error:"Authorize this device before testing"},403);
 // DB-enforced 10-minute cooldown; do not let retries send many notifications.
 const cutoff=new Date(now-600000).toISOString(),stamp=new Date(now).toISOString();
 const claimed=await db.prepare("UPDATE quick_push_subscriptions SET last_test_at=? "+
  "WHERE owner_id=? AND endpoint_hash=? AND (last_test_at IS NULL OR last_test_at<=?) "+
  "RETURNING endpoint_hash").bind(stamp,owner,hash,cutoff).first<{endpoint_hash:string}>();
 if(!claimed)return reply({error:"Wait 10 minutes between tests"},429);
 try{
   const token=await jwt(env,new URL(endpoint).origin,now);
   const result=await send(endpoint,{method:"POST",headers:{
     Authorization:"vapid t="+token+", k="+env.VAPID_PUBLIC_KEY,
     TTL:"3600",Urgency:"normal",
   }});
   if(result.status===404||result.status===410){
     await db.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? "+
       "RETURNING endpoint_hash").bind(owner,hash).first();
     return reply({error:"Subscription expired; re-enable notifications"},409);
   }
   if(!result.ok)return reply({error:"Push provider did not accept the test"},502);
   // Provider accepted the request. Final delivery must be confirmed on device.
   return reply({providerAccepted:true,deliveryConfirmed:false});
 }catch{
   return reply({error:"Unable to contact push provider"},502);
 }
}
