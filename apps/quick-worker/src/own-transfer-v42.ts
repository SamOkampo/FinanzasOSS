import type { QuickD1 } from "./index.js";
import { normalizeShortcutAmount } from "./shortcut-direct.js";

const labels = new Map(["Plata Pay","Bancolombia","Davivienda","Daviplata","Lulo Bank","Efectivo"].map(s=>[s.toLowerCase(),s]));
type TransferRow={id:string;amount_minor:number;from_bank_label:string;to_bank_label:string;occurred_at:string};
function reply(body:unknown,status:number){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}
export async function saveOwnTransfer(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 if(!body||typeof body!=="object"||Array.isArray(body))return reply({error:"invalid_body"},422);
 const o=body as Record<string,unknown>;
 if(Object.keys(o).some(k=>!["clientEntryId","amount","fromBankLabel","toBankLabel"].includes(k)))return reply({error:"invalid_fields"},422);
 const key=o.clientEntryId;
 if(typeof key!=="string"||!/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(key))return reply({error:"invalid_entry_id"},422);
 const source=typeof o.fromBankLabel==="string"?labels.get(o.fromBankLabel.trim().toLowerCase()):undefined;
 const destination=typeof o.toBankLabel==="string"?labels.get(o.toBankLabel.trim().toLowerCase()):undefined;
 if(!source||!destination||source===destination)return reply({error:"invalid_accounts"},422);
 const amount=normalizeShortcutAmount(o.amount);
 if(typeof amount!=="string"||!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(amount))return reply({error:"invalid_amount"},422);
 const [whole,decimal=""]=amount.split(".");
 const minor=Number(whole)*100+Number(decimal.padEnd(2,"0"));
 if(!Number.isSafeInteger(minor)||minor<1||minor>1000000000000)return reply({error:"invalid_amount"},422);
 const row=await db.prepare("INSERT INTO quick_v42_own_transfers(id,owner_id,client_entry_id,amount_minor,from_bank_label,to_bank_label,occurred_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id,amount_minor,from_bank_label,to_bank_label,occurred_at").bind(crypto.randomUUID(),owner,key,minor,source,destination,new Date().toISOString()).first<TransferRow>();
 const existing=row??await db.prepare("SELECT id,amount_minor,from_bank_label,to_bank_label,occurred_at FROM quick_v42_own_transfers WHERE owner_id=? AND client_entry_id=?").bind(owner,key).first<TransferRow>();
 if(!existing||existing.amount_minor!==minor||existing.from_bank_label!==source||existing.to_bank_label!==destination)return reply({error:"idempotency_conflict"},409);
 return reply({ok:true,entryId:existing.id,amountMinor:minor,fromBankLabel:source,toBankLabel:destination,occurredAt:existing.occurred_at,replayed:!row},row?201:200);
}

// A single owner-scoped write archives the old state via D1 triggers and changes both virtual legs together.
// Revision is the number of archived changes, including no-op edits; stale requests cannot overwrite newer edits.
export async function changeOwnTransfer(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 if(!body||typeof body!=="object"||Array.isArray(body))return reply({error:"invalid_body"},422);
 const d=body as Record<string,unknown>;
 if(d.operation!=="edit"&&d.operation!=="delete")return reply({error:"invalid_operation"},422);
 const allowed=d.operation==="edit"?["operation","id","expectedRevision","confirmed","amount","fromBankLabel","toBankLabel"]:["operation","id","expectedRevision","confirmed"];
 if(Object.keys(d).some(k=>!allowed.includes(k))||d.confirmed!==true)return reply({error:"confirmation_required_or_invalid_fields"},422);
 if(typeof d.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.id)||typeof d.expectedRevision!=="number"||!Number.isSafeInteger(d.expectedRevision)||d.expectedRevision<0)return reply({error:"invalid_id_or_revision"},422);
 const schema=await db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE (type='table' AND name='quick_v421_transfer_audit') OR (type='trigger' AND name IN ('quick_v421_transfer_archive_edit','quick_v421_transfer_archive_delete','quick_v421_transfer_prevent_replay'))").first<{n:number}>();
 if(schema?.n!==4)return reply({error:"transfer_corrections_unavailable"},503);
 const predicate=" WHERE owner_id=? AND id=? AND (SELECT COUNT(*) FROM quick_v421_transfer_audit a WHERE a.owner_id=quick_v42_own_transfers.owner_id AND a.transfer_id=quick_v42_own_transfers.id)=? RETURNING id";
 let result:{id:string}|null;
 if(d.operation==="delete"){
  result=await db.prepare("DELETE FROM quick_v42_own_transfers"+predicate).bind(owner,d.id,d.expectedRevision).first<{id:string}>();
 }else{
  const source=typeof d.fromBankLabel==="string"?labels.get(d.fromBankLabel.trim().toLowerCase()):undefined;
  const destination=typeof d.toBankLabel==="string"?labels.get(d.toBankLabel.trim().toLowerCase()):undefined;
  if(!source||!destination||source===destination)return reply({error:"invalid_accounts"},422);
  const amount=normalizeShortcutAmount(d.amount);
  if(typeof amount!=="string"||!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(amount))return reply({error:"invalid_amount"},422);
  const [whole,decimal=""]=amount.split(".");
  const minor=Number(whole)*100+Number(decimal.padEnd(2,"0"));
  if(!Number.isSafeInteger(minor)||minor<1||minor>1000000000000)return reply({error:"invalid_amount"},422);
  result=await db.prepare("UPDATE quick_v42_own_transfers SET amount_minor=?,from_bank_label=?,to_bank_label=?"+predicate).bind(minor,source,destination,owner,d.id,d.expectedRevision).first<{id:string}>();
 }
 if(!result)return reply({error:"transfer_missing_or_changed"},409);
 return reply({id:result.id,revision:d.expectedRevision+1,...(d.operation==="delete"?{deleted:true}:{saved:true})},200);
}
