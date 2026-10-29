// Per-owner, read-only default suggestions plus explicit user-approved categories.
// AI sends only minimized merchant labels after an explicit tap; no amounts,
// bank details, Access identity, transaction IDs, or full statements leave D1.
import type {QuickD1,QuickWorkerEnv} from "./index.js";

export class CategoryInputError extends Error {
 constructor(message:string,readonly status=422){super(message);}
}
export const TAXONOMY={
 "Alimentación":["Onces","Restaurantes","Mercado","Domicilios","Café y bebidas","Otros"],
 "Suscripciones":["IA y software","Streaming","Música","Servicios digitales","Otros"],
 "Ocio":["Salidas","Entretenimiento","Videojuegos","Viajes","Otros"],
 "Amigos y familia":["Regalos","Reuniones","Apoyo","Otros"],
 "Transporte":["Transporte público","Recargas","Movilidad","Combustible","Otros"],
 "Salud":["Farmacia","Consultas","Bienestar","Otros"],
 "Educación":["Universidad","Libros y cursos","Otros"],
 "Compras":["Ropa","Tecnología","Hogar","Otros"],
 "Pagos y transferencias":["Pagos a terceros","Transferencias","Otros"],
 "Vivienda y servicios":["Arriendo","Servicios públicos","Internet y telefonía","Otros"],
 "Otros":["Por revisar","Otros"],
} as const;
type Category=keyof typeof TAXONOMY;
type Source="manual"|"accountless";
type Movement={id:string;source:Source;amount_minor:number;currency:string;kind:string;merchant:string|null;
 occurred_at:string;bank_label:string|null;category:string|null;subcategory:string|null;classification_source:string|null};
const EXP=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoDay=(value:string)=>value.slice(0,10);
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
 "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
}});
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
 if(/vending|onces|mecato|snack|galleta|panaderia/.test(s))return {category:"Alimentación",subcategory:"Onces",confidence:"media"};
 if(/cafe|café|tinto|bebida|jugos|agua$/.test(s))return {category:"Alimentación",subcategory:"Café y bebidas",confidence:"baja"};
 if(/restaurante|almuerzo|comida|hamburgues|pizza|archie|trocipollo/.test(s))
   return {category:"Alimentación",subcategory:"Restaurantes",confidence:"media"};
 if(/didi food|rappi.*comida|domicilio/.test(s))
   return {category:"Alimentación",subcategory:"Domicilios",confidence:"media"};
 if(/recarga.*transporte|transmilenio|sitp|tullave|tu llave/.test(s))
   return {category:"Transporte",subcategory:"Recargas",confidence:"alta"};
 if(/uber|didi|taxi|parqueadero|pasaje/.test(s))
   return {category:"Transporte",subcategory:"Movilidad",confidence:"media"};
 if(/farmacia|drogueria|farmacen/.test(s))return {category:"Salud",subcategory:"Farmacia",confidence:"media"};
 if(/libro|universidad|unal|curso/.test(s))return {category:"Educación",subcategory:"Libros y cursos",confidence:"baja"};
 if(/bre-b|transferencia|paso plata|pasó plata/.test(s))
   return {category:"Pagos y transferencias",subcategory:"Pagos a terceros",confidence:"baja"};
 return {category:"Otros",subcategory:"Por revisar",confidence:"baja"};
}
const fromEntries="SELECT id,'manual' source,amount_minor,currency,kind,merchant,occurred_at,bank_label FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL "+
 "UNION ALL SELECT id,'accountless' source,amount_minor,currency,kind,merchant,occurred_at,bank_label FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL";
export async function ownerMovements(db:QuickD1,owner:string,limit=500):Promise<Movement[]>{
 const query="SELECT m.id,m.source,m.amount_minor,m.currency,m.kind,m.merchant,m.occurred_at,m.bank_label,c.category,c.subcategory,c.classification_source "+
 "FROM ("+fromEntries+") m LEFT JOIN quick_movement_categories c ON c.owner_id=? AND c.source=m.source AND c.movement_id=m.id "+
 "ORDER BY m.occurred_at DESC,m.id DESC LIMIT ?";
 const result=await db.prepare(query).bind(owner,owner,owner,limit).all<Movement>();
 return result.results;
}
export async function categoryReview(db:QuickD1,owner:string):Promise<Response>{
 const entries=await ownerMovements(db,owner,500);
 const total=new Map<string,number>(),items=entries.map(x=>{
   const suggestion=ruleCategory(x.merchant||"");
   const cat=validCategory(x.category,x.subcategory)?x.category:suggestion.category;
   const sub=validCategory(x.category,x.subcategory)?x.subcategory:suggestion.subcategory;
   if(x.kind==="purchase"&&x.currency==="COP")total.set(cat,(total.get(cat)||0)+x.amount_minor);
   return {id:x.id,source:x.source,day:isoDay(x.occurred_at),concept:x.merchant||"Sin concepto",
    amountCOP:(x.amount_minor/100).toFixed(2),category:cat,subcategory:sub,
    confidence:x.category?"confirmada":suggestion.confidence,manual:x.classification_source==="manual"};
 });
 return reply({taxonomy:TAXONOMY,entries:items,summary:[...total].map(([category,minor])=>({
   category,amountCOP:(minor/100).toFixed(2)})),limitedTo:500,
   notice:"Las reglas son sugerencias: verifica los conceptos antes de aceptar."});
}
export async function setCategory(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 const x=origin(body,["source","id","category","subcategory","confirmed"]);
 const source=sourceOf(x.source),id=idOf(x.id);
 if(x.confirmed!==true)throw new CategoryInputError("Confirm classification");
 if(!validCategory(x.category,x.subcategory))throw new CategoryInputError("Invalid category or subcategory");
 const table=source==="manual"?"quick_manual_entries":"quick_shortcut_expenses";
 const existing=await db.prepare("SELECT id FROM "+table+" WHERE owner_id=? AND id=? AND deleted_at IS NULL").bind(owner,id).first<{id:string}>();
 if(!existing)return reply({error:"Movement unavailable in this profile"},404);
 const stamp=new Date().toISOString();
 await db.prepare("INSERT INTO quick_movement_categories(owner_id,source,movement_id,category,subcategory,classification_source,updated_at) "+
 "VALUES(?,?,?,?,?,'manual',?) ON CONFLICT(owner_id,source,movement_id) DO UPDATE "+
 "SET category=excluded.category,subcategory=excluded.subcategory,classification_source='manual',updated_at=excluded.updated_at RETURNING movement_id")
 .bind(owner,source,id,x.category as string,x.subcategory as string,stamp).first();
 return reply({saved:true,source,id,category:x.category,subcategory:x.subcategory});
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
  "elige Pagos y transferencias/Pagos a terceros o Otros/Por revisar. No des asesoría financiera.";
 const catalog=JSON.stringify(TAXONOMY);
 let response:unknown;
 try{
   response=await env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8",{
     messages:[{role:"system",content:system},{role:"user",content:JSON.stringify({catalog,movements:modelInputs})}],
     max_tokens:350,temperature:0.1,stream:false,
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
