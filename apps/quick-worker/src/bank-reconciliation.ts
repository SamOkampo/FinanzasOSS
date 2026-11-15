// Verified snapshots and arithmetic reconciliation against labeled, already recorded bank movements.
// This is NOT a bank connection or a live balance. Never alter ledger records.
import type { QuickD1 } from "./index.js";

export class BalanceInputError extends Error {
  constructor(message:string,readonly status=422){super(message);}
}
type SqlAccount={id:string;owner_id:string;bank_label:string;account_type:string;currency:string};
type SqlSnapshot={id:string;account_id:string;request_key:string;amount_minor:number;as_of:string;created_at:string};
type Flow={in_minor:number;out_minor:number;in_count:number;out_count:number};
const KEY=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/;
const TYPES=new Set(["deposit","cash","credit"]);
function response(data:unknown,status=200):Response{
 return new Response(JSON.stringify(data),{status,headers:{
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"
 }});
}
function payload(body:unknown):{bankLabel:string;accountType:string;requestKey:string;amountMinor:number;asOf:string}{
 if(!body||typeof body!=="object"||Array.isArray(body))throw new BalanceInputError("Se requiere un objeto JSON.");
 const o=body as Record<string,unknown>;
 const allowed=new Set(["bankLabel","accountType","requestKey","amount","asOf","confirmed"]);
 if(Object.keys(o).some(k=>!allowed.has(k)))throw new BalanceInputError("Campo no admitido.");
 if(o.confirmed!==true)throw new BalanceInputError("Confirma el saldo leído en tu banco.");
 if(typeof o.bankLabel!=="string"||o.bankLabel.trim().length<1||o.bankLabel.trim().length>80||
   /[\u0000-\u001f\u007f]/.test(o.bankLabel))throw new BalanceInputError("Especifica el banco o billetera.");
 if(typeof o.accountType!=="string"||!TYPES.has(o.accountType))throw new BalanceInputError("Tipo de cuenta inválido.");
 if(typeof o.requestKey!=="string"||!KEY.test(o.requestKey))throw new BalanceInputError("Identificador inválido.");
 if(typeof o.amount!=="string"||!/^(?:0|[1-9][0-9]{0,9})$/.test(o.amount))throw new BalanceInputError("Saldo COP entero inválido.");
 const amountMinor=Number(o.amount)*100;
 if(!Number.isSafeInteger(amountMinor)||amountMinor>1000000000000)throw new BalanceInputError("Saldo fuera del límite permitido.");
 if(typeof o.asOf!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(o.asOf)||
   !Number.isFinite(Date.parse(o.asOf))||new Date(o.asOf).toISOString()!==o.asOf||
   Date.parse(o.asOf)>Date.now()+5*60000)throw new BalanceInputError("Fecha de saldo inválida o futura.");
 return {bankLabel:o.bankLabel.trim(),accountType:o.accountType,requestKey:o.requestKey,
   amountMinor,asOf:o.asOf};
}
export async function saveVerifiedBalance(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 const d=payload(body);
 await db.prepare("INSERT INTO quick_balance_accounts(id,owner_id,bank_label,account_type) VALUES(?,?,?,?) "+
  "ON CONFLICT(owner_id,bank_label) DO NOTHING RETURNING id")
  .bind(crypto.randomUUID(),owner,d.bankLabel,d.accountType).first();
 const account=await db.prepare("SELECT id,owner_id,bank_label,account_type,currency FROM quick_balance_accounts "+
   "WHERE owner_id=? AND bank_label=? COLLATE NOCASE LIMIT 1")
   .bind(owner,d.bankLabel).first<SqlAccount>();
 if(!account)throw new BalanceInputError("No se pudo verificar la cuenta.",503);
 if(account.account_type!==d.accountType)throw new BalanceInputError(
  "Esta entidad ya está registrada con otro tipo de cuenta; no se combinan saldos y deudas.",409);
 const prior=await db.prepare("SELECT id,account_id,request_key,amount_minor,as_of,created_at "+
  "FROM quick_balance_snapshots WHERE owner_id=? AND request_key=? LIMIT 1")
  .bind(owner,d.requestKey).first<SqlSnapshot>();
 if(prior){
  if(prior.account_id!==account.id||prior.amount_minor!==d.amountMinor||prior.as_of!==d.asOf)
    return response({error:"El identificador ya corresponde a otro saldo."},409);
  return response({snapshotId:prior.id,replayed:true,source:"user_verified"});
 }
 const row=await db.prepare("INSERT INTO quick_balance_snapshots("+
  "id,owner_id,account_id,request_key,amount_minor,as_of) VALUES(?,?,?,?,?,?) "+
  "ON CONFLICT DO NOTHING RETURNING id")
  .bind(crypto.randomUUID(),owner,account.id,d.requestKey,d.amountMinor,d.asOf).first<{id:string}>();
 if(!row)return response({error:"Ya existe otro saldo con esa hora, o el envío se duplicó. Revisa antes de reintentar."},409);
 return response({snapshotId:row.id,replayed:false,source:"user_verified"},201);
}
async function bankFlow(db:QuickD1,owner:string,label:string,after:string,until:string):Promise<Flow>{
 const query=[
  "SELECT SUM(credit_minor) AS in_minor,SUM(debit_minor) AS out_minor,",
  "SUM(credit_count) AS in_count,SUM(debit_count) AS out_count FROM (",
  "SELECT 0 AS credit_minor,SUM(amount_minor) AS debit_minor,0 AS credit_count,COUNT(*) AS debit_count ",
  "FROM quick_shortcut_expenses WHERE owner_id=? AND kind='purchase' AND deleted_at IS NULL ",
  "AND payment_method IN ('debit_card','bank_transfer','digital_wallet') ",
  "AND lower(trim(bank_label))=lower(trim(?)) AND occurred_at>? AND occurred_at<=? UNION ALL ",
  "SELECT 0,SUM(amount_minor),0,COUNT(*) FROM quick_manual_entries ",
  "WHERE owner_id=? AND kind='purchase' AND deleted_at IS NULL ",
  "AND payment_method IN ('debit_card','bank_transfer','digital_wallet') ",
  "AND lower(trim(bank_label))=lower(trim(?)) AND occurred_at>? AND occurred_at<=? UNION ALL ",
  "SELECT SUM(amount_minor),0,COUNT(*),0 FROM quick_income_entries ",
  "WHERE owner_id=? AND payment_method IN ('bank_transfer','digital_wallet') ",
  "AND lower(trim(bank_label))=lower(trim(?)) AND occurred_at>? AND occurred_at<=? UNION ALL ",
  "SELECT SUM(amount_minor),0,COUNT(*),0 FROM quick_statement_credits ",
  "WHERE owner_id=? AND lower(trim(bank_label))=lower(trim(?)) ",
  "AND occurred_at>? AND occurred_at<=? )"
 ].join("");
 const vals=[owner,label,after,until,owner,label,after,until,
   owner,label,after,until,owner,label,after,until];
 const v=await db.prepare(query).bind(...vals).first<Flow>();
 return {in_minor:Number(v?.in_minor||0),out_minor:Number(v?.out_minor||0),
   in_count:Number(v?.in_count||0),out_count:Number(v?.out_count||0)};
}
type VerifiedBalance = {
 id:string;label:string;type:string;currency:string;hasSnapshot:boolean;
 latest:{amountMinor:string;asOf:string;source:string}|null;
 previous:{amountMinor:string;asOf:string}|null;
 reconciliation:{status:string;expectedMinor:string;differenceMinor:string;incomingMinor:string;
  outgoingMinor:string;incomingCount:number;outgoingCount:number;after:string;until:string;scope:string}|null;
 connectionStatus:string;
};
export async function readVerifiedBalances(db:QuickD1,owner:string):Promise<VerifiedBalance[]>{
 const accounts=await db.prepare("SELECT id,owner_id,bank_label,account_type,currency "+
  "FROM quick_balance_accounts WHERE owner_id=? ORDER BY bank_label LIMIT 50").bind(owner).all<SqlAccount>();
 const items:VerifiedBalance[]=[];
 for(const account of accounts.results){
  const rows=await db.prepare("SELECT id,account_id,request_key,amount_minor,as_of,created_at "+
    "FROM quick_balance_snapshots WHERE owner_id=? AND account_id=? "+
    "ORDER BY as_of DESC,id DESC LIMIT 2").bind(owner,account.id).all<SqlSnapshot>();
  const [latest,previous]=rows.results;
  const item:VerifiedBalance={
    id:account.id,label:account.bank_label,type:account.account_type,currency:account.currency,
    hasSnapshot:Boolean(latest),latest:latest?{amountMinor:String(latest.amount_minor),asOf:latest.as_of,source:"user_verified"}:null,
    previous:previous?{amountMinor:String(previous.amount_minor),asOf:previous.as_of}:null,
    reconciliation:null,connectionStatus:"not_connected"
  };
  if(previous && latest && account.account_type==="deposit"){
    const flows=await bankFlow(db,owner,account.bank_label,previous.as_of,latest.as_of);
    const expected=previous.amount_minor+flows.in_minor-flows.out_minor;
    const difference=latest.amount_minor-expected;
    item.reconciliation={
      status:difference===0?"matches_recorded_movements":"difference_requires_review",
      expectedMinor:String(expected),differenceMinor:String(difference),
      incomingMinor:String(flows.in_minor),outgoingMinor:String(flows.out_minor),
      incomingCount:flows.in_count,outgoingCount:flows.out_count,
      after:previous.as_of,until:latest.as_of,
      scope:"Only exact-bank-label movements; not an official bank reconciliation"
    };
  }
  items.push(item);
 }
 return items;
}
export async function verifiedBalances(db:QuickD1,owner:string):Promise<Response>{
 const items=await readVerifiedBalances(db,owner);
 const aliases=await db.prepare(
  "SELECT bank_label AS label FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL "+
  "AND bank_label IS NOT NULL UNION SELECT bank_label FROM quick_income_entries "+
  "WHERE owner_id=? AND bank_label IS NOT NULL UNION SELECT bank_label "+
  "FROM quick_statement_credits WHERE owner_id=? UNION SELECT bank_label "+
  "FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL AND bank_label IS NOT NULL "+
  "ORDER BY label LIMIT 50"
 ).bind(owner,owner,owner,owner).all<{label:string}>();
 return response({accounts:items,bankLabels:aliases.results.map(x=>x.label),
  connectionStatus:"not_connected",balanceSource:"user_verified",
  note:"Saldos consultados por ti y fechados; no son acceso bancario en vivo. Solo se concilian depósitos con al menos dos snapshots y etiquetas exactas. Tarjetas de crédito muestran deuda y no se mezclan con efectivo."});
}
