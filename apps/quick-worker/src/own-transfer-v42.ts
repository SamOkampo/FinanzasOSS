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
