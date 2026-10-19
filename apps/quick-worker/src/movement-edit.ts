// Owner-bound staging-only corrections. Keep original rows for audit and
// iPhone Shortcut idempotency: deleting merely hides them from active history.
import type {QuickD1} from "./index.js";
export class MovementInputError extends Error {
  constructor(message:string,readonly status=422){super(message);}
}
type Body=Record<string,unknown>;
const methods=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]);
const banks=new Set(["debit_card","credit_card","bank_transfer"]);
function reply(data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
    "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  }});
}
function validBody(data:unknown):Body {
  if(!data||typeof data!=="object"||Array.isArray(data))
    throw new MovementInputError("Object required");
  const d=data as Body;
  if(Object.keys(d).some(x=>!["operation","source","id","expectedRevision","confirmed",
    "amount","concept","paymentMethod","bankLabel"].includes(x)))
    throw new MovementInputError("Unsupported field");
  if(d.operation!=="edit"&&d.operation!=="delete")
    throw new MovementInputError("Invalid operation");
  if(d.source!=="manual"&&d.source!=="accountless")
    throw new MovementInputError("Invalid movement source");
  if(typeof d.id!=="string"||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.id))
    throw new MovementInputError("Invalid movement ID");
  if(typeof d.expectedRevision!=="number"||!Number.isSafeInteger(d.expectedRevision)||
    d.expectedRevision<0||d.expectedRevision>100000000)
    throw new MovementInputError("Invalid revision");
  if(d.confirmed!==true)throw new MovementInputError("Explicit confirmation required");
  return d;
}
function amountInMinor(value:unknown):number{
  if(typeof value!=="string"||!/^[0-9]{1,10}(?:\.[0-9]{1,2})?$/.test(value))
    throw new MovementInputError("Enter a valid COP amount");
  const [pesos,cents=""]=value.split(".");
  const minor=Number(pesos)*100+Number(cents.padEnd(2,"0"));
  if(!Number.isSafeInteger(minor)||minor<=0||minor>1000000000000)
    throw new MovementInputError("Amount is outside allowed range");
  return minor;
}
function cleanText(value:unknown,max:number){
  if(typeof value!=="string")throw new MovementInputError("Text expected");
  const result=value.trim();
  if(!result||result.length>max||/[\u0000-\u001f\u007f]/.test(result))
    throw new MovementInputError("Invalid text");
  return result;
}
export async function changeMovement(db:QuickD1,owner:string,body:unknown):Promise<Response>{
  const d=validBody(body);
  const table=d.source==="manual"?"quick_manual_entries":"quick_shortcut_expenses";
  // SQL table name comes ONLY from a fixed internal allowlist.
  const id=d.id as string,rev=d.expectedRevision as number;
  const record=await db.prepare("SELECT id,kind,currency,deleted_at,revision FROM "+table+
    " WHERE owner_id=? AND id=?").bind(owner,id).first<
      {id:string;kind:string;currency:string;deleted_at:string|null;revision:number}>();
  if(!record)return reply({error:"Movement not found"},404);
  if(record.deleted_at)return reply({error:"Movement was already removed"},409);
  if(record.revision!==rev)return reply({error:"Movement changed, reload the list"},409);
  const time=new Date().toISOString();
  if(d.operation==="delete"){
    if(Object.keys(d).some(x=>["amount","concept","paymentMethod","bankLabel"].includes(x)))
      throw new MovementInputError("Delete does not accept editable fields");
    const updated=await db.prepare("UPDATE "+table+
      " SET deleted_at=?,revision=revision+1 WHERE owner_id=? AND id=? AND revision=? "+
      "AND deleted_at IS NULL RETURNING id,revision"
    ).bind(time,owner,id,rev).first<{id:string;revision:number}>();
    if(!updated)return reply({error:"Movement changed, reload the list"},409);
    return reply({deleted:true,id,revision:updated.revision});
  }
  // Do not silently reclassify transfers or change bank ledger associations.
  if(record.kind!=="purchase"||record.currency!=="COP")
    return reply({error:"Only COP purchases can be edited here"},422);
  const amount=amountInMinor(d.amount);
  const concept=cleanText(d.concept,120);
  const method=d.paymentMethod;
  if(typeof method!=="string"||!methods.has(method))
    throw new MovementInputError("Invalid payment method");
  const bankLabel=d.bankLabel===null||d.bankLabel===undefined||d.bankLabel===""?
    null:cleanText(d.bankLabel,80);
  if((banks.has(method)&&!bankLabel)||(!banks.has(method)&&bankLabel!==null))
    throw new MovementInputError("Bank required for cards/transfers only");
  const updated=await db.prepare(
    "UPDATE "+table+" SET amount_minor=?,merchant=?,payment_method=?,bank_label=?,"+
    "edited_at=?,revision=revision+1 WHERE owner_id=? AND id=? AND revision=? "+
    "AND kind='purchase' AND currency='COP' AND deleted_at IS NULL RETURNING id,revision"
  ).bind(amount,concept,method,bankLabel,time,owner,id,rev)
    .first<{id:string;revision:number}>();
  if(!updated)return reply({error:"Movement changed, reload the list"},409);
  return reply({saved:true,id,revision:updated.revision});
}
