import type { QuickD1 } from "./index.js";

// Finance dashboard: read-only, tenant-scoped, never infer an account,
// and never count transfers as purchases. Colombia is UTC-05 year-round.
// Daily aggregates make period switching fast without exposing other users.
type AggregateRow = { day: string; payment_method: string; amount_minor: number; quantity: number };
type MovementRow = {
  id: string; account_id: string | null; amount_minor: number; currency: string;
  payment_method: string; kind: string; occurred_at: string;
  merchant: string | null; bank_label: string | null; revision:number;
};
const accountBound = "SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision " +
  "FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL";
const accountFree = "SELECT id,NULL AS account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision " +
  "FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL";
const allMovementSql = accountBound + " UNION ALL " + accountFree;

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
  // Aggregate at DB level: the app never needs to download raw history to
  // calculate totals. All SQL branches constrain owner_id and purchases.
  const [daily, counts] = await Promise.all([
    db.prepare(
      "SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day," +
      "payment_method, SUM(amount_minor) AS amount_minor, COUNT(*) AS quantity " +
      "FROM (" + allMovementSql + ") " +
      "WHERE currency='COP' AND kind='purchase' " +
      "GROUP BY day,payment_method ORDER BY day DESC LIMIT 40001",
    ).bind(owner, owner).all<AggregateRow>(),
    db.prepare(
      "SELECT COUNT(*) AS total," +
      "COALESCE(SUM(CASE WHEN currency='USD' THEN 1 ELSE 0 END),0) AS usd," +
      "COALESCE(SUM(CASE WHEN kind!='purchase' THEN 1 ELSE 0 END),0) AS non_expenses " +
      "FROM (" + allMovementSql + ")",
    ).bind(owner, owner).first<{ total: number; usd: number; non_expenses: number }>(),
  ]);
  const truncated = daily.results.length > 40000;
  return reply({
    timezone: "America/Bogota", currency: "COP", movementCount: counts?.total ?? 0,
    excludedUsd: counts?.usd ?? 0, transfersAndInvestments: counts?.non_expenses ?? 0,
    truncated, daily: daily.results.slice(0, 40000).map((r) => ({
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
  const data = await db.prepare(
    "SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision " +
    "FROM (" + allMovementSql + ") ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?",
  ).bind(owner, owner, size + 1, page * size).all<MovementRow>();
  return reply({
    page, hasMore: data.results.length > size, entries: data.results.slice(0, size).map((x) => ({
      ...x, amount_minor: String(x.amount_minor),
    })),
  });
}
