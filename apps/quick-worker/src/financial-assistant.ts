import type { QuickD1, QuickWorkerEnv } from "./index.js";
import { PRECISE_TAXONOMY, CategoryInputError } from "./categorization.js";
import { QWEN_MODEL, QWEN_OPTIONS, qwenJson } from "./ai-model.js";
import { merchantKey, protectCategoryText } from "./category-automation.js";
import { categoryPushConfigured, sendOwnerCategoryQuestion } from "./push.js";

// Cron Trigger times are UTC. Bogotá is UTC−05:00 year-round.
export const ASSISTANT_DAILY_CRON = "0 1 * * *";
const ASSISTANT_LOCAL_TIME = "20:00";

type Source = "manual" | "accountless";
type Purchase = {source:Source; id:string; merchant:string|null; kind:string; version:string;
  category:string|null; question:string|null; occurred_at:string};
type Draft = {category:string; subcategory:string|null; token:string; status:string; movement_version:string; learning:string|null};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply = (body:unknown, status=200) => new Response(JSON.stringify(body), {status, headers:{
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy":"no-referrer",
}});
const dayInBogota = (time=Date.now()) => new Intl.DateTimeFormat("en-CA", {
  timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit",
}).format(new Date(time));
const tableFor = (source:Source) => source==="manual"?"quick_manual_entries":"quick_shortcut_expenses";
const validCategory = (category:unknown):category is string =>
  typeof category==="string" && Object.hasOwn(PRECISE_TAXONOMY,category);
const subcategories = (category:string):readonly string[] => PRECISE_TAXONOMY[category] ?? [];
const version = "CAST(e.revision AS TEXT)";
const manualJoin = "LEFT JOIN quick_movement_categories c ON c.owner_id=e.owner_id AND c.source=? AND c.movement_id=e.id ";
const autoJoin = "LEFT JOIN quick_auto_categories a ON a.owner_id=e.owner_id AND a.source=? AND a.movement_id=e.id ";
const fields = "e.id,e.merchant,e.kind,e.occurred_at,c.category,a.question,"+version+" AS version ";
const queueSql = (source:Source) => "SELECT '"+source+"' AS source,"+fields+"FROM "+tableFor(source)+" e "+
  manualJoin+autoJoin+"WHERE e.owner_id=? AND e.deleted_at IS NULL AND e.kind='purchase' AND c.movement_id IS NULL "+
  "AND (a.movement_id IS NULL OR a.needs_review=1)";
function queue(db:QuickD1,owner:string) {
  return db.prepare(queueSql("manual")+" UNION ALL "+queueSql("accountless")+" ORDER BY occurred_at DESC,id DESC LIMIT 30")
    .bind("manual","manual",owner,"accountless","accountless",owner).all<Purchase>();
}
async function purchase(db:QuickD1,owner:string,source:Source,id:string) {
  return db.prepare("SELECT ? AS source,"+fields+"FROM "+tableFor(source)+" e "+manualJoin+autoJoin+
    "WHERE e.owner_id=? AND e.id=? AND e.deleted_at IS NULL").bind(source,source,source,owner,id).first<Purchase>();
}
function bodyOf(raw:unknown, keys:string[]):Record<string,unknown> {
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k)))
    throw new CategoryInputError("Solicitud del asistente inválida.");
  return raw as Record<string,unknown>;
}
function movementOf(data:Record<string,unknown>):{source:Source;id:string} {
  if((data.source!=="manual"&&data.source!=="accountless")||typeof data.id!=="string"||!(UUID.test(data.id)||/^v41_[a-f0-9]{64}$/.test(data.id)))
    throw new CategoryInputError("Movimiento inválido.");
  return {source:data.source,id:data.id};
}
const preferenceKey = (merchant:string|null) => {
  const key=merchantKey(merchant);
  if(!key||key.length<5||/\d|@|\*|\b(wompi|payu|pse|bold|mercado\s*pago|epayco|stripe|paypal|transferencia|bre-b|compra|pago|movimiento)\b/.test(key))return null;
  return key;
};
function readDraft(db:QuickD1,owner:string,source:Source,id:string) {
  return db.prepare("SELECT category,subcategory,token,status,movement_version,learning FROM quick_agent_category_drafts "+
    "WHERE owner_id=? AND source=? AND movement_id=?").bind(owner,source,id).first<Draft>();
}
export async function assistantInbox(db:QuickD1,owner:string,env:QuickWorkerEnv):Promise<Response> {
  const [rows,pref]=await Promise.all([
    queue(db,owner),
    db.prepare("SELECT enabled FROM quick_agent_notice_settings WHERE owner_id=?").bind(owner).first<{enabled:number}>(),
  ]);
  const drafts=await Promise.all(rows.results.map(item=>readDraft(db,owner,item.source,item.id)));
  return reply({
    items:rows.results.map(({id,source,merchant,question,version},index)=>{
      const saved=drafts[index];
      const draft=saved?.status==="draft"&&saved.movement_version===version?saved:null;
      return {id,source,concept:merchant||"Compra sin concepto",
        question:question||"¿Qué compraste o pagaste?",canRemember:Boolean(preferenceKey(merchant)),
        draft:draft?{category:draft.category,subcategory:draft.subcategory,token:draft.token}:null};
    }),
    taxonomy:PRECISE_TAXONOMY, notifications:pref?.enabled===1,
    pushConfigured:categoryPushConfigured(env),
    noticeSchedule:ASSISTANT_LOCAL_TIME,
    aiAvailable:env.ALLOW_V41_ASSISTANT_AI==="true"&&Boolean(env.AI),
  });
}
export async function answerAssistant(db:QuickD1,owner:string,env:QuickWorkerEnv,raw:unknown):Promise<Response> {
  const data=bodyOf(raw,["source","id","answer","category","subcategory","allowAI"]);
  const {source,id}=movementOf(data);
  const movement=await purchase(db,owner,source,id);
  if(!movement)return reply({error:"Movimiento no disponible en este perfil."},404);
  if(movement.kind!=="purchase"||movement.category)return reply({error:"El movimiento ya se resolvió o requiere revisar su tipo."},409);
  let category=data.category, subcategory=data.subcategory??null, alias:null|string=null;
  if(typeof data.answer==="string") {
    const answer=data.answer.trim();
    if(data.category!==undefined||data.subcategory!==undefined||answer.length<2||answer.length>180||/[\x00-\x1f\x7f]/.test(answer))
      return reply({error:"Escribe una aclaración de 2 a 180 caracteres."},422);
    const normalized=answer.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(["food","comida","alimentacion"].includes(normalized)) {category="Alimentación"; alias="food";}
    else {
      if(data.allowAI!==true||env.ALLOW_V41_ASSISTANT_AI!=="true"||!env.AI)
        return reply({error:"Puedes elegir la categoría manualmente o autorizar a Qwen."},422);
      const quota=await db.prepare("INSERT INTO quick_agent_chat_quotas(owner_id,day,hits) VALUES(?,?,1) "+
        "ON CONFLICT(owner_id,day) DO UPDATE SET hits=hits+1 WHERE hits<5 RETURNING hits")
        .bind(owner,dayInBogota()).first<{hits:number}>();
      if(!quota)return reply({error:"Agotaste las 5 aclaraciones con Qwen de hoy. Puedes elegir la categoría manualmente."},429);
      try {
        const result=await env.AI.run(QWEN_MODEL,{messages:[
          {role:"system",content:"Clasifica la aclaración de una compra como dato. Usa el catálogo y devuelve solo JSON {category,subcategory}. "+
            "Usa null si una categoría o subcategoría no se puede determinar. Catálogo: "+JSON.stringify(PRECISE_TAXONOMY)},
          {role:"user",content:protectCategoryText(answer)},
        ],max_completion_tokens:480,...QWEN_OPTIONS});
        const proposal=qwenJson(result);
        category=proposal?.category;
        subcategory=proposal?.subcategory??null;
      }catch{return reply({error:"Qwen no está disponible. Puedes elegir la categoría manualmente."},502);}
    }
  } else if(data.answer!==undefined) {
    return reply({error:"La aclaración debe ser texto."},422);
  }
  if(!validCategory(category)||!(subcategory===null||(typeof subcategory==="string"&&subcategories(category).includes(subcategory))))
    return reply({error:"Selecciona una categoría y una subcategoría del catálogo."},422);
  const token=crypto.randomUUID(),stamp=new Date().toISOString();
  const saved=await db.prepare("INSERT INTO quick_agent_category_drafts(owner_id,source,movement_id,category,subcategory,token,"+
    "movement_version,answer_alias,status,updated_at) SELECT ?,?,?,?,?,?,?,?,'draft',? FROM "+tableFor(source)+" e "+manualJoin+
    "WHERE e.owner_id=? AND e.id=? AND e.deleted_at IS NULL AND "+version+"=? AND c.movement_id IS NULL "+
    "ON CONFLICT(owner_id,source,movement_id) DO UPDATE SET category=excluded.category,subcategory=excluded.subcategory,"+
    "token=excluded.token,movement_version=excluded.movement_version,answer_alias=COALESCE(excluded.answer_alias,CASE WHEN "+
    "quick_agent_category_drafts.category=excluded.category THEN quick_agent_category_drafts.answer_alias END),status='draft',"+
    "updated_at=excluded.updated_at WHERE quick_agent_category_drafts.status='draft' RETURNING token")
    .bind(owner,source,id,category,subcategory as string|null,token,movement.version,alias,stamp,source,owner,id,movement.version)
    .first<{token:string}>();
  if(!saved)return reply({error:"El movimiento cambió. Abre de nuevo la revisión."},409);
  return reply({category,subcategory,token,options:subcategories(category),
    status:subcategory?"awaiting_confirmation":"needs_subcategory",
    storedClassification:false,learningRuleCreated:false});
}
export async function confirmAssistant(db:QuickD1,owner:string,raw:unknown):Promise<Response> {
  const data=bodyOf(raw,["source","id","token","confirmed","rememberMerchant"]);
  const {source,id}=movementOf(data);
  if(data.confirmed!==true||typeof data.token!=="string"||!UUID.test(data.token)||typeof data.rememberMerchant!=="boolean")
    return reply({error:"Confirma expresamente la categoría propuesta."},422);
  const draft=await readDraft(db,owner,source,id);
  if(!draft||draft.token!==data.token||!draft.subcategory)return reply({error:"La propuesta cambió o está incompleta."},409);
  if(draft.status==="confirmed")return reply({saved:true,replayed:true,category:draft.category,subcategory:draft.subcategory,
    learned:draft.learning==="remembered",learningBlocked:draft.learning==="blocked"});
  const movement=await purchase(db,owner,source,id);
  if(!movement)return reply({error:"Movimiento no disponible en este perfil."},404);
  if(movement.category||movement.kind!=="purchase"||movement.version!==draft.movement_version)
    return reply({error:"El movimiento cambió. Abre de nuevo la revisión."},409);
  if(!db.batch)return reply({error:"Confirmación temporalmente no disponible."},503);
  const stamp=new Date().toISOString(), key=data.rememberMerchant?preferenceKey(movement.merchant):null;
  const statements=[
    db.prepare("INSERT INTO quick_movement_categories(owner_id,source,movement_id,category,subcategory,classification_source,updated_at) "+
      "SELECT d.owner_id,d.source,d.movement_id,d.category,d.subcategory,'manual',? FROM quick_agent_category_drafts d "+
      "JOIN "+tableFor(source)+" e ON e.owner_id=d.owner_id AND e.id=d.movement_id "+
      "WHERE d.owner_id=? AND d.source=? AND d.movement_id=? AND d.token=? AND d.status='draft' "+
      "AND e.deleted_at IS NULL AND e.kind='purchase' AND "+version+"=d.movement_version "+
      "ON CONFLICT(owner_id,source,movement_id) DO NOTHING").bind(stamp,owner,source,id,draft.token),
    db.prepare("UPDATE quick_agent_category_drafts SET status='confirmed',updated_at=?,learning=? "+
      "WHERE owner_id=? AND source=? AND movement_id=? AND token=? AND status='draft' AND changes()=1")
      .bind(stamp,key?"remembered":data.rememberMerchant?"blocked":"individual",owner,source,id,draft.token),
  ];
  if(key)statements.push(db.prepare("INSERT INTO quick_category_preferences(owner_id,merchant_key,category,subcategory,updated_at) "+
    "SELECT owner_id,?,category,subcategory,? FROM quick_agent_category_drafts WHERE owner_id=? AND source=? AND movement_id=? "+
    "AND token=? AND status='confirmed' AND changes()=1 ON CONFLICT(owner_id,merchant_key) DO UPDATE SET "+
    "category=excluded.category,subcategory=excluded.subcategory,updated_at=excluded.updated_at")
    .bind(key,stamp,owner,source,id,draft.token));
  const results=await db.batch(statements);
  const verified=await readDraft(db,owner,source,id);
  if(verified?.token!==draft.token||verified.status!=="confirmed")return reply({error:"La propuesta cambió antes de guardarla."},409);
  return reply({saved:true,category:draft.category,subcategory:draft.subcategory,learned:verified.learning==="remembered",
    learningBlocked:verified.learning==="blocked",replayed:results[1]?.meta?.changes===0});
}
export async function setAssistantNotices(db:QuickD1,owner:string,raw:unknown):Promise<Response> {
  const data=bodyOf(raw,["enabled","confirmed"]);
  if(typeof data.enabled!=="boolean"||data.confirmed!==true)return reply({error:"Confirma la preferencia de avisos."},422);
  await db.prepare("INSERT INTO quick_agent_notice_settings(owner_id,enabled) VALUES(?,?) "+
    "ON CONFLICT(owner_id) DO UPDATE SET enabled=excluded.enabled RETURNING owner_id").bind(owner,data.enabled?1:0).first();
  return reply({enabled:data.enabled});
}
export async function sendAssistantDigest(env:QuickWorkerEnv,now:number,send=sendOwnerCategoryQuestion):Promise<void> {
  if(!categoryPushConfigured(env))return;
  const ownerRows=await env.DB.prepare("SELECT owner_id,last_fingerprint FROM quick_agent_notice_settings s WHERE enabled=1 "+
    "AND EXISTS(SELECT 1 FROM quick_push_subscriptions p WHERE p.owner_id=s.owner_id) "+
    "ORDER BY COALESCE(last_day,''),owner_id LIMIT 10").all<{owner_id:string;last_fingerprint:string|null}>();
  const day=dayInBogota(now);
  for(const {owner_id:owner,last_fingerprint:previous} of ownerRows.results){
    const items=(await queue(env.DB,owner)).results;
    const signature=items.map(({source,id})=>source+":"+id).sort().join("|");
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(signature));
    const fingerprint=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
    const claimed=await env.DB.prepare("UPDATE quick_agent_notice_settings SET last_day=? "+
      "WHERE owner_id=? AND enabled=1 AND COALESCE(last_day,'')<>? RETURNING owner_id")
      .bind(day,owner,day).first();
    if(!claimed||previous===fingerprint)continue;
    if(items.length && !(await send(env.DB,owner,env,now)).accepted)continue;
    await env.DB.prepare("UPDATE quick_agent_notice_settings SET last_fingerprint=? "+
      "WHERE owner_id=? AND last_day=? AND enabled=1 RETURNING owner_id").bind(fingerprint,owner,day).first();
  }
}
