import type { QuickD1, QuickWorkerEnv } from "./index.js";
import { PRECISE_TAXONOMY, CategoryInputError } from "./categorization.js";
import { QWEN_MODEL, QWEN_OPTIONS, qwenJson } from "./ai-model.js";
import { merchantKey, protectCategoryText } from "./category-automation.js";
import { categoryPushConfigured, sendOwnerCategoryQuestion } from "./push.js";
import { ALERT_RULES, creditSchedule, defaultAlertRules, localDay, markAlertsNotified, openOperationalAlerts, readAlertRules,
  reconciliationNotificationRules, saveCreditDue, snoozeOperationalAlert } from "./assistant-alerts.js";

// Cron Trigger times are UTC. Bogotá is UTC−05:00 year-round.
export const ASSISTANT_DAILY_CRON = "0 1 * * *";
export const ASSISTANT_HOURLY_CRON = "0 * * * *";
const defaultNoticeHour = 20;
const bogotaHour = new Intl.DateTimeFormat("en-GB",{timeZone:"America/Bogota",hour:"2-digit",hourCycle:"h23"});
const hourLabel = (hour:number) => String(hour).padStart(2,"0")+":00";
type NoticeHours = {digest_hour:number;quiet_start:number|null;quiet_end:number|null;delivery_hour:number};

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
async function readNoticeHours(db:QuickD1,owner:string) {
  return db.prepare("SELECT digest_hour,quiet_start,quiet_end,delivery_hour FROM quick_agent_notice_hours WHERE owner_id=?")
    .bind(owner).first<NoticeHours>();
}
export async function assistantInbox(db:QuickD1,owner:string,env:QuickWorkerEnv):Promise<Response> {
  const [rows,pref,hours,rules,credit]=await Promise.all([
    queue(db,owner),
    db.prepare("SELECT enabled FROM quick_agent_notice_settings WHERE owner_id=?").bind(owner).first<{enabled:number}>(),
    readNoticeHours(db,owner),
    readAlertRules(db,owner),
    creditSchedule(db,owner),
  ]);
  const enabledRules=defaultAlertRules();
  if(env.ALLOW_V41_REVIEW_DRAFTS!=="true"){
    enabledRules.possible_duplicate=false;
    enabledRules.import_unreviewed=false;
  }
  if(env.ALLOW_V41_TRANSFER_LINKS!=="true")enabledRules.unmatched_internal_transfer=false;
  const [drafts,alerts]=await Promise.all([
    Promise.all(rows.results.map(item=>readDraft(db,owner,item.source,item.id))),
    openOperationalAlerts(db,owner,Date.now(),enabledRules),
  ]);
  return reply({
    items:rows.results.map(({id,source,merchant,question,version},index)=>{
      const saved=drafts[index];
      const draft=saved?.status==="draft"&&saved.movement_version===version?saved:null;
      return {id,source,concept:merchant||"Compra sin concepto",
        question:question||"¿Qué compraste o pagaste?",canRemember:Boolean(preferenceKey(merchant)),
        draft:draft?{category:draft.category,subcategory:draft.subcategory,token:draft.token}:null};
    }),
    taxonomy:PRECISE_TAXONOMY, notifications:pref?.enabled===1,
    alerts, rules, ruleLabels:Object.fromEntries(Object.entries(ALERT_RULES).filter(([rule])=>enabledRules[rule as keyof typeof enabledRules])), credit,
    pushConfigured:categoryPushConfigured(env),
    noticeSchedule:hourLabel(hours?.delivery_hour??defaultNoticeHour),
    noticeHours:{digestHour:hours?.digest_hour??defaultNoticeHour,quietStart:hours?.quiet_start??null,
      quietEnd:hours?.quiet_end??null},
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
        .bind(owner,localDay(Date.now())).first<{hits:number}>();
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
  const data=bodyOf(raw,["enabled","confirmed","rules","hours"]);
  if(typeof data.enabled!=="boolean"||data.confirmed!==true)return reply({error:"Confirma la preferencia de avisos."},422);
  const preferences=data.rules===undefined?{}:bodyOf(data.rules,Object.keys(ALERT_RULES));
  if(Object.values(preferences).some(value=>typeof value!=="boolean"))return reply({error:"Selecciona tipos de aviso válidos."},422);
  const hours=data.hours===undefined?null:bodyOf(data.hours,["digestHour","quietStart","quietEnd"]);
  const isHour=(value:unknown):value is number=>typeof value==="number"&&Number.isInteger(value)&&value>=0&&value<=23;
  if(hours&&(!isHour(hours.digestHour)||!((hours.quietStart===null&&hours.quietEnd===null)||
    (isHour(hours.quietStart)&&isHour(hours.quietEnd)&&hours.quietStart!==hours.quietEnd))))
    return reply({error:"Elige una hora de resumen y, si activas el silencio, dos horas distintas."},422);
  const notice=db.prepare("INSERT INTO quick_agent_notice_settings(owner_id,enabled) VALUES(?,?) "+
    "ON CONFLICT(owner_id) DO UPDATE SET enabled=excluded.enabled").bind(owner,data.enabled?1:0);
  const edits=Object.entries(preferences).map(([rule,enabled])=>
    db.prepare("INSERT INTO "+(reconciliationNotificationRules.has(rule)?"quick_agent_review_notification_rules":"quick_agent_alert_rules")+
      "(owner_id,rule,enabled) VALUES(?,?,?) "+
      "ON CONFLICT(owner_id,rule) DO UPDATE SET enabled=excluded.enabled").bind(owner,rule,enabled?1:0));
  if(hours)edits.push(db.prepare("INSERT INTO quick_agent_notice_hours(owner_id,digest_hour,quiet_start,quiet_end) VALUES(?,?,?,?) "+
    "ON CONFLICT(owner_id) DO UPDATE SET digest_hour=excluded.digest_hour,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end")
    .bind(owner,hours.digestHour as number,hours.quietStart as number|null,hours.quietEnd as number|null));
  if(!db.batch)return reply({error:"Preferencias temporalmente no disponibles."},503);
  await db.batch([notice,...edits]);
  return reply({enabled:data.enabled});
}
export async function listRememberedMerchants(db:QuickD1,owner:string,after:string|null):Promise<Response>{
  if(after!==null&&merchantKey(after)!==after)return reply({error:"Página de comercios inválida."},422);
  const {results}=await db.prepare("SELECT merchant_key AS merchant,category,subcategory,updated_at AS updatedAt "+
    "FROM quick_category_preferences WHERE owner_id=? AND merchant_key>? ORDER BY merchant_key LIMIT 26")
    .bind(owner,after??"").all<{merchant:string;category:string;subcategory:string;updatedAt:string}>();
  const items=results.slice(0,25);
  return reply({items,next:results.length>25?items.at(-1)?.merchant:null});
}
export async function forgetRememberedMerchant(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const data=bodyOf(raw,["merchant","updatedAt","confirmed"]);
  if(data.confirmed!==true||typeof data.merchant!=="string"||merchantKey(data.merchant)!==data.merchant||
    typeof data.updatedAt!=="string"||data.updatedAt.length>40)
    return reply({error:"Confirma el comercio que quieres olvidar."},422);
  const removed=await db.prepare("DELETE FROM quick_category_preferences WHERE owner_id=? AND merchant_key=? AND updated_at=? "+
    "RETURNING merchant_key").bind(owner,data.merchant,data.updatedAt).first();
  if(!removed&&await db.prepare("SELECT merchant_key FROM quick_category_preferences WHERE owner_id=? AND merchant_key=?")
    .bind(owner,data.merchant).first())return reply({error:"La regla cambió. Vuelve a cargar los comercios."},409);
  return reply({removed:Boolean(removed)});
}
export async function assistantSnooze(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const data=bodyOf(raw,["key"]);
  if(typeof data.key!=="string"||!/^[a-z0-9:-]{1,100}$/i.test(data.key))return reply({error:"Aviso inválido."},422);
  return (await snoozeOperationalAlert(db,owner,data.key,Date.now()))?
    reply({snoozed:true}):reply({error:"El aviso ya no está pendiente."},404);
}
export async function assistantCreditDue(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const data=bodyOf(raw,["account","dueOn","paid","confirmed"]);
  if(typeof data.account!=="string"||!UUID.test(data.account)||typeof data.dueOn!=="string"||
    !/^20\d{2}-\d{2}-\d{2}$/.test(data.dueOn)||typeof data.paid!=="boolean"||data.confirmed!==true)
    return reply({error:"Verifica la tarjeta y la fecha de vencimiento."},422);
  const day=new Date(data.dueOn+"T12:00:00Z");
  if(!Number.isFinite(+day)||day.toISOString().slice(0,10)!==data.dueOn)
    return reply({error:"Fecha de vencimiento inválida."},422);
  return (await saveCreditDue(db,owner,data.account,data.dueOn,data.paid))?
    reply({saved:true}):reply({error:"La tarjeta o su vencimiento ya no están disponibles."},404);
}
export async function sendAssistantDigest(env:QuickWorkerEnv,now:number,send=sendOwnerCategoryQuestion):Promise<void> {
  if(!categoryPushConfigured(env))return;
  const day=localDay(now),hour=Number(bogotaHour.format(new Date(now)));
  const ownerRows=await env.DB.prepare("SELECT s.owner_id,s.last_fingerprint FROM quick_agent_notice_settings s "+
    "LEFT JOIN quick_agent_notice_hours h ON h.owner_id=s.owner_id "+
    "WHERE s.enabled=1 AND COALESCE(h.delivery_hour,?)=? AND COALESCE(s.last_day,'')<? "+
    "AND EXISTS(SELECT 1 FROM quick_push_subscriptions p WHERE p.owner_id=s.owner_id) "+
    "ORDER BY COALESCE(s.last_day,''),s.owner_id LIMIT 10").bind(defaultNoticeHour,hour,day)
    .all<{owner_id:string;last_fingerprint:string|null}>();
  for(const {owner_id:owner,last_fingerprint:previous} of ownerRows.results){
    const rules=await readAlertRules(env.DB,owner);
    if(env.ALLOW_V41_REVIEW_DRAFTS!=="true"){rules.possible_duplicate=false;rules.import_unreviewed=false;}
    if(env.ALLOW_V41_TRANSFER_LINKS!=="true")rules.unmatched_internal_transfer=false;
    const items=rules.unclassified_movement?(await queue(env.DB,owner)).results:[];
    const alerts=(await openOperationalAlerts(env.DB,owner,now,rules)).filter(alert=>!alert.notified);
    const signature=items.map(({source,id})=>source+":"+id).sort().join("|");
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(signature));
    const fingerprint=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
    const claimed=await env.DB.prepare("UPDATE quick_agent_notice_settings SET last_day=? "+
      "WHERE owner_id=? AND enabled=1 AND COALESCE(last_day,'')<? AND "+
      "COALESCE((SELECT delivery_hour FROM quick_agent_notice_hours WHERE owner_id=?),?)=? RETURNING owner_id")
      .bind(day,owner,day,owner,defaultNoticeHour,hour).first();
    if(!claimed||(!alerts.length&&previous===fingerprint))continue;
    if((alerts.length||(items.length&&previous!==fingerprint))&&!(await send(env.DB,owner,env,now)).accepted)continue;
    await markAlertsNotified(env.DB,owner,alerts,new Date(now).toISOString());
    await env.DB.prepare("UPDATE quick_agent_notice_settings SET last_fingerprint=? "+
      "WHERE owner_id=? AND last_day=? AND enabled=1 RETURNING owner_id").bind(fingerprint,owner,day).first();
  }
}
