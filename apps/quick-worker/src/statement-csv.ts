// Account-free, owner-scoped bank CSV intake. Only COP debits are eligible;
// bank balances, credits, transfers and investment inflows are not inferred.
// Shares original Phase 8 preview model but requires a second server validation.
import {previewMappedImport,type RawImportRow,type ImportColumnMapping} from "../../../packages/import-engine/src/mapping-preview.js";
import type {QuickD1} from "./index.js";

export class StatementInputError extends Error{
 constructor(message:string,readonly status=422){super(message);}
}
type Json=Record<string,unknown>;
type Candidate={index:number;date:string;concept:string;minor:number;id:string;clientId:string};
const allowedMethods=new Set(["debit_card","credit_card","bank_transfer"]);
const allowedKeys=new Set(["rows","mapping","bankLabel","paymentMethod","selectedIndices","confirmed"]);
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function reply(data:unknown,status=200){
 return new Response(JSON.stringify(data),{status,headers:{
 "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
 "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
 }});
}
function validate(input:unknown):{rows:RawImportRow[];mapping:ImportColumnMapping;bankLabel:string;method:string;selected:number[]|null}{
 if(!input||typeof input!=="object"||Array.isArray(input))
   throw new StatementInputError("Expected import data");
 const x=input as Json;
 if(Object.keys(x).some(k=>!allowedKeys.has(k)))throw new StatementInputError("Unexpected import field");
 if(!Array.isArray(x.rows)||x.rows.length<1||x.rows.length>50)
   throw new StatementInputError("CSV import must contain 1–50 rows");
 const rows:RawImportRow[]=x.rows.map(row=>{
   if(!row||typeof row!=="object"||Array.isArray(row))throw new StatementInputError("Invalid CSV row");
   const o=row as Json,keys=Object.keys(o);
   if(keys.length<3||keys.length>12||keys.some(k=>k.length<1||k.length>80||/[\u0000-\u001f]/.test(k)))
     throw new StatementInputError("Invalid CSV headers");
   for(const val of Object.values(o)){
     if(typeof val!=="string"||val.length>260||/[\u0000-\u001f\u007f]/.test(val))
       throw new StatementInputError("Invalid CSV cell");
   }
   return o as Record<string,string>;
 });
 const m=x.mapping;
 if(!m||typeof m!=="object"||Array.isArray(m))throw new StatementInputError("Column mapping required");
 const mapping=m as Record<string,unknown>;
 if(Object.keys(mapping).some(k=>!["postedAt","description","amount","direction","currency","externalId"].includes(k)))
   throw new StatementInputError("Unsupported column mapping");
 for(const k of ["postedAt","description","amount","direction"]){
   if(typeof mapping[k]!=="string"||!(mapping[k] as string).length||
     !Object.prototype.hasOwnProperty.call(rows[0],mapping[k]))
     throw new StatementInputError("Map date, concept, amount and debit/credit columns");
 }
 for(const k of ["currency","externalId"]){
   if(mapping[k]!==undefined&&(typeof mapping[k]!=="string"||
       !Object.prototype.hasOwnProperty.call(rows[0],mapping[k])))
     throw new StatementInputError("Invalid optional mapping");
 }
 if(typeof x.bankLabel!=="string"||!x.bankLabel.trim()||x.bankLabel.trim().length>80||
   /[\u0000-\u001f]/.test(x.bankLabel))
   throw new StatementInputError("Choose the bank shown on the statement");
 if(typeof x.paymentMethod!=="string"||!allowedMethods.has(x.paymentMethod))
   throw new StatementInputError("Choose a supported statement payment method");
 const selected=x.selectedIndices;
 if(selected!==undefined&&(!Array.isArray(selected)||selected.length<1||
   selected.length>50||new Set(selected).size!==selected.length||
   selected.some(k=>!Number.isSafeInteger(k)||k<0||k>=rows.length)))
   throw new StatementInputError("Invalid row selection");
 return {rows,mapping:mapping as unknown as ImportColumnMapping,bankLabel:x.bankLabel.trim(),
   method:x.paymentMethod,selected:selected===undefined?null:selected as number[]};
}
function parseMoney(amount:string):number|null{
 if(!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(amount))return null;
 const [whole,cents=""]=amount.split(".");
 const minor=Number(whole)*100+Number(cents.padEnd(2,"0"));
 return minor>0&&minor<=1000000000000&&Number.isSafeInteger(minor)?minor:null;
}
function validDate(raw:string):boolean{
 if(!DATE.test(raw))return false;
 const parsed=new Date(raw+"T12:00:00Z");
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==raw)return false;
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",
  year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 return raw>="2000-01-01"&&parsed.getTime()<=Date.now()+86400000&&raw<=today;
}
async function idOf(value:string):Promise<string>{
 const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
 const hex=Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
 return "import_"+hex;
}
async function plan(input:unknown){
 const x=validate(input);
 const data=previewMappedImport(x.rows,x.mapping);
 const candidates:Candidate[]=[],issues:{index:number;issues:string[]}[]=[];
 for(const row of data.rows){
   const c=row.candidate,e=[...row.issues];
   const date=c.postedAt||"",rawAmount=c.amount||"",concept=(c.rawDescription||"").trim();
   const minor=parseMoney(rawAmount);
   if(!validDate(date))e.push("Fecha: usa AAAA-MM-DD de una fecha pasada");
   if(!minor)e.push("Monto: COP positivo, sin separadores de miles");
   if(concept.length<1||concept.length>120)e.push("Concepto no válido");
   if(c.direction!=="debit")e.push("No es un débito confirmado");
   if(c.currency&&c.currency!=="COP")e.push("Moneda diferente de COP");
   if(e.length){issues.push({index:row.rowIndex,issues:e});continue;}
   const source=c.externalId?.trim()||[date,concept.toLowerCase(),minor].join("|");
   const clientId=await idOf([x.bankLabel.toLowerCase(),x.method,source].join("|"));
   candidates.push({index:row.rowIndex,date,concept,minor:minor!,clientId,id:crypto.randomUUID()});
 }
 return {input:x,candidates,issues};
}
async function withDuplicates(db:QuickD1,owner:string,candidates:Candidate[]){
 const ready:Candidate[]=[],duplicates:number[]=[];
 for(const candidate of candidates){
  const old=await db.prepare("SELECT id FROM quick_shortcut_expenses "+
   "WHERE owner_id=? AND client_entry_id=?").bind(owner,candidate.clientId).first<{id:string}>();
  const near=await db.prepare("SELECT id FROM ("+
    "SELECT id,amount_minor,merchant,occurred_at FROM quick_shortcut_expenses "+
      "WHERE owner_id=? AND deleted_at IS NULL "+
    "UNION ALL SELECT id,amount_minor,merchant,occurred_at FROM quick_manual_entries "+
      "WHERE owner_id=? AND deleted_at IS NULL) "+
    "WHERE amount_minor=? AND lower(trim(merchant))=? "+
    "AND substr(datetime(occurred_at,'-5 hours'),1,10)=? LIMIT 1")
   .bind(owner,owner,candidate.minor,candidate.concept.toLowerCase(),candidate.date).first<{id:string}>();
  if(old||near)duplicates.push(candidate.index);else ready.push(candidate);
 }
 return {ready,duplicates};
}
export async function previewStatement(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 const {candidates,issues}=await plan(body);
 const {ready,duplicates}=await withDuplicates(db,owner,candidates);
 return reply({format:"CSV",stored:false,requiresConfirmation:true,total:issues.length+candidates.length,
  ready:ready.map(x=>({index:x.index,date:x.date,concept:x.concept,amountCOP:(x.minor/100).toFixed(2)})),
  skipped:issues,possibleDuplicates:duplicates});
}
export async function commitStatement(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 const raw=body as Json;
 if(!raw||raw.confirmed!==true)throw new StatementInputError("Explicit confirmation required");
 const {input,candidates,issues}=await plan(raw);
 const chosen=input.selected;
 if(!chosen||chosen.length<1)throw new StatementInputError("Choose previewed rows");
 if(chosen.some(i=>issues.some(e=>e.index===i)))throw new StatementInputError("Invalid rows cannot be imported");
 const entries=candidates.filter(x=>chosen.includes(x.index));
 if(entries.length!==chosen.length)throw new StatementInputError("Selected row no longer valid");
 const {ready,duplicates}=await withDuplicates(db,owner,entries);
 if(ready.length===0)return reply({inserted:0,duplicates:duplicates.length,confirmed:true});
 if(!db.batch)throw new StatementInputError("Atomic D1 batch unavailable",503);
 // A single SQLite transaction, with conflict-ignore for concurrent identical imports.
 const now=new Date().toISOString();
 const stmts=ready.map(x=>db.prepare(
  "INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,"+
  "payment_method,kind,occurred_at,merchant,bank_label,created_at) "+
  "VALUES(?,?,?,?,'COP',?,'purchase',?,?,?,?) "+
  "ON CONFLICT(owner_id,client_entry_id) DO NOTHING")
  .bind(x.id,owner,x.clientId,x.minor,input.method,x.date+"T17:00:00.000Z",x.concept,input.bankLabel,now));
 const results=await db.batch(stmts);
 const inserted=results.reduce((n,x)=>n+(x.meta?.changes??0),0);
 return reply({inserted,duplicates:duplicates.length+ready.length-inserted,confirmed:true});
}
