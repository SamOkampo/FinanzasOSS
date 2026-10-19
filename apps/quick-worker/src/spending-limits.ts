// Owner-scoped expense budgets. Soft warnings only: never block or mutate purchases.
// Colombia runs at UTC-05 all year. All limits are independent COP amounts.
import type {QuickD1} from "./index.js";

type Period="day"|"week"|"month"|"year";
const PERIODS:Period[]=["day","week","month","year"];
type Stored={period:Period;limit_minor:number};
type Totals={day_minor:number;week_minor:number;month_minor:number;year_minor:number};

export class BudgetInputError extends Error {
  constructor(message:string,readonly status=422){super(message);}
}
function response(value:unknown,status=200):Response{
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store, private","Referrer-Policy":"no-referrer",
    "X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  }});
}
function dates(ts:number){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Bogota",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(ts));
  const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  const today=v.year+"-"+v.month+"-"+v.day;
  // Noon UTC avoids local timezone differences in day-of-week arithmetic.
  const monday=new Date(today+"T12:00:00Z");
  monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  return {day:today,week:monday.toISOString().slice(0,10),
    month:today.slice(0,7)+"-01",year:today.slice(0,4)+"-01-01",today};
}
export async function readBudgets(db:QuickD1,owner:string,now=Date.now()):Promise<Response>{
  const b=dates(now);
  // Explicit owner clauses in both sources. Never count transfers, investments,
  // non-purchases, or non-COP records. One SQL aggregation, no client history cache.
  const [stored,totals]=await Promise.all([
    db.prepare("SELECT period,limit_minor FROM quick_spending_limits WHERE owner_id=?")
      .bind(owner).all<Stored>(),
    db.prepare("SELECT "+
      "COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS day_minor,"+
      "COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS week_minor,"+
      "COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS month_minor,"+
      "COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS year_minor "+
      "FROM (SELECT amount_minor,substr(datetime(occurred_at,'-5 hours'),1,10) AS day "+
      "FROM quick_manual_entries WHERE owner_id=? AND kind='purchase' AND currency='COP' AND deleted_at IS NULL "+
      "UNION ALL SELECT amount_minor,substr(datetime(occurred_at,'-5 hours'),1,10) AS day "+
      "FROM quick_shortcut_expenses WHERE owner_id=? AND kind='purchase' AND currency='COP' AND deleted_at IS NULL) "+
      "WHERE day<=?"
    ).bind(b.day,b.week,b.month,b.year,owner,owner,b.today).first<Totals>(),
  ]);
  const limits=new Map(stored.results.map(x=>[x.period,Number(x.limit_minor)]));
  return response({currency:"COP",timezone:"America/Bogota",asOf:b.today,
    periods:Object.fromEntries(PERIODS.map(period=>{
      const start=b[period],spend=Number(totals?.[period+"_minor" as keyof Totals]??0);
      const limit=limits.get(period)??null;
      const remaining=limit===null?null:Math.max(0,limit-spend);
      const used=limit===null?null:Math.round(spend/limit*100);
      const status=limit===null?"unconfigured":spend>limit?"over":spend===limit?"exhausted":
        spend*100>=limit*80?"near":"ok";
      return [period,{start,spentMinor:String(spend),limitMinor:limit===null?null:String(limit),
        remainingMinor:remaining===null?null:String(remaining),usedPercent:used,status}];
    }))});
}
export async function writeBudget(db:QuickD1,owner:string,body:unknown):Promise<Response>{
  if(!body||typeof body!=="object"||Array.isArray(body))throw new BudgetInputError("Expected budget object");
  const input=body as Record<string,unknown>;
  if(Object.keys(input).some(k=>!["period","amountCOP"].includes(k)))
    throw new BudgetInputError("Unsupported field");
  if(!PERIODS.includes(input.period as Period))throw new BudgetInputError("Unsupported budget period");
  const period=input.period as Period;
  if(input.amountCOP===null){
    await db.prepare("DELETE FROM quick_spending_limits WHERE owner_id=? AND period=? RETURNING period")
      .bind(owner,period).first();
    return response({period,removed:true});
  }
  // Integers only: COP whole-peso user input, no float loss or silent rounding.
  if(typeof input.amountCOP!=="string"||!/^[1-9][0-9]{0,9}$/.test(input.amountCOP)||
    Number(input.amountCOP)>1000000000)
    throw new BudgetInputError("Limit must be an integer between 1 and 1000000000 COP");
  const minor=Number(input.amountCOP)*100;
  await db.prepare(
    "INSERT INTO quick_spending_limits(owner_id,period,limit_minor,updated_at) "+
    "VALUES(?,?,?,?) ON CONFLICT(owner_id,period) DO UPDATE SET "+
    "limit_minor=excluded.limit_minor,updated_at=excluded.updated_at RETURNING period"
  ).bind(owner,period,minor,new Date().toISOString()).first();
  return response({period,limitMinor:String(minor),saved:true});
}
