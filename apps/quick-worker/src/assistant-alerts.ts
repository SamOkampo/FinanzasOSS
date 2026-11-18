import type {QuickD1} from "./index.js";
import {readVerifiedBalances} from "./bank-reconciliation.js";
import {listPendingStatementDrafts} from "./statement-review-drafts.js";
import {readUnlinkedStatementSides} from "./statement-transfer-links.js";

export const ALERT_RULES = {
  unclassified_movement:"Compras por clasificar",
  unreconciled_balance:"Diferencias de saldo",
  hapi_deposit_pending:"Aportes pendientes en Hapi",
  credit_payment_due:"Pagos de tarjeta próximos",
  possible_duplicate:"Posibles duplicados en extractos",
  unmatched_internal_transfer:"Transferencias sin vincular",
  import_unreviewed:"Revisiones de extractos pendientes",
} as const;
type Rule = keyof typeof ALERT_RULES;
export const reconciliationNotificationRules=new Set<string>(["possible_duplicate","unmatched_internal_transfer","import_unreviewed"]);
type Alert = {
  key:string;
  fingerprint:string;
  rule:Exclude<Rule,"unclassified_movement">;
  title:string;
  detail:string;
  target:"balance"|"portfolio"|"review"|"transfer";
  targetId?:string;
  severity:"important"|"review"|"info";
};
type CreditDue = {account_id:string;bank_label:string;due_on:string;paid:number};
const format = new Intl.DateTimeFormat("en-CA",{
  timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit",
});
const cop = new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP"});
export const localDay = (now:number) => format.format(new Date(now));
function dayOffset(day:string,days:number):string {
  return new Date(Date.parse(day+"T12:00:00Z")+days*86400000).toISOString().slice(0,10);
}
export async function readAlertRules(db:QuickD1,owner:string) {
  const stored=await db.prepare("SELECT rule,enabled FROM quick_agent_alert_rules WHERE owner_id=? "+
    "UNION ALL SELECT rule,enabled FROM quick_agent_review_notification_rules WHERE owner_id=?")
    .bind(owner,owner).all<{rule:Rule;enabled:number}>();
  const rules=defaultAlertRules();
  for(const row of stored.results)rules[row.rule]=row.enabled===1;
  return rules;
}
export function defaultAlertRules():Record<Rule,boolean>{
  return Object.fromEntries(Object.keys(ALERT_RULES).map(rule=>[rule,true])) as Record<Rule,boolean>;
}
export async function operationalAlerts(db:QuickD1,owner:string,now:number,rules:Record<Rule,boolean>):Promise<Alert[]> {
  const day=localDay(now), end=dayOffset(day,7);
  const balances=rules.unreconciled_balance?await readVerifiedBalances(db,owner):[];
  const pending=rules.hapi_deposit_pending?
    (await db.prepare("SELECT id,bank_label,debited_on,cop_minor FROM quick_hapi_deposits "+
      "WHERE owner_id=? AND usd_minor IS NULL ORDER BY debited_on,id LIMIT 30")
      .bind(owner).all<{id:string;bank_label:string;debited_on:string;cop_minor:number}>()).results:[];
  const dues=rules.credit_payment_due?
    (await db.prepare("SELECT d.account_id,a.bank_label,d.due_on,d.paid FROM quick_agent_credit_due d "+
      "JOIN quick_balance_accounts a ON a.owner_id=d.owner_id AND a.id=d.account_id "+
      "WHERE d.owner_id=? AND d.paid=0 AND d.due_on<=? ORDER BY d.due_on,d.account_id LIMIT 30")
      .bind(owner,end).all<CreditDue>()).results:[];
  const [drafts,unlinked]=await Promise.all([
    (rules.import_unreviewed||rules.possible_duplicate)?listPendingStatementDrafts(db,owner):[],
    rules.unmatched_internal_transfer?readUnlinkedStatementSides(db,owner).then(result=>result.results):[],
  ]);
  return [
    ...dues.map(({account_id,bank_label,due_on}):Alert=>({
      key:"credit:"+account_id+":"+due_on,fingerprint:due_on+(due_on<day?":overdue":":due"),rule:"credit_payment_due",
      title:bank_label,detail:due_on<day?"Pago vencido el "+due_on+" según la fecha que registraste.":
        "Pago registrado para el "+due_on+".",target:"balance",severity:due_on<=day?"important":"review",
    })),
    ...balances.flatMap(({id,label,reconciliation}):Alert[]=>{
      if(!reconciliation||reconciliation.status!=="difference_requires_review")return [];
      const {differenceMinor,after,until}=reconciliation;
      return [{key:"balance:"+id,fingerprint:[after,until,differenceMinor].join("|"),rule:"unreconciled_balance",
        title:label,detail:"Diferencia de "+cop.format(Number(differenceMinor)/100)+
          " entre los cortes y los movimientos registrados.",target:"balance",severity:"review"}];
    }),
    ...drafts.flatMap((item):Alert[]=>{
      const duplicate=rules.possible_duplicate&&item.duplicates>0;
      if(!duplicate&&!rules.import_unreviewed)return [];
      return [{key:"draft:"+item.id,fingerprint:[item.pending,item.duplicates,item.invalid].join("|"),
        rule:duplicate?"possible_duplicate":"import_unreviewed",target:"review",targetId:item.id,severity:"review",
        title:item.bank_label,detail:item.pending+" filas pendientes"+(item.duplicates?
          " · "+item.duplicates+" con posibles coincidencias dentro o fuera del extracto":"")+
          (item.invalid?" · "+item.invalid+" por corregir":"")+".",
      }];
    }),
    ...unlinked.map((item):Alert=>({
      key:"transfer:"+item.id,fingerprint:item.id,rule:"unmatched_internal_transfer",
      title:item.bank_label+" · "+item.counterparty_label,
      detail:(item.direction==="debit"?"Salida":"Abono")+" del "+item.occurred_on+
        " por "+cop.format(item.amount_minor/100)+" pendiente de vincular.",
      target:"transfer",targetId:item.id,severity:"info",
    })),
    ...pending.map(({id,bank_label,debited_on,cop_minor}):Alert=>({
      key:"hapi:"+id,fingerprint:debited_on+":"+cop_minor,rule:"hapi_deposit_pending",title:"Aporte de "+bank_label,
      detail:"Salida del "+debited_on+" pendiente de acreditación en Hapi.",target:"portfolio",severity:"info",
    })),
  ];
}
export async function openOperationalAlerts(db:QuickD1,owner:string,now:number,rules:Record<Rule,boolean>) {
  const alerts=await operationalAlerts(db,owner,now,rules);
  if(!alerts.length)return [];
  const state=await db.prepare("SELECT alert_key,fingerprint,snoozed_until,notified_at,acknowledged_at FROM quick_agent_alert_state "+
    "WHERE owner_id=? AND alert_key IN (SELECT value FROM json_each(?)) "+
    "AND (snoozed_until>? OR notified_at IS NOT NULL OR acknowledged_at IS NOT NULL)")
    .bind(owner,JSON.stringify(alerts.map(alert=>alert.key)),new Date(now).toISOString())
    .all<{alert_key:string;fingerprint:string;snoozed_until:string|null;notified_at:string|null;acknowledged_at:string|null}>();
  const lookup=new Map(state.results.map(row=>[JSON.stringify([row.alert_key,row.fingerprint]),row]));
  return alerts.flatMap(alert=>{
    const existing=lookup.get(JSON.stringify([alert.key,alert.fingerprint]));
    if(existing?.acknowledged_at||existing?.snoozed_until&&existing.snoozed_until>new Date(now).toISOString())return [];
    return [{...alert,notified:Boolean(existing?.notified_at),status:existing?.notified_at?"notified":"new"}];
  });
}
export async function acknowledgeOperationalAlert(db:QuickD1,owner:string,key:string,fingerprint:string,now:number):Promise<boolean>{
  const match=(await operationalAlerts(db,owner,now,defaultAlertRules()))
    .find(alert=>alert.key===key&&alert.fingerprint===fingerprint);
  if(!match)return false;
  await db.prepare("INSERT INTO quick_agent_alert_state(owner_id,alert_key,fingerprint,acknowledged_at) VALUES(?,?,?,?) "+
    "ON CONFLICT(owner_id,alert_key,fingerprint) DO UPDATE SET acknowledged_at=COALESCE(quick_agent_alert_state.acknowledged_at,excluded.acknowledged_at) RETURNING alert_key")
    .bind(owner,match.key,match.fingerprint,new Date(now).toISOString()).first();
  return true;
}
export async function snoozeOperationalAlert(db:QuickD1,owner:string,key:string,now:number):Promise<boolean> {
  const alerts=await operationalAlerts(db,owner,now,defaultAlertRules());
  const match=alerts.find(row=>row.key===key);
  if(!match)return false;
  await db.prepare("INSERT INTO quick_agent_alert_state(owner_id,alert_key,fingerprint,snoozed_until) VALUES(?,?,?,?) "+
    "ON CONFLICT(owner_id,alert_key,fingerprint) DO UPDATE SET snoozed_until=excluded.snoozed_until RETURNING alert_key")
    .bind(owner,match.key,match.fingerprint,new Date(now+86400000).toISOString()).first();
  return true;
}
export async function saveCreditDue(db:QuickD1,owner:string,account:string,dueOn:string,paid:boolean):Promise<boolean> {
  const statement=paid?
    db.prepare("UPDATE quick_agent_credit_due SET paid=1 WHERE owner_id=? AND account_id=? AND due_on=? RETURNING account_id")
      .bind(owner,account,dueOn):
    db.prepare("INSERT INTO quick_agent_credit_due(owner_id,account_id,due_on) SELECT owner_id,id,? "+
      "FROM quick_balance_accounts WHERE owner_id=? AND id=? AND account_type='credit' "+
      "ON CONFLICT(owner_id,account_id,due_on) DO UPDATE SET due_on=excluded.due_on RETURNING account_id")
      .bind(dueOn,owner,account);
  return Boolean(await statement.first());
}
export async function creditSchedule(db:QuickD1,owner:string) {
  const [accounts,dues]=await Promise.all([
    db.prepare("SELECT id,bank_label FROM quick_balance_accounts WHERE owner_id=? AND account_type='credit' "+
      "ORDER BY bank_label LIMIT 50").bind(owner).all<{id:string;bank_label:string}>(),
    db.prepare("SELECT d.account_id,a.bank_label,d.due_on,d.paid FROM quick_agent_credit_due d "+
      "JOIN quick_balance_accounts a ON a.owner_id=d.owner_id AND a.id=d.account_id "+
      "WHERE d.owner_id=? AND d.paid=0 ORDER BY d.due_on LIMIT 30").bind(owner).all<CreditDue>(),
  ]);
  return {accounts:accounts.results,dues:dues.results};
}
export async function markAlertsNotified(db:QuickD1,owner:string,alerts:Pick<Alert,"key"|"fingerprint">[],timestamp:string) {
  const statements=alerts.map(alert=>db.prepare(
    "INSERT INTO quick_agent_alert_state(owner_id,alert_key,fingerprint,notified_at) VALUES(?,?,?,?) "+
    "ON CONFLICT(owner_id,alert_key,fingerprint) DO UPDATE SET notified_at=excluded.notified_at",
  ).bind(owner,alert.key,alert.fingerprint,timestamp));
  if(statements.length)await db.batch?.(statements);
}
