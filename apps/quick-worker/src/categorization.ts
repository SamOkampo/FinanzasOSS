// Per-owner, read-only default suggestions plus explicit user-approved categories.
// AI sends only minimized merchant labels after an explicit tap; no amounts,
// bank details, Access identity, transaction IDs, or full statements leave D1.
import type {QuickD1,QuickWorkerEnv} from "./index.js";
import { learnCategory } from "./category-automation.js";
import { classifyQuickEconomicMovement } from "./economic-review.js";

export class CategoryInputError extends Error {
 constructor(message:string,readonly status=422){super(message);}
}
export const TAXONOMY={
 "Alimentación":["Onces","Restaurantes","Mercado","Domicilios","Café y bebidas","Panadería","Comida rápida","Snacks y dulces","Otros"],
 "Suscripciones":["IA y software","Streaming","Música","Servicios digitales","Otros"],
 "Ocio":["Salidas","Entretenimiento","Videojuegos","Viajes","Cine","Otros"],
 "Amigos y familia":["Regalos","Reuniones","Apoyo","Otros"],
 "Transporte":["Transporte público","Recargas","Movilidad","Combustible","Otros"],
 "Salud":["Farmacia","Consultas","Bienestar","Productos naturales","Otros"],
 "Educación":["Universidad","Libros y cursos","Otros"],
 "Compras":["Ropa","Tecnología","Hogar","Papelería","Arte y manualidades","Cuidado personal","Otros"],
 "Pagos y transferencias":["Pagos a terceros","Transferencias","Entre cuentas propias","Otros"],
 "Deudas y obligaciones":["Abonos a préstamos","Tarjetas de crédito","Otros"],
 "Inversiones":["Aportes","Compras de activos","Otros"],
 "Vivienda y servicios":["Arriendo","Servicios públicos","Internet y telefonía","Otros"],
 "Otros":["Por revisar","Otros"],
} as const;
type Category=keyof typeof TAXONOMY;
type Source="manual"|"accountless";
type Movement={id:string;source:Source;amount_minor:number;currency:string;kind:string;merchant:string|null;payment_method:string;
 occurred_at:string;bank_label:string|null;category:string|null;subcategory:string|null;classification_source:string|null;
 auto_category:string|null;auto_subcategory:string|null;auto_confidence:number|null;
 auto_needs_review:number|null;auto_question:string|null;auto_source:string|null};
const EXP=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoDay=(value:string)=>value.slice(0,10);
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
 "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
}});
const legacyVague=(cat:unknown,sub:unknown)=>cat==="Otros"||sub==="Otros"||
 cat==="Por confirmar"||sub==="Por revisar";
export const PRECISE_TAXONOMY=Object.fromEntries(
 Object.entries(TAXONOMY).filter(([category])=>category!=="Otros").map(
 ([category,subs])=>[category,subs.filter(sub=>sub!=="Otros"&&sub!=="Por revisar")]
 )
);
const validCategory=(cat:unknown,sub:unknown):cat is Category=>
 typeof cat==="string"&&Object.hasOwn(TAXONOMY,cat)&&
 typeof sub==="string"&&(TAXONOMY[cat as Category] as readonly string[]).includes(sub);
const origin=(body:unknown,allowed:string[])=>{
 if(!body||typeof body!=="object"||Array.isArray(body))throw new CategoryInputError("Expected JSON object");
 const val=body as Record<string,unknown>;
 if(Object.keys(val).some(x=>!allowed.includes(x)))throw new CategoryInputError("Unsupported field");
 return val;
};
function sourceOf(v:unknown):Source{
 if(v!=="manual"&&v!=="accountless")throw new CategoryInputError("Invalid source");
 return v;
}
function idOf(v:unknown):string{
 if(typeof v!=="string"||!EXP.test(v))throw new CategoryInputError("Invalid movement ID");
 return v;
}
function fold(value:string):string{
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
export function ruleCategory(merchant:string):{category:Category;subcategory:string;confidence:string}{
 const s=fold(merchant);
 if(/chatgpt|openai|claude|notion|github|canva|spotify|netflix|youtube premium|apple.com\/bill/.test(s))
   return /spotify/.test(s)?{category:"Suscripciones",subcategory:"Música",confidence:"media"}:
     /netflix|youtube premium/.test(s)?{category:"Suscripciones",subcategory:"Streaming",confidence:"media"}:
     {category:"Suscripciones",subcategory:"IA y software",confidence:"media"};
 if(/^(pago de prestamo|abono (a|al) prestamo|cuota de prestamo|pague (el |un )?prestamo|devolvi (el |un )?prestamo|le devolvi.*prestamo)/.test(s))return {category:"Deudas y obligaciones",subcategory:"Abonos a préstamos",confidence:"alta"};
 if(/^(pago (de |del )?tarjeta de credito)/.test(s))return {category:"Deudas y obligaciones",subcategory:"Tarjetas de crédito",confidence:"alta"};
 if(/(?:entre mis cuentas|a mi otra cuenta|de mi cuenta a mi|a mi plata|de mi bancolombia a plata)/.test(s))
   return {category:"Pagos y transferencias",subcategory:"Entre cuentas propias",confidence:"alta"};
 if(/(?:aporte|inverti|inversion)\s+(?:en |a )?(?:hapi|bolsa|etf|acciones)/.test(s))
   return {category:"Inversiones",subcategory:"Aportes",confidence:"media"};
 if(/chokis|chococono|mecato|snack|galleta|helado|tajaditas/.test(s))return {category:"Alimentación",subcategory:"Snacks y dulces",confidence:"media"};
 if(/panaderia|pasteleria|pan de bono|almojabana/.test(s))return {category:"Alimentación",subcategory:"Panadería",confidence:"media"};
 if(/hamburgues|comida rapida|fast food|burger|kfc|mcdonald/.test(s))return {category:"Alimentación",subcategory:"Comida rápida",confidence:"media"};
 if(/vending|onces|empanada/.test(s))return {category:"Alimentación",subcategory:"Onces",confidence:"media"};
 if(/cafe|café|tinto|bebida|jugos|agua$|espresso|expresso/.test(s))return {category:"Alimentación",subcategory:"Café y bebidas",confidence:"media"};
 if(/restaurante|almuerzo|comida|hamburgues|pizza|archie|trocipollo/.test(s))
   return {category:"Alimentación",subcategory:"Restaurantes",confidence:"media"};
 if(/didi food|rappi.*comida|domicilio/.test(s))
   return {category:"Alimentación",subcategory:"Domicilios",confidence:"media"};
 if(/cine|cinema|pelicula/.test(s))return {category:"Ocio",subcategory:"Cine",confidence:"media"};
 if(/plan movil|virgin mobile|plan celular/.test(s))return {category:"Vivienda y servicios",subcategory:"Internet y telefonía",confidence:"media"};
 if(/transporte semana/.test(s))return {category:"Transporte",subcategory:"Transporte público",confidence:"media"};
 if(/recarga.*transporte|transmilenio|sitp|tullave|tu llave/.test(s))
   return {category:"Transporte",subcategory:"Recargas",confidence:"alta"};
 if(/uber|didi|taxi|parqueadero|pasaje/.test(s))
   return {category:"Transporte",subcategory:"Movilidad",confidence:"media"};
 if(/farmacia|drogueria|farmacen/.test(s))return {category:"Salud",subcategory:"Farmacia",confidence:"media"};
 if(/naturista|productos naturales/.test(s))return {category:"Salud",subcategory:"Productos naturales",confidence:"baja"};
 if(/lienzo|pintura|libreria de arte|acuarela/.test(s))return {category:"Compras",subcategory:"Arte y manualidades",confidence:"baja"};
 if(/libro|universidad|unal|curso/.test(s))return {category:"Educación",subcategory:"Libros y cursos",confidence:"baja"};
 if(/bre-b|transferencia|paso plata|pasó plata/.test(s))
   return {category:"Pagos y transferencias",subcategory:"Transferencias",confidence:"baja"};
 return {category:"Otros",subcategory:"Por revisar",confidence:"baja"};
}
const fromEntries="SELECT id,'manual' source,amount_minor,currency,kind,merchant,occurred_at,bank_label,payment_method FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL "+
 "UNION ALL SELECT id,'accountless' source,amount_minor,currency,kind,merchant,occurred_at,bank_label,payment_method FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL";
export async function ownerMovements(db:QuickD1,owner:string,limit=500):Promise<Movement[]>{
 const query="SELECT m.id,m.source,m.amount_minor,m.currency,m.kind,m.merchant,m.occurred_at,m.bank_label,m.payment_method,c.category,c.subcategory,c.classification_source,"+
 "a.category AS auto_category,a.subcategory AS auto_subcategory,a.confidence AS auto_confidence,"+
 "a.needs_review AS auto_needs_review,a.question AS auto_question,a.classification_source AS auto_source "+
 "FROM ("+fromEntries+") m LEFT JOIN quick_movement_categories c ON c.owner_id=? AND c.source=m.source AND c.movement_id=m.id "+
 "LEFT JOIN quick_auto_categories a ON a.owner_id=? AND a.source=m.source AND a.movement_id=m.id "+
 "ORDER BY m.occurred_at DESC,m.id DESC LIMIT ?";
 const result=await db.prepare(query).bind(owner,owner,owner,owner,limit).all<Movement>();
 return result.results;
}
export async function categoryReview(db:QuickD1,owner:string):Promise<Response>{
 const entries=await ownerMovements(db,owner,500);
 const total=new Map<string,number>();
 const economic=new Map<string,{minor:number;count:number}>();
 const items=entries.map(x=>{
   const suggestion=ruleCategory(x.merchant||"");
   const manual=validCategory(x.category,x.subcategory);
   const automatic=validCategory(x.auto_category,x.auto_subcategory);
   const rawCat=manual?x.category:automatic?x.auto_category:suggestion.category;
   const rawSub=manual?x.subcategory:automatic?x.auto_subcategory:suggestion.subcategory;
   const vague=legacyVague(rawCat,rawSub);
   const cat=vague?"Pendiente de clasificar":rawCat;
   const sub=vague?"Requiere más contexto":rawSub;
   const economicGroup=classifyQuickEconomicMovement({
     kind:x.kind,merchant:x.merchant,paymentMethod:x.payment_method,
     manualCategory:manual?x.category:null,manualSubcategory:manual?x.subcategory:null,
     autoCategory:automatic?x.auto_category:null,
     autoSubcategory:automatic?x.auto_subcategory:null,
     autoConfidence:automatic?x.auto_confidence:null,
     autoNeedsReview:automatic?x.auto_needs_review===1:null,
   });
   if(x.currency==="COP"){
     const previous=economic.get(economicGroup)??{minor:0,count:0};
     economic.set(economicGroup,{minor:previous.minor+x.amount_minor,count:previous.count+1});
     if(economicGroup==="expense")total.set(String(cat),(total.get(String(cat))||0)+x.amount_minor);
   }
   return {id:x.id,source:x.source,day:isoDay(x.occurred_at),concept:x.merchant||"Sin concepto",
    economicGroup,economicNeedsReview:economicGroup==="review",
    economicTypeSource:manual?"confirmado":automatic?x.auto_source:"reglas",
    amountCOP:(x.amount_minor/100).toFixed(2),category:cat,subcategory:sub,
    confidence:manual?"confirmada":automatic?(x.auto_confidence??0):suggestion.confidence,
    manual:x.classification_source==="manual",automatic:automatic?x.auto_source:null,
    needsReview:vague || economicGroup==="review" || (manual?false:automatic?x.auto_needs_review===1:suggestion.confidence!=="alta"),
    question:economicGroup==="review"
      ? "¿Cuál fue la finalidad de este movimiento? Si es entre tus cuentas, selecciónalo expresamente; si pagaste una compra o una deuda, elige su categoría."
      : manual?null:automatic?x.auto_question:"¿Qué fue este movimiento? Elige la categoría correcta."};
 });
 return reply({taxonomy:PRECISE_TAXONOMY,entries:items,summary:[...total].map(([category,minor])=>({
   category,amountCOP:(minor/100).toFixed(2)})),
   economicSummary:[...economic].map(([group,value])=>({
     group,count:value.count,amountCOP:(value.minor/100).toFixed(2)
   })),limitedTo:500,
   notice:"El resumen por categorías cuenta solo consumos identificados. Deudas y transferencias dudosas van aparte y nunca se reclasifican en el ledger sin confirmación."});
}
export async function setCategory(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 const x=origin(body,["source","id","category","subcategory","confirmed","rememberMerchant"]);
 const source=sourceOf(x.source),id=idOf(x.id);
 if(x.confirmed!==true)throw new CategoryInputError("Confirm classification");
 if(!validCategory(x.category,x.subcategory)||legacyVague(x.category,x.subcategory))throw new CategoryInputError("Elige una categoría y subcategoría específicas; no se permite Otros.");
 if(x.rememberMerchant!==undefined && typeof x.rememberMerchant!=="boolean")throw new CategoryInputError("Invalid merchant preference");
 const table=source==="manual"?"quick_manual_entries":"quick_shortcut_expenses";
 const existing=await db.prepare("SELECT id FROM "+table+" WHERE owner_id=? AND id=? AND deleted_at IS NULL").bind(owner,id).first<{id:string}>();
 if(!existing)return reply({error:"Movement unavailable in this profile"},404);
 const stamp=new Date().toISOString();
 await db.prepare("INSERT INTO quick_movement_categories(owner_id,source,movement_id,category,subcategory,classification_source,updated_at) "+
 "VALUES(?,?,?,?,?,'manual',?) ON CONFLICT(owner_id,source,movement_id) DO UPDATE "+
 "SET category=excluded.category,subcategory=excluded.subcategory,classification_source='manual',updated_at=excluded.updated_at RETURNING movement_id")
 .bind(owner,source,id,x.category as string,x.subcategory as string,stamp).first();
 if(x.rememberMerchant===true)await learnCategory(db,owner,source,id,x.category,x.subcategory,true);
 return reply({saved:true,source,id,category:x.category,subcategory:x.subcategory,learned:x.rememberMerchant===true});
}
const mask=(s:string)=>/transferencia|bre-b|nequi|paso plata|pasó plata|daviplata|pago a |a la llave/i.test(s)?
 "Transferencia a otra persona (destinatario omitido)":s.replace(/\b[0-9]{3,}\b/g,"[numero]")
 .replace(/@[a-z0-9._-]+/gi,"[llave]").replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,"[correo]")
 .slice(0,100);
export async function qwenSuggestions(db:QuickD1,owner:string,env:QuickWorkerEnv,body:unknown):Promise<Response>{
 const x=origin(body,["movements","confirmed"]);
 if(x.confirmed!==true)throw new CategoryInputError("AI data sharing consent required");
 if(!Array.isArray(x.movements)||x.movements.length<1||x.movements.length>8)
   throw new CategoryInputError("Select 1–8 movements");
 const picks=(x.movements as unknown[]).map(y=>{
   const val=origin(y,["source","id"]);return {source:sourceOf(val.source),id:idOf(val.id)};
 });
 if(new Set(picks.map(x=>x.source+":"+x.id)).size!==picks.length)
   throw new CategoryInputError("Duplicated selection");
 if(env.ALLOW_AI_SUGGESTIONS!=="true"||!env.AI)return reply({error:"Qwen is not enabled on this Worker yet"},503);
 // Owner-bound daily quota is claimed before paid model invocation.
 const day=new Date().toISOString().slice(0,10);
 const claim=await db.prepare("INSERT INTO quick_ai_daily_quotas(owner_id,day,hits) VALUES(?,?,1) "+
 "ON CONFLICT(owner_id,day) DO UPDATE SET hits=hits+1 WHERE hits<5 RETURNING hits")
 .bind(owner,day).first<{hits:number}>();
 if(!claim)return reply({error:"Maximum 5 AI reviews per day per profile"},429);
 const entries=await ownerMovements(db,owner,500);
 const values=picks.map(p=>entries.find(x=>x.id===p.id&&x.source===p.source));
 if(values.some(x=>!x))return reply({error:"One movement unavailable in this profile"},404);
 const modelInputs=values.map((entry,i)=>({index:i,concept:mask(entry?.merchant||"")}));
 const system="Eres clasificador de consumos en Colombia. Nunca inventes un gasto, importe ni comercio. "+
  "Devuelve exclusivamente JSON {suggestions:[{index:0,category:'...',subcategory:'...'}]}. "+
  "Usa SOLO el catálogo dado. Si no puedes saber la intención o es una transferencia sin contexto, "+
  "elige Pagos y transferencias/Transferencias o Otros/Por revisar. No des asesoría financiera. /no_think";
 const catalog=JSON.stringify(TAXONOMY);
 let response:unknown;
 try{
   response=await env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8",{
     messages:[{role:"system",content:system},{role:"user",content:JSON.stringify({catalog,movements:modelInputs})}],
     max_tokens:900,temperature:0.1,stream:false,
   });
 }catch{return reply({error:"Qwen temporarily unavailable. Manual categories still work."},502);}
 const record=response as {response?:string;choices?:Array<{message?:{content?:string}}>};
 const output=typeof record?.response==="string"?record.response:record?.choices?.[0]?.message?.content;
 let parsed:unknown;
 try{
   if(typeof output!=="string"||output.length>6000)throw Error("invalid");
   const start=output.indexOf("{"),end=output.lastIndexOf("}");
   parsed=JSON.parse(output.slice(start,end+1));
 }catch{return reply({error:"Qwen did not return valid suggestions. Nothing was saved."},502);}
 const proposals=(parsed as {suggestions?:unknown})?.suggestions;
 if(!Array.isArray(proposals))return reply({error:"Invalid Qwen output"},502);
 const suggestions=picks.map((p,i)=>{
   const item=proposals.find(y=>y&&typeof y==="object"&&(y as {index?:number}).index===i) as
     {category?:string;subcategory?:string}|undefined;
   const defaultRule=ruleCategory(values[i]?.merchant||"");
   const accepted=item&&validCategory(item.category,item.subcategory);
   return {...p,category:accepted?item.category:defaultRule.category,
     subcategory:accepted?item.subcategory:defaultRule.subcategory,
     origin:accepted?"qwen":"regla",requiresReview:true};
 });
 return reply({suggestions,stored:false,model:"Qwen3",usage:"Solo se enviaron conceptos minimizados; ningún gasto fue modificado."});
}
