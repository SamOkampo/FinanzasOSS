import type {QuickD1} from "./index.js";
import {CategoryInputError} from "./categorization.js";

type Deposit = {id:string;bank_label:string;debited_on:string;cop_minor:number;credited_on:string|null;
  usd_minor:number|null;fee_cop_minor:number|null;broker_ref:string|null;origin_source:string|null;origin_id:string|null};
type Origin = {id:string;bank_label:string;debited_on:string;cop_minor:number;source:"manual"|"statement"};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
}});
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const FIELDS="id,bank_label,debited_on,cop_minor,credited_on,usd_minor,fee_cop_minor,broker_ref,origin_source,origin_id";
const originsQuery="SELECT id,bank_label,substr(datetime(occurred_at,'-5 hours'),1,10) debited_on,amount_minor cop_minor,'manual' AS source "+
  "FROM quick_manual_entries WHERE owner_id=? AND kind='investment_transfer' AND currency='COP' AND deleted_at IS NULL "+
  "AND bank_label IS NOT NULL UNION ALL SELECT id,bank_label,occurred_on debited_on,amount_minor cop_minor,'statement' AS source "+
  "FROM quick_statement_review_decisions WHERE owner_id=? AND action='own_transfer' AND direction='debit' "+
  "AND lower(trim(counterparty_label)) IN ('hapi','hapi (bróker)','hapi (broker)')";
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const bad=(message:string):never=>{throw new CategoryInputError(message);};
function input(raw:unknown,allowed:string[]):Record<string,unknown>{
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).some(key=>!allowed.includes(key)))bad("Solicitud inválida.");
  const data=raw as Record<string,unknown>;
  if(data.confirmed!==true)bad("Confirma los datos del aporte.");
  return data;
}
function text(value:unknown,label:string,max:number):string{
  if(typeof value==="string"&&value.trim()&&value.trim().length<=max&&!/[\x00-\x1f\x7f]/.test(value))return value.trim();
  return bad("Verifica "+label+".");
}
function date(value:unknown):string{
  const day=text(value,"la fecha",10);
  const parsed=new Date(day+"T12:00:00Z");
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==day||day>today())
    return bad("Selecciona una fecha válida que no sea futura.");
  return day;
}
function minor(value:unknown,max:number,allowZero=false):number{
  if(typeof value!=="string"||!/^(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(value))return bad("Escribe el importe sin separadores de miles.");
  const [whole,fraction=""]=value.split(".");
  const n=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  if(n>max||(!n&&!allowZero))return bad("Importe fuera del rango permitido.");
  return n;
}
function dto(row:Deposit){
  const rate=row.usd_minor?(BigInt(row.cop_minor)*10000n+BigInt(row.usd_minor)/2n)/BigInt(row.usd_minor):null;
  return {id:row.id,bank:row.bank_label,debitedOn:row.debited_on,copMinor:String(row.cop_minor),
    creditedOn:row.credited_on,usdMinor:row.usd_minor==null?null:String(row.usd_minor),
    feeCopMinor:row.fee_cop_minor==null?null:String(row.fee_cop_minor),reference:row.broker_ref,
    originSource:row.origin_source,originId:row.origin_id,status:row.usd_minor?"credited":"pending",
    effectiveCopPerUsd:rate===null?null:String(rate/10000n)+"."+String(rate%10000n).padStart(4,"0")};
}
export async function listHapiDeposits(db:QuickD1,owner:string):Promise<Response>{
  const [deposits,origins]=await Promise.all([
    db.prepare("SELECT "+FIELDS+" FROM quick_hapi_deposits WHERE owner_id=? ORDER BY debited_on DESC,id LIMIT 100")
      .bind(owner).all<Deposit>(),
    db.prepare("SELECT o.* FROM ("+originsQuery+") o WHERE NOT EXISTS(SELECT 1 FROM quick_hapi_deposits d "+
      "WHERE d.owner_id=? AND d.origin_source=o.source AND d.origin_id=o.id) ORDER BY o.debited_on DESC,o.id LIMIT 30")
      .bind(owner,owner,owner).all<Origin>(),
  ]);
  return response({provider:"hapi",connection:"manual",currency:"USD",items:deposits.results.map(dto),origins:origins.results});
}
export async function saveHapiDeposit(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const data=input(raw,["requestKey","origin","bank","debitedOn","copAmount","confirmed"]);
  const requestKey=text(data.requestKey,"el identificador",96);
  if(!KEY.test(requestKey))return bad("Identificador del aporte inválido.");
  let origin:Origin|null=null;
  if(data.origin!==undefined){
    if(typeof data.origin!=="string"||! /^(manual|statement):[\w-]{12,100}$/.test(data.origin)||
      data.bank!==undefined||data.debitedOn!==undefined||data.copAmount!==undefined)return bad("Selecciona un movimiento de origen válido.");
    const [source,id]=data.origin.split(":");
    origin=await db.prepare("SELECT * FROM ("+originsQuery+") WHERE source=? AND id=? LIMIT 1")
      .bind(owner,owner,source!,id!).first<Origin>();
    if(!origin)return response({error:"El movimiento de origen no está disponible en tu perfil."},404);
  }
  const bank=origin?.bank_label??text(data.bank,"el banco de origen",80);
  const debitedOn=origin?.debited_on??date(data.debitedOn);
  const copMinor=origin?.cop_minor??minor(data.copAmount,1000000000000);
  const source=origin?.source??null, originId=origin?.id??null;
  const saved=await db.prepare("INSERT INTO quick_hapi_deposits(id,owner_id,request_key,bank_label,debited_on,cop_minor,origin_source,origin_id) "+
    "VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING RETURNING "+FIELDS)
    .bind(crypto.randomUUID(),owner,requestKey,bank,debitedOn,copMinor,source,originId).first<Deposit>();
  if(saved)return response(dto(saved),201);
  const prior=await db.prepare("SELECT "+FIELDS+" FROM quick_hapi_deposits WHERE owner_id=? AND request_key=?")
    .bind(owner,requestKey).first<Deposit>();
  if(prior&&prior.bank_label===bank&&prior.debited_on===debitedOn&&prior.cop_minor===copMinor&&prior.origin_source===source&&prior.origin_id===originId)
    return response(dto(prior));
  return response({error:"El movimiento de origen o el identificador ya pertenece a otro aporte."},409);
}
export async function confirmHapiCredit(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const data=input(raw,["id","creditedOn","usdAmount","reference","feeCop","confirmed"]);
  const id=text(data.id,"el identificador",36);
  if(!/^[a-f0-9-]{36}$/.test(id))return bad("Identificador del aporte inválido.");
  const creditedOn=date(data.creditedOn),usdMinor=minor(data.usdAmount,100000000000);
  const reference=text(data.reference,"la referencia del comprobante de Hapi",80);
  const fee=data.feeCop===undefined?null:minor(data.feeCop,1000000000000,true);
  const current=await db.prepare("SELECT "+FIELDS+" FROM quick_hapi_deposits WHERE owner_id=? AND id=?")
    .bind(owner,id).first<Deposit>();
  if(!current)return response({error:"El aporte no está disponible en tu perfil."},404);
  if(creditedOn<current.debited_on||(fee!==null&&fee>current.cop_minor))return bad("La fecha o la comisión no coincide con el aporte.");
  if(current.usd_minor!==null&&current.credited_on===creditedOn&&current.usd_minor===usdMinor&&
    current.broker_ref===reference&&current.fee_cop_minor===fee)return response(dto(current));
  const saved=await db.prepare("UPDATE OR IGNORE quick_hapi_deposits SET credited_on=?,usd_minor=?,broker_ref=?,fee_cop_minor=? "+
    "WHERE owner_id=? AND id=? AND usd_minor IS NULL RETURNING "+FIELDS)
    .bind(creditedOn,usdMinor,reference,fee,owner,id).first<Deposit>();
  if(saved)return response(dto(saved));
  const latest=await db.prepare("SELECT "+FIELDS+" FROM quick_hapi_deposits WHERE owner_id=? AND id=?")
    .bind(owner,id).first<Deposit>();
  if(latest?.credited_on===creditedOn&&latest.usd_minor===usdMinor&&latest.broker_ref===reference&&latest.fee_cop_minor===fee)
    return response(dto(latest));
  return response({error:"El aporte ya fue confirmado o esta referencia de Hapi pertenece a otro aporte."},409);
}

type Position = {symbol:string;quantity:string;marketValueMinor:string;assetType?:"security"|"crypto";costBasisMinor?:string};
type Snapshot = {id:string;as_of:string;cash_minor:number;positions_json:string;
  fx_cop_per_usd:string|null;fx_source:string|null;fx_observed_at:string|null};
const SNAPSHOT_FIELDS="id,as_of,cash_minor,positions_json,fx_cop_per_usd,fx_source,fx_observed_at";
async function portfolioHistory(db:QuickD1,owner:string) {
  return (await db.prepare("SELECT "+SNAPSHOT_FIELDS+" FROM quick_hapi_portfolio_snapshots "+
    "WHERE owner_id=? ORDER BY as_of DESC LIMIT 12").bind(owner).all<Snapshot>()).results;
}
function snapshotDto(snapshot:Snapshot) {
  const positions=JSON.parse(snapshot.positions_json) as Position[];
  const byAsset={security:0n,crypto:0n,unclassified:0n};
  const positionsWithReturns=positions.map(position=>{
    const market=BigInt(position.marketValueMinor);
    byAsset[position.assetType??"unclassified"]+=market;
    return {...position,...(position.costBasisMinor===undefined?{}:{
      unrealizedMinor:String(market-BigInt(position.costBasisMinor)),
    })};
  });
  const marketValue=byAsset.security+byAsset.crypto+byAsset.unclassified;
  const total=BigInt(snapshot.cash_minor)+marketValue;
  let fx=null;
  if(snapshot.fx_cop_per_usd&&snapshot.fx_source&&snapshot.fx_observed_at){
    const [whole,decimals=""]=snapshot.fx_cop_per_usd.split(".");
    const rate=BigInt(whole!+decimals.padEnd(6,"0"));
    const rounded=((total<0n?-total:total)*rate+500000n)/1000000n;
    fx={copPerUsd:snapshot.fx_cop_per_usd,source:snapshot.fx_source,observedAt:snapshot.fx_observed_at,
      totalCopMinor:String(total<0n?-rounded:rounded)};
  }
  return {id:snapshot.id,asOf:snapshot.as_of,cashMinor:String(snapshot.cash_minor),positions:positionsWithReturns,
    marketValueMinor:String(marketValue),totalMinor:String(total),
    allocation:{security:String(byAsset.security),crypto:String(byAsset.crypto),unclassified:String(byAsset.unclassified)},fx};
}
export async function listHapiPortfolio(db:QuickD1,owner:string):Promise<Response>{
  const history=(await portfolioHistory(db,owner)).map(snapshotDto);
  const latest=history[0]??null;
  const contributions=latest?await db.prepare("SELECT CAST(SUM(usd_minor) AS TEXT) AS minor "+
    "FROM quick_hapi_deposits WHERE owner_id=? AND usd_minor IS NOT NULL AND credited_on<=?")
    .bind(owner,latest.asOf).first<{minor:string|null}>():null;
  return response({provider:"hapi",currency:"USD",connection:"manual",latest,
    creditedAtLatestCutMinor:contributions?.minor??null,
    history:history.map(({asOf,cashMinor,marketValueMinor,totalMinor})=>({asOf,cashMinor,marketValueMinor,totalMinor}))});
}
export async function saveHapiPortfolio(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const data=input(raw,["asOf","cashUsd","positions","fx","printedTotalUsd","confirmed"]);
  const asOf=date(data.asOf);
  const cashText=text(data.cashUsd,"el efectivo neto en USD",20);
  const cashMinor=cashText.startsWith("-")?-minor(cashText.slice(1),100000000000,true):minor(cashText,100000000000,true);
  let rate:string|null=null,source:string|null=null,observedAt:string|null=null;
  if(data.fx!==undefined){
    if(!data.fx||typeof data.fx!=="object"||Array.isArray(data.fx)||Object.keys(data.fx).some(k=>!["copPerUsd","source","observedAt"].includes(k)))
      return bad("Verifica la cotización COP del corte.");
    const fx=data.fx as Record<string,unknown>;
    const rawRate=text(fx.copPerUsd,"la tasa COP por USD",16);
    if(!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,6})?$/.test(rawRate)||!/[1-9]/.test(rawRate))
      return bad("Escribe una tasa positiva con máximo seis decimales.");
    rate=rawRate.includes(".")?rawRate.replace(/0+$/,"").replace(/\.$/,""):rawRate;
    source=text(fx.source,"la fuente de la tasa",80);
    const observed=text(fx.observedAt,"la fecha y hora de la tasa",29);
    const instant=new Date(observed);
    if(!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(observed)||!Number.isFinite(+instant)||
       instant.toISOString().slice(0,19)!==observed.slice(0,19)||instant.getTime()>Date.now()||
       new Date(instant.getTime()-18000000).toISOString().slice(0,10)!==asOf)
      return bad("La hora de la tasa debe pertenecer al día del corte en Bogotá.");
    observedAt=instant.toISOString();
  }
  if(!Array.isArray(data.positions)||data.positions.length>60)return bad("Registra hasta 60 posiciones.");
  const symbols=new Set<string>();
  const positions=data.positions.map(raw=>{
    if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).some(key=>!["symbol","quantity","marketValueUsd","assetType","costBasisUsd"].includes(key)))
      return bad("Formato de posición inválido.");
    const symbol=text(raw.symbol,"el símbolo del activo",16).toUpperCase();
    const quantity=text(raw.quantity,"la cantidad del activo",28);
    if(!/^[A-Z0-9][A-Z0-9./-]{0,15}$/.test(symbol)||symbols.has(symbol))
      return bad("Verifica los símbolos. Cada activo debe aparecer una vez.");
    if(!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/.test(quantity)||!/[1-9]/.test(quantity))
      return bad("Indica una cantidad positiva, con hasta 12 decimales.");
    symbols.add(symbol);
    if(raw.assetType!==undefined&&raw.assetType!=="security"&&raw.assetType!=="crypto")
      return bad("Selecciona un tipo de activo válido.");
    return {symbol,quantity:quantity.includes(".")?quantity.replace(/0+$/,"").replace(/\.$/,""):quantity,
      marketValueMinor:String(minor(raw.marketValueUsd,100000000000,true)),
      ...(raw.assetType===undefined?{}:{assetType:raw.assetType}),
      ...(raw.costBasisUsd===undefined?{}:{costBasisMinor:String(minor(raw.costBasisUsd,100000000000,true))})};
  });
  if(data.printedTotalUsd!==undefined){
    const printed=text(data.printedTotalUsd,"el total impreso",20);
    if(!/^-?(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/.test(printed))return bad("El total impreso no es válido.");
    const negative=printed.startsWith("-");
    const [whole,dec=""]=printed.replace(/^-/,"").split(".");
    const expected=(BigInt(whole!)*100n+BigInt(dec.padEnd(2,"0")))*(negative?-1n:1n);
    const actual=positions.reduce((sum,p)=>sum+BigInt(p.marketValueMinor),BigInt(cashMinor));
    if(expected!==actual)return bad("El efectivo y las posiciones no cuadran con el total impreso.");
  }
  positions.sort((a,b)=>a.symbol.localeCompare(b.symbol,"en"));
  const encoded=JSON.stringify(positions);
  const saved=await db.prepare("INSERT INTO quick_hapi_portfolio_snapshots(id,owner_id,as_of,cash_minor,positions_json,fx_cop_per_usd,fx_source,fx_observed_at) "+
    "VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,as_of) DO NOTHING RETURNING "+SNAPSHOT_FIELDS)
    .bind(crypto.randomUUID(),owner,asOf,cashMinor,encoded,rate,source,observedAt).first<Snapshot>();
  if(saved)return response(snapshotDto(saved),201);
  const prior=await db.prepare("SELECT "+SNAPSHOT_FIELDS+" FROM quick_hapi_portfolio_snapshots WHERE owner_id=? AND as_of=?")
    .bind(owner,asOf).first<Snapshot>();
  if(prior&&prior.cash_minor===cashMinor&&prior.positions_json===encoded&&prior.fx_cop_per_usd===rate&&
     prior.fx_source===source&&prior.fx_observed_at===observedAt)return response(snapshotDto(prior));
  return response({error:"Ya registraste un corte distinto para esta fecha."},409);
}
