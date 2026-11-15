import type {QuickD1} from "./index.js";

type Side={id:string;bank_label:string;counterparty_label:string;payment_method:string;
  occurred_on:string;description:string;direction:"debit"|"credit";amount_minor:number};
type Candidate={debit_id:string;credit_id:string;from_label:string;to_label:string;debited_on:string;
  credited_on:string;debit_description:string;credit_description:string;amount_minor:number;kind:"own_transfer"|"card_payment"};
type Link=Candidate&{id:string;confirmed_at:string};
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const source="quick_statement_review_decisions";
const links="quick_statement_transfer_links";
const kind="CASE WHEN c.payment_method='credit_card' THEN 'card_payment' ELSE 'own_transfer' END";
const columns="d.id debit_id,c.id credit_id,d.bank_label from_label,c.bank_label to_label,"+
  "d.occurred_on debited_on,c.occurred_on credited_on,d.description debit_description,c.description credit_description,d.amount_minor";
const hapiNames="('hapi','hapi (bróker)','hapi (broker)')";
const paired="d.owner_id=c.owner_id AND d.direction='debit' AND c.direction='credit' "+
  "AND d.action='own_transfer' AND c.action='own_transfer' AND d.amount_minor=c.amount_minor "+
  "AND d.payment_method<>'credit_card' AND lower(trim(d.bank_label))<>lower(trim(c.bank_label)) "+
  "AND lower(trim(c.bank_label)) NOT IN "+hapiNames+" AND lower(trim(d.bank_label)) NOT IN "+hapiNames+" "+
  "AND lower(trim(d.counterparty_label))=lower(trim(c.bank_label)) "+
  "AND lower(trim(c.counterparty_label))=lower(trim(d.bank_label)) "+
  "AND c.occurred_on BETWEEN date(d.occurred_on,'-5 days') AND date(d.occurred_on,'+5 days')";
const missing="NOT EXISTS (SELECT 1 FROM "+links+" l WHERE l.owner_id=d.owner_id AND l.debit_id=d.id) "+
  "AND NOT EXISTS (SELECT 1 FROM "+links+" l WHERE l.owner_id=c.owner_id AND l.credit_id=c.id)";
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{
  "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
}});

export async function listStatementLinks(db:QuickD1,owner:string):Promise<Response>{
  const [candidates,pending,history]=await Promise.all([
    db.prepare("SELECT "+columns+","+kind+" kind FROM "+source+" d JOIN "+source+" c ON "+paired+
      " WHERE d.owner_id=? AND "+missing+
      " ORDER BY max(d.occurred_on,c.occurred_on) DESC,d.id,c.id LIMIT 50").bind(owner).all<Candidate>(),
    db.prepare("SELECT s.id,s.bank_label,s.counterparty_label,s.payment_method,s.occurred_on,s.description,s.direction,s.amount_minor "+
      "FROM "+source+" s WHERE s.owner_id=? AND s.action='own_transfer' AND "+
      "lower(trim(s.counterparty_label)) NOT IN "+hapiNames+" AND lower(trim(s.bank_label)) NOT IN "+hapiNames+" "+
      "AND NOT EXISTS (SELECT 1 FROM "+links+" l WHERE l.owner_id=s.owner_id AND "+
      "((s.direction='debit' AND l.debit_id=s.id) OR (s.direction='credit' AND l.credit_id=s.id))) "+
      "ORDER BY s.occurred_on DESC,s.id LIMIT 50").bind(owner).all<Side>(),
    db.prepare("SELECT l.id,l.kind,l.confirmed_at,"+columns+" FROM "+links+" l "+
      "JOIN "+source+" d ON d.owner_id=l.owner_id AND d.id=l.debit_id "+
      "JOIN "+source+" c ON c.owner_id=l.owner_id AND c.id=l.credit_id "+
      "WHERE l.owner_id=? ORDER BY l.confirmed_at DESC,l.id DESC LIMIT 50").bind(owner).all<Link>(),
  ]);
  return response({currency:"COP",limit:50,candidates:candidates.results,pending:pending.results,history:history.results});
}

export async function confirmStatementLink(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return response({error:"Confirma el cruce de los dos movimientos."},422);
  const data=raw as Record<string,unknown>;
  if(Object.keys(data).some(key=>!["debitId","creditId","confirmed"].includes(key))||data.confirmed!==true||
    typeof data.debitId!=="string"||!idPattern.test(data.debitId)||typeof data.creditId!=="string"||
    !idPattern.test(data.creditId)||data.creditId===data.debitId)
    return response({error:"Selecciona y confirma los dos movimientos."},422);
  const {debitId,creditId}=data;
  const inserted=await db.prepare("INSERT INTO "+links+"(id,owner_id,debit_id,credit_id,kind,confirmed_at) "+
    "SELECT ?,d.owner_id,d.id,c.id,"+kind+",? FROM "+source+" d JOIN "+source+" c ON "+paired+
    " WHERE d.owner_id=? AND d.id=? AND c.id=? AND "+missing+
    " ON CONFLICT DO NOTHING RETURNING id,kind,confirmed_at")
    .bind(crypto.randomUUID(),new Date().toISOString(),owner,debitId,creditId)
    .first<{id:string;kind:string;confirmed_at:string}>();
  if(inserted)return response({...inserted,replayed:false},201);
  const prior=await db.prepare("SELECT id,kind,confirmed_at FROM "+links+" WHERE owner_id=? AND debit_id=? AND credit_id=?")
    .bind(owner,debitId,creditId).first<{id:string;kind:string;confirmed_at:string}>();
  if(prior)return response({...prior,replayed:true});
  return response({error:"El cruce cambió o las filas no son compatibles. Actualiza las sugerencias."},409);
}
