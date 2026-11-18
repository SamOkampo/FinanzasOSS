import type {QuickD1} from "./index.js";
import {previewReconciliationV41,validateStatementReview} from "./statement-reconcile-v41.js";
import {statementRowKeys,type Preview,type PreviewRow} from "./statement-confirm-v41.js";

type ReviewInput=ReturnType<typeof validateStatementReview>;
type DraftRow={index:number;key:string|null;hash:string|null;duplicate:boolean;invalid:boolean};
type DraftRecord={input_json:string};
type PendingDraft={id:string;bank_label:string;updated_at:string;pending:number;duplicates:number;invalid:number};
const ID=/^[a-f0-9]{64}$/;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{
 "Cache-Control":"private, no-store","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
 "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
}});
const pendingRows="FROM quick_statement_review_drafts draft JOIN json_each(draft.rows_json) item "+
 "LEFT JOIN quick_statement_review_decisions decision ON decision.owner_id=draft.owner_id "+
 "AND decision.row_key=json_extract(item.value,'$.key') AND decision.row_hash=json_extract(item.value,'$.hash') "+
 "WHERE draft.owner_id=? AND decision.id IS NULL";
function minimalInput(raw:unknown):ReviewInput {
 const input=validateStatementReview(raw);
 const mapping=Object.fromEntries(Object.entries(input.mapping).sort(([a],[b])=>a.localeCompare(b))) as ReviewInput["mapping"];
 const columns=[...new Set(Object.values(mapping))].sort();
 return {...input,mapping,rows:input.rows.map(row=>Object.fromEntries(columns.map(col=>[col,Object.hasOwn(row,col)?row[col]:""]))) as Record<string,string>[]};
}
async function review(db:QuickD1,owner:string,input:ReviewInput){
 const result=await previewReconciliationV41(db,owner,input);
 return await result.json() as Preview;
}
function isDuplicate(row:PreviewRow){return Boolean(row.existing.length||row.repeatOfIndex!=null);}
export async function saveStatementDraft(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
 const input=minimalInput(raw),serialized=JSON.stringify(input);
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(serialized));
 const id=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
 const preview=await review(db,owner,input);
 const keys=await statementRowKeys(preview,input.paymentMethod,input.rows,input.mapping);
 const rows:DraftRow[]=preview.rows.map(row=>({
   index:row.index,key:keys.get(row.index)?.rowKey??null,hash:keys.get(row.index)?.rowHash??null,duplicate:isDuplicate(row),invalid:row.status==="needs_correction",
 }));
 const stamp=new Date().toISOString();
 await db.prepare("DELETE FROM quick_statement_review_drafts WHERE owner_id=? AND id NOT IN (SELECT draft.id "+
   pendingRows+") RETURNING id").bind(owner,owner).all<{id:string}>();
 const stored=await db.prepare("INSERT INTO quick_statement_review_drafts(owner_id,id,bank_label,input_json,rows_json,created_at,updated_at) "+
   "SELECT ?,?,?,?,?,?,? WHERE (SELECT count(*) FROM quick_statement_review_drafts WHERE owner_id=?)<20 "+
   "OR EXISTS(SELECT 1 FROM quick_statement_review_drafts WHERE owner_id=? AND id=?) "+
   "ON CONFLICT(owner_id,id) DO UPDATE SET rows_json=excluded.rows_json,updated_at=excluded.updated_at RETURNING id")
   .bind(owner,id,input.bankLabel,serialized,JSON.stringify(rows),stamp,stamp,owner,owner,id).first<{id:string}>();
 if(!stored)return reply({error:"Puedes guardar hasta 20 revisiones. Descarta una antes de guardar otra."},409);
 const remaining=await db.prepare("SELECT count(*) AS n "+pendingRows+" AND draft.id=?").bind(owner,id).first<{n:number}>();
 return reply({id,saved:true,pending:remaining?.n??0});
}
export async function listPendingStatementDrafts(db:QuickD1,owner:string):Promise<PendingDraft[]>{
 return (await db.prepare("SELECT draft.id,draft.bank_label,draft.updated_at,count(*) pending,"+
   "sum(json_extract(item.value,'$.duplicate')) duplicates,sum(json_extract(item.value,'$.invalid')) invalid "+
   pendingRows+" GROUP BY draft.id,draft.bank_label,draft.updated_at ORDER BY draft.updated_at DESC,draft.id LIMIT 20")
   .bind(owner).all<PendingDraft>()).results;
}
export async function openStatementDraft(db:QuickD1,owner:string,id:string):Promise<Response>{
 if(!ID.test(id))return reply({error:"Revisión inválida."},422);
 const stored=await db.prepare("SELECT input_json FROM quick_statement_review_drafts "+
   "WHERE owner_id=? AND id=?").bind(owner,id).first<DraftRecord>();
 if(!stored)return reply({error:"No se encontró una revisión guardada en tu perfil."},404);
 const input=minimalInput(JSON.parse(stored.input_json));
 const result=await review(db,owner,input);
 const pending=await db.prepare("SELECT json_extract(item.value,'$.index') idx "+pendingRows+" AND draft.id=?")
   .bind(owner,id).all<{idx:number}>();
 const remaining=new Set(pending.results.map(row=>row.idx));
 const rows=result.rows.filter(row=>remaining.has(row.index));
 return reply({id,input,result:{...result,rows,count:rows.length}});
}
export async function discardStatementDraft(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
 const data=raw as {id?:unknown;confirmed?:unknown}|null;
 if(!data||typeof data.id!=="string"||!ID.test(data.id)||data.confirmed!==true||
   Object.keys(data).some(key=>!["id","confirmed"].includes(key)))return reply({error:"Confirma cuál revisión deseas descartar."},422);
 await db.prepare("DELETE FROM quick_statement_review_drafts WHERE owner_id=? AND id=? RETURNING id").bind(owner,data.id).first();
 return reply({discarded:true});
}
