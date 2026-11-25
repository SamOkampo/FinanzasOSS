import type { QuickD1 } from "./index.js";
import { quickEconomicGroupSql } from "./economic-review.js";

// Finance dashboard: read-only, tenant-scoped, never infer an account,
// and never count transfers as purchases. Colombia is UTC-05 year-round.
// Daily aggregates make period switching fast without exposing other users.
type AggregateRow = { day: string; payment_method: string; amount_minor: number; quantity: number };
type BankAggregateRow = { day: string; bank: string; amount_minor: number; quantity: number };
type CategoryAggregateRow = { day: string; category: string; subcategory: string; amount_minor: number; quantity: number };
type MovementRow = {
  id: string; account_id: string | null; amount_minor: number; currency: string;
  payment_method: string; kind: string; occurred_at: string;
  merchant: string | null; bank_label: string | null; revision:number;
  source?:string;direction?:"credit"|"debit";economic_purpose?:string|null;income_category?:string|null;
  category?:string;subcategory?:string;category_status?:string;
};
const accountBound = "SELECT owner_id,'manual' AS source,id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision,'debit' AS direction,NULL AS economic_purpose,NULL AS income_category " +
  "FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL";
const accountFree = "SELECT owner_id,'accountless' AS source,id,NULL AS account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision,'debit' AS direction,NULL AS economic_purpose,NULL AS income_category " +
  "FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL";
// Credits from bank/card statements are read-only, owner-bound and non-expense.
const statementCredits = "SELECT owner_id,'statement_credit' AS source,id,NULL AS account_id," +
  "amount_minor,currency,'bank_transfer' AS payment_method," +
  "CASE WHEN economic_purpose='income' THEN 'income' ELSE kind END AS kind," +
  "occurred_at,merchant,bank_label," +
  "0 AS revision,'credit' AS direction,economic_purpose," +
  "CASE WHEN economic_purpose='income' THEN 'payment' ELSE NULL END AS income_category " +
  "FROM quick_statement_credits WHERE owner_id=?";
const incomeEntries = "SELECT owner_id,'income' AS source,id,NULL AS account_id," +
  "amount_minor,currency,payment_method,kind,occurred_at,concept AS merchant,bank_label," +
  "0 AS revision,'credit' AS direction,'income' AS economic_purpose,income_category " +
  "FROM quick_income_entries WHERE owner_id=?";
const baseMovementSql = accountBound + " UNION ALL " + accountFree + " UNION ALL " + statementCredits +
  " UNION ALL " + incomeEntries;
async function movementProjection(db: QuickD1,owner:string){
  const enabled=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='quick_v42_own_transfers'").first<{name:string}>();
  const transferSql=" UNION ALL SELECT owner_id,'own_transfer',id,NULL,amount_minor,'COP','bank_transfer','transfer',occurred_at,from_bank_label || ' → ' || to_bank_label,from_bank_label,0,'debit','transfer',NULL FROM quick_v42_own_transfers WHERE owner_id=?";
  const allMovementSql=baseMovementSql+(enabled?transferSql:"");
  const classifiedMovements="SELECT m.*,"+quickEconomicGroupSql()+" AS economic_group FROM ("+allMovementSql+") m LEFT JOIN quick_movement_categories c ON c.owner_id=m.owner_id AND c.source=m.source AND c.movement_id=m.id LEFT JOIN quick_auto_categories a ON a.owner_id=m.owner_id AND a.source=m.source AND a.movement_id=m.id";
  const owners=enabled?[owner,owner,owner,owner,owner]:[owner,owner,owner,owner];
  return {allMovementSql,classifiedMovements,owners};
}

function reply(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function dashboardOverview(db: QuickD1, owner: string): Promise<Response> {
  const {allMovementSql,classifiedMovements,owners}=await movementProjection(db,owner);
  // Aggregate at DB level: the app never needs to download raw history to
  // calculate totals. All SQL branches constrain owner_id and purchases.
  const [daily, counts, byBank, byCategory, incomeDaily] = await Promise.all([
    db.prepare(
      "SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day," +
      "payment_method, SUM(amount_minor) AS amount_minor, COUNT(*) AS quantity " +
      "FROM (" + classifiedMovements + ") " +
      "WHERE currency='COP' AND economic_group='expense' " +
      "GROUP BY day,payment_method ORDER BY day DESC LIMIT 40001",
    ).bind(...owners).all<AggregateRow>(),
    db.prepare(
      "SELECT COUNT(*) AS total," +
      "COALESCE(SUM(CASE WHEN currency='USD' THEN 1 ELSE 0 END),0) AS usd," +
      "COALESCE(SUM(CASE WHEN economic_group NOT IN ('expense','income') THEN 1 ELSE 0 END),0) AS non_expenses," +
      "COALESCE(SUM(CASE WHEN economic_group='income' THEN amount_minor ELSE 0 END),0) AS income_minor," +
      "COALESCE(SUM(CASE WHEN economic_group='income' THEN 1 ELSE 0 END),0) AS income_count," +
      "COALESCE(SUM(CASE WHEN economic_group='review' AND currency='COP' THEN amount_minor ELSE 0 END),0) AS review_minor," +
      "COALESCE(SUM(CASE WHEN economic_group='debt_payment' AND currency='COP' THEN amount_minor ELSE 0 END),0) AS debt_minor " +
      "FROM (" + classifiedMovements + ")",
    ).bind(...owners).first<{ total: number; usd: number; non_expenses: number; income_minor:number;
      income_count:number; review_minor: number; debt_minor: number }>(),
    db.prepare(
      "SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day," +
      "COALESCE(NULLIF(TRIM(bank_label),''),'Sin banco indicado') AS bank," +
      "SUM(amount_minor) AS amount_minor,COUNT(*) AS quantity " +
      "FROM (" + classifiedMovements + ") " +
      "WHERE currency='COP' AND economic_group='expense' " +
      "GROUP BY day,bank ORDER BY day DESC LIMIT 40001",
    ).bind(...owners).all<BankAggregateRow>(),
    db.prepare(
      "SELECT substr(datetime(m.occurred_at,'-5 hours'),1,10) AS day," +
      "CASE WHEN c.category IS NOT NULL AND c.category!='Otros' AND c.subcategory!='Otros' AND c.category!='Por confirmar' THEN c.category WHEN a.category IS NOT NULL AND a.category!='Otros' AND a.subcategory!='Otros' AND a.category!='Por confirmar' AND a.needs_review=0 AND a.confidence>=0.90 THEN a.category ELSE 'Pendiente de clasificar' END AS category," +
      "CASE WHEN c.category IS NOT NULL AND c.category!='Otros' AND c.subcategory!='Otros' AND c.category!='Por confirmar' THEN c.subcategory WHEN a.category IS NOT NULL AND a.category!='Otros' AND a.subcategory!='Otros' AND a.category!='Por confirmar' AND a.needs_review=0 AND a.confidence>=0.90 THEN a.subcategory ELSE 'Pendiente de clasificar' END AS subcategory," +
      "SUM(m.amount_minor) AS amount_minor,COUNT(*) AS quantity " +
      "FROM ("+allMovementSql+") m LEFT JOIN quick_movement_categories c " +
      "ON c.owner_id=m.owner_id AND c.source=m.source AND c.movement_id=m.id " +
      "LEFT JOIN quick_auto_categories a ON a.owner_id=m.owner_id AND a.source=m.source AND a.movement_id=m.id " +
      "WHERE m.currency='COP' AND "+quickEconomicGroupSql()+"='expense' " +
      "GROUP BY 1,2,3 ORDER BY 1 DESC LIMIT 40001",
    ).bind(...owners).all<CategoryAggregateRow>(),
    db.prepare(
      "SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day," +
      "payment_method,SUM(amount_minor) AS amount_minor,COUNT(*) AS quantity " +
      "FROM (" + classifiedMovements + ") " +
      "WHERE currency='COP' AND economic_group='income' " +
      "GROUP BY day,payment_method ORDER BY day DESC LIMIT 40001"
    ).bind(...owners).all<AggregateRow>(),
  ]);
  return reply({
    timezone: "America/Bogota", currency: "COP", movementCount: counts?.total ?? 0,
    excludedUsd: counts?.usd ?? 0, transfersAndInvestments: counts?.non_expenses ?? 0,
    incomeMinor: String(counts?.income_minor ?? 0),
    incomeCount: counts?.income_count ?? 0,
    incomeDaily: incomeDaily.results.map(x=>({day:x.day,method:x.payment_method,
      minor:String(x.amount_minor),count:x.quantity})),
    pendingTransferReviewMinor: String(counts?.review_minor ?? 0),
    debtPaymentsMinor: String(counts?.debt_minor ?? 0),
    truncated: daily.results.length > 40000 || byBank.results.length > 40000 || byCategory.results.length > 40000,
    categoryDaily: byCategory.results.slice(0,40000).map(r=>({
      day:r.day,category:r.category,subcategory:r.subcategory,
      minor:String(r.amount_minor),count:r.quantity,
    })),
    bankDaily: byBank.results.slice(0,40000).map(r => ({
      day:r.day,bank:r.bank,minor:String(r.amount_minor),count:r.quantity,
    })),
    daily: daily.results.slice(0, 40000).map((r) => ({
      day: r.day, method: r.payment_method, minor: String(r.amount_minor), count: r.quantity,
    })),
  });
}

export async function dashboardMovements(db: QuickD1, owner: string, url: URL): Promise<Response> {
  const raw = url.searchParams.get("page") ?? "0";
  if (!/^(0|[1-9][0-9]{0,4})$/.test(raw) || Number(raw) > 10000 ||
    [...url.searchParams.keys()].some((key) => key !== "page")) {
    return new Response(JSON.stringify({ error: "Invalid page" }), {
      status: 422, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const page = Number(raw);
  const size = 40;
  const {allMovementSql,owners}=await movementProjection(db,owner);
  const data = await db.prepare(
    "SELECT m.id,m.account_id,m.amount_minor,m.currency,m.payment_method,m.kind," +
    "m.occurred_at,m.merchant,m.bank_label,m.revision,m.source,m.direction," +
    "m.economic_purpose,m.income_category," +
    "CASE WHEN m.economic_purpose='income' THEN 'Ingresos' WHEN m.source IN ('statement_credit','own_transfer') AND m.kind='transfer' THEN 'Pagos y transferencias' WHEN m.source='statement_credit' AND m.kind='received_transfer' THEN 'Abono recibido' WHEN c.category IS NOT NULL AND c.category!='Otros' AND c.subcategory!='Otros' AND c.category!='Por confirmar' THEN c.category WHEN a.category IS NOT NULL AND a.category!='Otros' AND a.subcategory!='Otros' AND a.category!='Por confirmar' AND a.needs_review=0 AND a.confidence>=0.90 THEN a.category ELSE 'Pendiente de clasificar' END AS category," +
    "CASE WHEN m.economic_purpose='income' THEN CASE m.income_category WHEN 'salary' THEN 'Salario' WHEN 'sales' THEN 'Ventas' WHEN 'commission' THEN 'Comisiones' WHEN 'interest' THEN 'Intereses' WHEN 'refund' THEN 'Devoluciones' WHEN 'payment' THEN 'Pago recibido' ELSE 'Otros ingresos' END WHEN m.source IN ('statement_credit','own_transfer') AND m.kind='transfer' THEN 'Entre cuentas propias' WHEN m.source='statement_credit' AND m.kind='received_transfer' THEN 'Origen por confirmar' WHEN c.category IS NOT NULL AND c.category!='Otros' AND c.subcategory!='Otros' AND c.category!='Por confirmar' THEN c.subcategory WHEN a.category IS NOT NULL AND a.category!='Otros' AND a.subcategory!='Otros' AND a.category!='Por confirmar' AND a.needs_review=0 AND a.confidence>=0.90 THEN a.subcategory ELSE 'Pendiente de clasificar' END AS subcategory," +
    "CASE WHEN m.economic_purpose='income' THEN 'income' WHEN m.source IN ('statement_credit','own_transfer') THEN 'nonexpense' WHEN c.category IS NOT NULL AND c.category!='Otros' AND c.subcategory!='Otros' THEN 'confirmed' " +
    "WHEN a.category IS NOT NULL AND a.category!='Otros' AND a.subcategory!='Otros' " +
    "AND a.needs_review=0 AND a.confidence>=0.9 THEN 'suggested' ELSE 'review' END AS category_status " +
    "FROM (" + allMovementSql + ") m " +
    "LEFT JOIN quick_movement_categories c ON c.owner_id=m.owner_id AND c.source=m.source AND c.movement_id=m.id " +
    "LEFT JOIN quick_auto_categories a ON a.owner_id=m.owner_id AND a.source=m.source AND a.movement_id=m.id " +
    "ORDER BY m.occurred_at DESC,m.id DESC LIMIT ? OFFSET ?",
  ).bind(...owners, size + 1, page * size).all<MovementRow>();
  return reply({
    page, hasMore: data.results.length > size, entries: data.results.slice(0, size).map((x) => ({
      ...x, amount_minor: String(x.amount_minor),
    })),
  });
}
