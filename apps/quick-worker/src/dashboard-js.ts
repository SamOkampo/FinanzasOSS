// Dashboard client: plain modern JavaScript, zero libraries, no persistence,
// no third-party requests, and no untrusted content inserted as markup.
export const DASH_JS = `(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  });
  const shortMoney = new Intl.NumberFormat("es-CO", {
    notation: "compact", maximumFractionDigits: 1,
  });
  const fmtDay = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "2-digit", month: "short",
  });
  const fmtFull = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "2-digit", month: "short", year: "numeric",
  });
  const COLORS = ["#b66b45", "#829e8c", "#c7a57b", "#69918c", "#a48e9e", "#92927d"];
  const LABELS = {
    cash: "Efectivo", debit_card: "Tarjeta débito",
    credit_card: "Tarjeta crédito", bank_transfer: "Transferencia",
    digital_wallet: "Billetera digital", other: "Otro",
  };
  const state = { period: "month", overview: null, history: [], page: 0, hasMore: false, loadingHistory: false };
  const asCOP = (minor) => money.format(Number(minor || 0) / 100);
  const asCompact = (minor) => shortMoney.format(Number(minor || 0) / 100);
  const dateKey = (date) => date.toISOString().slice(0, 10);
  const parseDay = (day) => new Date(day + "T12:00:00Z");
  const advance = (day, days) => {
    const d = parseDay(day);
    d.setUTCDate(d.getUTCDate() + days);
    return dateKey(d);
  };
  const monthStart = (day) => day.slice(0, 7) + "-01";
  const yearStart = (day) => day.slice(0, 4) + "-01-01";
  const prevMonth = (day) => {
    const d = parseDay(monthStart(day));
    d.setUTCMonth(d.getUTCMonth() - 1);
    return dateKey(d).slice(0, 7) + "-01";
  };
  function bogotaToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const obj = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return obj.year + "-" + obj.month + "-" + obj.day;
  }
  function weekStart(day) {
    const dow = parseDay(day).getUTCDay();
    return advance(day, -((dow + 6) % 7)); // Monday in Colombia
  }
  function bounds(period, today) {
    if (period === "day") return { start: today, end: advance(today, 1),
      previous: { start: advance(today, -1), end: today }, title: "Hoy · " + fmtFull.format(parseDay(today)) };
    if (period === "week") {
      const start = weekStart(today);
      return { start, end: advance(start, 7), previous: { start: advance(start, -7), end: start },
        title: "Semana del " + fmtDay.format(parseDay(start)) + " al " + fmtDay.format(parseDay(advance(start, 6))) };
    }
    if (period === "month") {
      const start = monthStart(today);
      return { start, end: advance(today, 1), previous: { start: prevMonth(today), end: start },
        title: new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(parseDay(today)) };
    }
    if (period === "year") {
      const start = yearStart(today);
      return { start, end: advance(today, 1), previous: { start: String(Number(today.slice(0, 4)) - 1) + "-01-01", end: start },
        title: "Año " + today.slice(0, 4) };
    }
    return { start: "0000-01-01", end: "9999-12-31",
      previous: null, title: "Histórico completo · desde tu primer registro" };
  }
  const between = (day, b) => day >= b.start && day < b.end;
  const totals = (items) => items.reduce((s, a) => {
    s.minor += Number(a.minor);
    s.count += Number(a.count);
    return s;
  }, { minor: 0, count: 0 });

  function renderKpis(selected, current, previous, all) {
    $("kpi-total").textContent = asCOP(current.minor);
    $("kpi-count").textContent = current.count.toLocaleString("es-CO");
    $("kpi-average").textContent = current.count ? asCOP(current.minor / current.count) : money.format(0);
    $("kpi-all").textContent = asCOP(all.minor);
    $("all-count").textContent = all.count.toLocaleString("es-CO") + " gastos COP registrados";
    const chip = $("kpi-compare");
    const note = document.querySelector(".kpi-note");
    chip.className = "delta muted";
    if (!selected.previous) {
      chip.textContent = "Histórico";
      if (note) note.textContent = "desde el primer registro";
    } else if (!previous.minor && !current.minor) {
      chip.textContent = "Sin variación";
      if (note) note.textContent = "vs. período anterior";
    } else if (!previous.minor) {
      chip.textContent = "Primeros gastos";
      if (note) note.textContent = "vs. período anterior";
    } else {
      const change = (current.minor - previous.minor) / previous.minor * 100;
      chip.textContent = (change > 0 ? "↑ +" : change < 0 ? "↓ " : "— ") +
        Math.abs(change).toLocaleString("es-CO", { maximumFractionDigits: 0 }) + "%";
      chip.className = "delta " + (change > 0 ? "up" : change < 0 ? "down" : "muted");
      if (note) note.textContent = "vs. período anterior";
    }
  }
  function chartSeries(items, period, today) {
    const grouped = new Map();
    for (const item of items) grouped.set(item.day, (grouped.get(item.day) || 0) + Number(item.minor));
    const keys = [];
    if (period === "year" || period === "all") {
      const end = monthStart(today);
      const months = period === "year" ? Number(today.slice(5, 7)) : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = parseDay(end);
        d.setUTCMonth(d.getUTCMonth() - i);
        const k = dateKey(d).slice(0, 7);
        keys.push(k);
      }
      const values = keys.map((key) =>
        [...grouped.entries()].reduce((sum, [day, n]) => sum + (day.startsWith(key) ? n : 0), 0));
      return { keys, values, monthly: true };
    }
    const start = period === "month" ? monthStart(today) : advance(today, -6);
    const end = today;
    for (let d = start; d <= end; d = advance(d, 1)) keys.push(d);
    return { keys, values: keys.map((key) => grouped.get(key) || 0), monthly: false };
  }
  const svgEl = (name, props = {}) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(props).forEach(([k, v]) => node.setAttribute(k, String(v)));
    return node;
  };
  function renderTrend(items, period, today) {
    const { keys, values, monthly } = chartSeries(items, period, today);
    const max = Math.max(1, ...values);
    const L = 14, R = 782, T = 13, B = 214;
    const step = (R - L) / Math.max(1, keys.length - 1);
    const points = values.map((v, i) => [L + step * i, B - v / max * (B - T)]);
    const line = points.map((p, i) => (i === 0 ? "M" : "L") +
      p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");
    $("trend-line").setAttribute("d", line);
    $("trend-area").setAttribute("d", line + " L" + points.at(-1)[0].toFixed(2) +
      "," + B + " L" + L + "," + B + " Z");
    const grid = $("gridlines");
    grid.replaceChildren();
    for (let i = 0; i < 4; i++) {
      const y = T + ((B - T) / 3) * i;
      grid.appendChild(svgEl("line", { x1: L, y1: y, x2: R, y2: y,
        stroke: "#2c3942", "stroke-width": 1, "stroke-dasharray": "4 6" }));
    }
    const dots = $("trend-dots");
    dots.replaceChildren();
    for (let i = 0; i < points.length; i++) {
      if (i !== points.length - 1 && i % Math.max(1, Math.floor(points.length / 9)) !== 0) continue;
      const circle = svgEl("circle", { cx: points[i][0], cy: points[i][1], r: i === points.length - 1 ? 5 : 3,
        fill: "#baffdd", stroke: "#163b35", "stroke-width": 2 });
      const title = svgEl("title");
      title.textContent = keys[i] + ": " + asCOP(values[i]);
      circle.appendChild(title);
      dots.appendChild(circle);
    }
    const caption = (key) => monthly
      ? new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" }).format(parseDay(key + "-01"))
      : fmtDay.format(parseDay(key));
    $("chart-first").textContent = keys.length ? caption(keys[0]) : "—";
    $("chart-last").textContent = keys.length ? caption(keys.at(-1)) : "—";
    $("trend-total").textContent = asCOP(values.reduce((a, b) => a + b, 0));
    $("trend-subtitle").textContent = period === "day" ? "Últimos 7 días, incluido hoy"
      : period === "week" ? "Últimos 7 días"
      : period === "month" ? "Desde el primer día del mes"
      : period === "year" ? "Mes a mes, en el año actual" : "Evolución de los últimos 12 meses";
    $("trend").setAttribute("aria-label", "Gastos: " +
      keys.map((key, i) => key + " " + asCOP(values[i])).join("; "));
  }
  function renderMethods(items) {
    const grouped = new Map();
    let all = 0;
    for (const item of items) {
      const n = Number(item.minor);
      all += n;
      grouped.set(item.method, (grouped.get(item.method) || 0) + n);
    }
    const rows = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
    $("donut-total").textContent = totals(items).count.toLocaleString("es-CO");
    const legend = $("methods");
    legend.replaceChildren();
    if (!rows.length) {
      $("donut").style.background = "conic-gradient(#263742 0deg 360deg)";
      const note = document.createElement("p");
      note.className = "empty-small";
      note.textContent = "Sin gastos en este período";
      legend.appendChild(note);
      $("top-method").textContent = "Sin datos";
      return;
    }
    let angle = 0;
    const segments = [];
    rows.forEach(([method, amount], i) => {
      const color = COLORS[i % COLORS.length];
      const pct = amount / all;
      const last = angle + 360 * pct;
      segments.push(color + " " + angle + "deg " + last + "deg");
      angle = last;
      const row = document.createElement("div");
      row.className = "method-row";
      const dot = document.createElement("i");
      dot.style.background = color;
      const name = document.createElement("span");
      name.textContent = LABELS[method] || "Otro";
      const value = document.createElement("b");
      value.textContent = Math.round(pct * 100) + "%";
      row.append(dot, name, value);
      const meter = document.createElement("div");
      meter.className = "method-meter";
      const fill = document.createElement("span");
      fill.style.width = (pct * 100).toFixed(2) + "%";
      fill.style.background = color;
      meter.appendChild(fill);
      legend.append(row, meter);
    });
    $("donut").style.background = "conic-gradient(" + segments.join(",") + ")";
    $("top-method").textContent = LABELS[rows[0][0]] || "Otro";
    $("donut").setAttribute("aria-label",
      rows.map(([key, minor]) => (LABELS[key] || key) + " " + asCOP(minor)).join("; "));
  }
  function renderWeek(items, today) {
    const perDay = new Map();
    items.forEach((item) => perDay.set(item.day, (perDay.get(item.day) || 0) + Number(item.minor)));
    const days = Array.from({ length: 7 }, (_, i) => advance(today, -6 + i));
    const max = Math.max(1, ...days.map((d) => perDay.get(d) || 0));
    const panel = $("week-bars");
    panel.replaceChildren();
    for (const day of days) {
      const value = perDay.get(day) || 0;
      const cell = document.createElement("div");
      cell.className = "bar-day" + (day === today ? " today" : "");
      const amount = document.createElement("div");
      amount.className = "bar-value";
      amount.textContent = value ? asCompact(value) : "—";
      const track = document.createElement("div");
      track.className = "bar-track";
      const bar = document.createElement("div");
      bar.className = "bar-fill";
      bar.style.height = (value ? Math.max(3, value / max * 100) : 0) + "%";
      track.appendChild(bar);
      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" })
        .format(parseDay(day)).replace(".", "");
      cell.title = day + " · " + asCOP(value);
      cell.append(amount, track, label);
      panel.appendChild(cell);
    }
  }
  function renderInsights(items, totalMovements) {
    const days = new Map();
    items.forEach((x) => days.set(x.day, (days.get(x.day) || 0) + Number(x.minor)));
    const top = [...days.entries()].sort((a, b) => b[1] - a[1])[0];
    $("peak-day").textContent = top
      ? fmtDay.format(parseDay(top[0])) + " · " + asCOP(top[1]) : "Sin datos";
    $("all-movements").textContent = Number(totalMovements).toLocaleString("es-CO");
  }
  function renderDashboard() {
    if (!state.overview) return;
    const today = bogotaToday();
    const selected = bounds(state.period, today);
    const all = state.overview.daily;
    const active = all.filter((row) => between(row.day, selected));
    const prior = selected.previous ? all.filter((row) => between(row.day, selected.previous)) : [];
    $("period-label").textContent = selected.title;
    renderKpis(selected, totals(active), totals(prior), totals(all));
    renderTrend(all, state.period, today);
    renderMethods(active);
    renderWeek(all, today);
    renderInsights(active, state.overview.movementCount);
  }
  function textOrUnknown(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }
  function td(child, className = "") {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    if (typeof child === "string") cell.textContent = child;
    else cell.appendChild(child);
    return cell;
  }
  function showHistory() {
    const body = $("history-body");
    body.replaceChildren();
    if (!state.history.length) {
      const tr = document.createElement("tr");
      const cell = td("Aún no hay movimientos. Registra uno desde Atajos y actualiza aquí.", "empty-row");
      cell.colSpan = 5;
      tr.appendChild(cell);
      body.appendChild(tr);
    }
    state.history.forEach((x) => {
      const tr = document.createElement("tr");
      const concept = document.createElement("div");
      concept.className = "history-name";
      concept.textContent = textOrUnknown(x.merchant, x.kind === "purchase" ? "Gasto sin concepto" : "Movimiento");
      const kind = document.createElement("small");
      kind.className = "history-kind";
      kind.textContent = x.kind === "purchase" ? (x.account_id === null ? "Sin cuenta asociada" : "Gasto manual")
        : x.kind === "transfer" ? "Transferencia propia · no es gasto"
        : x.kind === "investment_transfer" ? "Aporte a inversión · no es gasto" : "Movimiento";
      const desc = document.createElement("div");
      desc.append(concept, kind);
      const method = document.createElement("div");
      method.className = "history-method";
      const methodLabel = document.createElement("strong");
      methodLabel.className = "history-payment-method-label";
      methodLabel.textContent = LABELS[x.payment_method] || "Método sin identificar";
      method.appendChild(methodLabel);
      // Keep both fields independently labelled, but in the SAME visible
      // column. The bank below the concept was easy to miss on mobile.
      const bankName = typeof x.bank_label === "string" ? x.bank_label.trim() : "";
      if (bankName) {
        const bank = document.createElement("small");
        bank.className = "history-bank-detail";
        bank.textContent = "Banco: " + bankName;
        method.appendChild(bank);
      }
      const amount = document.createElement("strong");
      amount.className = "history-amount";
      amount.textContent = (x.kind === "purchase" ? "− " : "↔ ") +
        (x.currency === "COP" ? asCOP(x.amount_minor) :
          new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD" }).format(Number(x.amount_minor) / 100));
      const actions=document.createElement("div");
      actions.className="history-actions";
      const edit=document.createElement("button");
      edit.type="button";edit.className="history-action-edit";
      edit.textContent="Editar";
      edit.setAttribute("aria-label","Editar "+(x.merchant||"movimiento"));
      edit.disabled=x.kind!=="purchase"||x.currency!=="COP";
      if(edit.disabled)edit.title="Por seguridad, solo se editan gastos COP";
      const remove=document.createElement("button");
      remove.type="button";remove.className="history-action-remove";
      remove.textContent="";remove.setAttribute("aria-label","Eliminar "+(x.merchant||"movimiento"));
      remove.setAttribute("title","Eliminar movimiento");
      const symbol=document.createElement("span");symbol.className="history-trash-icon";
      symbol.setAttribute("aria-hidden","true");remove.appendChild(symbol);
      edit.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("finanzasoss:movement-action",
        {detail:{action:"edit",entry:x}})));
      remove.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("finanzasoss:movement-action",
        {detail:{action:"delete",entry:x}})));
      actions.append(edit,remove);
      tr.append(td(desc), td(fmtFull.format(new Date(x.occurred_at))), td(method),
        td(amount, "align-right"),td(actions,"history-actions-cell"));
      body.appendChild(tr);
    });
    $("history-status").textContent = "Mostrando " + state.history.length.toLocaleString("es-CO") +
      " movimiento(s) · más antiguos al final";
    $("load-more").hidden = !state.hasMore;
  }
  async function fetchJson(url) {
    let r;
    try {
      r = await fetch(url, { method: "GET", credentials: "same-origin", cache: "no-store",
        headers: { Accept: "application/json" } });
    } catch {
      // On Safari, failed service-worker fetches used to bubble up as raw
      // "FetchEvent.respondWith ... Load failed" errors.
      throw new Error("No se pudieron cargar los datos. Comprueba tu conexión, abre la PWA desde Safari y toca Actualizar.");
    }
    if (r.status === 401 || r.status === 403) throw new Error(
      "La sesión privada expiró. Abre esta página en Safari y vuelve a iniciar sesión con Cloudflare Access.");
    if (!r.ok) throw new Error("No se pudieron consultar los datos (HTTP " + r.status + ").");
    return await r.json();
  }
  function fail(error) {
    $("error").hidden = false;
    $("error").textContent = error instanceof Error ? error.message : "No fue posible cargar los movimientos.";
  }
  async function loadHistory(reset = false) {
    if (state.loadingHistory) return;
    state.loadingHistory = true;
    const button = $("load-more");
    button.disabled = true;
    if (reset) { state.page = 0; state.history = []; state.hasMore = false; }
    try {
      const data = await fetchJson("/api/quick/dashboard/movements?page=" + state.page);
      state.history.push(...data.entries);
      state.hasMore = Boolean(data.hasMore);
      state.page += 1;
      showHistory();
    } catch (error) { fail(error); }
    finally { state.loadingHistory = false; button.disabled = false; }
  }
  async function refresh() {
    $("error").hidden = true;
    $("reload").disabled = true;
    try {
      const overview = await fetchJson("/api/quick/dashboard/overview");
      if (overview.truncated) throw new Error("El historial supera el máximo de agregaciones permitido. Contacta soporte para una consulta completa.");
      state.overview = overview;
      renderDashboard();
      // Transient, same-origin in-memory handoff for late-loaded Studio interactions.
      // Never persisted in storage or a financial cache.
      window.__finanzasossLatestOverview = overview;
      document.dispatchEvent(new CustomEvent("finanzasoss:data", {detail:{overview}}));
      if (overview.excludedUsd && $("testing")) {
        $("testing").textContent = "ENTORNO STAGING · " + overview.excludedUsd +
          " movimiento(s) en USD excluidos de totales COP; disponibles en el historial.";
      }
      await loadHistory(true);
    } catch (error) { fail(error); }
    finally { $("reload").disabled = false; }
  }
  document.querySelectorAll(".period-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.period = button.dataset.period;
      document.querySelectorAll(".period-btn").forEach((x) => {
        x.classList.toggle("active", x === button);
        x.setAttribute("aria-pressed", String(x === button));
      });
      renderDashboard();
    });
  });
  $("load-more").addEventListener("click", () => void loadHistory());
  $("reload").addEventListener("click", () => void refresh());
  $("refresh-history").addEventListener("click", () => void loadHistory(true));
  $("today").textContent = fmtFull.format(new Date());
  // Installability without offline financial data storage or analytics.
  if ("serviceWorker" in navigator) {
    // Replace legacy intercepting workers with a network-neutral worker.
    // It exists for installability, but NEVER handles fetch events.
    navigator.serviceWorker.register("/dashboard-sw.js", { scope: "/dashboard",
      updateViaCache: "none" }).then((reg) => reg.update()).catch(() => {});

  }
  void refresh();
})();`;
