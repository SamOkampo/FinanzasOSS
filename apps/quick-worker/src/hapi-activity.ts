import type {QuickD1} from "./index.js";
import {HAPI_ACTIVITY_KINDS,type HapiActivityRow,type HapiActivityKind} from "./hapi-activity-data.js";


type Stored={id:string;occurred_on:string;kind:HapiActivityKind;description:string;amount_minor:number;
 symbol:string|null;quantity:string|null;broker_ref:string|null};
const columns="id,occurred_on,kind,description,amount_minor,symbol,quantity,broker_ref";
const fields=["date","kind","description","amountUsd","symbol","quantity","reference"];
const hashPattern=/^[a-f0-9]{64}$/;
const respond=(value:unknown,status=200)=>Response.json(value,{status,headers:{
 "Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
}});
const validText=(value:unknown,max:number):value is string=>
 typeof value==="string"&&value.trim().length>0&&value.length<=max&&!/[\x00-\x1f\x7f]/.test(value);
function normalize(raw:unknown,today:string):HapiActivityRow|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).some(key=>!fields.includes(key))||
   typeof r.date!=="string"||!/^20\d{2}-\d{2}-\d{2}$/.test(r.date)||r.date>today||
   !HAPI_ACTIVITY_KINDS.includes(r.kind as HapiActivityKind)||!validText(r.description,160)||
   typeof r.amountUsd!=="string"||!/^(?:0|[1-9]\d{0,9})\.\d{2}$/.test(r.amountUsd)||
   Number(r.amountUsd)<=0||Number(r.amountUsd)>1000000000)return null;
 const asDate=new Date(r.date+"T12:00:00Z");
 if(!Number.isFinite(+asDate)||asDate.toISOString().slice(0,10)!==r.date)return null;
 if(r.symbol!==undefined&&(typeof r.symbol!=="string"||!/^[A-Z0-9][A-Z0-9./-]{0,15}$/.test(r.symbol)))return null;
 if(r.quantity!==undefined&&(typeof r.quantity!=="string"||!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/.test(r.quantity)||
   !/[1-9]/.test(r.quantity)))return null;
 if(r.reference!==undefined&&!validText(r.reference,80))return null;
 const q=r.quantity as string|undefined;
 const ref=r.reference as string|undefined;
 return {date:r.date,kind:r.kind as HapiActivityKind,description:r.description.trim().replace(/\s+/g," "),amountUsd:r.amountUsd,
   ...(r.symbol?{symbol:r.symbol as string}:{}),
   ...(q?{quantity:q.includes(".")?q.replace(/0+$/,"").replace(/\.$/,""):q}:{}),
   ...(ref?{reference:ref.trim().toUpperCase()}:{}),
 };
}
async function sha(value:string){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}
const amount=(usd:string)=>Number(usd.replace(".",""));
const storedRow=(r:Stored):HapiActivityRow=>({
 date:r.occurred_on,kind:r.kind,description:r.description,amountUsd:(r.amount_minor/100).toFixed(2),
 ...(r.symbol?{symbol:r.symbol}:{}),...(r.quantity?{quantity:r.quantity}:{}),...(r.broker_ref?{reference:r.broker_ref}:{}),
});
function readStored(db:QuickD1,owner:string,id:string){
 return db.prepare("SELECT "+columns+" FROM quick_hapi_activity WHERE owner_id=? AND id=?").bind(owner,id).first<Stored>();
}
async function prepare(db:QuickD1,owner:string,raw:unknown){
 if(!Array.isArray(raw)||!raw.length||raw.length>200)return null;
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format();
 const rows=raw.map(item=>normalize(item,today));
 if(rows.some(item=>!item))return null;
 const occurrences=new Map<string,number>(),keys=new Set<string>();
 const normalized=[];
 for(const [index,row] of (rows as HapiActivityRow[]).entries()){
   const signature=JSON.stringify([row.date,row.kind,row.description.toLowerCase(),row.amountUsd,row.symbol??"",row.quantity??""]);
   const duplicateIndex=occurrences.get(signature)??0;
   occurrences.set(signature,duplicateIndex+1);
   const id=await sha(row.reference?JSON.stringify(["reference",row.kind,row.reference]):
     JSON.stringify(["row",signature,duplicateIndex]));

   const duplicate=keys.has(id);
   keys.add(id);
   normalized.push({id,index,row,duplicate});
 }
 const repeated=new Set(normalized.filter(item=>item.duplicate).map(item=>item.id));
 const ids=JSON.stringify([...keys]);
 const found=(await db.prepare("SELECT "+columns+" FROM quick_hapi_activity WHERE owner_id=? AND id IN (SELECT value FROM json_each(?))")
   .bind(owner,ids).all<Stored>()).results;
 const prior=new Map(found.map(row=>[row.id,row]));
 return normalized.map(({id,index,row})=>{
   const stored=prior.get(id);
   return {id,index,row,status:repeated.has(id)||Boolean(stored&&JSON.stringify(storedRow(stored))!==JSON.stringify(row))?
     "conflict":stored?"exists":"new"};
 });
}
export async function hapiActivityPreview(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
 const data=raw as {rows?:unknown}|null;
 if(!data||Object.keys(data).some(key=>key!=="rows"))return respond({error:"Envía las filas del reporte."},422);
 const items=await prepare(db,owner,data.rows);
 if(!items)return respond({error:"Revisa las fechas, los tipos y los importes USD. Máximo 200 filas por reporte."},422);
 return respond({items,digest:await sha(JSON.stringify(items.map(({id,row})=>[id,row])))});
}
export async function hapiActivityCommit(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
 const data=raw as {rows?:unknown;selected?:unknown;digest?:unknown;confirmed?:unknown}|null;
 if(!data||data.confirmed!==true||typeof data.digest!=="string"||!hashPattern.test(data.digest)||
   !Array.isArray(data.selected)||!data.selected.length||data.selected.length>200||
   data.selected.some(n=>!Number.isInteger(n)||n<0||n>=200)||new Set(data.selected).size!==data.selected.length||
   Object.keys(data).some(key=>!["rows","selected","digest","confirmed"].includes(key)))
   return respond({error:"Selecciona y confirma las filas revisadas."},422);
 const items=await prepare(db,owner,data.rows);
 if(!items||await sha(JSON.stringify(items.map(({id,row})=>[id,row])))!==data.digest)
   return respond({error:"La vista previa cambió. Vuelve a revisar el reporte."},409);
 const selected=items.filter(item=>(data.selected as number[]).includes(item.index));
 if(selected.length!==data.selected.length||selected.some(item=>item.status==="conflict"))
   return respond({error:"Hay referencias en conflicto en las filas seleccionadas."},409);
 const values=selected.map(({id,row})=>[id,row.date,row.kind,row.description,amount(row.amountUsd),
   row.symbol??null,row.quantity??null,row.reference??null]);
 const incoming="SELECT ?,json_extract(value,'$[0]'),json_extract(value,'$[1]'),json_extract(value,'$[2]'),"+
   "json_extract(value,'$[3]'),json_extract(value,'$[4]'),json_extract(value,'$[5]'),"+
   "json_extract(value,'$[6]'),json_extract(value,'$[7]'),? FROM json_each(?) WHERE 1 ";
 // If a concurrent import claimed an identifier with differing data, the ID constraint aborts the entire statement.
 const conflict=["occurred_on","kind","description","amount_minor","symbol","quantity","broker_ref"]
   .map(key=>"quick_hapi_activity."+key+" IS NOT excluded."+key).join(" OR ");
 let created:number;
 try{
   const inserted=await db.prepare("INSERT INTO quick_hapi_activity(owner_id,"+columns+",created_at) "+incoming+
     "ON CONFLICT(owner_id,id) DO UPDATE SET id='' WHERE "+conflict+" RETURNING id")
     .bind(owner,new Date().toISOString(),JSON.stringify(values)).all<{id:string}>();
   created=inserted.results.length;
 }catch(error){
   const current=await prepare(db,owner,data.rows);
   if(!current?.some(item=>(data.selected as number[]).includes(item.index)&&item.status==="conflict"))throw error;
   return respond({error:"Una referencia cambió durante el guardado. Vuelve a consultar el reporte."},409);
 }
 return respond({created,alreadySaved:selected.length-created});
}
export async function listHapiActivity(db:QuickD1,owner:string):Promise<Response>{
 const [rows,deposits]=await Promise.all([
   db.prepare("SELECT "+columns+",CASE WHEN kind='deposit' AND EXISTS("+
     "SELECT 1 FROM quick_hapi_deposits d WHERE d.owner_id=a.owner_id "+
     "AND upper(d.broker_ref)=COALESCE(a.broker_ref,'ACTIVITY:'||upper(a.id)) "+
     "AND d.credited_on=a.occurred_on AND d.usd_minor=a.amount_minor) THEN 1 ELSE 0 END AS linked "+
     "FROM quick_hapi_activity a WHERE owner_id=? ORDER BY occurred_on DESC,id LIMIT 100")
     .bind(owner).all<Stored&{linked:number}>(),
   db.prepare("SELECT id,bank_label,debited_on,cop_minor FROM quick_hapi_deposits WHERE owner_id=? "+
     "AND usd_minor IS NULL ORDER BY debited_on DESC,id LIMIT 100").bind(owner)
     .all<{id:string;bank_label:string;debited_on:string;cop_minor:number}>(),
 ]);
 return respond({items:rows.results.map(row=>({id:row.id,...storedRow(row),linkedDeposit:row.linked===1})),pending:deposits.results});
}

export async function linkHapiActivityDeposit(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
 const data=raw as {activityId?:unknown;depositId?:unknown;confirmed?:unknown}|null;
 if(!data||data.confirmed!==true||typeof data.activityId!=="string"||!hashPattern.test(data.activityId)||
   typeof data.depositId!=="string"||Object.keys(data).some(key=>!["activityId","depositId","confirmed"].includes(key)))
   return respond({error:"Confirma el vínculo del depósito y la salida de tu banco."},422);
 const row=await readStored(db,owner,data.activityId);
 if(!row||row.kind!=="deposit")return respond({error:"El depósito de Hapi no está disponible en tu perfil."},404);
 const reference=row.broker_ref||"ACTIVITY:"+row.id.toUpperCase();
 const updated=await db.prepare("UPDATE quick_hapi_deposits SET credited_on=?,usd_minor=?,broker_ref=? "+
   "WHERE owner_id=? AND id=? AND usd_minor IS NULL AND debited_on<=? AND NOT EXISTS ("+
   "SELECT 1 FROM quick_hapi_deposits prior WHERE prior.owner_id=? AND upper(prior.broker_ref)=?) RETURNING id")
   .bind(row.occurred_on,row.amount_minor,reference,owner,data.depositId,row.occurred_on,owner,reference).first<{id:string}>();
 if(updated)return respond({linked:true});
 const prior=await db.prepare("SELECT id FROM quick_hapi_deposits WHERE owner_id=? AND id=? "+
   "AND credited_on=? AND usd_minor=? AND upper(broker_ref)=?")
   .bind(owner,data.depositId,row.occurred_on,row.amount_minor,reference).first<{id:string}>();
 return prior?respond({linked:true,replayed:true}):respond({error:"El aporte no coincide o este depósito ya está vinculado."},409);
}
