var mn=Object.freeze({automaticActivationAllowed:!1,automaticChargingAllowed:!1,paymentProcessorCallsEnabled:!1,pricesMayBeInvented:!1,pendingAssignmentGrantsEntitlements:!1,productionBillingRequiresExplicitAuthorization:!0});function J(e){switch(e){case"purchase":case"fee":case"tax":return"expense";case"income":return"income";case"refund":return"refund";case"transfer":return"internal_transfer";case"investment_transfer":return"investment_flow";case"investment_activity":return"investment_activity";case"debt_payment":return"debt_flow";case"cash_withdrawal":case"cash_deposit":return"cash_movement";case"adjustment":return"neutral";case"unknown":return"unknown"}}var rt=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),it=new Set(["expense","own_transfer","investment_transfer"]);function D(e,t,o){if(typeof e!="string")throw new Error(t+" must be text");let n=e.trim();if(!n||n.length>o||/[\u0000-\u001f\u007f]/.test(n))throw new Error(t+" is invalid");return n}function Y(e,t,o){return e==null||e===""?null:D(e,t,o)}function at(e){if(typeof e!="string"||!/^(?:0|[1-9][0-9]{0,10})(?:\.[0-9]{1,2})?$/.test(e))throw new Error("Amount must be an ungrouped decimal with at most two fractional digits");let t=e.split("."),o=t[0],n=(t[1]??"").padEnd(2,"0"),i=BigInt(o)*100n+BigInt(n||"0");if(i<=0n||i>1000000000000n)throw new Error("Amount must be positive and within the permitted limit");return i}function st(e){if(typeof e!="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{3})?Z$/.test(e))throw new Error("occurredAt must be canonical UTC");let t=new Date(e);if(Number.isNaN(t.getTime())||(e.endsWith(".000Z")?t.toISOString()!==e:t.toISOString().replace(".000Z","Z")!==e))throw new Error("occurredAt is invalid");return e}function R(e){if(e===null||typeof e!="object"||Array.isArray(e))throw new Error("Quick entry input must be an object");let t=D(e.tenantId,"tenantId",128),o=D(e.actorId,"actorId",128),n=D(e.clientEntryId,"clientEntryId",96);if(!/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(n))throw new Error("clientEntryId must be a stable, caller-generated idempotency key");if(e.currency!=="COP"&&e.currency!=="USD")throw new Error("Only explicitly supported currencies COP and USD are allowed");if(!rt.has(e.paymentMethod))throw new Error("Payment method is not supported");if(!it.has(e.classification))throw new Error("Classification must be explicitly selected");let i=e.classification==="expense"?"purchase":e.classification==="own_transfer"?"transfer":"investment_transfer",a=Object.freeze({amountMinor:at(e.amount),currency:e.currency});return Object.freeze({tenantId:t,actorId:o,clientEntryId:n,money:a,occurredAt:st(e.occurredAt),paymentMethod:e.paymentMethod,bankLabel:Y(e.bankLabel,"bankLabel",80),merchant:Y(e.merchant,"merchant",120),classification:e.classification,kind:i,economicClass:J(i),direction:"debit",sourceType:"manual",requiresUserConfirmation:!0,persistenceEnabled:!1,accountSelectionRequiredBeforePosting:!0})}var Z=`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#111c25">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>Quick \xB7 FinanzasOSS</title>
<link rel="stylesheet" href="/quick.css">
<script src="/quick.js" defer><\/script>
</head><body>
<main class="shell">
  <header class="top">
    <div class="brand"><span class="brand-icon">F<span>.</span></span><span>FINANZAS<span class="brand-light">OSS</span></span></div>
    <a href="/dashboard" class="dash-shortcut">\u2197 Ver dashboard</a>
    <div class="env"><span class="env-dot"></span> STAGING PRIVADO</div>
  </header>
  <section class="intro"><div class="eyebrow">CONTROL DIARIO / QUICK</div><h1>Tus gastos.<br><em>Sin fricci\xF3n.</em></h1><p>Registra un movimiento en segundos. Por ahora, usa \xFAnicamente informaci\xF3n ficticia para las pruebas.</p></section>
  <div class="warning" role="note"><span aria-hidden="true">\u25CF</span><span>Entorno de pruebas. No introduzcas datos bancarios reales, contrase\xF1as ni movimientos personales.</span></div>
  <section class="panel" aria-labelledby="capture-title">
    <div class="panel-title"><div><div class="eyebrow">01 / CAPTURA</div><h2 id="capture-title">Nuevo movimiento</h2></div><span class="pill" id="write-flag">Comprobando...</span></div>
    <form id="entry-form" autocomplete="off">
      <label class="field-label" for="amount">\xBFCu\xE1nto gastaste?</label>
      <div class="amount-field"><span>$</span><input id="amount" name="amount" type="text" inputmode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" value="25000" maxlength="14" aria-describedby="amount-help" required><small>COP</small></div>
      <div id="amount-help" class="hint">Para la prueba: 25000. Sin puntos de miles ni comas.</div>
      <div class="grid-fields">
        <div><label class="field-label" for="account">Cuenta manual</label><select id="account" required><option value="">Cargando cuentas...</option></select></div>
        <div><label class="field-label" for="method">M\xE9todo</label><select id="method" required><option value="debit_card">Tarjeta d\xE9bito</option><option value="cash">Efectivo</option><option value="credit_card">Tarjeta cr\xE9dito</option><option value="bank_transfer">Transferencia</option><option value="digital_wallet">Billetera digital</option><option value="other">Otro</option></select></div>
        <div id="bank-field" hidden><label class="field-label" for="bank">\xBFQu\xE9 banco es?</label><input id="bank" type="text" maxlength="80" autocomplete="off" placeholder="Ej. Banco de prueba"></div>
        <div><label class="field-label" for="classification">Tipo de movimiento</label><select id="classification" required><option value="expense">Gasto</option><option value="own_transfer">Transferencia propia</option><option value="investment_transfer">Aporte a inversi\xF3n</option></select></div>
        <div><label class="field-label" for="merchant">Concepto \xB7 opcional</label><input id="merchant" type="text" maxlength="120" placeholder="Almuerzo de prueba"></div>
      </div>
      <div class="submit-zone"><div class="hint">Una transferencia propia o una inversi\xF3n no cuenta como gasto.</div><button id="save-entry" type="submit" disabled>Guardar movimiento <span aria-hidden="true">\u2197</span></button></div>
    </form>
    <div id="entry-message" class="feedback" role="status" aria-live="polite"></div>
  </section>
  <section class="panel compact" aria-labelledby="accounts-title">
    <div class="panel-title"><div><div class="eyebrow">02 / CONFIGURACI\xD3N</div><h2 id="accounts-title">Cuenta de prueba</h2></div></div>
    <p class="subline">Es una etiqueta manual, no una conexi\xF3n con un banco.</p>
    <form id="account-form" autocomplete="off">
      <div class="account-row"><div class="grow"><label class="field-label" for="account-label">Nombre</label><input id="account-label" maxlength="100" value="Efectivo de prueba" required></div><div><label class="field-label" for="account-kind">Clase</label><select id="account-kind"><option value="cash">Efectivo</option><option value="bank_manual">Banco manual</option><option value="wallet_manual">Billetera manual</option></select></div></div>
      <button id="save-account" class="secondary" disabled type="submit">Crear cuenta ficticia <span aria-hidden="true">+</span></button>
    </form>
    <div id="account-message" class="feedback" role="status" aria-live="polite"></div>
  </section>
  <section class="panel compact" aria-labelledby="shortcut-title">
    <div class="panel-title"><div><div class="eyebrow">03 / IPHONE</div><h2 id="shortcut-title">Atajo directo a D1</h2></div></div>
    <p class="subline">Solo gastos ficticios. Debes configurar Cloudflare Access Service Auth para iPhone. El token dura 90 d\xEDas y se puede revocar; al crear uno nuevo, el anterior deja de servir.</p>
    <button id="enroll-device" class="secondary" type="button" disabled>Generar token para mi iPhone <span aria-hidden="true">\u2197</span></button>
    <button id="revoke-device" class="secondary" type="button">Revocar acceso del iPhone <span aria-hidden="true">\xD7</span></button>
    <div id="shortcut-message" class="feedback" role="status" aria-live="polite"></div>
    <p class="hint">Copia el token una sola vez en tu Atajo y no lo compartas.</p>
    <div id="shortcut-token" class="token-once" aria-label="Token de un solo uso"></div>
    <button id="copy-shortcut-token" class="secondary" type="button">Copiar token <span aria-hidden="true">\u2197</span></button>
  </section>
  <section class="history" aria-labelledby="history-title">
    <div class="panel-title"><div><div class="eyebrow">04 / HISTORIAL</div><h2 id="history-title">\xDAltimos registros</h2></div><button id="refresh" class="mini" type="button">Actualizar \u21BB</button></div>
    <div class="history-body" id="history-body"><div class="empty">Consultando D1...</div></div>
  </section>
  <footer>FINANZASOSS / QUICK \xB7 PRUEBA DE ALMACENAMIENTO \xB7 SIN MOVIMIENTOS BANCARIOS</footer>
</main>
</body></html>`,X='.dash-shortcut{display:inline-flex;align-items:center;gap:.4rem;text-decoration:none;border:1px solid #38574d;color:#a9f4d6;padding:.6rem .85rem;border-radius:10px;font-weight:750;font-size:12px;white-space:nowrap}.dash-shortcut:hover{background:#15352a}.top{flex-wrap:wrap;gap:10px} :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#16242c;background:#f4f3f0;font-synthesis:none}*{box-sizing:border-box}body{margin:0}.shell{max-width:820px;margin:0 auto;padding:0 24px 52px}.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d3d6d3;padding:25px 0 22px;gap:12px}.brand{display:flex;align-items:center;gap:10px;font-size:14px;letter-spacing:.075em;font-weight:800}.brand-light{font-weight:450;color:#6a7c83}.brand-icon{display:grid;place-content:center;height:35px;width:35px;border-radius:7px;background:#16242c;color:#fff;font-size:19px;letter-spacing:-.08em}.brand-icon span{color:#8cf0bb}.env{display:flex;align-items:center;gap:7px;border:1px solid #cbd6d1;border-radius:4px;padding:8px 10px;color:#53665c;font-size:10px;font-weight:750;letter-spacing:.065em;white-space:nowrap}.env-dot{height:7px;width:7px;border-radius:50%;background:#53b585}.intro{padding:50px 0 20px}.eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#6e8b7b}.intro h1{font-size:clamp(36px,7vw,60px);letter-spacing:-.065em;line-height:1.06;margin:14px 0 12px;font-weight:780}.intro em{font-style:normal;color:#478c68}.intro p{font-size:14px;line-height:1.65;max-width:440px;color:#63747a}.warning{display:flex;gap:12px;background:#edf2ea;border:1px solid #d3dfd1;padding:13px 16px;font-size:12px;line-height:1.5;color:#416147;margin:16px 0 26px;border-radius:4px}.warning>span:first-child{font-size:13px}.panel{background:#fff;border:1px solid #d9deda;border-radius:7px;padding:29px;margin-bottom:16px;box-shadow:0 4px 18px rgba(18,36,27,.025)}.panel.compact{padding:25px 29px}.panel-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:23px}.panel h2,.history h2{font-size:21px;letter-spacing:-.035em;margin:6px 0 0;font-weight:720}.pill{background:#f2f3f0;color:#73817c;font-size:10px;border:1px solid #dfe4e0;border-radius:4px;padding:7px 9px;white-space:nowrap}.pill.enabled{color:#287d4b;background:#e8f6ec;border-color:#c4e4cf}.field-label{display:block;font-size:11px;letter-spacing:.03em;font-weight:720;margin-bottom:9px;color:#3b4c50}.amount-field{height:78px;display:flex;align-items:center;border-bottom:2px solid #1e3c32;gap:12px;margin-bottom:8px}.amount-field>span{font-size:30px;font-weight:500;color:#4d6858}.amount-field input{border:0;outline:0;flex:1;min-width:0;font-size:44px;letter-spacing:-.05em;font-weight:750;font-variant-numeric:tabular-nums;padding:0;background:transparent;color:#16242c}.amount-field small{font-size:12px;color:#7b8982;letter-spacing:.06em}.hint{font-size:11px;line-height:1.5;color:#82918c}.grid-fields{display:grid;grid-template-columns:1fr 1fr;gap:22px 17px;margin-top:29px}input:not(.amount-field input),select{display:block;width:100%;height:45px;border:1px solid #d8dfda;border-radius:4px;padding:10px 11px;color:#253730;background:#fafbf8;font-size:13px;font:inherit;outline-offset:3px}input:focus,select:focus{border-color:#5aa078}.submit-zone{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #e8ebe7;padding-top:24px;margin-top:25px}.submit-zone .hint{max-width:260px}button{border:0;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:space-between;gap:20px;font-size:13px;font-weight:750;transition:transform .12s,background .12s}button:not(:disabled):active{transform:translateY(1px)}button:disabled{cursor:not-allowed;opacity:.5}button[type=submit]:not(.secondary){min-height:46px;color:#fff;background:#1d4b37;padding:12px 18px}button[type=submit]:not(.secondary):hover:not(:disabled){background:#28704e}.account-row{display:flex;align-items:end;gap:12px}.account-row>.grow{flex:1}.account-row>div:last-child{width:155px}.secondary{min-height:43px;padding:10px 14px;border:1px solid #cbd6cf;background:#e9f2ed;color:#285b3e;margin-top:17px}.subline{font-size:12px;color:#738078;margin:-14px 0 18px}.feedback{min-height:0;font-size:12px;line-height:1.55;margin-top:12px}.feedback:empty{display:none}.feedback.error{color:#ae3e3e}.feedback.good{color:#217448}.history{padding:27px 5px 15px;margin-bottom:8px}.history .panel-title{padding:0 3px}.mini{font-size:11px;color:#37674d;background:transparent;padding:9px 3px}.history-body{border-top:1px solid #d7ddd8}.entry-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:17px 4px;border-bottom:1px solid #e0e4df}.entry-description{font-size:13px;font-weight:720}.entry-meta{font-size:11px;color:#728079;margin-top:5px}.entry-amount{font-size:15px;font-weight:760;font-variant-numeric:tabular-nums;white-space:nowrap}.empty{padding:24px 4px;color:#89968e;font-size:13px}footer{text-align:center;border-top:1px solid #d7ded7;padding:24px 0;color:#96a19a;font-size:9px;letter-spacing:.1em}@media(max-width:560px){.shell{padding:0 18px 30px}.intro{padding:32px 0 13px}.intro h1{font-size:45px}.panel,.panel.compact{padding:21px 18px}.grid-fields{grid-template-columns:1fr 1fr;gap:18px 11px}.submit-zone{flex-direction:column;align-items:stretch}.submit-zone .hint{max-width:none}button[type=submit]:not(.secondary){width:100%}.amount-field input{font-size:37px}.env{font-size:9px}.account-row{flex-direction:column;align-items:stretch}.account-row>div:last-child{width:100%}}@media(prefers-reduced-motion:reduce){button{transition:none}}.token-once{word-break:break-all;user-select:all;font:12px ui-monospace,monospace;margin-top:12px;color:#285b3e;line-height:1.5}',ee=`"use strict";
(() => {
  const get = (id) => document.getElementById(id);
  const state = { accounts: [], writes: false, entryKey: null, entryBody: null, accountKey: null, accountBody: null };
  const formEntry = get("entry-form");
  const formAccount = get("account-form");
  const buttonEntry = get("save-entry");
  const buttonAccount = get("save-account");
  const buttonEnroll = get("enroll-device");
  const buttonRevoke = get("revoke-device");
  const BANK_METHODS = new Set(["debit_card", "credit_card", "bank_transfer"]);
  const METHODS = new Set(["cash", "debit_card", "credit_card", "bank_transfer", "digital_wallet", "other"]);
  function updateBankField() {
    const needed = BANK_METHODS.has(get("method").value);
    const field = get("bank-field");
    const input = get("bank");
    field.hidden = !needed;
    input.required = needed;
    input.disabled = !needed;
    if (!needed) input.value = "";
  }
  const safe = (error) => error instanceof Error ? error.message : "Error de conexi\xF3n";
  const message = (target, value, bad = false) => {
    const node = get(target);
    node.textContent = value;
    node.className = "feedback " + (bad ? "error" : "good");
  };
  // Apple Shortcuts passes draft values via a URL *fragment*, never through an
  // HTTP query/body. Consume and erase it before performing any fetch.
  // This prefill is untrusted input; the authenticated POST still validates it.
  function consumeShortcutDraft() {
    const fragment = window.location.hash;
    if (!fragment || !fragment.startsWith("#quick=")) return null;
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {
      window.location.hash = "";
    }
    if (fragment.length > 512) return { error: "Atajo demasiado largo." };
    const params = new URLSearchParams(fragment.slice(1));
    const legacy = ["quick", "amount", "concept", "account"];
    const extended = [...legacy, "method", "bank"];
    const fields = [...params.keys()];
    // Existing 4-parameter shortcuts remain supported; new ones must
    // explicitly specify both method and bank (blank only if not bank-based).
    const allowed = fields.length === legacy.length ? legacy
      : fields.length === extended.length ? extended : null;
    if (!allowed || allowed.some((key) => params.getAll(key).length !== 1)
      || fields.some((key) => !allowed.includes(key)) || params.get("quick") !== "1") {
      return { error: "El enlace del Atajo no tiene el formato esperado." };
    }
    const amount = params.get("amount").trim();
    const concept = params.get("concept").trim();
    const account = params.get("account").trim();
    const method = allowed === extended ? params.get("method") : null;
    const bank = allowed === extended ? params.get("bank").trim() : "";
    if (method !== null && !METHODS.has(method)) {
      return { error: "M\xE9todo de pago inv\xE1lido en el Atajo." };
    }
    if (method !== null && ((BANK_METHODS.has(method) &&
      (!bank || bank.length > 80 || [...bank].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)))
      || (!BANK_METHODS.has(method) && bank !== ""))) {
      return { error: "El banco solo debe indicarse para tarjeta o transferencia, y no puede estar vac\xEDo en esos m\xE9todos." };
    }
    if (!/^[0-9]{1,10}([.][0-9]{1,2})?$/.test(amount) || !(Number(amount) > 0)) {
      return { error: "Monto inv\xE1lido. En el Atajo escribe 25000, sin puntos de miles." };
    }
    if (!concept || concept.length > 120 || !account || account.length > 100
      || [...concept, ...account].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
      return { error: "Concepto o cuenta no v\xE1lidos en el Atajo." };
    }
    return { amount, concept, account, method, bank };
  }
  const shortcutDraft = consumeShortcutDraft();
  function applyShortcutDraft() {
    if (!shortcutDraft) return;
    if (shortcutDraft.error) {
      message("entry-message", shortcutDraft.error + " Introduce los datos manualmente.", true);
      return;
    }
    get("amount").value = shortcutDraft.amount;
    get("merchant").value = shortcutDraft.concept;
    if (shortcutDraft.method !== null) {
      get("method").value = shortcutDraft.method;
      updateBankField();
      if (BANK_METHODS.has(shortcutDraft.method)) {
        get("bank").value = shortcutDraft.bank;
      }
    }
    // Do not guess the user's financial account if two labels match, or if
    // the requested account does not exist. Require a manual selection.
    const normalize = (label) => label.trim().toLocaleLowerCase("es-CO");
    const matched = state.accounts.filter((item) =>
      item.currency === "COP" && normalize(item.label) === normalize(shortcutDraft.account));
    if (matched.length !== 1) {
      get("account").selectedIndex = -1;
      buttonEntry.disabled = true;
      message("entry-message", "Monto y concepto precargados, pero no se encontr\xF3 una cuenta \xFAnica con el nombre indicado. Selecci\xF3nala manualmente.", true);
      return;
    }
    get("account").value = matched[0].id;
    message("entry-message", "Atajo precargado. Revisa el tipo de movimiento y el m\xE9todo antes de confirmar. Nada se ha guardado todav\xEDa.");
  }
  async function jsonFetch(path, init) {
    const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || ("Error HTTP " + response.status));
    return payload;
  }
  function setWriteEnabled(enabled, shortcutsConfigured = false) {
    state.writes = enabled;
    buttonEntry.disabled = !enabled || state.accounts.length === 0;
    buttonAccount.disabled = !enabled;
    buttonEnroll.disabled = !enabled || !shortcutsConfigured;
    get("write-flag").textContent = enabled ? "PRUEBAS HABILITADAS" : "SOLO LECTURA";
    get("write-flag").className = "pill" + (enabled ? " enabled" : "");
  }
  async function health() {
    try {
      const payload = await jsonFetch("/healthz");
      setWriteEnabled(payload.writesConfigured === true, payload.shortcutsConfigured === true);
      if (!state.writes) message("entry-message", "El registro est\xE1 temporalmente deshabilitado. La lectura de datos sigue disponible.");
    } catch { setWriteEnabled(false); }
  }
  async function accounts() {
    try {
      const data = await jsonFetch("/api/quick/accounts");
      state.accounts = Array.isArray(data.accounts) ? data.accounts : [];
      const sel = get("account");
      const previous = sel.value;
      sel.replaceChildren();
      if (state.accounts.length === 0) {
        const item = new Option("Primero crea una cuenta ficticia \u2193", "");
        sel.add(item);
        message("account-message", "Todav\xEDa no hay cuentas de prueba. Crea una abajo para continuar.");
      } else {
        for (const a of state.accounts) {
          sel.add(new Option(a.label + " \xB7 " + a.currency, a.id));
        }
        if (state.accounts.some((a) => a.id === previous)) sel.value = previous;
        else sel.selectedIndex = 0;
      }
      buttonEntry.disabled = !state.writes || state.accounts.length === 0;
    } catch (e) {
      message("account-message", "No se pudieron leer las cuentas: " + safe(e), true);
      buttonEntry.disabled = true;
    }
  }
  async function entries() {
    try {
      const data = await jsonFetch("/api/quick/entries");
      const list = get("history-body");
      list.replaceChildren();
      if (!data.entries || data.entries.length === 0) {
        const placeholder = document.createElement("div");
        placeholder.className = "empty";
        placeholder.textContent = "A\xFAn no hay gastos registrados.";
        list.append(placeholder);
        return;
      }
      for (const item of data.entries) {
        const row = document.createElement("div");
        row.className = "entry-row";
        const left = document.createElement("div");
        const concept = document.createElement("div");
        concept.className = "entry-description";
        concept.textContent = item.merchant || (item.kind === "investment_transfer" ? "Aporte a inversi\xF3n" : item.kind === "transfer" ? "Transferencia propia" : "Movimiento");
        const meta = document.createElement("div");
        meta.className = "entry-meta";
        const account = state.accounts.find((a) => a.id === item.account_id);
        const movementKind = item.kind === "investment_transfer"
          ? "APORTE A INVERSI\xD3N" : item.kind === "transfer"
            ? "TRANSFERENCIA PROPIA" : "GASTO";
        meta.textContent = movementKind + " \xB7 " + new Date(item.occurred_at).toLocaleDateString("es-CO") + (item.account_id === null ? "" : " \xB7 " + (account ? account.label : "Cuenta manual")) + (item.bank_label ? " \xB7 " + item.bank_label : "") + " \xB7 " + item.payment_method;
        left.append(concept, meta);
        const amount = document.createElement("div");
        amount.className = "entry-amount";
        amount.textContent = new Intl.NumberFormat("es-CO", { style: "currency", currency: item.currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(item.amount_minor) / 100);
        row.append(left, amount);
        list.append(row);
      }
    } catch (e) {
      get("history-body").textContent = "No se pudo leer el historial: " + safe(e);
    }
  }
  async function post(path, body) {
    return jsonFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  formAccount.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.writes || buttonAccount.disabled) return;
    const values = {
      label: get("account-label").value.trim(),
      accountKind: get("account-kind").value,
      currency: "COP",
      bankLabel: null,
    };
    const fingerprint = JSON.stringify(values);
    if (state.accountKey && state.accountBody !== fingerprint) {
      message("account-message", "Revisa el listado antes de modificar e intentar de nuevo una operaci\xF3n incierta.", true);
      return;
    }
    state.accountKey ??= crypto.randomUUID();
    state.accountBody = fingerprint;
    buttonAccount.disabled = true;
    try {
      const result = await post("/api/quick/accounts", { ...values, clientAccountId: state.accountKey });
      state.accountKey = null; state.accountBody = null;
      message("account-message", result.replayed ? "Cuenta recuperada; no se duplic\xF3." : "Cuenta ficticia creada correctamente.");
      await accounts();
      get("account").value = result.accountId;
    } catch (e) {
      message("account-message", "No se confirm\xF3 la creaci\xF3n: " + safe(e) + ". Consulta las cuentas antes de reintentar.", true);
    } finally { buttonAccount.disabled = !state.writes; }
  });
  formEntry.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.writes || buttonEntry.disabled) return;
    const acct = state.accounts.find((a) => a.id === get("account").value);
    if (!acct) { message("entry-message", "Selecciona una cuenta de prueba.", true); return; }
    const selectedClass = get("classification").value;
    const classLabel = selectedClass === "investment_transfer"
      ? "APORTE A INVERSI\xD3N (NO ES UN GASTO)"
      : selectedClass === "own_transfer"
        ? "TRANSFERENCIA PROPIA (NO ES UN GASTO)"
        : "GASTO";
    const needsBank = BANK_METHODS.has(get("method").value);
    const bankLabel = needsBank ? get("bank").value.trim() : null;
    if (needsBank && (!bankLabel || bankLabel.length > 80)) {
      message("entry-message", "Escribe el nombre del banco para tarjeta o transferencia.", true);
      return;
    }
    // Make the method, bank and economic classification explicit before
    // append-only storage. No automatic changes to previous entries.
    if (!window.confirm("Confirma este movimiento de prueba:\\n\\n" +
      classLabel + "\\nMonto: $" + get("amount").value.trim() +
      " " + acct.currency + "\\nCuenta: " + acct.label +
      (needsBank ? "\\nBanco: " + bankLabel : "") +
      "\\n\\n\xBFEs correcto el tipo de movimiento?")) return;
    const values = {
      accountId: acct.id, amount: get("amount").value.trim(),
      currency: acct.currency, paymentMethod: get("method").value,
      classification: selectedClass,
      occurredAt: new Date().toISOString(), merchant: get("merchant").value.trim() || null,
      bankLabel, confirmed: true,
    };
    // Reuse the same timestamp/key only on a retry with unchanged form data.
    const fields = { ...values, occurredAt: undefined };
    const fingerprint = JSON.stringify(fields);
    if (state.entryKey && state.entryBody?.fingerprint !== fingerprint) {
      message("entry-message", "Primero verifica el historial antes de cambiar los datos de un env\xEDo incierto.", true);
      return;
    }
    state.entryKey ??= crypto.randomUUID();
    if (!state.entryBody) state.entryBody = { fingerprint, occurredAt: values.occurredAt };
    values.occurredAt = state.entryBody.occurredAt;
    buttonEntry.disabled = true;
    try {
      const result = await post("/api/quick/entries", { ...values, clientEntryId: state.entryKey });
      state.entryKey = null; state.entryBody = null;
      message("entry-message", result.replayed ? "Movimiento confirmado; no se duplic\xF3." : "Movimiento ficticio guardado en D1.");
      await entries();
    } catch (e) {
      message("entry-message", "No se confirm\xF3 el guardado: " + safe(e) + ". Revisa el historial antes de reintentar.", true);
    } finally { buttonEntry.disabled = !state.writes || state.accounts.length === 0; }
  });
  buttonEnroll.addEventListener("click", async () => {
    if (!window.confirm("\xBFCrear un token personal para el iPhone? El anterior ser\xE1 revocado.")) return;
    buttonEnroll.disabled = true;
    try {
      const result = await post("/api/quick/shortcut/enroll", { label: "iPhone", confirmed: true });
      get("shortcut-token").textContent = result.token;
      message("shortcut-message", "Copia este token ahora: no volver\xE1 a mostrarse. Caduca en 90 d\xEDas.");
    } catch (error) {
      message("shortcut-message", "No se pudo habilitar el iPhone: " + safe(error), true);
    } finally { buttonEnroll.disabled = false; }
  });
  buttonRevoke.addEventListener("click", async () => {
    if (!window.confirm("\xBFRevocar el token del iPhone? El Atajo dejar\xE1 de registrar gastos.")) return;
    try {
      await post("/api/quick/shortcut/revoke", { confirmed: true });
      get("shortcut-token").textContent = "";
      message("shortcut-message", "Token revocado.");
    } catch (error) {
      message("shortcut-message", "No se pudo revocar el token: " + safe(error), true);
    }
  });
  get("copy-shortcut-token").addEventListener("click", async () => {
    const token = get("shortcut-token").textContent;
    if (!token) { message("shortcut-message", "Primero genera un token.", true); return; }
    try {
      await navigator.clipboard.writeText(token);
      message("shortcut-message", "Token copiado al portapapeles del iPhone.");
    } catch { message("shortcut-message", "Mant\xE9n pulsado el token para seleccionarlo y copiarlo.", true); }
  });
  get("method").addEventListener("change", updateBankField);
  updateBankField();
  get("refresh").addEventListener("click", () => void entries());
  get("account").addEventListener("change", () => {
    buttonEntry.disabled = !state.writes || !get("account").value;
  });
  void (async () => { await health(); await accounts(); applyShortcutDraft(); await entries(); })();
})();`;var te=`<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#172c2c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="FinanzasOSS">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="description" content="Tus movimientos y tu visi\xF3n financiera, en un mismo lugar privado.">
<link rel="manifest" href="/dashboard.webmanifest">
<link rel="icon" type="image/svg+xml" href="/dashboard-icon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/dashboard-icon-180.png">
<link rel="stylesheet" href="/dashboard.css">
<title>FinanzasOSS \xB7 Estudio financiero</title>
<script src="/dashboard.js" defer><\/script>
<script src="/studio.js" defer><\/script>
<script src="/budgets.js" defer><\/script>
<script src="/movement-editor.js" defer><\/script>
<script src="/statement-import.js" defer><\/script>
</head>
<body>
<a href="#contenido" class="skip">Saltar al contenido</a>
<div class="studio" id="studio">
  <aside class="rail" aria-label="Navegaci\xF3n principal">
    <a class="brand" href="/dashboard" aria-label="FinanzasOSS, inicio">
      <span class="brand-mark" aria-hidden="true">F<span class="brand-point">\xB7</span></span>
      <span class="brand-word">finanzas<span>oss</span><small>ESTUDIO PERSONAL</small></span>
    </a>
    <div class="rail-meta"><span class="live-led"></span> ENTORNO PRIVADO <span class="rail-number">01/08</span></div>
    <nav class="rail-navigation" id="primary-nav" aria-label="Espacios financieros">
      <button class="rail-item is-active" type="button" data-view="today" aria-current="page"><span class="rail-glyph" aria-hidden="true">\u25EB</span><span>Hoy</span><span class="rail-index">01</span></button>
      <button class="rail-item" type="button" data-view="movement"><span class="rail-glyph" aria-hidden="true">\u21C4</span><span>Movimientos</span><span class="rail-index">02</span></button>
      <button class="rail-item" type="button" data-view="portfolio"><span class="rail-glyph" aria-hidden="true">\u25C8</span><span>Portafolios</span><span class="rail-index">03</span></button>
      <button class="rail-item" type="button" data-view="plan"><span class="rail-glyph" aria-hidden="true">\u25A4</span><span>Plan</span><span class="rail-index">04</span></button>
      <button class="rail-item" type="button" data-view="map"><span class="rail-glyph" aria-hidden="true">\u25CE</span><span>Mapa financiero</span><span class="rail-index">05</span></button>
    </nav>
    <div class="rail-group-label">HERRAMIENTAS</div>
    <nav class="rail-navigation secondary-nav" aria-label="Herramientas">
      <button class="rail-item" type="button" data-view="imports"><span class="rail-glyph" aria-hidden="true">\u21A5</span><span>Importar</span></button>
      <button class="rail-item" type="button" data-view="connections"><span class="rail-glyph" aria-hidden="true">\u2301</span><span>Conexiones</span></button>
      <button class="rail-item" type="button" data-view="settings"><span class="rail-glyph" aria-hidden="true">\u2699</span><span>Ajustes</span></button>
    </nav>
    <div class="rail-bottom"><p class="rail-quote">No se trata de ver m\xE1s n\xFAmeros.<br><em>Se trata de entenderlos.</em></p><div class="rail-foot"><span>FINANZASOSS</span><span>2026 \xB7 CO</span></div></div>
  </aside>
  <div class="stage">
    <header class="masthead">
      <div class="masthead-left"><span class="mobile-mark" aria-hidden="true">F\xB7</span><span class="mast-location">TU ESPACIO <span class="mast-divider">/</span> <strong id="current-space">HOY</strong></span></div>
      <div class="mast-actions">
        <span id="today" class="local-date">Bogot\xE1</span>
        <button id="privacy-toggle" class="icon-button" type="button" aria-label="Ocultar cifras" aria-pressed="false" title="Ocultar cifras"><span aria-hidden="true">\u25C9</span></button>
        <button id="reload" class="icon-button" type="button" aria-label="Actualizar movimientos" title="Actualizar"><span class="native-refresh" aria-hidden="true"></span></button>
        <button id="add-top" class="new-button" type="button"><span aria-hidden="true">\uFF0B</span> Registrar gasto</button>
      </div>
    </header>
    <main id="contenido" class="main">
      <p id="live-announcement" class="sr-only" role="status" aria-live="polite"></p>
      <div id="error" class="alert" role="alert" hidden></div>
      <section class="space is-visible" id="space-today" data-space="today" aria-labelledby="heading-today">
        <div class="intro-line"><span class="intro-index">01 \u2014 RESUMEN</span><span class="intro-right">TU DINERO, SIN RUIDO <span aria-hidden="true"><span class="native-arrow" aria-hidden="true"></span></span></span></div>
        <div class="editorial-hero">
          <div class="hero-copy">
            <p class="eyebrow">FINANZAS PERSONALES / BOGOT\xC1</p>
            <h1 id="heading-today">Un poco m\xE1s <em>de claridad.</em></h1>
            <p class="hero-sub">Lo que gastas, c\xF3mo lo gastas y lo que vale la pena mirar. Todo en un solo espacio.</p>
            <div class="hero-status"><span class="live-led"></span><span id="hero-status">Sincronizando tus registros\u2026</span></div>
          </div>
          <div class="hero-stamp" aria-hidden="true"><span>F</span><span class="stamp-arrow"><span class="native-arrow" aria-hidden="true"></span></span><small>FI<span>NA</span>NZAS</small></div>
        </div>
        <div class="budget-home" id="budget-home" aria-live="polite"><div><span class="micro-label">TU PLAN DE GASTOS</span><p id="budget-home-status">Configura tus l\xEDmites para seguir tus gastos diarios, semanales, mensuales y anuales.</p></div><button type="button" class="soft-button" data-view="plan">Gestionar l\xEDmites <span class="native-arrow" aria-hidden="true"></span></button></div>
        <div class="section-topline"><span>LECTURA DEL PER\xCDODO</span><span class="section-count">DATOS COP \xB7 REGISTRADOS</span></div>
        <div class="period-strip">
          <div class="period-controls" role="group" aria-label="Seleccionar per\xEDodo">
            <button type="button" class="period-btn" data-period="day">Hoy</button>
            <button type="button" class="period-btn" data-period="week">Semana</button>
            <button type="button" class="period-btn active" data-period="month" aria-pressed="true">Mes</button>
            <button type="button" class="period-btn" data-period="year">A\xF1o</button>
            <button type="button" class="period-btn" data-period="all">Todo</button>
          </div>
          <span id="period-label" class="period-caption">Cargando\u2026</span>
        </div>
        <div class="metrics">
          <article class="metric metric-feature"><div class="metric-top"><span>GASTOS DEL PER\xCDODO</span><span>01 / 04</span></div><div class="metric-money" data-private id="kpi-total">\u2014</div><div class="metric-bottom"><span class="delta muted" id="kpi-compare">Cargando</span><span class="kpi-note">vs. per\xEDodo anterior</span></div></article>
          <article class="metric"><div class="metric-top"><span>MOVIMIENTOS</span><span>02 / 04</span></div><div class="metric-money" id="kpi-count">\u2014</div><p>Gastos registrados</p></article>
          <article class="metric"><div class="metric-top"><span>PROMEDIO</span><span>03 / 04</span></div><div class="metric-money" data-private id="kpi-average">\u2014</div><p>Por movimiento</p></article>
          <article class="metric"><div class="metric-top"><span>HIST\xD3RICO</span><span>04 / 04</span></div><div class="metric-money" data-private id="kpi-all">\u2014</div><p id="all-count">Total de gastos</p></article>
        </div>
        <div class="analytics-grid">
          <article class="editorial-panel trend-panel"><div class="panel-heading"><div><div class="micro-label">EVOLUCI\xD3N / 01</div><h2>El pulso de tus gastos</h2><p id="trend-subtitle">Evoluci\xF3n del per\xEDodo</p></div><span class="panel-tag">COP <span class="tiny-dot"></span></span></div>
            <div class="chart-wrap" data-private><svg id="trend" role="img" aria-label="Gr\xE1fico de gastos" viewBox="0 0 800 255" preserveAspectRatio="none"><defs><linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#bb784e" stop-opacity=".21"/><stop offset="100%" stop-color="#bb784e" stop-opacity="0"/></linearGradient></defs><g id="gridlines"></g><path id="trend-area" fill="url(#trendGradient)"></path><path id="trend-line" fill="none" stroke="#aa613f" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round"></path><g id="trend-dots"></g></svg><div class="chart-ends"><span id="chart-first">\u2014</span><span id="chart-last">\u2014</span></div></div>
            <div class="panel-footer"><span><i class="tiny-dot"></i> Datos registrados</span><strong id="trend-total" data-private>\u2014</strong></div>
          </article>
          <article class="editorial-panel method-panel"><div class="panel-heading"><div><div class="micro-label">COMPORTAMIENTO / 02</div><h2>C\xF3mo se mueve</h2><p>Distribuci\xF3n por medios de pago</p></div></div>
            <div class="donut-area" data-private><div class="donut" id="donut" role="img" aria-label="Distribuci\xF3n por m\xE9todo"><div class="donut-hole"><span>REGISTROS</span><strong id="donut-total">\u2014</strong></div></div></div><div id="methods" class="methods"></div>
          </article>
        </div>
        <div class="bottom-grid">
          <article class="editorial-panel bars-panel"><div class="panel-heading"><div><div class="micro-label">\xDALTIMOS SIETE D\xCDAS / 03</div><h2>Semana a semana</h2><p>Actividad reciente en horario de Colombia</p></div></div><div id="week-bars" class="week-bars" data-private></div></article>
          <article class="editorial-panel insight-panel"><div class="panel-heading"><div><div class="micro-label">UNA MIRADA M\xC1S / 04</div><h2>En perspectiva</h2></div></div><div class="insight-row"><span>D\xEDa de mayor gasto</span><strong id="peak-day" data-private>\u2014</strong></div><div class="insight-row"><span>M\xE9todo predominante</span><strong id="top-method">\u2014</strong></div><div class="insight-row"><span>Movimientos hist\xF3ricos</span><strong id="all-movements">\u2014</strong></div></article>
        </div>
        <button type="button" class="full-link" data-view="movement"><span>Explora el historial de movimientos</span><span>VER TODOS <b aria-hidden="true"><span class="native-arrow" aria-hidden="true"></span></b></span></button>
      </section>
      <section class="space" id="space-movement" data-space="movement" aria-labelledby="heading-movement" hidden>
        <div class="intro-line"><span class="intro-index">02 \u2014 MOVIMIENTOS</span><span class="intro-right">SIN SALDOS SUPUESTOS</span></div>
        <div class="page-intro"><p class="eyebrow">TU LIBRO DE REGISTRO</p><h1 id="heading-movement">Cada peso <em>cuenta algo.</em></h1><p>Una cronolog\xEDa honesta de todos los gastos ingresados desde tu iPhone y la captura manual.</p></div>
        <div class="history-toolbar"><div class="history-left"><span id="history-count" class="history-count">\u2014 movimientos</span><span class="history-note">M\xE1s recientes primero</span></div><div class="history-right"><button id="refresh-history" type="button" class="soft-button"><span class="native-refresh" aria-hidden="true"></span> Actualizar</button><button id="add-movement" type="button" class="solid-button">\uFF0B A\xF1adir gasto</button></div></div>
        <article class="table-panel"><div class="table-scroll"><table aria-label="Historial de movimientos financieros"><thead><tr><th>CONCEPTO / TIPO</th><th>FECHA</th><th>M\xC9TODO DE PAGO</th><th class="align-right">VALOR</th><th class="history-actions-head"><span class="sr-only">Acciones</span></th></tr></thead><tbody id="history-body"><tr><td colspan="5" class="empty-row">Cargando tus movimientos\u2026</td></tr></tbody></table></div><div class="history-bottom"><p id="history-status">Consultando historial\u2026</p><button id="load-more" type="button" class="soft-button" hidden>Cargar movimientos anteriores <span aria-hidden="true">\u2193</span></button></div></article>
        <p class="footnote">Los registros sin cuenta no se asignan autom\xE1ticamente a una cuenta bancaria. Las transferencias propias y los aportes de inversi\xF3n no se cuentan como consumo.</p>
      </section>
      <section class="space" id="space-portfolio" data-space="portfolio" aria-labelledby="heading-portfolio" hidden>
        <div class="intro-line"><span class="intro-index">03 \u2014 PORTAFOLIOS</span><span class="intro-right">INVERSI\xD3N / SOLO LECTURA</span></div>
        <div class="page-intro"><p class="eyebrow">TUS ACTIVOS, EN CONTEXTO</p><h1 id="heading-portfolio">Construir tambi\xE9n <em>es medir.</em></h1><p>El lugar para ver aportes, rendimiento, posiciones y patrimonio, cuando existan fuentes verificadas.</p></div>
        <article class="statement-card"><div><span class="statement-kicker">PATRIMONIO VERIFICADO</span><h2>Sin valor disponible <span aria-hidden="true">\u2014</span></h2><p>No hay posiciones ni saldos sincronizados. Un gasto registrado no permite calcular tu patrimonio.</p></div><span class="statement-symbol" aria-hidden="true">\u25CC</span></article>
        <div class="three-columns">
          <article class="module"><span class="module-no">01 / FUENTE</span><h3>Hapi</h3><p>Importaci\xF3n por extractos oficiales. A\xFAn no vinculada en esta PWA.</p><span class="state-pill">Sin datos conectados</span></article>
          <article class="module"><span class="module-no">02 / FUENTE</span><h3>Binance</h3><p>Adaptador de solo lectura en el proyecto original. Sin credenciales productivas.</p><span class="state-pill">Sin datos conectados</span></article>
          <article class="module"><span class="module-no">03 / FUENTE</span><h3>Interactive Brokers</h3><p>Adaptador preparado. La consulta real exige autorizaci\xF3n verificada.</p><span class="state-pill">Sin datos conectados</span></article>
        </div>
        <div class="guidance"><span class="guidance-mark" aria-hidden="true"><span class="native-arrow" aria-hidden="true"></span></span><div><h3>El sistema original sigue aqu\xED.</h3><p>Los modelos de posiciones, aportes netos, dividendos, costo base y rentabilidad se conservan en el repositorio. Todav\xEDa no se alimentan de fuentes autorizadas en este entorno.</p></div><button class="soft-button" data-view="imports" type="button">Explorar importaci\xF3n</button></div>
      </section>
      <section class="space" id="space-plan" data-space="plan" aria-labelledby="heading-plan" hidden>
        <div class="intro-line"><span class="intro-index">04 \u2014 PLAN</span><span class="intro-right">OBSERVACIONES / NO PRON\xD3STICOS</span></div>
        <div class="page-intro"><p class="eyebrow">CONOCE TUS H\xC1BITOS</p><h1 id="heading-plan">Poner intenci\xF3n <em>a cada gasto.</em></h1><p>Lecturas basadas en tu historial, sin presupuestos inventados ni compromisos financieros autom\xE1ticos.</p></div>
        <div class="three-columns">
          <article class="module"><span class="module-no">GASTOS / MES ACTUAL</span><strong id="plan-month" data-private class="module-value">\u2014</strong><p>El total registrado hasta hoy, no tu gasto bancario completo.</p></article>
          <article class="module"><span class="module-no">D\xCDAS CON GASTOS / MES</span><strong id="plan-days" class="module-value">\u2014</strong><p>D\xEDas en los que a\xF1adiste al menos un movimiento.</p></article>
          <article class="module"><span class="module-no">PROMEDIO DIARIO REGISTRADO</span><strong id="plan-average" data-private class="module-value">\u2014</strong><p>Distribuido entre los d\xEDas transcurridos este mes.</p></article>
        </div>
        <section class="budget-section" aria-labelledby="budgets-heading">
 <div class="budget-heading"><div><span class="micro-label">PLAN \xB7 CONTROL PERSONAL</span><h2 id="budgets-heading">Tus l\xEDmites <em>de gasto.</em></h2><p>Establece hasta cu\xE1nto te propones gastar. Calculamos todo con los movimientos que registraste en COP, incluyendo el Atajo del iPhone. Semana: lunes a domingo. No incluye movimientos bancarios a\xFAn no conectados.</p></div><span class="state-pill">4 per\xEDodos independientes</span></div>
 <div id="budget-cards" class="budget-grid"><article class="budget-card" data-budget-period="day">
 <div class="budget-card-top"><div><span class="micro-label">L\xCDMITE DIARIO</span><h3>Diario</h3><p>Cada d\xEDa, de 00:00 a 23:59 \xB7 hora de Bogot\xE1</p></div><span id="budget-status-day" class="budget-chip">Sin configurar</span></div>
 <div class="budget-stat"><strong data-private id="budget-spent-day">\u2014</strong><span data-private id="budget-remaining-day">\u2014</span></div>
 <progress id="budget-progress-day" class="budget-progress" value="0" max="100" aria-label="Porcentaje del presupuesto diario utilizado"></progress>
 <label for="budget-input-day">Tu l\xEDmite en pesos (COP)</label><div class="budget-edit"><div class="budget-amount"><span aria-hidden="true">$</span><input data-private id="budget-input-day" type="text" inputmode="numeric" pattern="[0-9]{1,10}" maxlength="10" placeholder="Sin l\xEDmite" autocomplete="off"></div><button type="button" class="solid-button" data-budget-save="day">Guardar</button><button type="button" class="soft-button" data-budget-remove="day">Quitar</button></div>
 </article>
<article class="budget-card" data-budget-period="week">
 <div class="budget-card-top"><div><span class="micro-label">L\xCDMITE SEMANAL</span><h3>Semanal</h3><p>De lunes a domingo \xB7 hora de Bogot\xE1</p></div><span id="budget-status-week" class="budget-chip">Sin configurar</span></div>
 <div class="budget-stat"><strong data-private id="budget-spent-week">\u2014</strong><span data-private id="budget-remaining-week">\u2014</span></div>
 <progress id="budget-progress-week" class="budget-progress" value="0" max="100" aria-label="Porcentaje del presupuesto semanal utilizado"></progress>
 <label for="budget-input-week">Tu l\xEDmite en pesos (COP)</label><div class="budget-edit"><div class="budget-amount"><span aria-hidden="true">$</span><input data-private id="budget-input-week" type="text" inputmode="numeric" pattern="[0-9]{1,10}" maxlength="10" placeholder="Sin l\xEDmite" autocomplete="off"></div><button type="button" class="solid-button" data-budget-save="week">Guardar</button><button type="button" class="soft-button" data-budget-remove="week">Quitar</button></div>
 </article>
<article class="budget-card" data-budget-period="month">
 <div class="budget-card-top"><div><span class="micro-label">L\xCDMITE MENSUAL</span><h3>Mensual</h3><p>Del d\xEDa 1 al \xFAltimo d\xEDa del mes \xB7 hora de Bogot\xE1</p></div><span id="budget-status-month" class="budget-chip">Sin configurar</span></div>
 <div class="budget-stat"><strong data-private id="budget-spent-month">\u2014</strong><span data-private id="budget-remaining-month">\u2014</span></div>
 <progress id="budget-progress-month" class="budget-progress" value="0" max="100" aria-label="Porcentaje del presupuesto mensual utilizado"></progress>
 <label for="budget-input-month">Tu l\xEDmite en pesos (COP)</label><div class="budget-edit"><div class="budget-amount"><span aria-hidden="true">$</span><input data-private id="budget-input-month" type="text" inputmode="numeric" pattern="[0-9]{1,10}" maxlength="10" placeholder="Sin l\xEDmite" autocomplete="off"></div><button type="button" class="solid-button" data-budget-save="month">Guardar</button><button type="button" class="soft-button" data-budget-remove="month">Quitar</button></div>
 </article>
<article class="budget-card" data-budget-period="year">
 <div class="budget-card-top"><div><span class="micro-label">L\xCDMITE ANUAL</span><h3>Anual</h3><p>Del 1 de enero al 31 de diciembre \xB7 hora de Bogot\xE1</p></div><span id="budget-status-year" class="budget-chip">Sin configurar</span></div>
 <div class="budget-stat"><strong data-private id="budget-spent-year">\u2014</strong><span data-private id="budget-remaining-year">\u2014</span></div>
 <progress id="budget-progress-year" class="budget-progress" value="0" max="100" aria-label="Porcentaje del presupuesto anual utilizado"></progress>
 <label for="budget-input-year">Tu l\xEDmite en pesos (COP)</label><div class="budget-edit"><div class="budget-amount"><span aria-hidden="true">$</span><input data-private id="budget-input-year" type="text" inputmode="numeric" pattern="[0-9]{1,10}" maxlength="10" placeholder="Sin l\xEDmite" autocomplete="off"></div><button type="button" class="solid-button" data-budget-save="year">Guardar</button><button type="button" class="soft-button" data-budget-remove="year">Quitar</button></div>
 </article></div>
 <p id="budget-message" role="status" aria-live="polite" class="budget-message">Consultando tus presupuestos\u2026</p>
 <p class="budget-note">Recibir\xE1s avisos dentro de FinanzasOSS al llegar al 80 % o alcanzar el l\xEDmite. Nunca bloquearemos un registro real por superar una meta. Los l\xEDmites no transfieren dinero ni tienen acceso a bancos.</p>
 </section>
      </section>
      <section class="space" id="space-map" data-space="map" aria-labelledby="heading-map" hidden>
        <div class="intro-line"><span class="intro-index">05 \u2014 MAPA FINANCIERO</span><span class="intro-right">ORIGEN / DESTINO</span></div>
        <div class="page-intro"><p class="eyebrow">ENTENDER EL RECORRIDO</p><h1 id="heading-map">Por d\xF3nde <em>se va.</em></h1><p>Mapa de tus gastos realmente registrados, agrupados por m\xE9todo. No representa conexiones bancarias ni dinero disponible.</p></div>
        <article class="flow-panel">
          <div class="flow-source"><span>REGISTROS DE GASTO</span><strong id="map-total" data-private>\u2014</strong><small>Acumulado registrado en COP</small></div>
          <div class="flow-channel" aria-hidden="true"><span></span><i class="native-arrow-right" aria-hidden="true"></i></div>
          <div id="map-targets" class="flow-targets"><p>Cargando m\xE9todos de pago\u2026</p></div>
        </article>
        <div class="guidance"><span class="guidance-mark" aria-hidden="true">\u203B</span><div><h3>Un mapa sin duplicar movimientos.</h3><p>Los movimientos de bancos y portafolios solo podr\xE1n agregarse con reconciliaci\xF3n verificada para no sumar dos veces una misma operaci\xF3n.</p></div></div>
      </section>
      <section class="space" id="space-imports" data-space="imports" aria-labelledby="heading-imports" hidden>
        <div class="intro-line"><span class="intro-index">06 \u2014 IMPORTAR DATOS</span><span class="intro-right">CSV \xB7 REVISI\xD3N OBLIGATORIA</span></div>
        <div class="page-intro"><p class="eyebrow">EXTRACTOS BANCARIOS</p><h1 id="heading-imports">Importa con <em>control.</em></h1><p>Sube un CSV de ejemplo en staging, indica sus columnas y revisa cada d\xE9bito antes de guardar. No conecta cuentas ni deduce saldos.</p></div>
        <section class="module import-studio" aria-labelledby="import-upload-heading">
          <div><span class="module-no">01 / CSV DE D\xC9BITOS \xB7 PESOS COLOMBIANOS</span><h2 id="import-upload-heading">Selecciona un extracto</h2><p>CSV UTF-8, hasta 50 filas y 64 KB. Fechas AAAA-MM-DD, montos positivos sin separador de miles y columna de tipo con <code>debit</code> para compras. Los abonos se omiten. En esta primera versi\xF3n no se admiten XLSX, OFX ni PDF en la PWA.</p></div>
          <label for="import-file">Archivo CSV</label><input id="import-file" type="file" accept=".csv,text/csv" aria-describedby="import-status"/>
          <div class="import-options">
            <label for="import-bank">Nombre del banco del extracto<input id="import-bank" type="text" maxlength="80" placeholder="Ej. Bancolombia" autocomplete="off"/></label>
            <label for="import-payment-method">Medio de pago<select id="import-payment-method"><option value="debit_card">Tarjeta d\xE9bito</option><option value="credit_card">Tarjeta cr\xE9dito</option><option value="bank_transfer">Transferencia bancaria</option></select></label>
          </div>
          <div id="import-mapping" hidden><h3>Asignar columnas</h3><p>Selecciona las columnas originales del archivo. No se deduce su significado autom\xE1ticamente.</p>
            <div class="import-options">
              <label>Fecha<select id="import-col-date"></select></label>
              <label>Concepto<select id="import-col-description"></select></label>
              <label>Importe<select id="import-col-amount"></select></label>
              <label>Tipo (debit/credit)<select id="import-col-direction"></select></label>
              <label>Moneda, opcional<select id="import-col-currency"></select></label>
              <label>ID de transacci\xF3n, opcional<select id="import-col-external"></select></label>
            </div>
          </div>
          <button class="solid-button" id="import-preview" type="button" disabled>Revisar CSV</button>
          <p id="import-status" role="status" aria-live="polite">Todav\xEDa no has elegido un archivo.</p>
          <div id="import-review" hidden><h3>02 / Vista previa del extracto</h3>
            <p id="import-summary" aria-live="polite"></p>
            <div class="import-review-list" id="import-rows"></div>
            <div class="import-confirm-actions"><button id="import-confirm" type="button" class="solid-button" disabled>Confirmar importaci\xF3n seleccionada</button><button id="import-cancel" type="button" class="soft-button">Cancelar revisi\xF3n</button></div>
            <p class="budget-note">La importaci\xF3n a\xF1ade gastos sin asignar una cuenta bancaria. Excluye posibles duplicados por fecha, monto y concepto. Si una compra ya est\xE1 registrada, comprueba Movimientos antes de importar.</p>
          </div>
        </section>
      </section>
      <section class="space" id="space-connections" data-space="connections" aria-labelledby="heading-connections" hidden>
        <div class="intro-line"><span class="intro-index">07 \u2014 CONEXIONES</span><span class="intro-right">SOLO INTEGRACIONES AUTORIZADAS</span></div>
        <div class="page-intro"><p class="eyebrow">FUENTES DE CONFIANZA</p><h1 id="heading-connections">Todo conectado. <em>Cuando sea seguro.</em></h1><p>Los m\xF3dulos para entidades colombianas existen en el c\xF3digo, pero ninguna sincronizaci\xF3n bancaria real est\xE1 activada en el entorno actual.</p></div>
        <div class="connections-grid" id="connections-grid">
          <article class="connection"><span class="connection-icon">B.</span><div><h3>Bancolombia</h3><p>Acceso oficial pendiente</p></div><span class="state-pill">No conectado</span></article>
          <article class="connection"><span class="connection-icon">N.</span><div><h3>Nequi</h3><p>Acceso oficial pendiente</p></div><span class="state-pill">No conectado</span></article>
          <article class="connection"><span class="connection-icon">D.</span><div><h3>Davivienda</h3><p>Acceso oficial pendiente</p></div><span class="state-pill">No conectado</span></article>
          <article class="connection"><span class="connection-icon">L.</span><div><h3>Lulo Bank</h3><p>Acceso oficial pendiente</p></div><span class="state-pill">No conectado</span></article>
        </div>
        <p class="footnote">Aqu\xED nunca pediremos contrase\xF1as de banca en l\xEDnea, claves de retiro ni frases semilla.</p>
      </section>
      <section class="space" id="space-settings" data-space="settings" aria-labelledby="heading-settings" hidden>
        <div class="intro-line"><span class="intro-index">08 \u2014 AJUSTES</span><span class="intro-right">CONTROL PERSONAL</span></div>
        <div class="page-intro"><p class="eyebrow">UNA EXPERIENCIA A TU MEDIDA</p><h1 id="heading-settings">Tu espacio. <em>Tus reglas.</em></h1><p>Cambia c\xF3mo ves los datos. Ninguna preferencia financiera se env\xEDa a servicios externos.</p></div>
        <div class="settings-panel"><div class="setting-row app-setting profile-setting">
  <div><h3>Perfil activo</h3><p>Solo ves tus propios gastos, presupuestos, importaciones y dispositivos autorizados. Cada correo tiene su espacio privado.</p>
  <p id="profile-email" data-private role="status" aria-live="polite">Comprobando cuenta\u2026</p></div>
  <a class="soft-button profile-logout" href="/cdn-cgi/access/logout" aria-label="Cerrar sesi\xF3n de FinanzasOSS y cambiar de cuenta">Cerrar sesi\xF3n / Cambiar perfil</a>
</div><div class="setting-row"><div><h3>Modo privacidad</h3><p>Oculta visualmente los montos cuando alguien mire tu pantalla.</p></div><button id="privacy-setting" type="button" class="toggle-button" role="switch" aria-checked="false">Desactivado</button></div><div class="setting-row"><div><h3>Movimiento reducido</h3><p>Desactiva las transiciones decorativas. Respeta la preferencia de accesibilidad del sistema.</p></div><button id="motion-setting" type="button" class="toggle-button" role="switch" aria-checked="false">Seg\xFAn sistema</button></div><div class="setting-row"><div><h3>Apariencia</h3><p>Un estilo editorial luminoso o una variante nocturna.</p></div><button id="theme-setting" type="button" class="toggle-button">Modo oscuro</button></div><div class="setting-row"><div><h3>Datos y almacenamiento</h3><p>La PWA funciona en l\xEDnea. No almacena tu historial, credenciales ni saldos sin conexi\xF3n.</p></div><span class="state-pill">Datos privados</span></div>
<div class="setting-row app-setting"><div><h3>Instalar FinanzasOSS</h3><p>\xDAsala desde el icono de inicio como una aplicaci\xF3n. Los movimientos financieros nunca se guardan sin conexi\xF3n.</p><p id="install-feedback" class="app-setting-status" role="status" aria-live="polite">Lista para instalar en tu celular.</p></div><button id="install-pwa" type="button" class="soft-button">Instalar aplicaci\xF3n</button></div>
<div class="setting-row app-setting"><div><h3>Recordatorio de gastos</h3><p>Aviso diario opcional a las 8:30 p. m. (Bogot\xE1). No incluye montos, bancos ni conceptos.</p><p id="push-feedback" class="app-setting-status" role="status" aria-live="polite">Comprobando disponibilidad\u2026</p></div><div class="push-actions"><button id="push-toggle" type="button" class="soft-button" disabled>Comprobar</button><button id="push-test" type="button" class="soft-button" disabled>Enviar prueba al iPhone</button></div></div>
<div class="setting-row danger-row">
  <div><h3>Restablecer movimientos y saldos</h3>
  <p>Borra gastos y movimientos de este mes o de todos los meses. Los acumulados del panel se recalculan. No modifica bancos externos, cuentas manuales ni el Atajo del iPhone.</p></div>
  <button type="button" id="reset-open" class="danger-button">Restablecer movimientos y saldos <span class="native-arrow" aria-hidden="true"></span></button>
</div></div>
      </section>
      <footer class="site-footer"><span>F\xB7 FINANZASOSS <i> / </i> ESTUDIO FINANCIERO</span><span>ACCESO PRIVADO \xB7 STAGING \xB7 COLOMBIA</span></footer>
    </main>
  </div>
  <nav class="mobile-nav" aria-label="Navegaci\xF3n m\xF3vil">
    <button type="button" class="mobile-item is-active" data-view="today" aria-current="page"><span>\u2302</span><small>Hoy</small></button>
    <button type="button" class="mobile-item" data-view="movement"><span>\u21C4</span><small>Actividad</small></button>
    <button id="add-mobile" type="button" class="mobile-create" aria-label="Registrar gasto"><span>\uFF0B</span></button>
    <button type="button" class="mobile-item" data-view="portfolio"><span>\u25C8</span><small>Portafolio</small></button>
    <button type="button" class="mobile-item" id="open-more" aria-haspopup="dialog" aria-controls="more-dialog"><span>\u2637</span><small>M\xE1s</small></button>
  </nav>
</div>
<dialog id="more-dialog" class="more-dialog" aria-labelledby="more-heading">
<div class="more-top"><div><span class="micro-label">NAV / FINANZASOSS</span><h2 id="more-heading">Explorar <em>espacios.</em></h2></div><button type="button" id="close-more" class="icon-button" aria-label="Cerrar navegaci\xF3n">\xD7</button></div>
<div class="more-links">
<button type="button" data-view="today"><span>01</span>Hoy <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="movement"><span>02</span>Movimientos <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="portfolio"><span>03</span>Portafolios <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="plan"><span>04</span>Plan <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="map"><span>05</span>Mapa financiero <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="imports"><span>06</span>Importar <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="connections"><span>07</span>Conexiones <b><span class="native-arrow" aria-hidden="true"></span></b></button>
<button type="button" data-view="settings"><span>08</span>Ajustes <b><span class="native-arrow" aria-hidden="true"></span></b></button>
</div>
<p class="more-foot">Un mismo espacio, todos tus movimientos.</p>
</dialog>

<dialog id="reset-dialog" class="reset-dialog" aria-labelledby="reset-heading">
  <div class="reset-top"><span class="micro-label">AJUSTES / GESTIONAR MOVIMIENTOS</span><button type="button" class="icon-button" id="reset-close" aria-label="Cerrar restablecimiento">\xD7</button></div>
  <h2 id="reset-heading">Restablecer <em>movimientos.</em></h2>
  <p class="reset-description">Elige qu\xE9 per\xEDodo quieres borrar en <strong>FinanzasOSS staging</strong>. Se eliminar\xE1n los movimientos de ese per\xEDodo y se recalcular\xE1n los acumulados del dashboard. Los bancos externos no cambian.</p>
  <fieldset class="reset-scopes"><legend>\xBFQu\xE9 per\xEDodo quieres restablecer?</legend>
    <label class="reset-scope"><input type="radio" name="reset-scope" value="month" checked><span><strong>Este mes</strong><small>Solo movimientos del mes actual, seg\xFAn la hora de Bogot\xE1</small></span></label>
    <label class="reset-scope"><input type="radio" name="reset-scope" value="all"><span><strong>Todos los meses</strong><small>Historial completo de movimientos registrados en staging</small></span></label>
  </fieldset>
  <button type="button" id="reset-preview" class="soft-button reset-preview">Revisar movimientos afectados</button>
  <div id="reset-counts" class="reset-counts" aria-live="polite"><p>Selecciona un per\xEDodo y pulsa Revisar para conocer cu\xE1ntos registros se eliminar\xEDan.</p></div>
  <p class="reset-warning"><strong>Se conservan:</strong> tus cuentas manuales, el acceso a FinanzasOSS y la autorizaci\xF3n de Registrar Gasto Directo. No se borran saldos bancarios externos ni credenciales.</p>
  <label class="reset-check"><input id="reset-ack" type="checkbox" disabled><span>Revis\xE9 el per\xEDodo y la cantidad de movimientos. Entiendo que la eliminaci\xF3n no se puede deshacer desde la PWA.</span></label>
  <label for="reset-phrase" class="reset-type-label">Para confirmar, escribe <strong id="reset-required-phrase">BORRAR ESTE MES</strong></label>
  <input id="reset-phrase" class="reset-phrase" type="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="BORRAR ESTE MES" disabled>
  <p id="reset-feedback" class="reset-feedback" role="status" aria-live="polite"></p>
  <div class="reset-actions">
    <button id="reset-cancel" type="button" class="soft-button">Cancelar</button>
    <button id="reset-confirm" type="button" class="danger-confirm" disabled>Eliminar movimientos seleccionados</button>
  </div>
</dialog>
<dialog id="expense-dialog" aria-labelledby="expense-heading" class="expense-dialog">
  <form id="expense-form" autocomplete="off">
    <div class="dialog-kicker">CAPTURA SEGURA / COP</div>
    <div class="dialog-head"><h2 id="expense-heading">Un gasto, <em>sin vueltas.</em></h2><button id="close-expense" class="icon-button" type="button" aria-label="Cerrar">\xD7</button></div>
    <p>Sin cuenta asociada, igual que el Atajo de tu iPhone.</p>
    <label for="expense-amount">Monto en pesos colombianos</label>
    <div class="expense-amount"><span>$</span><input id="expense-amount" name="amount" type="text" inputmode="numeric" placeholder="0" maxlength="12" pattern="[0-9]{1,12}" required></div>
    <label for="expense-concept">\xBFEn qu\xE9 gastaste?</label><input id="expense-concept" name="concept" type="text" maxlength="120" required placeholder="Por ejemplo, almuerzo">
    <label for="expense-method">\xBFC\xF3mo pagaste?</label>
    <select id="expense-method" name="paymentMethod" required>
      <option value="cash">Efectivo</option><option value="debit_card">Tarjeta d\xE9bito</option><option value="credit_card">Tarjeta cr\xE9dito</option><option value="bank_transfer">Transferencia bancaria</option><option value="digital_wallet">Billetera digital</option><option value="other">Otro</option>
    </select>
    <div id="expense-bank-row" hidden><label for="expense-bank">\xBFQu\xE9 banco es?</label><input id="expense-bank" name="bankLabel" list="bank-suggestions" maxlength="80" placeholder="Selecciona o escribe un banco"><datalist id="bank-suggestions"><option value="Bancolombia"><option value="Nequi"><option value="Davivienda"><option value="Daviplata"><option value="Lulo Bank"><option value="RappiPay"><option value="Pibank"><option value="Nu Colombia"></datalist></div>
    <div id="expense-review" class="expense-review" role="status" hidden></div>
    <p id="expense-feedback" class="expense-feedback" role="status" aria-live="polite"></p>
    <button id="expense-submit" class="save-button" type="submit">Revisar movimiento <span class="native-arrow-right" aria-hidden="true"></span></button>
    <small class="dialog-foot">Solo staging. No registres datos financieros reales todav\xEDa.</small>
  </form>
</dialog>

<dialog id="movement-edit-dialog" class="expense-dialog movement-editor" aria-labelledby="movement-edit-heading">
 <form id="movement-edit-form" autocomplete="off">
  <div class="dialog-kicker">CORREGIR REGISTRO \xB7 COP</div>
  <div class="dialog-head"><h2 id="movement-edit-heading">Editar <em>gasto.</em></h2><button id="movement-edit-close" type="button" class="icon-button" aria-label="Cerrar edici\xF3n">\xD7</button></div>
  <p>Modifica este gasto sin cambiar su identidad ni asociarlo a otra cuenta. Los l\xEDmites se recalcular\xE1n.</p>
  <label for="movement-edit-amount">Importe (COP)</label>
  <div class="expense-amount"><span>$</span><input id="movement-edit-amount" type="text" maxlength="13" inputmode="decimal" pattern="[0-9]{1,10}([.][0-9]{1,2})?" required></div>
  <label for="movement-edit-concept">Concepto</label>
  <input id="movement-edit-concept" type="text" maxlength="120" required>
  <label for="movement-edit-method">M\xE9todo de pago</label>
  <select id="movement-edit-method" required><option value="cash">Efectivo</option><option value="debit_card">Tarjeta d\xE9bito</option><option value="credit_card">Tarjeta cr\xE9dito</option><option value="bank_transfer">Transferencia bancaria</option><option value="digital_wallet">Billetera digital</option><option value="other">Otro</option></select>
  <div id="movement-edit-bank-row" hidden><label for="movement-edit-bank">Banco</label><input id="movement-edit-bank" type="text" maxlength="80"></div>
  <div id="movement-edit-review" class="expense-review" hidden role="status"></div>
  <p id="movement-edit-feedback" class="expense-feedback" role="status" aria-live="polite"></p>
  <button id="movement-edit-submit" type="submit" class="save-button">Revisar cambios</button>
  <small class="dialog-foot">Para eliminar un registro, utiliza la papelera discreta del historial. Requiere confirmaci\xF3n.</small>
 </form>
</dialog>
</body></html>`;var ne=`
:root{color-scheme:light;--paper:#f5f3ee;--surface:#fffefa;--ink:#20322f;--ink-2:#42534d;--ink-muted:#728078;--rule:#dedfd6;--copper:#b66b45;--copper-2:#e9c8b2;--forest:#172e2c;--forest-2:#244541;--cream:#efe7d8;--light:#f4f0e7;--success:#38735a;--shadow:0 16px 38px rgba(29,42,37,.04);--ease:cubic-bezier(.22,1,.36,1);font-family:"Avenir Next",Avenir,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;font-synthesis:none}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased}button,input,select{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}button,a,input,select{-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--copper);outline-offset:3px}button:disabled{cursor:not-allowed;opacity:.55}[hidden]{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.skip{position:fixed;top:-100px;left:12px;background:#fff;color:#182d29;z-index:200;padding:14px;border-radius:8px}.skip:focus{top:12px}::selection{background:#e7b99b;color:#172925}
.studio{min-height:100svh;display:grid;grid-template-columns:252px minmax(0,1fr)}.rail{height:100svh;position:sticky;top:0;display:flex;flex-direction:column;background:var(--forest);padding:31px 18px 22px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#46574e transparent;color:#eeeadd}.brand{display:flex;align-items:center;gap:11px;padding:0 13px 29px;border-bottom:1px solid #48605a4a}.brand-mark{width:49px;height:49px;border:1px solid #aec0aa55;background:#e9e9d6;display:grid;place-items:center;color:#273a32;border-radius:50%;font:italic 600 34px Georgia,serif;position:relative}.brand-point{font-family:Georgia,serif;position:absolute;bottom:2px;right:8px;font-size:29px;color:var(--copper)}.brand-word{font-size:17px;letter-spacing:-.07em;font-weight:800}.brand-word>span{font-weight:400;color:#d0a483}.brand-word small{display:block;letter-spacing:.21em;font-size:8px;margin-top:5px;color:#a9bbb3;font-weight:650}.rail-meta{font:700 9px "Avenir Next",sans-serif;letter-spacing:.17em;color:#a8c1b8;display:flex;align-items:center;gap:8px;padding:27px 13px 21px}.rail-number{margin-left:auto;color:#819e93}.live-led{background:#a6bda6;box-shadow:0 0 0 4px #a4caab20;width:6px;height:6px;border-radius:50%;display:inline-block;flex-shrink:0}.rail-navigation{display:grid;gap:4px}.rail-item{color:#bac9c3;display:flex;align-items:center;text-align:left;width:100%;border:0;border-radius:9px;background:transparent;padding:14px 13px;min-height:48px;gap:12px;font-size:12px;font-weight:580;position:relative;transition:background .24s var(--ease),color .24s var(--ease),transform .24s var(--ease)}.rail-item:hover{background:#ffffff13;color:#fff;transform:translateX(2px)}.rail-item.is-active{background:#e9e6d7;color:var(--forest);font-weight:800;box-shadow:0 4px 15px #00000018}.rail-item.is-active:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 3px 3px 0;background:var(--copper)}.rail-glyph{font-size:22px;line-height:1;width:27px;display:grid;place-items:center;font-family:Georgia,serif;font-weight:400}.rail-index{font:650 9px "Avenir Next",sans-serif;letter-spacing:.07em;opacity:.53;margin-left:auto}.rail-group-label{font-size:9px;color:#8ba599;letter-spacing:.19em;font-weight:700;margin:29px 13px 12px}.secondary-nav .rail-item{min-height:44px}.rail-bottom{margin-top:auto;padding:30px 13px 0}.rail-quote{font:italic 17px/1.45 Georgia,"Times New Roman",serif;color:#e9edda;letter-spacing:-.015em}.rail-quote em{color:#c89878}.rail-foot{border-top:1px solid #61766b50;padding-top:16px;margin-top:25px;font-size:8px;letter-spacing:.12em;color:#89a397;display:flex;justify-content:space-between}
.stage{min-width:0}.masthead{height:76px;border-bottom:1px solid var(--rule);background:var(--paper);padding:0 clamp(20px,4.4vw,66px);display:flex;align-items:center;justify-content:space-between;gap:14px;position:sticky;top:0;z-index:20}.masthead-left,.mast-actions{display:flex;align-items:center;gap:16px}.mast-location{font-weight:780;font-size:10px;letter-spacing:.13em}.mast-location strong{color:var(--copper);font-weight:850}.mast-divider{color:#c6c2b7;margin:0 10px}.local-date{color:var(--ink-muted);font-size:11px;white-space:nowrap}.icon-button{width:38px;height:38px;border:1px solid var(--rule);background:var(--surface);border-radius:10px;color:var(--ink);display:grid;place-items:center;font-size:22px;transition:background .2s,transform .2s,border-color .2s}.icon-button:hover{background:#eee8db;border-color:#b8bfaf;transform:translateY(-2px)}.icon-button[aria-pressed="true"]{background:#f5e2d3;color:#905430;border-color:#ddba9e}.new-button,.solid-button{border:0;background:var(--forest);color:#f7f2e6;padding:12px 18px;border-radius:9px;font-weight:750;font-size:12px;min-height:43px;display:flex;align-items:center;gap:12px;justify-content:center;transition:transform .25s var(--ease),background .25s var(--ease),box-shadow .25s}.new-button:hover,.solid-button:hover{background:var(--forest-2);transform:translateY(-2px);box-shadow:0 6px 20px #182e2b25}.new-button span{font-size:18px;font-weight:300;line-height:1}.mobile-mark{display:none}.main{max-width:1620px;min-width:0;margin:0 auto;padding:37px clamp(20px,4.4vw,66px) 35px}.space{width:100%}.space.is-visible{animation:space-arrive .52s var(--ease) both}.space[hidden]{display:none}.intro-line,.section-topline{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#87928a;font-weight:800;font-size:9px;letter-spacing:.16em;padding-bottom:14px;border-bottom:1px solid var(--rule)}.intro-index{color:#9a6b53}.intro-right{display:flex;align-items:center;gap:12px}.intro-right>span{font-size:17px;line-height:.5;color:var(--copper)}.editorial-hero{display:flex;justify-content:space-between;align-items:center;gap:40px;min-height:286px;padding:28px 5px 36px}.hero-copy{max-width:680px}.eyebrow{font-size:10px;color:#a46d50;letter-spacing:.18em;font-weight:800;margin:0 0 12px}.editorial-hero h1,.page-intro h1{margin:0;font:500 clamp(43px,5.4vw,77px)/1.07 Georgia,"Iowan Old Style","Palatino Linotype",serif;letter-spacing:-.057em;max-width:760px;color:var(--ink)}.editorial-hero h1 em,.page-intro h1 em{font-weight:400;color:var(--copper)}.hero-sub,.page-intro>p:last-child{margin:17px 0 0;color:#738078;line-height:1.8;font-size:13px;max-width:520px}.hero-status{display:flex;align-items:center;gap:11px;color:#627369;font-size:11px;margin-top:22px}.hero-stamp{width:196px;height:196px;flex-shrink:0;border-radius:50%;border:1px solid #b4bbad;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle,#eee9db 0 47%,transparent 47%),repeating-conic-gradient(from 0deg,#bcbeb228 0deg 1deg,transparent 1deg 12deg);transform:rotate(-13deg);color:var(--ink)}.hero-stamp:after{content:"";position:absolute;inset:13px;border:1px solid #b8bfb3;border-radius:50%}.hero-stamp>span:first-child{font:italic 116px/.9 Georgia,serif;letter-spacing:-.12em;padding-right:16px}.hero-stamp .stamp-arrow{position:absolute;right:47px;top:48px;font-size:32px;color:var(--copper)}.hero-stamp small{font-size:9px;letter-spacing:.35em;margin-top:15px;font-weight:750}.hero-stamp small span{color:var(--copper)}.section-topline{margin:8px 0 18px;border-bottom:0;padding-bottom:0}.section-count{color:#a1aaa0}
.period-strip{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.period-controls{display:inline-flex;gap:3px;border-bottom:1px solid #cdd1c5}.period-btn{min-height:43px;min-width:65px;background:transparent;border:0;border-bottom:2px solid transparent;color:#7a887f;padding:11px 17px 13px;margin-bottom:-1px;font-size:12px;font-weight:700;transition:color .2s,border-color .2s,background .2s}.period-btn:hover{background:#eceae3;color:var(--ink)}.period-btn.active{color:var(--copper);border-color:var(--copper)}.period-caption{font:italic 14px Georgia,serif;color:#708176;text-align:right}.metrics{display:grid;grid-template-columns:1.35fr repeat(3,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:10px;overflow:hidden}.metric{background:var(--surface);padding:26px 22px 22px;min-height:176px;display:flex;flex-direction:column;justify-content:space-between;gap:15px;position:relative}.metric-feature{background:var(--forest);color:#f1f1de}.metric-top{display:flex;justify-content:space-between;gap:10px;color:#829188;font-size:9px;letter-spacing:.14em;font-weight:800}.metric-feature .metric-top{color:#b7cbbf}.metric-top span:last-child{opacity:.55}.metric-money{font-size:clamp(21px,2.5vw,38px);font-variant-numeric:tabular-nums;letter-spacing:-.065em;font-weight:760;overflow-wrap:anywhere}.metric-feature .metric-money{color:#f2e7cb;font-size:clamp(23px,2.8vw,42px)}.metric p{margin:0;color:#77877e;font-size:11px}.metric-bottom{display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:10px;color:#c6d6c9}.delta{font-size:10px;font-weight:800;padding:5px 7px;background:#ffffff20;border-radius:3px;color:#f1e9d8}.delta.up{color:#ffd1b4}.delta.down{color:#b3f4d2}.kpi-note{color:#a9beb4}
.analytics-grid,.bottom-grid{display:grid;grid-template-columns:minmax(0,1.68fr) minmax(280px,.95fr);gap:18px;margin-top:19px}.editorial-panel{background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:26px 27px;box-shadow:var(--shadow);min-width:0}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.micro-label,.module-no{font-size:9px;color:#a2755d;letter-spacing:.14em;font-weight:800}.panel-heading h2{font:500 25px/1.16 Georgia,serif;letter-spacing:-.045em;color:var(--ink);margin:10px 0 8px}.panel-heading p{margin:0;color:var(--ink-muted);font-size:11px}.panel-tag{color:#b17a5b;font-size:10px;letter-spacing:.12em;display:flex;align-items:center;gap:6px}.tiny-dot{display:inline-block;background:var(--copper);border-radius:50%;width:6px;height:6px}.chart-wrap{margin-top:27px;overflow:hidden}.chart-wrap svg{height:224px;width:100%;display:block;overflow:visible}.chart-ends{display:flex;justify-content:space-between;color:#98a69b;font-size:10px;margin-top:5px}.panel-footer{border-top:1px solid var(--rule);padding-top:18px;margin-top:21px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#819086}.panel-footer>span{display:flex;align-items:center;gap:8px}.panel-footer strong{color:var(--forest)}.donut-area{display:grid;place-items:center;margin:20px auto}.donut{height:166px;width:166px;border-radius:50%;background:conic-gradient(#e8e6df 0deg 360deg);display:grid;place-items:center;transition:background .45s var(--ease)}.donut-hole{width:71%;height:71%;border-radius:50%;background:var(--surface);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px}.donut-hole>span{color:var(--ink-muted);font-size:9px;letter-spacing:.16em;font-weight:700}.donut-hole strong{font:500 35px Georgia,serif}.methods{display:grid;gap:11px}.method-row{display:grid;grid-template-columns:9px minmax(0,1fr) auto;gap:10px;align-items:center;color:var(--ink-2);font-size:11px}.method-row i{height:8px;width:8px;border-radius:50%;display:block}.method-row b{font-weight:850;color:var(--ink)}.method-meter{grid-column:2/4;height:3px;margin-top:-5px;background:#e9e7df;overflow:hidden}.method-meter span{display:block;height:100%;transition:width .3s var(--ease)}.empty-small{font-size:11px;color:var(--ink-muted);text-align:center}
.bottom-grid{margin-top:18px}.week-bars{height:188px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:end;gap:17px;padding:21px 0 0}.bar-day{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:8px}.bar-value{font-size:10px;color:#85958a;white-space:nowrap}.bar-track{flex:1;position:relative;background:#f1efe7;width:min(100%,37px);min-height:70px;border-radius:3px;overflow:hidden}.bar-fill{position:absolute;bottom:0;left:0;right:0;min-height:0;background:linear-gradient(0deg,#996348,#cf9470);border-radius:2px;transition:height .6s var(--ease)}.bar-day.today .bar-fill{background:linear-gradient(0deg,#314e45,#6c917f)}.bar-label{font-size:10px;font-weight:750;color:#809087}.insight-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid var(--rule);font-size:11px;color:var(--ink-muted)}.insight-row:first-of-type{margin-top:18px}.insight-row strong{font-size:11px;color:var(--ink);text-align:right;font-weight:750}.full-link{width:100%;margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:transparent;border:0;border-bottom:1px solid #a7ae9d;padding:24px 6px;text-align:left;transition:padding .2s,color .2s}.full-link>span:first-child{font:italic 23px Georgia,serif;color:var(--ink)}.full-link>span:last-child{font-size:10px;font-weight:800;letter-spacing:.13em;color:var(--copper)}.full-link b{font-size:21px;font-weight:400;margin-left:7px}.full-link:hover{padding-left:16px}
.page-intro{padding:55px 0 45px;max-width:860px}.page-intro h1{font-size:clamp(41px,5vw,70px)}.page-intro>p:last-child{max-width:650px}.history-toolbar{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:17px}.history-left,.history-right{display:flex;align-items:center;gap:17px}.history-count{color:var(--forest);font-size:12px;font-weight:800}.history-note{color:var(--ink-muted);font-size:11px}.soft-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;border:1px solid #b5bfb4;color:var(--forest);background:transparent;border-radius:7px;padding:10px 15px;font-size:11px;font-weight:750;transition:background .18s,transform .2s}.soft-button:hover{background:#e9e6dd;transform:translateY(-1px)}.table-panel{background:var(--surface);border:1px solid var(--rule);border-radius:8px;box-shadow:var(--shadow);overflow:hidden}.table-scroll{overflow:auto}.table-panel table{border-collapse:collapse;width:100%;min-width:530px;text-align:left}.table-panel th{color:#919e92;border-bottom:1px solid var(--rule);font-size:9px;letter-spacing:.14em;font-weight:750;padding:20px 25px}.table-panel td{padding:20px 25px;border-bottom:1px solid #ebece5;color:#738278;font-size:11px}.table-panel tbody tr{transition:background .2s}.table-panel tbody tr:hover{background:#f8f6ef}.align-right{text-align:right}.history-name{color:var(--ink);font-size:12px;font-weight:780}.history-kind{display:block;color:#93a097;font-size:10px;margin-top:7px}.history-method{color:var(--ink-2)}.method-sub{display:block;color:#9da69a;font-size:10px;margin-top:5px}.history-amount{color:var(--forest);font-weight:800;font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap}.empty-row{text-align:center;color:var(--ink-muted);padding:43px 15px!important}.history-bottom{min-height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 25px;gap:15px}.history-bottom p{color:var(--ink-muted);font-size:10px}.footnote{font-size:11px;color:var(--ink-muted);line-height:1.9;margin:22px 0}
.statement-card{background:var(--forest);color:#f7efdb;border-radius:8px;padding:32px 35px;display:flex;justify-content:space-between;align-items:center;gap:30px;min-height:205px}.statement-kicker{font-size:10px;letter-spacing:.16em;color:#a4bdaf;font-weight:800}.statement-card h2{font:400 clamp(30px,4vw,52px)/1.1 Georgia,serif;letter-spacing:-.045em;margin:15px 0}.statement-card h2 span{color:#bb8e6c}.statement-card p{color:#b9c8bf;font-size:12px;line-height:1.8;margin:0;max-width:510px}.statement-symbol{font:italic 110px Georgia,serif;color:#ffffff38;padding:0 25px}.three-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-top:17px}.module{background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:27px 24px;min-height:219px;display:flex;align-items:flex-start;flex-direction:column;gap:17px}.module h3{margin:0;font:400 26px Georgia,serif;letter-spacing:-.03em}.module p{margin:0;color:var(--ink-muted);font-size:12px;line-height:1.75}.state-pill{font-size:10px;font-weight:780;color:#687a70;background:#ecf0e7;padding:8px 10px;border-radius:3px;margin-top:auto;letter-spacing:.02em}.state-pill.pending{background:#f5e7dc;color:#9b674c}.module-value{font:500 clamp(22px,2.5vw,36px) Georgia,serif;letter-spacing:-.055em;color:var(--forest);margin-top:7px;overflow-wrap:anywhere}.guidance{margin-top:19px;padding:23px 25px;display:flex;align-items:center;gap:19px;background:#ebe9df;border:1px solid #d9dbd0;border-radius:8px}.guidance-mark{font:44px Georgia,serif;color:var(--copper)}.guidance h3{font:500 22px Georgia,serif;margin:0 0 8px;letter-spacing:-.03em}.guidance p{color:#6b7b70;font-size:11px;line-height:1.7;margin:0}.guidance>.soft-button{flex-shrink:0;margin-left:auto}.flow-panel{background:var(--surface);border:1px solid var(--rule);padding:42px;display:grid;grid-template-columns:1fr 90px 1fr;align-items:center;gap:20px;min-height:350px;border-radius:8px}.flow-source{background:var(--forest);color:#f5eddb;border-radius:7px;padding:30px;display:flex;flex-direction:column;gap:14px}.flow-source span{font-size:9px;letter-spacing:.17em;color:#b7c9bc}.flow-source strong{font:500 clamp(24px,2.8vw,41px) Georgia,serif;overflow-wrap:anywhere}.flow-source small{color:#9eb3a9;font-size:10px}.flow-channel{position:relative;display:grid;place-items:center}.flow-channel span{height:1px;width:100%;background:var(--copper)}.flow-channel i{position:absolute;font-style:normal;font-size:22px;color:var(--copper);background:var(--surface);padding:0 5px}.flow-targets{display:grid;gap:10px}.flow-target{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;gap:15px;background:#f1f0e8;border-left:3px solid var(--copper);border-radius:2px}.flow-target strong{font-size:11px}.flow-target span{font-size:11px;color:#87968c}.flow-targets>p{font-size:12px;color:#7d887e}.format-row{display:flex;flex-wrap:wrap;gap:9px;margin:8px 0 12px}.format-row span{background:#e9e8de;color:#315048;padding:11px 16px;font-size:11px;letter-spacing:.12em;font-weight:800}.import-layout{display:grid;grid-template-columns:1.4fr .8fr;gap:18px}.module.wide{min-height:350px}.how-steps{display:grid;gap:0;width:100%}.how-steps>div{border-top:1px solid var(--rule);padding:17px 0;display:flex;align-items:center;gap:20px;color:#4d5e54;font-size:12px}.how-steps b{color:var(--copper);font-size:10px}.note-card{background:#efe9db;border-color:#ded7c8}.note-card .soft-button{margin-top:auto}.connections-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.connection{background:var(--surface);border:1px solid var(--rule);padding:22px 20px;display:flex;align-items:center;gap:16px;border-radius:7px;min-width:0}.connection-icon{height:48px;width:48px;border:1px solid #c4cac0;border-radius:9px;display:grid;place-items:center;color:var(--copper);font:italic 22px Georgia,serif;flex-shrink:0}.connection h3{font:500 20px Georgia,serif;letter-spacing:-.025em;margin:0 0 5px}.connection p{color:var(--ink-muted);font-size:11px;margin:0}.connection .state-pill{margin-left:auto;flex-shrink:0}.settings-panel{background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:0 29px}.setting-row{padding:23px 0;display:flex;align-items:center;justify-content:space-between;gap:25px;border-bottom:1px solid var(--rule)}.setting-row:last-child{border-bottom:0}.setting-row h3{font:500 22px Georgia,serif;margin:0 0 7px}.setting-row p{margin:0;color:var(--ink-muted);font-size:11px;line-height:1.7}.toggle-button{border:1px solid #a9b3aa;background:#e7eae0;color:var(--forest);padding:12px 15px;border-radius:30px;white-space:nowrap;min-width:102px;font-size:11px;font-weight:800}.toggle-button[aria-checked="true"]{background:var(--forest);border-color:var(--forest);color:#f3eee0}
.site-footer{border-top:1px solid var(--rule);padding-top:25px;margin-top:65px;display:flex;justify-content:space-between;gap:20px;font-size:9px;font-weight:700;letter-spacing:.12em;color:#9caa9f}.site-footer i{font-style:normal;color:var(--copper);padding:0 10px}
.alert{background:#f9ddd5;border:1px solid #d79a87;color:#823f2e;padding:13px 17px;border-radius:5px;margin-bottom:20px;font-size:12px}
.mobile-nav{display:none}
.expense-dialog{width:min(94vw,500px);max-height:calc(100dvh - 45px);border:1px solid #c4c7b9;border-radius:10px;background:var(--surface);color:var(--ink);padding:30px 32px 25px;box-shadow:0 40px 100px #0006;overflow:auto}.expense-dialog::backdrop{background:#11231ebe;backdrop-filter:blur(8px)}.dialog-kicker{color:var(--copper);font-size:10px;font-weight:800;letter-spacing:.15em}.dialog-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.dialog-head h2{font:italic 500 39px/1.14 Georgia,serif;letter-spacing:-.05em;margin:15px 0 9px}.dialog-head h2 em{color:var(--copper)}.expense-dialog>form>p{color:var(--ink-muted);font-size:12px;line-height:1.7}.expense-dialog label{display:block;font-size:11px;font-weight:800;margin:19px 0 9px;color:var(--ink-2)}.expense-dialog input,.expense-dialog select{background:#f8f7f0;border:1px solid #cdd1c6;border-radius:7px;padding:14px 15px;width:100%;outline-offset:2px;color:var(--ink);font-size:13px;min-height:48px}.expense-dialog input:focus,.expense-dialog select:focus{border-color:var(--copper)}.expense-amount{display:flex;align-items:center;border:1px solid #cdd1c6;background:#f8f7f0;border-radius:7px;padding-left:14px}.expense-amount span{color:var(--copper);font:italic 30px Georgia,serif}.expense-amount input{border:0;font-size:27px;font-variant-numeric:tabular-nums;padding:9px 13px;background:transparent}.expense-review{background:#e9ebe3;border-left:3px solid var(--copper);padding:14px 15px;margin-top:20px;font-size:12px;line-height:1.8;white-space:pre-line}.expense-feedback{min-height:22px;margin:12px 0;font-size:11px}.expense-feedback.fail{color:#9a4633}.expense-feedback.ok{color:#327354}.save-button{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;background:var(--forest);color:#fff3df;min-height:52px;border-radius:7px;padding:14px 18px;font-weight:780;font-size:13px}.save-button:hover{background:var(--forest-2)}.dialog-foot{display:block;text-align:center;color:#9aa69c;font-size:10px;margin-top:13px}
.studio.is-private [data-private]{filter:blur(8px);user-select:none;pointer-events:none}.studio.is-private .flow-target [data-private],.studio.is-private .table-panel .history-amount{filter:blur(7px);user-select:none}.studio.is-private .metric-money[data-private]{filter:blur(9px)}.studio.is-private #history-body .history-amount{filter:blur(8px)}
@keyframes space-arrive{from{opacity:.18;transform:translateY(19px)}to{opacity:1;transform:translateY(0)}}@keyframes subtle-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}.metric,.editorial-panel,.module,.connection{transition:border-color .27s var(--ease),transform .36s var(--ease),box-shadow .36s var(--ease)}@media(hover:hover){.editorial-panel:hover,.module:hover,.connection:hover{border-color:#b1bcaf;box-shadow:0 22px 45px #26382c10;transform:translateY(-3px)}}.space .metric{animation:subtle-enter .56s var(--ease) both}.space .metric:nth-child(2){animation-delay:.045s}.space .metric:nth-child(3){animation-delay:.085s}.space .metric:nth-child(4){animation-delay:.125s}
@media(max-width:1320px){.studio{grid-template-columns:218px minmax(0,1fr)}.main{padding-left:30px;padding-right:30px}.masthead{padding:0 30px}.rail{padding-left:13px;padding-right:13px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.metric{min-height:148px}.metric-money{font-size:30px}.analytics-grid,.bottom-grid{grid-template-columns:minmax(0,1.35fr) minmax(250px,.85fr)}.connection{flex-wrap:wrap}.connection .state-pill{margin-left:0}}
@media(max-width:980px){.studio{display:block}.rail{display:none}.mobile-mark{display:grid;place-items:center;background:var(--forest);color:#efe3ca;border-radius:50%;width:33px;height:33px;font:italic 20px Georgia,serif}.masthead{height:68px}.main{max-width:950px}.editorial-hero{min-height:260px}.hero-stamp{width:146px;height:146px}.hero-stamp>span:first-child{font-size:90px}.hero-stamp .stamp-arrow{right:30px;top:30px}.hero-stamp small{font-size:7px}.mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;height:calc(69px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);z-index:70;background:#172e2cf7;border-top:1px solid #395a50;justify-content:space-around;align-items:center;gap:4px;backdrop-filter:blur(18px)}.mobile-item{background:transparent;border:0;color:#aac1b6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:65px;min-height:49px}.mobile-item>span{font:25px Georgia,serif;line-height:1}.mobile-item small{font-size:10px;font-weight:750}.mobile-item.is-active{color:#ffeed3}.mobile-create{height:52px;width:52px;border:1px solid #dedac9;background:#d7a283;color:var(--forest);font-size:30px;border-radius:50%;transform:translateY(-11px);box-shadow:0 7px 20px #0004}.main{padding-bottom:calc(105px + env(safe-area-inset-bottom))}.site-footer{margin-top:47px}}
@media(max-width:720px){.masthead{padding:0 18px;height:63px}.masthead-left{gap:9px}.mast-location{font-size:9px}.mast-divider{margin:0 4px}.mast-actions{gap:8px}.local-date{display:none}.icon-button{width:35px;height:35px}.new-button{display:none}.main{padding:25px 17px calc(109px + env(safe-area-inset-bottom))}.intro-line{font-size:8px}.intro-right{font-size:8px}.editorial-hero{padding:34px 1px 28px;min-height:unset}.hero-copy{min-width:0}.editorial-hero h1,.page-intro h1{font-size:clamp(42px,10.5vw,58px)}.hero-sub{font-size:12px;margin-top:15px}.hero-status{font-size:10px;margin-top:18px}.hero-stamp{display:none}.page-intro{padding:39px 0 34px}.page-intro>p:last-child{font-size:12px}.section-topline{font-size:8px;margin-top:14px}.section-count{font-size:8px}.period-strip{display:block}.period-controls{width:100%;display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}.period-btn{min-width:0;padding:11px 2px;font-size:10px}.period-caption{display:block;font-size:12px;text-align:left;margin-top:11px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:1px}.metric{min-height:140px;padding:19px 15px;gap:12px}.metric-top{font-size:8px}.metric-money,.metric-feature .metric-money{font-size:clamp(21px,5.5vw,29px)}.metric p{font-size:10px}.kpi-note{font-size:9px}.analytics-grid,.bottom-grid{grid-template-columns:1fr;gap:12px;margin-top:12px}.editorial-panel{padding:23px 19px}.panel-heading h2{font-size:24px}.chart-wrap svg{height:195px}.method-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:10px;align-items:center}.method-panel .panel-heading{grid-column:1/-1}.donut{width:min(34vw,152px);height:min(34vw,152px)}.donut-hole strong{font-size:24px}.methods{gap:9px}.method-row{font-size:10px;gap:6px}.week-bars{gap:9px}.full-link>span:first-child{font-size:19px}.full-link>span:last-child{font-size:9px}.history-toolbar{align-items:flex-start;flex-direction:column}.history-right{justify-content:space-between;width:100%}.table-panel th,.table-panel td{padding:17px 13px}.history-bottom{padding:0 13px}.statement-card{padding:27px 23px;min-height:170px}.statement-symbol{display:none}.three-columns{grid-template-columns:1fr;gap:11px}.module{min-height:unset;padding:23px 22px}.module-value{font-size:34px}.guidance{padding:19px 18px;flex-wrap:wrap;gap:13px}.guidance-mark{font-size:33px}.guidance h3{font-size:20px}.guidance>.soft-button{margin-left:0}.flow-panel{grid-template-columns:1fr;padding:23px;gap:12px}.flow-channel{height:33px}.flow-channel span{height:100%;width:1px}.flow-channel i{transform:rotate(90deg)}.import-layout,.connections-grid{grid-template-columns:1fr}.connection{flex-wrap:nowrap}.connection .state-pill{margin-left:auto}.settings-panel{padding:0 18px}.setting-row{gap:13px}.setting-row h3{font-size:20px}.setting-row p{font-size:11px}.toggle-button{min-width:95px}.site-footer{font-size:8px;line-height:1.7;display:grid}.expense-dialog{padding:25px 21px;max-height:calc(100dvh - 24px)}.dialog-head h2{font-size:34px}}
@media(max-width:360px){.metric-money,.metric-feature .metric-money{font-size:20px}.method-panel{display:block}.donut{width:150px;height:150px}.connection .state-pill{font-size:9px}.setting-row{align-items:flex-start;flex-direction:column}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}.studio.no-motion *, .studio.no-motion *::before,.studio.no-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
.studio.theme-night{--paper:#111c1c;--surface:#192725;--ink:#e5e8dd;--ink-2:#c1cec4;--ink-muted:#a1b5a9;--rule:#364841;--copper:#d7a17f;--forest:#1e3c36;--forest-2:#305449;--cream:#263e36;--light:#172722;color-scheme:dark}.theme-night .masthead{background:var(--paper)}.theme-night .metric-feature,.theme-night .statement-card,.theme-night .flow-source{background:#27443c}.theme-night .metric-feature .metric-money{color:#ffe4c9}.theme-night .period-btn:hover,.theme-night .soft-button:hover,.theme-night .icon-button:hover{background:#294139}.theme-night .module,.theme-night .connection,.theme-night .editorial-panel,.theme-night .table-panel{box-shadow:none}.theme-night .rail{background:#102221}.theme-night .table-panel tbody tr:hover{background:#253933}.theme-night .flow-target,.theme-night .format-row span,.theme-night .guidance,.theme-night .note-card,.theme-night .settings-panel{background:#263831}.theme-night .expense-dialog,.theme-night .expense-dialog input,.theme-night .expense-dialog select,.theme-night .expense-amount{background:#1f3530;color:#f3ebd8}.theme-night .icon-button{background:#233a32}.theme-night .toggle-button{background:#315047;color:#e8eddd}.theme-night .donut-hole{background:#192725}.theme-night .bar-track,.theme-night .method-meter{background:#2d4038}

/* Mobile navigation: editorial index instead of hidden destinations. */
.more-dialog{width:min(92vw,480px);max-height:min(88dvh,800px);margin:auto;border:1px solid #b5bbaf;border-radius:11px;background:var(--paper);padding:23px 25px 20px;box-shadow:0 32px 100px #0008;color:var(--ink);overflow-y:auto}
.more-dialog::backdrop{background:#132622d4;backdrop-filter:blur(8px)}
.more-top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:17px;border-bottom:1px solid var(--rule)}
.more-top h2{font:400 35px/1.1 Georgia,serif;letter-spacing:-.055em;margin:12px 0 2px}
.more-top h2 em{color:var(--copper)}
.more-links{display:grid;gap:0;margin-top:9px}
.more-links button{width:100%;min-height:53px;border:0;border-bottom:1px solid var(--rule);background:none;text-align:left;display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:12px;color:var(--ink);font-size:14px;font-weight:740;transition:color .2s,transform .2s,padding .2s}
.more-links button:hover{color:var(--copper);padding-left:6px}
.more-links button span{font-size:10px;letter-spacing:.12em;color:#9e745f}
.more-links button b{font:400 23px Georgia,serif;color:var(--copper)}
.more-foot{color:var(--ink-muted);font:italic 15px Georgia,serif;padding-top:12px;text-align:center}
.theme-night .more-dialog{background:var(--paper)}
@media(max-width:720px){.more-dialog{width:min(96vw,450px);padding:21px 20px}.more-top h2{font-size:32px}}

/* Accessibility + complete dark theme after cross-device visual QA. */
.icon-button{width:44px;height:44px;min-width:44px;min-height:44px}
.new-button,.period-btn{min-height:44px}
body.theme-night{--paper:#111c1c;--surface:#192725;--ink:#e5e8dd;--ink-2:#c1cec4;--ink-muted:#aebfb2;--rule:#364841;--copper:#d7a17f;--forest:#1e3c36;--forest-2:#305449;background:var(--paper);color:var(--ink);color-scheme:dark}
.studio.theme-night{color:var(--ink)}
.theme-night .page-intro>p:last-child,.theme-night .hero-sub{color:#b5c9bb}
.theme-night .hero-status,.theme-night .metric p,.theme-night .footnote,.theme-night .history-note,.theme-night .history-bottom p{color:#aec3b5}
.theme-night .table-panel td,.theme-night .history-kind,.theme-night .history-method,.theme-night .flow-target span,.theme-night .guidance p{color:#b7c8bd}
.theme-night .intro-index,.theme-night .module-no,.theme-night .micro-label{color:#dfac8b}
.theme-night .method-row,.theme-night .metric-top,.theme-night .panel-footer{color:#aebfb4}
.theme-night .insight-row,.theme-night .bar-value,.theme-night .bar-label{color:#b4c6b9}
.theme-night .site-footer{color:#a2b5a8}
.theme-night .state-pill{background:#345045;color:#e0eee0}
.theme-night .state-pill.pending{background:#634633;color:#ffe8d0}
.theme-night .expense-review{background:#34483e;border-color:#ddaa82;color:#f3f1e5}
.theme-night .expense-dialog>form>p,.theme-night .dialog-foot,.theme-night .more-foot{color:#b6c5b9}
.theme-night .expense-dialog input::placeholder{color:#aeb9ad}
@media(max-width:720px){.masthead .icon-button{width:44px;height:44px;min-width:44px;min-height:44px}.masthead{min-height:66px}.mobile-item{min-height:50px}}

/* Drawn iconography: no Unicode emoji presentation or colored iOS arrows. */
.native-arrow{display:inline-block;position:relative;flex:0 0 auto;width:19px;height:19px;color:inherit;vertical-align:middle;font-size:0!important;line-height:0}
.native-arrow:before{content:"";position:absolute;width:17px;height:1.8px;left:1px;top:11px;background:currentColor;border-radius:2px;transform:rotate(-45deg);transform-origin:center}
.native-arrow:after{content:"";position:absolute;width:9px;height:9px;right:1px;top:1px;border-right:1.8px solid currentColor;border-top:1.8px solid currentColor;border-radius:1px}
.more-links button .native-arrow{width:19px;height:19px;color:var(--copper)}
.more-links button b{font-weight:400;line-height:0}
.intro-right>.native-arrow{width:16px;height:16px;color:var(--copper)}
.intro-right>.native-arrow:before{width:13px;top:9px}
.intro-right>.native-arrow:after{width:7px;height:7px}
.guidance-mark .native-arrow{width:29px;height:29px;color:var(--copper)}
.guidance-mark .native-arrow:before{width:25px;height:2.4px;left:1px;top:17px}
.guidance-mark .native-arrow:after{width:14px;height:14px;border-width:2.4px;right:2px;top:1px}
.stamp-arrow .native-arrow{width:30px;height:30px;color:var(--copper)}
.stamp-arrow .native-arrow:before{width:27px;height:2px;top:17px}
.stamp-arrow .native-arrow:after{width:15px;height:15px;border-width:2px}
.full-link .native-arrow{width:22px;height:22px}
.native-arrow-right{display:inline-block;width:13px;height:13px;position:relative;vertical-align:middle}
.native-arrow-right:before{content:"";position:absolute;height:1.6px;left:0;right:1px;top:6px;background:currentColor}
.native-arrow-right:after{content:"";position:absolute;right:1px;top:3px;width:6px;height:6px;border-right:1.6px solid currentColor;border-top:1.6px solid currentColor;transform:rotate(45deg)}
.native-refresh{display:inline-block;position:relative;width:19px;height:19px;flex:0 0 auto;vertical-align:middle;border:2px solid currentColor;border-radius:50%;border-top-color:transparent;transform:rotate(-40deg)}
.native-refresh:after{content:"";position:absolute;right:-4px;top:-2px;width:6px;height:6px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(10deg)}
/* The reset is separated from ordinary preferences, not styled as a positive action. */
.danger-row{border-top:1px solid #e3cbbd;gap:24px}
.danger-row h3{color:#98533e}
.danger-button{border:1px solid #b77761;background:transparent;color:#934d3a;border-radius:7px;min-height:45px;display:inline-flex;align-items:center;justify-content:center;gap:12px;white-space:nowrap;padding:10px 15px;font-size:11px;font-weight:850;transition:background .18s,transform .2s}
.danger-button:hover{background:#f5e6de;transform:translateY(-1px)}
.danger-button .native-arrow{width:15px;height:15px}
.reset-dialog{color:var(--ink);width:min(93vw,535px);max-height:calc(100dvh - 35px);padding:30px 32px 28px;background:var(--surface);border:1px solid #c5c8ba;border-radius:11px;overflow-y:auto;box-shadow:0 30px 90px #111a1666}
.reset-dialog::backdrop{background:#11241cd4;backdrop-filter:blur(9px)}
.reset-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.reset-dialog h2{font:400 clamp(31px,6vw,43px)/1.12 Georgia,serif;letter-spacing:-.05em;margin:14px 0}
.reset-dialog h2 em{color:var(--copper)}
.reset-description{font-size:12px;line-height:1.8;color:var(--ink-muted);margin:0 0 19px}
.reset-description strong{color:var(--ink)}
.reset-counts{background:var(--light);border:1px solid var(--rule);border-radius:7px;padding:15px 17px;display:grid;gap:12px}
.reset-counts p{color:var(--ink-muted);font-size:12px;margin:0}
.reset-count{display:flex;align-items:center;justify-content:space-between;gap:15px;color:var(--ink-2);font-size:12px}
.reset-count strong{font-size:16px;color:var(--ink);font-variant-numeric:tabular-nums}
.reset-warning{background:#f9e9df;border:1px solid #e4c5b5;color:#874832;padding:12px 14px;border-radius:5px;font-size:11px;line-height:1.7;margin:17px 0}
.reset-check{display:flex;gap:11px;align-items:flex-start;color:var(--ink);font-size:12px;line-height:1.6;cursor:pointer}
.reset-check input{accent-color:#a65e46;width:18px;height:18px;flex:0 0 18px;margin:1px 0 0}
.reset-type-label{display:block;font-size:12px;color:var(--ink);margin:21px 0 9px}
.reset-type-label strong{color:#98533e;white-space:nowrap}
.reset-phrase{width:100%;border:1px solid #c6cabe;border-radius:7px;background:var(--paper);color:var(--ink);padding:14px;font-size:13px;letter-spacing:.04em;min-height:47px}
.reset-phrase:focus{border-color:#a65e46}
.reset-feedback{font-size:11px;min-height:18px;color:#974633;line-height:1.6}
.reset-actions{display:flex;justify-content:flex-end;gap:12px;align-items:center}
.danger-confirm{border:0;border-radius:7px;background:#a34d3a;color:#fff;padding:13px 16px;min-height:45px;font-weight:850;font-size:12px}
.danger-confirm:not(:disabled):hover{background:#7d3527}
.theme-night .danger-row{border-color:#705247}
.theme-night .danger-button{color:#e9b5a1;border-color:#ab7261}
.theme-night .danger-button:hover{background:#392e2b}
.theme-night .reset-dialog{background:var(--surface)}
.theme-night .reset-counts{background:#243932}
.theme-night .reset-warning{background:#452d28;color:#f1c7b5;border-color:#67483d}
.theme-night .reset-phrase{background:#152823}
@media(max-width:720px){.danger-row{align-items:flex-start;flex-direction:column}.danger-button{width:100%}.reset-dialog{padding:21px 19px;max-height:calc(100dvh - 18px)}.reset-actions{flex-direction:column-reverse}.reset-actions>button{width:100%}}

/* iOS retains :hover after tapping. Avoid phantom highlighted tabs. */
@media(hover:none){.period-btn:hover{background:transparent;color:var(--ink-muted)}.period-btn.active:hover{background:transparent;color:var(--copper)}.more-links button:hover{padding-left:0;color:var(--ink)}.icon-button:hover{transform:none}}
.icon-button .native-refresh{transition:transform .35s var(--ease)}
.icon-button:active .native-refresh{transform:rotate(135deg)}
@media(prefers-reduced-motion:reduce){.icon-button .native-refresh{transition:none!important}}

/* PWA installation and privacy-first notification controls. */
.app-setting{align-items:center;gap:18px}
.app-setting>.soft-button{min-height:46px;min-width:145px;justify-content:center}
.app-setting-status{max-width:520px;font-size:11px;line-height:1.55;color:var(--ink-muted);margin-top:8px}
@media(max-width:640px){
 .app-setting{align-items:stretch;flex-direction:column}
 .app-setting>.soft-button{width:100%;min-height:48px}
 .expense-dialog{max-height:calc(100dvh - env(safe-area-inset-top) - 14px);
  overflow-y:auto;overscroll-behavior:contain}
 .expense-dialog input,.expense-dialog select{font-size:16px}
}

/* Personal spending limits \u2014 functional finance controls, accessible on iPhone. */
.budget-home{border:1px solid var(--rule);background:var(--surface);border-radius:9px;
 padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px}
.budget-home p{font-size:12px;margin:7px 0 0;color:var(--ink-2);line-height:1.6}
.budget-home[data-budget-status="near"]{border-left:4px solid #bc7a52}
.budget-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin:34px 0 20px}
.budget-heading h2{margin:12px 0 10px;font:500 clamp(32px,3vw,44px)/1.1 Georgia,serif;letter-spacing:-.045em}
.budget-heading h2 em{color:var(--copper)}
.budget-heading p{color:var(--ink-muted);font-size:12px;line-height:1.8;max-width:640px;margin:0}
.budget-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.budget-card{background:var(--surface);border:1px solid var(--rule);padding:22px;border-radius:11px;
 min-width:0;box-shadow:var(--shadow)}
.budget-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.budget-card h3{font:500 30px/1.1 Georgia,serif;letter-spacing:-.04em;margin:12px 0 8px}
.budget-card p{margin:0;color:var(--ink-muted);line-height:1.55;font-size:11px}
.budget-chip{font-size:10px;white-space:nowrap;color:var(--forest);background:#e9ece5;
 padding:7px 9px;border-radius:5px;font-weight:700}
.budget-card[data-budget-status="near"] .budget-chip{background:#f8ead8;color:#955a31}
.budget-card[data-budget-status="over"] .budget-chip,
.budget-card[data-budget-status="exhausted"] .budget-chip{background:#fae5e1;color:#a0443f}
.budget-stat{display:flex;flex-direction:column;gap:6px;margin:21px 0 10px}
.budget-stat strong{font:500 clamp(19px,2.7vw,30px) Georgia,serif;letter-spacing:-.03em;overflow-wrap:anywhere}
.budget-stat span{color:var(--ink-muted);font-size:11px}
.budget-progress{width:100%;height:11px;overflow:hidden;accent-color:#498775;border-radius:6px}
.budget-card[data-budget-status="near"] .budget-progress{accent-color:#b97745}
.budget-card[data-budget-status="over"] .budget-progress,
.budget-card[data-budget-status="exhausted"] .budget-progress{accent-color:#b14e40}
.budget-card label{display:block;font-weight:700;color:var(--ink-2);margin:21px 0 8px;font-size:11px}
.budget-edit{display:flex;gap:7px;align-items:stretch}
.budget-amount{display:flex;min-width:0;flex:1;align-items:center;gap:6px;border:1px solid var(--rule);
 background:var(--paper);border-radius:7px;padding:0 10px}
.budget-amount span{color:var(--copper);font-weight:800;font-size:16px}
.budget-amount input{min-width:0;width:100%;padding:12px 0;font-size:16px;color:var(--ink);background:transparent;border:0;
 font-variant-numeric:tabular-nums;outline-offset:2px}
.budget-edit .soft-button,.budget-edit .solid-button{font-size:11px;min-height:46px;padding:10px 13px;white-space:nowrap}
.budget-message{min-height:18px;margin:18px 0 5px;color:var(--ink-2);font-size:12px}
.budget-note{margin:8px 0 0!important;color:var(--ink-muted);font-size:11px;line-height:1.7}
@media(max-width:800px){.budget-grid{grid-template-columns:1fr}}
@media(max-width:480px){
 .budget-home{flex-direction:column;align-items:stretch}
 .budget-heading{flex-direction:column;gap:10px}
 .budget-card{padding:18px 15px}
 .budget-card-top{gap:8px}
 .budget-card h3{font-size:27px}
 .budget-edit{flex-wrap:wrap}
 .budget-amount{flex-basis:100%;min-height:48px}
 .budget-edit .soft-button,.budget-edit .solid-button{flex:1;min-width:0}
}

/* Compact movement controls: 44px touch targets; trash pictogram remains subtle. */
.history-actions-head{width:126px}
.history-actions-cell{white-space:nowrap;min-width:125px}
.history-actions{display:flex;justify-content:flex-end;align-items:center;gap:3px}
.history-action-edit,.history-action-remove{border:0;border-radius:7px;background:transparent;
 color:var(--ink-2);cursor:pointer;min-height:44px;min-width:44px;
 display:inline-flex;align-items:center;justify-content:center;transition:background .15s}
.history-action-edit{font-size:11px;font-weight:750;padding:0 8px}
.history-action-edit:hover,.history-action-edit:focus-visible{background:var(--surface)}
.history-action-edit:disabled{opacity:.3;cursor:not-allowed}
.history-action-remove{color:var(--ink-muted)}
.history-action-remove:hover,.history-action-remove:focus-visible{color:#aa4d43;background:#f6e9e6}
.history-trash-icon{width:13px;height:14px;position:relative;border:1.5px solid currentColor;
 border-radius:2px 2px 3px 3px;transform:scale(.85);margin-top:5px}
.history-trash-icon::before{content:"";position:absolute;left:-3px;right:-3px;top:-5px;
 border-top:1.5px solid currentColor;border-radius:2px}
.history-trash-icon::after{content:"";position:absolute;left:4px;top:-8px;width:3px;height:2px;
 border:1px solid currentColor;border-bottom:0}
.movement-editor{max-width:520px}
.movement-editor input,.movement-editor select{background:var(--paper);color:var(--ink);
 border:1px solid var(--rule);border-radius:6px;width:100%;padding:13px 14px;
 min-height:48px;font-size:16px}
.movement-editor .expense-amount input{border:0;background:transparent}
.movement-editor input:focus-visible,.movement-editor select:focus-visible{outline:2px solid var(--copper)}
@media(max-width:600px){
 .history-actions-head{width:98px}
 .history-actions-cell{min-width:98px;padding-inline:2px}
 .history-action-edit{padding:0 3px;font-size:10px}
 .history-action-remove{min-width:40px}
 .movement-editor{width:calc(100vw - 18px);padding:19px 18px;
 max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 16px)}
}

/* Keep payment METHOD separate from the optional BANK on every viewport.
   Do not style bank names like a method or let them displace the method. */
.history-method{color:var(--ink-2);min-width:152px;line-height:1.35}
.history-payment-method-label{display:block;font-size:12px;font-weight:750;
  line-height:1.4;white-space:normal;color:inherit}
.history-bank-detail{display:block;font-size:11px;line-height:1.5;
  color:var(--forest);margin-top:6px;font-weight:650;
  white-space:normal;overflow-wrap:anywhere}
@media(max-width:600px){
  .history-method{min-width:133px}
  .history-payment-method-label{font-size:11px;line-height:1.35}
  .history-bank-detail{font-size:11px;line-height:1.4}
}
.theme-night .history-bank-detail{color:#c6dfd1}

/* v22 / calm charcoal-green dark mode. No light-mode selectors changed. */
body.theme-night,.studio.theme-night{
  --paper:#111b1d;--surface:#1d2c2a;--ink:#edf1ea;--ink-2:#cfddd3;
  --ink-muted:#b4c5bb;--rule:#3c5149;--copper:#e1ae8c;
  --forest:#24483d;--forest-2:#31594b;--cream:#253a34;
  --light:#20342e;--success:#8acba4;
  --shadow:0 9px 25px #060c0c15;color-scheme:dark
}
.theme-night .masthead{background:#111b1df7;border-bottom-color:var(--rule)}
.theme-night .metric,.theme-night .editorial-panel,.theme-night .module,
.theme-night .connection,.theme-night .table-panel,.theme-night .budget-card,
.theme-night .budget-home,.theme-night .settings-panel{
  background:var(--surface);border-color:var(--rule);box-shadow:none
}
.theme-night .metric-feature,.theme-night .statement-card,.theme-night .flow-source{
  background:#27443c
}
.theme-night .metric-top,.theme-night .metric p,.theme-night .module p,
.theme-night .setting-row p,.theme-night .budget-heading p,.theme-night .budget-card p,
.theme-night .budget-note,.theme-night .budget-message,.theme-night .footnote,
.theme-night .history-note,.theme-night .history-kind,.theme-night .history-bottom p{
  color:var(--ink-muted)
}
.theme-night .module-value,.theme-night .history-amount,.theme-night .history-count{
  color:#d9eee1
}
.theme-night .history-name,.theme-night .history-payment-method-label,
.theme-night .budget-card h3,.theme-night .budget-stat strong{
  color:var(--ink)
}
.theme-night .history-bank-detail{color:#a7d4be}
.theme-night .table-panel th{color:#c4d3c9;border-bottom-color:var(--rule)}
.theme-night .table-panel td{color:var(--ink-2);border-bottom-color:#33463f}
.theme-night .table-panel tbody tr:hover{background:#273a34}
.theme-night .rail{background:#101d1d}
.theme-night .rail-item.is-active{background:#304a40;color:#f0f1e9;box-shadow:inset 0 0 0 1px #527063}
.theme-night .rail-item.is-active .rail-index{opacity:.75}
.theme-night .soft-button,.theme-night .icon-button{
  background:#233831;border-color:#526a5d;color:#e9f2e9
}
.theme-night .soft-button:hover,.theme-night .icon-button:hover{
  background:#304c40;border-color:#799587;color:#fff
}
.theme-night .soft-button:focus-visible,.theme-night .icon-button:focus-visible,
.theme-night .period-btn:focus-visible,.theme-night .budget-amount:focus-within{
  outline:2px solid var(--copper);outline-offset:3px
}
.theme-night .period-btn{color:#c6d6cb}
.theme-night .period-btn.active{color:#edbd9c;border-color:#edbd9c}
.theme-night .period-btn:hover{background:#233831;color:#f2f4ea}
.theme-night .period-btn.active:hover{color:#edbd9c}
.theme-night .toggle-button{border-color:#648373;color:#f1f5ed;background:#29473c}
.theme-night .toggle-button[aria-checked="true"]{background:#446a55;border-color:#88b69e;color:#fff}
.theme-night .state-pill{background:#2d4a3b;border:1px solid #4e6e5b;color:#d5ebdb}
.theme-night .state-pill.pending{background:#49392e;border-color:#89654a;color:#f7dbc3}
.theme-night .budget-chip{background:#28483a;color:#d2eede}
.theme-night .budget-card[data-budget-status="near"] .budget-chip{
  background:#4d3b2a;color:#f7d9b1
}
.theme-night .budget-card[data-budget-status="over"] .budget-chip,
.theme-night .budget-card[data-budget-status="exhausted"] .budget-chip{
  background:#4c302e;color:#ffd0c5
}
.theme-night .budget-amount{
  background:#142422;border-color:#567064;color:var(--ink)
}
.theme-night .budget-amount input{color:var(--ink);background:transparent;caret-color:#f1c7a8}
.theme-night .budget-amount input::placeholder{color:#adc2b4}
.theme-night .budget-progress{accent-color:#88b69e;background:#263b34}
.theme-night .budget-progress::-webkit-progress-bar{background:#263b34}
.theme-night .budget-progress::-webkit-progress-value{background:#88b69e}
.theme-night .budget-card[data-budget-status="near"] .budget-progress{accent-color:#e4b17d}
.theme-night .budget-card[data-budget-status="near"] .budget-progress::-webkit-progress-value{background:#e4b17d}
.theme-night .budget-card[data-budget-status="over"] .budget-progress,
.theme-night .budget-card[data-budget-status="exhausted"] .budget-progress{accent-color:#d99587}
.theme-night .budget-card[data-budget-status="over"] .budget-progress::-webkit-progress-value,
.theme-night .budget-card[data-budget-status="exhausted"] .budget-progress::-webkit-progress-value{background:#d99587}
.theme-night .expense-dialog,.theme-night .reset-dialog,.theme-night .more-dialog{
  background:#1c2b28;color:var(--ink);border-color:#51675e
}
.theme-night .expense-dialog input,.theme-night .expense-dialog select,
.theme-night .movement-editor input,.theme-night .movement-editor select,
.theme-night .reset-dialog input,.theme-night .reset-phrase,
.theme-night .expense-amount{
  background:#142421;border:1px solid #526b60;color:var(--ink);caret-color:#ecc2a2
}
.theme-night .expense-amount input,.theme-night .movement-editor .expense-amount input{
  background:transparent;border:0;color:var(--ink)
}
.theme-night .expense-dialog input::placeholder,.theme-night .movement-editor input::placeholder{
  color:#aec1b3
}
.theme-night .expense-review,.theme-night .movement-editor .expense-review{
  background:#2b4037;border-color:var(--copper);color:#f0f1e9
}
.theme-night .expense-feedback.fail{color:#ffc1b0}
.theme-night .expense-feedback.ok{color:#a6e1be}
.theme-night .danger-button{color:#f4c7b5;border-color:#c78c76}
.theme-night .danger-button:hover{background:#4c322d}
.theme-night .history-action-remove:hover,.theme-night .history-action-remove:focus-visible{
  background:#503530;color:#ffc3b6
}
.theme-night .mobile-nav{
  background:#111f1eF5;border-top:1px solid #49665b;
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)
}
.theme-night .mobile-item{color:#bbd0c3}
.theme-night .mobile-item.is-active{color:#f4dfc9}
.theme-night .method-sub{color:var(--ink-muted)}

/* Validated statement CSV import; follows Studio light/dark tokens. */
.import-studio{max-width:920px;gap:16px}
.import-studio h2{font:500 29px/1.15 Georgia,serif;letter-spacing:-.03em;margin:8px 0}
.import-studio h3{font:500 22px/1.2 Georgia,serif;margin:18px 0 6px}
.import-studio label{font-size:11px;font-weight:750;color:var(--ink-2)}
.import-studio input,.import-studio select{
  display:block;min-height:48px;width:100%;border:1px solid var(--rule);
  background:var(--paper);color:var(--ink);border-radius:7px;font-size:16px;
  padding:12px 13px;margin-top:7px
}
.import-studio input[type="file"]{height:auto;min-height:58px;padding:12px}
.import-studio input[type="file"]::file-selector-button{
  border:1px solid var(--rule);border-radius:6px;background:var(--surface);
  color:var(--ink);padding:8px;margin-right:10px
}
.import-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.import-studio button{min-height:44px}
.import-studio button:disabled{opacity:.5;cursor:not-allowed}
#import-status,#import-summary{font-size:12px;line-height:1.6;color:var(--ink-2)}
.import-review-list{display:grid;gap:8px;max-height:340px;overflow-y:auto}
.import-row{display:flex;align-items:center;gap:12px;background:var(--paper);
  border:1px solid var(--rule);border-radius:8px;padding:12px;
  font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.import-row input{flex-shrink:0;width:20px;min-height:20px;height:20px;margin:0}
.import-issue{border-left:3px solid var(--copper);padding:9px 12px;
  color:var(--ink-2);font-size:11px;line-height:1.6;background:var(--light)}
.import-confirm-actions,.push-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.theme-night .import-studio input,.theme-night .import-studio select{
  border-color:#526b60;background:#142421;color:#edf1ea
}
.theme-night .import-studio input[type="file"]::file-selector-button{
  background:#29483d;border-color:#66877a;color:#edf1ea
}
.theme-night .import-issue{background:#433529;color:#f2dac0}
.theme-night .import-row{background:#142421;border-color:#526b60}
@media(max-width:640px){.import-options{grid-template-columns:1fr}
 .import-confirm-actions{flex-direction:column;align-items:stretch}
 .import-confirm-actions button{width:100%}
 .push-actions{width:100%}.push-actions button{flex:1 1 100%}
}

/* Authenticated profile, no shared financial data between Access identities. */
.profile-setting{align-items:center;gap:18px}
.profile-setting #profile-email{
  margin-top:9px;font-size:12px;font-weight:700;color:var(--ink-2);
  overflow-wrap:anywhere;line-height:1.5
}
.profile-logout{display:inline-flex;justify-content:center;align-items:center;
  min-height:44px;text-decoration:none;text-align:center;border:1px solid var(--rule);
  border-radius:7px;white-space:normal}
.profile-logout:focus-visible{outline:2px solid var(--copper);outline-offset:3px}
.theme-night .profile-setting #profile-email{color:#c7e0d2}
.theme-night .profile-logout{background:#233831;color:#e9f2e9;border-color:#526a5d}
.theme-night .profile-logout:hover{background:#304c40;border-color:#799587;color:#fff}
@media(max-width:650px){.profile-setting{flex-direction:column;align-items:stretch}
 .profile-logout{width:100%;padding:12px}}
`;var oe=`(() => {
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
    cash: "Efectivo", debit_card: "Tarjeta d\xE9bito",
    credit_card: "Tarjeta cr\xE9dito", bank_transfer: "Transferencia",
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
      previous: { start: advance(today, -1), end: today }, title: "Hoy \xB7 " + fmtFull.format(parseDay(today)) };
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
        title: "A\xF1o " + today.slice(0, 4) };
    }
    return { start: "0000-01-01", end: "9999-12-31",
      previous: null, title: "Hist\xF3rico completo \xB7 desde tu primer registro" };
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
      chip.textContent = "Hist\xF3rico";
      if (note) note.textContent = "desde el primer registro";
    } else if (!previous.minor && !current.minor) {
      chip.textContent = "Sin variaci\xF3n";
      if (note) note.textContent = "vs. per\xEDodo anterior";
    } else if (!previous.minor) {
      chip.textContent = "Primeros gastos";
      if (note) note.textContent = "vs. per\xEDodo anterior";
    } else {
      const change = (current.minor - previous.minor) / previous.minor * 100;
      chip.textContent = (change > 0 ? "\u2191 +" : change < 0 ? "\u2193 " : "\u2014 ") +
        Math.abs(change).toLocaleString("es-CO", { maximumFractionDigits: 0 }) + "%";
      chip.className = "delta " + (change > 0 ? "up" : change < 0 ? "down" : "muted");
      if (note) note.textContent = "vs. per\xEDodo anterior";
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
    $("chart-first").textContent = keys.length ? caption(keys[0]) : "\u2014";
    $("chart-last").textContent = keys.length ? caption(keys.at(-1)) : "\u2014";
    $("trend-total").textContent = asCOP(values.reduce((a, b) => a + b, 0));
    $("trend-subtitle").textContent = period === "day" ? "\xDAltimos 7 d\xEDas, incluido hoy"
      : period === "week" ? "\xDAltimos 7 d\xEDas"
      : period === "month" ? "Desde el primer d\xEDa del mes"
      : period === "year" ? "Mes a mes, en el a\xF1o actual" : "Evoluci\xF3n de los \xFAltimos 12 meses";
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
      note.textContent = "Sin gastos en este per\xEDodo";
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
      amount.textContent = value ? asCompact(value) : "\u2014";
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
      cell.title = day + " \xB7 " + asCOP(value);
      cell.append(amount, track, label);
      panel.appendChild(cell);
    }
  }
  function renderInsights(items, totalMovements) {
    const days = new Map();
    items.forEach((x) => days.set(x.day, (days.get(x.day) || 0) + Number(x.minor)));
    const top = [...days.entries()].sort((a, b) => b[1] - a[1])[0];
    $("peak-day").textContent = top
      ? fmtDay.format(parseDay(top[0])) + " \xB7 " + asCOP(top[1]) : "Sin datos";
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
      const cell = td("A\xFAn no hay movimientos. Registra uno desde Atajos y actualiza aqu\xED.", "empty-row");
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
        : x.kind === "transfer" ? "Transferencia propia \xB7 no es gasto"
        : x.kind === "investment_transfer" ? "Aporte a inversi\xF3n \xB7 no es gasto" : "Movimiento";
      const desc = document.createElement("div");
      desc.append(concept, kind);
      const method = document.createElement("div");
      method.className = "history-method";
      const methodLabel = document.createElement("strong");
      methodLabel.className = "history-payment-method-label";
      methodLabel.textContent = LABELS[x.payment_method] || "M\xE9todo sin identificar";
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
      amount.textContent = (x.kind === "purchase" ? "\u2212 " : "\u2194 ") +
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
      " movimiento(s) \xB7 m\xE1s antiguos al final";
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
      throw new Error("No se pudieron cargar los datos. Comprueba tu conexi\xF3n, abre la PWA desde Safari y toca Actualizar.");
    }
    if (r.status === 401 || r.status === 403) throw new Error(
      "La sesi\xF3n privada expir\xF3. Abre esta p\xE1gina en Safari y vuelve a iniciar sesi\xF3n con Cloudflare Access.");
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
      if (overview.truncated) throw new Error("El historial supera el m\xE1ximo de agregaciones permitido. Contacta soporte para una consulta completa.");
      state.overview = overview;
      renderDashboard();
      // Transient, same-origin in-memory handoff for late-loaded Studio interactions.
      // Never persisted in storage or a financial cache.
      window.__finanzasossLatestOverview = overview;
      document.dispatchEvent(new CustomEvent("finanzasoss:data", {detail:{overview}}));
      if (overview.excludedUsd && $("testing")) {
        $("testing").textContent = "ENTORNO STAGING \xB7 " + overview.excludedUsd +
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
})();`;var re=`(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const studio = byId("studio");
  const spaces = ["today", "movement", "portfolio", "plan", "map", "imports", "connections", "settings"];
  const names = {
    today: "HOY", movement: "MOVIMIENTOS", portfolio: "PORTAFOLIOS", plan: "PLAN",
    map: "MAPA FINANCIERO", imports: "IMPORTAR", connections: "CONEXIONES", settings: "AJUSTES",
  };
  const bankRequired = new Set(["debit_card", "credit_card", "bank_transfer"]);
  const methods = {cash:"Efectivo",debit_card:"Tarjeta d\xE9bito",credit_card:"Tarjeta cr\xE9dito",
    bank_transfer:"Transferencia",digital_wallet:"Billetera digital",other:"Otro"};
  const COP = new Intl.NumberFormat("es-CO", {style:"currency",currency:"COP",maximumFractionDigits:0});
  const dateBogota = () => {
    const pts = new Intl.DateTimeFormat("en-US", {timeZone:"America/Bogota",year:"numeric",
      month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const row = Object.fromEntries(pts.map((p) => [p.type,p.value]));
    return row.year+"-"+row.month+"-"+row.day;
  };
  const amountCOP = (minor) => COP.format(Number(minor || 0)/100);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = "today", ownReduced = false, privateMode = false;
  let latestOverview = null, capabilities = null, stagedWrite = null;
  const announcement = byId("live-announcement");
  function announce(text) { announcement.textContent = text; }
  // Profile identification is always derived from the authenticated Access
  // identity; never reuse an email provided by the browser or local storage.
  async function showActiveProfile(){
    const label=byId("profile-email");
    try{
      const response=await fetch("/api/quick/profile",{
        credentials:"same-origin",cache:"no-store",
        headers:{Accept:"application/json"},
      });
      if(!response.ok)throw new Error("La sesi\xF3n no pudo verificarse.");
      const data=await response.json();
      if(typeof data.email!=="string"||!data.email.includes("@"))
        throw new Error("Identidad incompleta.");
      label.textContent="Sesi\xF3n activa: "+data.email;
    }catch{
      label.textContent="No se pudo consultar el correo. Inicia sesi\xF3n nuevamente si es necesario.";
    }
  }
  void showActiveProfile();
  function switchTo(id, {fromHash=false}={}) {
    if (!spaces.includes(id)) return;
    if (active === id && !byId("space-"+id).hidden) return;
    active = id;
    for (const section of document.querySelectorAll(".space[data-space]")) {
      const visible = section.dataset.space === id;
      section.hidden = !visible;
      section.classList.toggle("is-visible", visible);
    }
    for (const control of document.querySelectorAll("button[data-view]")) {
      const selected = control.dataset.view === id;
      control.classList.toggle("is-active", selected);
      if (selected && (control.classList.contains("rail-item") || control.classList.contains("mobile-item"))) {
        control.setAttribute("aria-current","page");
      } else control.removeAttribute("aria-current");
    }
    byId("current-space").textContent = names[id];
    if (!fromHash) history.replaceState(null, "", "#"+id);
    const heading = byId("heading-"+id);
    if (heading) { heading.setAttribute("tabindex","-1"); heading.focus({preventScroll:true}); }
    window.scrollTo({top:0,behavior:ownReduced || reduced.matches ? "instant" : "smooth"});
    announce("Secci\xF3n "+names[id].toLowerCase());
  }
  document.querySelectorAll("button[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => switchTo(btn.dataset.view)));
  const moreDialog=byId("more-dialog");
  byId("open-more").addEventListener("click",()=>{if(!moreDialog.open)moreDialog.showModal();});
  byId("close-more").addEventListener("click",()=>moreDialog.close());
  moreDialog.querySelectorAll("button[data-view]").forEach((button)=>{
    button.addEventListener("click",()=>{moreDialog.close();});
  });

  window.addEventListener("hashchange", () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (spaces.includes(target)) switchTo(target,{fromHash:true});
  });
  if (spaces.includes(location.hash.slice(1))) switchTo(location.hash.slice(1),{fromHash:true});
  function setPrivacy(value) {
    privateMode = value;
    studio.classList.toggle("is-private",value);
    byId("privacy-toggle").setAttribute("aria-pressed",String(value));
    byId("privacy-toggle").setAttribute("aria-label",value?"Mostrar cifras":"Ocultar cifras");
    byId("privacy-setting").setAttribute("aria-checked",String(value));
    byId("privacy-setting").textContent=value?"Activado":"Desactivado";
    // Blurring is not sufficient for assistive technology privacy.
    document.querySelectorAll("[data-private],.history-amount").forEach((el) => {
      if (value) { el.setAttribute("aria-hidden","true"); el.setAttribute("inert",""); }
      else { el.removeAttribute("aria-hidden"); el.removeAttribute("inert"); }
    });
    announce(value?"Cifras ocultas":"Cifras visibles");
  }
  byId("privacy-toggle").addEventListener("click",()=>setPrivacy(!privateMode));
  byId("privacy-setting").addEventListener("click",()=>setPrivacy(!privateMode));
  byId("motion-setting").addEventListener("click",()=>{
    ownReduced = !ownReduced;
    studio.classList.toggle("no-motion",ownReduced);
    byId("motion-setting").setAttribute("aria-checked",String(ownReduced));
    byId("motion-setting").textContent=ownReduced?"Reducido":"Seg\xFAn sistema";
  });
  // No browser storage by policy: follow the device appearance at launch.
  function applyTheme(night){
    studio.classList.toggle("theme-night",night);
    document.body.classList.toggle("theme-night",night);
    document.querySelector('meta[name="theme-color"]').setAttribute("content",
      night?"#111b1d":"#172c2c");
    byId("theme-setting").textContent=night?"Modo claro":"Modo oscuro";
    byId("theme-setting").setAttribute("aria-label",
      night?"Cambiar a modo claro":"Cambiar a modo oscuro");
  }
  applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
  byId("theme-setting").addEventListener("click",()=>{
    applyTheme(!studio.classList.contains("theme-night"));
  });
  // Gesture policy mirrored from the original mobile-experience model:
  // only single-finger horizontal navigation starting outside interactive elements.
  let touchStart = null;
  studio.addEventListener("touchstart",(event)=>{
    if (event.touches.length!==1 || event.target.closest("button,a,input,select,dialog,table,.chart-wrap")) {touchStart=null;return;}
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  studio.addEventListener("touchend",(event)=>{
    if (!touchStart || event.changedTouches.length!==1 || innerWidth>980) {touchStart=null;return;}
    const dx=event.changedTouches[0].clientX-touchStart.x;
    const dy=event.changedTouches[0].clientY-touchStart.y;
    touchStart=null;
    if (Math.abs(dx)<64 || Math.abs(dx)<Math.abs(dy)*1.25) return;
    const order=["today","movement","portfolio","plan","map"];
    const index=order.indexOf(active);
    const next=order[index+(dx<0?1:-1)];
    if (index>=0 && next) switchTo(next);
  },{passive:true});
  function applyPrivacyToNewNodes() {
    if(privateMode) setPrivacy(true);
  }
  function updatePlanAndMap(overview) {
    if (!overview || !Array.isArray(overview.daily)) return;
    latestOverview=overview;
    const today=dateBogota(), first=today.slice(0,7)+"-01";
    const all=overview.daily;
    const thisMonth=all.filter((x)=>x.day>=first && x.day<=today);
    const total=all.reduce((s,x)=>s+Number(x.minor),0);
    const month=thisMonth.reduce((s,x)=>s+Number(x.minor),0);
    const days=new Set(thisMonth.map((x)=>x.day));
    const monthElapsed=Number(today.slice(8,10));
    byId("plan-month").textContent=amountCOP(month);
    byId("plan-days").textContent=String(days.size).padStart(2,"0");
    byId("plan-average").textContent=amountCOP(month/Math.max(1,monthElapsed));
    byId("map-total").textContent=amountCOP(total);
    byId("hero-status").textContent=overview.movementCount===0?
      "Tu historial est\xE1 listo para recibir el primer gasto" :
      new Intl.NumberFormat("es-CO").format(overview.movementCount)+" movimientos consultados en privado";
    const sumByMethod = new Map();
    all.forEach((x)=>sumByMethod.set(x.method,(sumByMethod.get(x.method)||0)+Number(x.minor)));
    const targets=byId("map-targets");
    targets.replaceChildren();
    const items=[...sumByMethod].sort((a,b)=>b[1]-a[1]);
    if(!items.length){const message=document.createElement("p");
      message.textContent="A\xFAn no hay gastos registrados.";targets.appendChild(message);}
    items.forEach(([method,minor],i)=>{
      const box=document.createElement("div");box.className="flow-target";
      box.style.borderLeftColor=["#b66b45","#8b9d84","#bca27a","#6b918c","#a68d9a","#89908c"][i%6];
      const label=document.createElement("strong");label.textContent=methods[method]||"Otro";
      const amount=document.createElement("span");amount.setAttribute("data-private","");
      amount.textContent=amountCOP(minor);
      box.append(label,amount);targets.appendChild(box);
    });
    applyPrivacyToNewNodes();
  }
  document.addEventListener("finanzasoss:data",(event)=>updatePlanAndMap(event.detail.overview));
  if (window.__finanzasossLatestOverview) updatePlanAndMap(window.__finanzasossLatestOverview);
  // Amounts inserted during pagination must follow the privacy preference.
  const movementTarget=byId("history-body");
  new MutationObserver(()=> {
    if(!privateMode)return;
    movementTarget.querySelectorAll(".history-amount").forEach((el)=>{
      el.setAttribute("aria-hidden","true");el.setAttribute("inert","");
    });
  }).observe(movementTarget,{childList:true,subtree:false});

  async function readCapabilities() {
    try {
      const r=await fetch("/api/quick/studio/capabilities",{credentials:"same-origin",cache:"no-store"});
      if(!r.ok) return;
      const model=await r.json();if(model.product!=="FinanzasOSS")return;
      capabilities=model;
      // This is a capability check, not a bank login / provider activation.
      if(model.banks?.connected!==0 || model.investments?.connected!==0) {
        announce("Hay cambios en las fuentes disponibles. Revisa su estado antes de interpretar saldos.");
      }
    } catch { /* existing live ledger remains usable offline-error without cache */ }
  }
  void readCapabilities();
  const dialog=byId("expense-dialog"),form=byId("expense-form"),methodField=byId("expense-method");
  const bankRow=byId("expense-bank-row"),bank=byId("expense-bank");
  const review=byId("expense-review"),feedback=byId("expense-feedback"),submit=byId("expense-submit");
  function resetReview(keepPending) {
    review.hidden=true;
    feedback.textContent="";
    feedback.className="expense-feedback";
    submit.textContent="Revisar movimiento \u2192";
    submit.dataset.confirmed="false";
    if(!keepPending)stagedWrite=null;
  }
  function openCapture() {
    if(!dialog.open)dialog.showModal();
    if(!stagedWrite)resetReview(false);
    byId("expense-amount").focus();
  }
  for(const id of ["add-top","add-mobile","add-movement"]){
    byId(id).addEventListener("click",openCapture);
  }
  byId("close-expense").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{if(!stagedWrite){form.reset();resetReview(false);}});
  dialog.addEventListener("cancel",(event)=>{
    if(submit.disabled) event.preventDefault();
  });
  function updateBank() {
    const show=bankRequired.has(methodField.value);
    bankRow.hidden=!show;bank.required=show;
    if(!show)bank.value="";
    resetReview(Boolean(stagedWrite));
  }
  methodField.addEventListener("change",updateBank);
  for(const input of [byId("expense-amount"),byId("expense-concept"),bank]){
    input.addEventListener("input",()=>resetReview(Boolean(stagedWrite)));
  }
  updateBank();
  function capturePayload() {
    const amount=byId("expense-amount").value.trim();
    const concept=byId("expense-concept").value.trim();
    const method=methodField.value;
    const bankLabel=bankRequired.has(method)?bank.value.trim():null;
    if(!/^[0-9]{1,12}$/.test(amount)||Number(amount)<1)
      throw new Error("Introduce un monto entero mayor que cero.");
    if(concept.length<1 || concept.length>120)
      throw new Error("Escribe un concepto v\xE1lido.");
    if(!Object.hasOwn(methods,method)) throw new Error("Selecciona un medio de pago.");
    if(bankRequired.has(method)&&(!bankLabel || bankLabel.length>80))
      throw new Error("Selecciona o escribe el banco.");
    return {amount,concept,paymentMethod:method,bankLabel};
  }
  form.addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(submit.disabled)return;
    let payload;
    try {payload=capturePayload();}
    catch(error){feedback.textContent=error.message;feedback.className="expense-feedback fail";return;}
    const fingerprint=JSON.stringify(payload);
    if(stagedWrite && stagedWrite.fingerprint!==fingerprint){
      feedback.textContent="Hay un env\xEDo pendiente con otros datos. Consulta el historial antes de modificarlo.";
      feedback.className="expense-feedback fail";return;
    }
    if(submit.dataset.confirmed!=="true"){
      review.hidden=false;
      review.textContent="Confirma este gasto de prueba:\\n"+COP.format(Number(payload.amount))+
        " \xB7 "+payload.concept+"\\n"+methods[payload.paymentMethod]+
        (payload.bankLabel?" \xB7 "+payload.bankLabel:"")+"\\nNo se asociar\xE1 a ninguna cuenta.";
      if(typeof window.finanzasossBudgetWarning==="function")
        review.textContent+=window.finanzasossBudgetWarning(Number(payload.amount));
      submit.dataset.confirmed="true";
      submit.textContent="Confirmar y guardar \u2713";
      feedback.textContent="Revisa que el monto, concepto y m\xE9todo sean correctos.";
      feedback.className="expense-feedback";
      return;
    }
    // Reuse exactly the same ID on uncertain retries. No double write.
    if(!stagedWrite) stagedWrite={fingerprint,key:crypto.randomUUID()};
    submit.disabled=true;
    try {
      const response=await fetch("/api/quick/studio/expense",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...payload,clientEntryId:stagedWrite.key,confirmed:true}),
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error==="Entry idempotency key reused with different data"?
        "La clave ya existe con otros valores. Revisa el historial.":
        "No se confirm\xF3 el guardado (HTTP "+response.status+").");
      if(!data.entryId)throw new Error("Respuesta sin identificador; revisa el historial.");
      stagedWrite=null;
      resetReview(false);
      form.reset();updateBank();dialog.close();
      announce(data.replayed?"Movimiento recuperado sin duplicar.":"Movimiento confirmado en el historial.");
      switchTo("movement");
      byId("reload").click();
    } catch(error) {
      feedback.textContent=error.message+" No reenv\xEDes con otra clave sin revisar primero el historial.";
      feedback.className="expense-feedback fail";
    } finally {submit.disabled=false;}
  });
  // Scoped reset requires period selection, server preview, typed confirmation
  // and an additional native confirmation. No implicit reset on page load.
  const resetDialog=byId("reset-dialog"),resetOpen=byId("reset-open");
  const resetClose=byId("reset-close"),resetCancel=byId("reset-cancel");
  const resetPreview=byId("reset-preview");
  const resetAck=byId("reset-ack"),resetPhrase=byId("reset-phrase");
  const resetConfirm=byId("reset-confirm"),resetFeedback=byId("reset-feedback");
  const resetCounts=byId("reset-counts"),resetRequired=byId("reset-required-phrase");
  const resetScopes=[...resetDialog.querySelectorAll('input[name="reset-scope"]')];
  const typedPhrases={month:"BORRAR ESTE MES",all:"BORRAR TODOS LOS MESES"};
  let resetChallenge=null,resetInProgress=false,resetPreparing=false;
  function scopeSelected() {
    return resetScopes.find((el)=>el.checked)?.value==="all"?"all":"month";
  }
  function resetReady(){
    resetConfirm.disabled=!resetChallenge||!resetAck.checked||
      resetPhrase.value.trim()!==typedPhrases[scopeSelected()]||
      resetChallenge.scope!==scopeSelected()||resetInProgress||resetPreparing;
  }
  function invalidateReset(){
    resetChallenge=null;resetAck.checked=false;resetPhrase.value="";
    resetAck.disabled=true;resetPhrase.disabled=true;
    resetRequired.textContent=typedPhrases[scopeSelected()];
    resetPhrase.placeholder=typedPhrases[scopeSelected()];
    resetCounts.replaceChildren();
    const message=document.createElement("p");
    message.textContent="Pulsa Revisar para conocer los movimientos que se eliminar\xEDan.";
    resetCounts.append(message);
    resetReady();
  }
  resetAck.addEventListener("change",resetReady);
  resetPhrase.addEventListener("input",resetReady);
  resetScopes.forEach((input)=>input.addEventListener("change",()=>{
    if(resetPreparing)return;
    resetFeedback.textContent="";
    invalidateReset();
  }));
  async function postReset(path,payload){
    let response;
    try{
      response=await fetch("/api/quick/studio/reset/"+path,{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(payload),
      });
    }catch{
      throw new Error("No hubo respuesta de la red. Comprueba la conexi\xF3n en Safari e int\xE9ntalo de nuevo.");
    }
    const body=await response.json().catch(()=>({}));
    if(!response.ok){
      if(response.status===401||response.status===403)throw new Error(
        "Tu sesi\xF3n o el restablecimiento no est\xE1n disponibles en staging. Abre Safari e inicia sesi\xF3n.");
      if(response.status===409)throw new Error(
        "La confirmaci\xF3n expir\xF3 o llegaron nuevos movimientos. Vuelve a revisar los totales.");
      throw new Error("No se pudo completar la operaci\xF3n (HTTP "+response.status+").");
    }
    return body;
  }
  resetOpen.addEventListener("click",()=>{
    if(resetDialog.open)return;
    resetScopes[0].checked=true;
    resetFeedback.textContent="";
    invalidateReset();
    resetDialog.showModal();
  });
  resetClose.addEventListener("click",()=>{if(!resetInProgress && !resetPreparing)resetDialog.close();});
  resetCancel.addEventListener("click",()=>{if(!resetInProgress && !resetPreparing)resetDialog.close();});
  resetDialog.addEventListener("cancel",(event)=>{if(resetInProgress || resetPreparing)event.preventDefault();});
  resetDialog.addEventListener("close",()=>invalidateReset());
  resetPreview.addEventListener("click",async()=>{
    if(resetInProgress||resetPreparing)return;
    invalidateReset();
    const scope=scopeSelected();
    resetFeedback.textContent="";
    resetPreparing=true;resetPreview.disabled=true;resetScopes.forEach((x)=>x.disabled=true);
    const loading=document.createElement("p");
    loading.textContent="Consultando tus movimientos del per\xEDodo\u2026";
    resetCounts.replaceChildren(loading);
    try{
      const out=await postReset("prepare",{acknowledged:true,scope});
      if(!resetDialog.open)return;
      if(!out.challengeId||out.scope!==scope||!out.counts ||
        out.confirmationPhrase!==typedPhrases[scope]) {
        throw new Error("No se pudo verificar el per\xEDodo del restablecimiento.");
      }
      resetChallenge={id:out.challengeId,scope,monthKey:out.monthKey};
      resetCounts.replaceChildren();
      const title=document.createElement("p");
      title.textContent=scope==="month"?
        "Per\xEDodo a borrar: "+out.monthKey+" \xB7 horario de Bogot\xE1":
        "Per\xEDodo a borrar: todos los meses registrados";
      resetCounts.append(title);
      for(const [name,value] of [
        ["Movimientos manuales",out.counts.manualEntries],
        ["Gastos del Atajo / PWA",out.counts.directExpenses],
        ["Total de movimientos",out.counts.manualEntries+out.counts.directExpenses],
      ]){
        const line=document.createElement("div");line.className="reset-count";
        const label=document.createElement("span");label.textContent=name;
        const count=document.createElement("strong");count.textContent=Number(value).toLocaleString("es-CO");
        line.append(label,count);resetCounts.append(line);
      }
      const notice=document.createElement("p");
      notice.textContent="Confirmaci\xF3n v\xE1lida durante cinco minutos. Se conservar\xE1n cuentas y autorizaciones.";
      resetCounts.append(notice);
      resetAck.disabled=false;resetPhrase.disabled=false;
      resetRequired.textContent=out.confirmationPhrase;
      resetPhrase.placeholder=out.confirmationPhrase;
    }catch(error){
      resetFeedback.textContent=error.message;
      invalidateReset();
    }finally{
      resetPreparing=false;resetPreview.disabled=false;
      resetScopes.forEach((x)=>x.disabled=false);resetReady();
    }
  });
  resetConfirm.addEventListener("click",async()=>{
    if(!resetChallenge||resetInProgress||resetPreparing||!resetAck.checked ||
      resetPhrase.value.trim()!==typedPhrases[scopeSelected()]||
      resetChallenge.scope!==scopeSelected())return;
    const scope=resetChallenge.scope;
    const confirmation=scope==="month"?
      "\xBFEliminar definitivamente los movimientos del mes actual? Los dem\xE1s meses y el Atajo se conservar\xE1n.":
      "\xBFEliminar definitivamente TODOS los movimientos de staging? Las cuentas y el Atajo se conservar\xE1n.";
    if(!window.confirm(confirmation))return;
    resetInProgress=true;resetReady();resetPreview.disabled=true;
    resetCancel.disabled=true;resetClose.disabled=true;resetScopes.forEach((x)=>x.disabled=true);
    resetFeedback.textContent="Verificando la confirmaci\xF3n y actualizando tus movimientos\u2026";
    try{
      const result=await postReset("confirm",{
        challengeId:resetChallenge.id,scope,
        phrase:typedPhrases[scope],confirmed:true,
      });
      if(!result.reset||result.scope!==scope||result.shortcutAuthorizationRevoked!==false)
        throw new Error("El servidor no confirm\xF3 un restablecimiento seguro.");
      resetChallenge=null;
      resetAck.checked=false;resetPhrase.value="";
      resetCounts.replaceChildren();
      const summary=document.createElement("p");
      summary.textContent="Movimientos restablecidos. Las cuentas y el Atajo siguen autorizados.";
      resetCounts.append(summary);
      resetFeedback.textContent="El per\xEDodo seleccionado qued\xF3 limpio. Los acumulados se recalcular\xE1n.";
      announce("Movimientos eliminados del per\xEDodo seleccionado; autorizaci\xF3n de Atajos conservada.");
      byId("reload").click();
    }catch(error){
      // Never automatically retry a destructive POST.
      resetFeedback.textContent=error.message+
        " Si hubo error de red, revisa primero el historial antes de volver a confirmar.";
    }finally{
      resetInProgress=false;resetPreview.disabled=false;
      resetCancel.disabled=false;resetClose.disabled=false;resetScopes.forEach((x)=>x.disabled=false);
      resetReady();
    }
  });

  // App install: Android browsers may expose a native prompt; iOS uses Share.
  let installEvent=null;
  const installButton=byId("install-pwa"),installStatus=byId("install-feedback");
  const pushButton=byId("push-toggle"),pushStatus=byId("push-feedback"),pushTest=byId("push-test");
  const standalone=()=>matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
  window.addEventListener("beforeinstallprompt",(event)=>{
    event.preventDefault();installEvent=event;
    installStatus.textContent="Lista para instalar desde este navegador.";
  });
  window.addEventListener("appinstalled",()=>{
    installEvent=null;installStatus.textContent="FinanzasOSS est\xE1 instalada.";
  });
  installButton.addEventListener("click",async()=>{
    if(standalone()){installStatus.textContent="Ya est\xE1s usando FinanzasOSS como aplicaci\xF3n.";return;}
    if(installEvent){
      const event=installEvent;installEvent=null;
      await event.prompt();
      installStatus.textContent="Comprueba si el icono aparece en tu inicio.";
    }else{
      installStatus.textContent="iPhone: Safari > Compartir > A\xF1adir a pantalla de inicio. Android: men\xFA del navegador > Instalar aplicaci\xF3n.";
    }
  });
  const pushSupported=()=>window.isSecureContext && "serviceWorker" in navigator &&
    "PushManager" in window && "Notification" in window;
  let pushOptions=null,pushBusy=false,pushOn=false;
  const activeSubscription=async()=>{
    const registration=await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  };
  async function updatePush(){
    if(pushBusy)return;
    pushTest.disabled=true;
    if(!pushSupported()){
      pushButton.disabled=true;pushButton.textContent="No disponible";
      pushStatus.textContent="Tu navegador no permite notificaciones Web Push.";
      return;
    }
    try{
      const response=await fetch("/api/quick/push/config",{credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw new Error("La configuraci\xF3n no respondi\xF3.");
      pushOptions=await response.json();
      if(!pushOptions.enabled){
        pushButton.disabled=true;pushButton.textContent="Pr\xF3ximamente";
        pushStatus.textContent="Notificaciones pendientes de configuraci\xF3n segura en este entorno.";
        return;
      }
      if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!standalone()){
        pushButton.disabled=true;pushButton.textContent="Instala la PWA";
        pushStatus.textContent="Abre FinanzasOSS desde su icono de la pantalla de inicio para activar avisos.";
        return;
      }
      if(Notification.permission==="denied"){
        pushButton.disabled=true;pushButton.textContent="Bloqueado";
        pushStatus.textContent="Permiso denegado. Puedes modificarlo desde Ajustes del dispositivo.";
        return;
      }
      const existingSubscription=await activeSubscription();
      if(existingSubscription){
        const statusResponse=await fetch("/api/quick/push/status",{
          method:"POST",credentials:"same-origin",cache:"no-store",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({endpoint:existingSubscription.endpoint}),
        });
        if(!statusResponse.ok)throw new Error("No se pudo comprobar la autorizaci\xF3n.");
        pushOn=Boolean((await statusResponse.json()).registered);
      }else pushOn=false;
      pushButton.disabled=false;pushButton.textContent=pushOn?"Desactivar avisos":"Activar avisos";
      pushTest.disabled=!pushOn;
      pushStatus.textContent=pushOn?(pushOptions.deliveryEnabled?"Activo \xB7 recordatorio diario a las 8:30 p. m.":"Permiso registrado. El env\xEDo de avisos a\xFAn no est\xE1 habilitado."):
        "Desactivado. Solo recibir\xE1s avisos si aceptas.";
    }catch{
      pushButton.disabled=true;pushButton.textContent="No disponible";
      pushStatus.textContent="No pudimos consultar las notificaciones. Reintenta en l\xEDnea.";
    }
  }
  const decodeKey=(value)=>{
    const input=value.replace(/-/g,"+").replace(/_/g,"/");
    const binary=atob(input+"=".repeat((4-input.length%4)%4));
    return Uint8Array.from(binary,c=>c.charCodeAt(0));
  };
  pushButton.addEventListener("click",async()=>{
    if(pushBusy||!pushOptions?.enabled)return;
    pushBusy=true;pushButton.disabled=true;
    try{
      if(!pushOn){
        // MUST be called directly from the user click, before network awaits.
        const permission=await Notification.requestPermission();
        if(permission!=="granted")throw new Error("Permiso no concedido.");
        const registration=await navigator.serviceWorker.ready;
        let subscription=await registration.pushManager.getSubscription();
        if(!subscription)subscription=await registration.pushManager.subscribe({
          userVisibleOnly:true,applicationServerKey:decodeKey(pushOptions.publicKey),
        });
        const response=await fetch("/api/quick/push/subscribe",{
          method:"POST",credentials:"same-origin",cache:"no-store",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({endpoint:subscription.endpoint,confirmed:true}),
        });
        if(!response.ok)throw new Error("No se confirm\xF3 el permiso en el servidor.");
        pushStatus.textContent="Autorizaci\xF3n guardada.";
      }else{
        const subscription=await activeSubscription();
        if(subscription){
          const response=await fetch("/api/quick/push/unsubscribe",{
            method:"POST",credentials:"same-origin",cache:"no-store",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({endpoint:subscription.endpoint}),
          });
          if(!response.ok)throw new Error("No se pudo revocar el permiso en el servidor.");
          await subscription.unsubscribe();
        }
        pushStatus.textContent="Autorizaci\xF3n revocada.";
      }
    }catch(error){
      pushStatus.textContent=error.message||"La operaci\xF3n no pudo completarse.";
    }finally{pushBusy=false;await updatePush();}
  });
  pushTest.addEventListener("click",async()=>{
    if(pushBusy||!pushOn||!window.confirm("\xBFEnviar un aviso de prueba a este dispositivo? No incluye datos financieros."))return;
    pushBusy=true;pushTest.disabled=true;
    try{
      const subscription=await activeSubscription();
      if(!subscription)throw new Error("No hay dispositivo autorizado. Activa los avisos primero.");
      const res=await fetch("/api/quick/push/test",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({endpoint:subscription.endpoint,confirmed:true}),
      });
      const value=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(value.error||"El proveedor no acept\xF3 el aviso.");
      pushStatus.textContent="Prueba aceptada por el proveedor. Revisa las notificaciones de iOS.";
    }catch(e){pushStatus.textContent=e.message||"No se pudo probar.";}
    finally{pushBusy=false;pushTest.disabled=!pushOn;}
  });
  void updatePush();
})();
`;var ie=`(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const names={day:"diario",week:"semanal",month:"mensual",year:"anual"};
  const labels={day:"hoy",week:"esta semana",month:"este mes",year:"este a\xF1o"};
  const periods=Object.keys(names);
  const fmt=new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
  const cop=minor=>fmt.format(Number(minor||0)/100);
  let current=null,loading=false,mutation=false;
  function statusText(p){
    if(p.status==="unconfigured")return "Sin l\xEDmite";
    if(p.status==="over")return "L\xEDmite superado";
    if(p.status==="exhausted")return "L\xEDmite alcanzado";
    if(p.status==="near")return "Cerca del l\xEDmite";
    return "Dentro del l\xEDmite";
  }
  function render(data,resetInput){
    current=data;
    let warnings=[];
    for(const period of periods){
      const p=data.periods[period],configured=p.limitMinor!==null;
      const container=document.querySelector('[data-budget-period="'+period+'"]');
      const chip=$("budget-status-"+period),spent=$("budget-spent-"+period),
        remain=$("budget-remaining-"+period),bar=$("budget-progress-"+period),
        input=$("budget-input-"+period);
      if(!p || !container)continue;
      chip.textContent=statusText(p);
      container.dataset.budgetStatus=p.status;
      spent.textContent=cop(p.spentMinor)+" gastados";
      remain.textContent=configured?"Disponible: "+cop(p.remainingMinor):"Define una meta personal";
      bar.value=configured?Math.min(100,p.usedPercent):0;
      bar.setAttribute("aria-valuetext",configured?
        p.usedPercent+" por ciento usado":"Sin l\xEDmite configurado");
      if(resetInput)input.value=configured?String(Number(p.limitMinor)/100):"";
      if(configured && ["near","exhausted","over"].includes(p.status))
        warnings.push(names[period]+": "+statusText(p).toLowerCase());
    }
    const status=$("budget-home-status"),home=$("budget-home");
    const configured=periods.filter(period=>data.periods[period].limitMinor!==null).length;
    if(warnings.length){
      status.textContent="Atenci\xF3n: "+warnings.join(" \xB7 ")+".";
      home.dataset.budgetStatus="near";
    }else{
      status.textContent=configured?
        configured+" l\xEDmite(s) configurado(s). Todos los per\xEDodos est\xE1n bajo control.":
        "Todav\xEDa no has definido l\xEDmites. Config\xFAralos en Plan.";
      home.dataset.budgetStatus="ok";
    }
    // Data-private elements are obfuscated by Studio CSS in privacy mode.
    const privateMode=$("studio").classList.contains("is-private");
    document.querySelectorAll(".budget-section [data-private]").forEach(el=>{
      if(privateMode){el.setAttribute("aria-hidden","true");el.setAttribute("inert","");}
      else{el.removeAttribute("aria-hidden");el.removeAttribute("inert");}
    });
  }
  async function reload(resetInput=false){
    if(loading || mutation)return;
    loading=true;
    try{
      const r=await fetch("/api/quick/budgets",{credentials:"same-origin",cache:"no-store"});
      if(!r.ok)throw new Error("No se pudieron consultar los presupuestos (HTTP "+r.status+").");
      const data=await r.json();
      if(data.currency!=="COP"||!data.periods||periods.some(p=>!data.periods[p]))
        throw new Error("El servidor devolvi\xF3 presupuestos incompletos.");
      render(data,resetInput);
      $("budget-message").textContent="L\xEDmites sincronizados con tus gastos registrados.";
    }catch(error){
      $("budget-message").textContent=error.message+" Comprueba tu conexi\xF3n.";
    }finally{loading=false;}
  }
  async function update(period,remove){
    if(mutation||loading)return;
    const input=$("budget-input-"+period),status=$("budget-message");
    const amount=input.value.trim();
    if(!remove&&(!/^[1-9][0-9]{0,9}$/.test(amount)||Number(amount)>1000000000)){
      status.textContent="Escribe un l\xEDmite entero de 1 a 1.000.000.000 COP.";input.focus();return;
    }
    if(remove && (!current || current.periods[period].limitMinor===null)){
      status.textContent="No hay l\xEDmite "+names[period]+" que quitar.";return;
    }
    if(remove&&!confirm("\xBFQuitar tu l\xEDmite "+names[period]+"? No eliminar\xE1 ning\xFAn gasto."))return;
    mutation=true;
    document.querySelectorAll("[data-budget-save],[data-budget-remove]").forEach(el=>el.disabled=true);
    try{
      const res=await fetch("/api/quick/budgets",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({period,amountCOP:remove?null:amount}),
      });
      if(!res.ok)throw new Error("No se pudo guardar el l\xEDmite (HTTP "+res.status+").");
      status.textContent=remove?"L\xEDmite "+names[period]+" quitado.":"L\xEDmite "+names[period]+" guardado.";
    }catch(error){status.textContent=error.message+" Revisa el estado antes de reintentar.";}
    finally{
      mutation=false;
      document.querySelectorAll("[data-budget-save],[data-budget-remove]").forEach(el=>el.disabled=false);
      await reload(true);
    }
  }
  for(const period of periods){
    document.querySelector('[data-budget-save="'+period+'"]')
      .addEventListener("click",()=>update(period,false));
    document.querySelector('[data-budget-remove="'+period+'"]')
      .addEventListener("click",()=>update(period,true));
  }
  // Warn in the confirmation preview, including cross-period breaches. Never
  // prevent saving nor imply a bank account or fully synced balance exists.
  window.finanzasossBudgetWarning=(amount)=>{
    if(!current||!Number.isSafeInteger(amount)||amount<=0)return "";
    const extra=amount*100,notices=[];
    for(const period of periods){
      const p=current.periods[period];if(p.limitMinor===null)continue;
      const newSpend=Number(p.spentMinor)+extra,limit=Number(p.limitMinor);
      if(newSpend>=limit)notices.push("L\xEDmite "+names[period]+" alcanzado o superado");
      else if(newSpend*100>=limit*80)notices.push("Alcanzar\xEDas el 80 % del l\xEDmite "+names[period]);
    }
    return notices.length?"\\nAviso de presupuesto: "+notices.join("; ")+". Puedes registrar el gasto igualmente.":"";
  };
  document.addEventListener("finanzasoss:data",()=>{void reload();});
  window.addEventListener("pageshow",()=>{void reload();});
  void reload(true);
})();`;var ae=`(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const dialog=$("movement-edit-dialog"),form=$("movement-edit-form");
  const amount=$("movement-edit-amount"),concept=$("movement-edit-concept");
  const method=$("movement-edit-method"),bank=$("movement-edit-bank");
  const bankRow=$("movement-edit-bank-row"),feedback=$("movement-edit-feedback");
  const review=$("movement-edit-review"),submit=$("movement-edit-submit");
  const needsBank=new Set(["debit_card","credit_card","bank_transfer"]);
  let entry=null,busy=false,reviewFingerprint=null;
  const sourceOf=e=>e.account_id===null?"accountless":"manual";
  function resetReview(){
    reviewFingerprint=null;review.hidden=true;
    submit.textContent="Revisar cambios";
    feedback.className="expense-feedback";feedback.textContent="";
  }
  function displayBank(){
    const needed=needsBank.has(method.value);
    bankRow.hidden=!needed;bank.required=needed;
    if(!needed)bank.value="";
    resetReview();
  }
  function openEditor(data){
    if(busy)return;
    if($("studio").classList.contains("is-private")){
      window.alert("Desactiva el modo privacidad para editar montos.");
      return;
    }
    if(data.kind!=="purchase"||data.currency!=="COP"){
      window.alert("En este momento solo se pueden editar gastos en pesos colombianos.");
      return;
    }
    entry=data;
    amount.value=String(Number(data.amount_minor)/100);
    concept.value=data.merchant||"";
    method.value=data.payment_method;
    bank.value=data.bank_label||"";
    bankRow.hidden=!needsBank.has(method.value);
    bank.required=needsBank.has(method.value);
    resetReview();
    dialog.showModal();amount.focus();
  }
  $("movement-edit-close").addEventListener("click",()=>{if(!busy)dialog.close();});
  dialog.addEventListener("cancel",event=>{if(busy)event.preventDefault();});
  dialog.addEventListener("close",()=>{if(!busy){entry=null;resetReview();}});
  for(const element of [amount,concept,bank]){
    element.addEventListener("input",resetReview);
  }
  method.addEventListener("change",displayBank);
  function payload(){
    const a=amount.value.trim(),c=concept.value.trim(),m=method.value;
    const b=needsBank.has(m)?bank.value.trim():null;
    if(!/^[0-9]{1,10}(?:\\.[0-9]{1,2})?$/.test(a)||!(Number(a)>0))
      throw new Error("Escribe un monto v\xE1lido en COP.");
    if(!c||c.length>120)throw new Error("Escribe un concepto v\xE1lido.");
    if(!["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"].includes(m))
      throw new Error("Selecciona un m\xE9todo de pago.");
    if(needsBank.has(m)&&(!b||b.length>80))
      throw new Error("Indica el banco para tarjeta o transferencia.");
    return {operation:"edit",source:sourceOf(entry),id:entry.id,
      expectedRevision:entry.revision,confirmed:true,
      amount:a,concept:c,paymentMethod:m,bankLabel:b};
  }
  function refresh(){
    $("reload").click(); // Reloads history, dashboard and connected budget calculations.
  }
  async function post(data){
    const response=await fetch("/api/quick/studio/movement/change",{
      method:"POST",credentials:"same-origin",cache:"no-store",
      headers:{"Content-Type":"application/json"},body:JSON.stringify(data),
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok){
      if(response.status===409)throw new Error("El movimiento cambi\xF3 o ya se elimin\xF3. Actualiza la lista.");
      if(response.status===401||response.status===403)throw new Error("Sesi\xF3n caducada o no autorizada.");
      throw new Error("No se pudo guardar (HTTP "+response.status+").");
    }
    return result;
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();if(busy||!entry)return;
    let data;
    try{data=payload();}
    catch(error){feedback.className="expense-feedback fail";feedback.textContent=error.message;return;}
    const fingerprint=JSON.stringify(data);
    if(reviewFingerprint!==fingerprint){
      reviewFingerprint=fingerprint;review.hidden=false;
      review.textContent="Confirma la correcci\xF3n:\\n"+
        "Nuevo monto: $"+Number(data.amount).toLocaleString("es-CO")+
        "\\nConcepto: "+data.concept+"\\nMedio de pago: "+method.options[method.selectedIndex].textContent+
        "\\nSe conservar\xE1n la fecha y la asociaci\xF3n anterior del registro.";
      submit.textContent="Confirmar y guardar";
      feedback.textContent="Revisa los cambios antes de confirmarlos.";return;
    }
    busy=true;submit.disabled=true;
    try{
      const result=await post(data);
      if(!result.saved)throw new Error("El servidor no confirm\xF3 la modificaci\xF3n.");
      dialog.close();entry=null;resetReview();
      $("live-announcement").textContent="Gasto actualizado. Se recalcularon los totales.";
      refresh();
    }catch(error){feedback.className="expense-feedback fail";feedback.textContent=error.message;}
    finally{busy=false;submit.disabled=false;}
  });
  async function remove(data){
    if(busy)return;
    const name=(data.merchant||"movimiento").slice(0,80);
    if(!window.confirm("\xBFEliminar \\""+name+"\\" del historial?\\n"+
      "Dejar\xE1 de sumar en tus gastos y presupuestos. La fila original se conservar\xE1 internamente para impedir duplicados."))return;
    busy=true;
    try{
      const result=await post({operation:"delete",source:sourceOf(data),id:data.id,
        expectedRevision:data.revision,confirmed:true});
      if(!result.deleted)throw new Error("El servidor no confirm\xF3 la eliminaci\xF3n.");
      $("live-announcement").textContent="Movimiento retirado del historial y del c\xE1lculo de gastos.";
      refresh();
    }catch(error){window.alert(error.message+"\\nActualiza el historial antes de reintentar.");}
    finally{busy=false;}
  }
  document.addEventListener("finanzasoss:movement-action",event=>{
    const data=event.detail;
    if(!data||!data.entry||!["edit","delete"].includes(data.action))return;
    if(data.action==="edit")openEditor(data.entry);
    else void remove(data.entry);
  });
})();`;var se=`(() => {
 "use strict";
 const $=id=>document.getElementById(id),status=$("import-status");
 let rows=[],data=null,readyIndices=new Set(),busy=false;
 const headers=()=>["date","description","amount","direction","currency","external"]
    .map(x=>$("import-col-"+x));
 const safeMessage=e=>{status.textContent=e instanceof Error?e.message:String(e);};
 function csvRows(text){
  if(text.length>65536)throw Error("El CSV supera 64 KB.");
  if(/^\\uFEFF/.test(text))text=text.slice(1);
  let result=[],row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(quoted){
    if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;
    else field+=ch;
   }else if(ch==='"'){if(field.length)throw Error("Comillas inv\xE1lidas en CSV");quoted=true;}
   else if(ch===","){row.push(field);field="";}
   else if(ch==="\\n"){row.push(field.replace(/\\r$/,""));result.push(row);row=[];field="";}
   else field+=ch;
  }
  if(quoted)throw Error("CSV con comillas sin cerrar");
  if(field||row.length){row.push(field);result.push(row);}
  if(result.length<2)throw Error("CSV sin filas de movimientos");
  const head=result[0].map(x=>x.trim());
  if(new Set(head).size!==head.length||head.length<4||head.length>12||head.some(x=>!x||x.length>80))throw Error("Encabezados inv\xE1lidos o duplicados");
  const content=result.slice(1).filter(r=>r.some(cell=>cell.trim()));
  if(content.length>50)throw Error("Usa extractos de m\xE1ximo 50 movimientos por archivo");
  if(content.some(r=>r.length!==head.length))throw Error("Algunas filas tienen diferente n\xFAmero de columnas");
  return {head,rows:content.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i].trim()])))};
 }
 function invalidate(){
  $("import-review").hidden=true;data=null;readyIndices.clear();
  $("import-confirm").disabled=true;
 }
 function setBusy(flag){busy=flag;$("import-preview").disabled=flag||!rows.length;$("import-confirm").disabled=flag||!data||!readyIndices.size;}
 function populate(head){
  const choices=headers();
  for(const sel of choices){
   sel.replaceChildren();
   const optional=sel.id.endsWith("currency")||sel.id.endsWith("external");
   const blank=document.createElement("option");blank.value="";blank.textContent=optional?"Sin columna":"Selecciona columna";
   sel.appendChild(blank);
   for(const value of head){const op=document.createElement("option");op.value=value;op.textContent=value;sel.appendChild(op);}
  }
  $("import-mapping").hidden=false;
  const normalize=x=>x.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");
  const find=values=>head.find(h=>values.includes(normalize(h)))||"";
  const candidates=[
   ["fecha","date","fecha operacion","postedat"],
   ["descripcion","description","concepto","comercio","detalle"],
   ["monto","importe","amount","valor","valor cop"],
   ["tipo","direction","naturaleza","debito/credito"],
   ["moneda","currency"],
   ["id","referencia","externalid","transactionid"],
  ];
  choices.forEach((sel,i)=>sel.value=find(candidates[i]));
 }
 async function request(path,payload){
  const res=await fetch(path,{method:"POST",credentials:"same-origin",cache:"no-store",
   headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const value=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(value.error||"HTTP "+res.status+". No se guard\xF3 el archivo.");
  return value;
 }
 function payload(){
  const [date,desc,amount,direction,currency,external]=headers().map(sel=>sel.value);
  if(!date||!desc||!amount||!direction)throw Error("Asignar fecha, concepto, importe y tipo es obligatorio");
  return {rows,mapping:{postedAt:date,description:desc,amount,direction,
   ...(currency?{currency}:{}),...(external?{externalId:external}:{})},
   bankLabel:$("import-bank").value.trim(),paymentMethod:$("import-payment-method").value};
 }
 function showPreview(p){
  const box=$("import-rows");box.replaceChildren();readyIndices=new Set(p.ready.map(x=>x.index));
  $("import-review").hidden=false;
  $("import-summary").textContent=p.ready.length+" d\xE9bitos elegibles \xB7 "+
    p.possibleDuplicates.length+" posibles duplicados \xB7 "+p.skipped.length+" filas para revisar.";
  for(const item of p.ready){
   const label=document.createElement("label");label.className="import-row";
   const check=document.createElement("input");check.type="checkbox";check.checked=true;
   const content=document.createElement("span");content.textContent=item.date+" \xB7 "+item.concept+
     " \xB7 $"+Number(item.amountCOP).toLocaleString("es-CO");
   check.addEventListener("change",()=>{
    if(check.checked)readyIndices.add(item.index);else readyIndices.delete(item.index);
    $("import-confirm").disabled=!readyIndices.size||busy;
   });
   label.append(check,content);box.append(label);
  }
  for(const i of p.possibleDuplicates){
   const note=document.createElement("p");note.className="import-issue";
   note.textContent="Fila "+(i+1)+": posible duplicado. No se incluir\xE1.";
   box.append(note);
  }
  for(const invalid of p.skipped){
   const note=document.createElement("p");note.className="import-issue";
   note.textContent="Fila "+(invalid.index+1)+": "+invalid.issues.join(" \xB7 ");
   box.append(note);
  }
  $("import-confirm").disabled=!readyIndices.size;
 }
 $("import-file").addEventListener("change",async()=>{
  invalidate();rows=[];setBusy(false);
  const file=$("import-file").files?.[0];if(!file){status.textContent="Selecciona un archivo CSV.";return;}
  try{
   if(!/\\.csv$/i.test(file.name)||file.size<1||file.size>65536)throw Error("Selecciona un CSV de m\xE1ximo 64 KB.");
   const parsed=csvRows(await file.text());rows=parsed.rows;populate(parsed.head);
   status.textContent="CSV cargado en memoria: "+rows.length+" filas. Verifica columnas y banco.";
  }catch(e){rows=[];$("import-mapping").hidden=true;safeMessage(e);}
  setBusy(false);
 });
 for(const e of [...headers(),$("import-bank"),$("import-payment-method")]){
  e.addEventListener("change",invalidate);
 }
 $("import-preview").addEventListener("click",async()=>{
  if(busy)return;setBusy(true);invalidate();
  try{
   const input=payload();
   if(!input.bankLabel||input.bankLabel.length>80)throw Error("Escribe el banco del extracto.");
   const p=await request("/api/quick/import/preview",input);data=input;showPreview(p);
   status.textContent="Vista previa revisada por el servidor. Nada se ha guardado.";
  }catch(e){safeMessage(e);}finally{setBusy(false);}
 });
 $("import-confirm").addEventListener("click",async()=>{
  if(busy||!data||!readyIndices.size)return;
  const selectedIndices=[...readyIndices].sort((a,b)=>a-b);
  if(!window.confirm("\xBFImportar "+selectedIndices.length+" gastos revisados? No se importar\xE1n abonos ni saldos."))return;
  setBusy(true);
  try{
   const result=await request("/api/quick/import/commit",
     {...data,selectedIndices,confirmed:true});
   status.textContent=result.inserted+" gastos guardados \xB7 "+result.duplicates+" duplicados omitidos.";
   $("import-review").hidden=true;data=null;readyIndices.clear();
   const reload=$("reload");if(reload)reload.click();
  }catch(e){safeMessage(e);}finally{setBusy(false);}
 });
 $("import-cancel").addEventListener("click",()=>{
  invalidate();status.textContent="Revisi\xF3n cancelada. Ning\xFAn gasto guardado.";
 });
})();`;var ce=JSON.stringify({id:"/dashboard",name:"FinanzasOSS \xB7 Mi panel",short_name:"FinanzasOSS",description:"Consulta tus movimientos y gastos desde tu iPhone de forma privada.",start_url:"/dashboard",scope:"/",display:"standalone",orientation:"portrait-primary",background_color:"#f5f3ee",theme_color:"#172c2c",lang:"es-CO",categories:["finance","productivity"],icons:[{src:"/dashboard-icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any maskable"},{src:"/dashboard-icon-180.png",sizes:"180x180",type:"image/png",purpose:"any"}]}),de='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="FinanzasOSS"><rect width="180" height="180" rx="41" fill="#091c1d"/><rect x="11" y="11" width="158" height="158" rx="34" fill="none" stroke="#23584d" stroke-width="2"/><g fill="#7cedc5"><rect x="41" y="36" width="18" height="107" rx="6"/><rect x="41" y="36" width="83" height="18" rx="6"/><rect x="41" y="86" width="68" height="18" rx="6"/></g><path d="M103 124 137 90m0 0-20 2m20-2-1 17" stroke="#b6d2f4" stroke-width="8" fill="none" stroke-linejoin="round"/></svg>',le="iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAEjUlEQVR42u3dvVHcQBiAYbEoudjZjV0AkSmACkhJ3Ad1uA8Sp66AAiByB7RAxODAvhl+dD+Sdle7q+eNmGEYhPTcx3fi5jjbfNm+dqW0Oe9UYc8vxRxKD7CiX8cFgfcAqyXgPcjKdv0zwO5BVkuwe5DVEuweZLUEO8Cs4p5ELg4aZhViqAdZLa0gAWa1NK370jFvry5d4MJ6un/Ig3rCpD4b/VqOxJgBBvxdI1GPA50I8yHEWaaByr5eI1CfDjoy5n0nBeB2gEe9lieiPg10YswQt4s7N+qsoEEGe3nQCTCDvE7YOVAfBh0BM8iK7uAA6gCzcvT2+s++NXvAZqjiESmoT2x45Zg5nXcHC7KSGhlYPUKRB6rVTOvYkzrEnM4wKyvqAavRJrTXYKgEPyHm7mw6K7uXD2ZDzEcXzFp6nw5zpzPMWhz1G7vBqVRLzQJtOqu01SPMxSylaKqvMGd/Np2VakpP3aPt0LJD251V6i5tQquxCe0NY9RKm/PubPP126j35Shh3bh9vHPxRvTz+48qj3uKtepWDpids2ZAw+zcNQMaZucwOuil9meY13kup9y+c9tOVg4JaAloCWgBLQEtAS0BLQEtoNV8tb6UFGitDjPQMAMtmEuud3FlQktAS0BLQAtoCWgJaAloCWgBLQEtAS0BLQEtoCWgJaAloCWgBbQEtAS0BLQEtICWgJaAloCWgBbQUvmt7u10bx/vqjxubwNsQnsgAi2o//Xr95/Bj60cio461vpxDGpNkIFuGHWNEK0c2tvN9QXQgrqF9QNoqJtCDTTUTa0yQK8E9VyMtezlQJvWnhQKaqBVRFOe2NX0IAAaZhNaMAOtaI19Lcea/hQONMxAqz3MMe5VA61iMA99XGM9GOt+AjgE+Ob6otpVxYSGefTngFZVmGtGDTTMTaEGGuamAhpmoAUz0IIZaMEMNMwrxQw0zEALZqAFM9CCGWiYgRbMQAtmoAUz0CvrVKQwA90MapiBbgY1zEA3gxpmoJtBDTPQq3uiKKAFtAS0BLQEtICWgJaAloCWgBbQEtA5ivVvJNbw7yiAHtHT/UPXdV23vbqsDjXM9bVztnPX3MoxFSXMJnQzqGFeV1X+WzdItX9CP7+M+oIl92jZnw/2/OK2nezQUlugrR0qbt14B3rkHi0V13/DIdajSYo5nbPv0FN+HUipfYUY39SU1tK782fQ9mhVvj9H2aFNaZUynT+DnjilodZimD+YDakOTlrCSzgmPvWzUinWdI4+oa0eWmJvPg56xh0PqJUF8x6jZ5sv29fBz2zOo+1G1hFFd7EHdBj7BVN2ItNaOTAf36GhVkWYD68cEdcPKwjIUa77CQM2G+ihKQ32OiBHu9bRQEdEDTbIqTCPA50YNdztIF4K83jQkVGf8oQR8HoAJ7leI29MjAedCPUpJ0tllmzoTLjLNg10YtSArxTwTMzzQGdErZU14+8ffZRvDLYWhrwrlHIggjlGobQDEsxz6pMcmBVECw3BPumBgq3Mv837LAcOtjKtpX3WHwRskJsAve8HAxzgqkEDDnDi/gLvSxzb9b7BbwAAAABJRU5ErkJggg==",pe=`
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// Intentionally NO fetch event handler; every request uses the native browser network stack.
self.addEventListener("push", (event) => {
  // Empty payload only. Do not reveal any amount, bank or account on locked screens.
  event.waitUntil(self.registration.showNotification("FinanzasOSS", {
    body:"\xBFRegistraste tus gastos de hoy?",
    icon:"/dashboard-icon-180.png",
    badge:"/dashboard-icon-180.png",
    tag:"finanzasoss-daily",
    data:{url:"/dashboard#movement"},
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target=new URL("/dashboard#movement",self.location.origin).href;
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const window of windows) {
      if(new URL(window.url).origin===self.location.origin){
        await window.focus();
        if("navigate" in window) await window.navigate(target);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
`;var ct="SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL",dt="SELECT id,NULL AS account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL",q=ct+" UNION ALL "+dt;function ue(e){return new Response(JSON.stringify(e),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'","Referrer-Policy":"no-referrer"}})}async function me(e,t){let[o,n]=await Promise.all([e.prepare("SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day,payment_method, SUM(amount_minor) AS amount_minor, COUNT(*) AS quantity FROM ("+q+") WHERE currency='COP' AND kind='purchase' GROUP BY day,payment_method ORDER BY day DESC LIMIT 40001").bind(t,t).all(),e.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN currency='USD' THEN 1 ELSE 0 END),0) AS usd,COALESCE(SUM(CASE WHEN kind!='purchase' THEN 1 ELSE 0 END),0) AS non_expenses FROM ("+q+")").bind(t,t).first()]),i=o.results.length>4e4;return ue({timezone:"America/Bogota",currency:"COP",movementCount:n?.total??0,excludedUsd:n?.usd??0,transfersAndInvestments:n?.non_expenses??0,truncated:i,daily:o.results.slice(0,4e4).map(a=>({day:a.day,method:a.payment_method,minor:String(a.amount_minor),count:a.quantity}))})}async function ge(e,t,o){let n=o.searchParams.get("page")??"0";if(!/^(0|[1-9][0-9]{0,4})$/.test(n)||Number(n)>1e4||[...o.searchParams.keys()].some(s=>s!=="page"))return new Response(JSON.stringify({error:"Invalid page"}),{status:422,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});let i=Number(n),a=40,r=await e.prepare("SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,revision FROM ("+q+") ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?").bind(t,t,a+1,i*a).all();return ue({page:i,hasMore:r.results.length>a,entries:r.results.slice(0,a).map(s=>({...s,amount_minor:String(s.amount_minor)}))})}var W=Object.freeze([{id:"today",label:"Hoy",shortLabel:"Hoy",priority:1},{id:"movement",label:"Movimientos",shortLabel:"Mov.",priority:2},{id:"portfolio",label:"Portafolios",shortLabel:"Portaf.",priority:3},{id:"plan",label:"Plan",shortLabel:"Plan",priority:4},{id:"map",label:"Mapa financiero",shortLabel:"Mapa",priority:5}]),fe=Object.freeze(["profile","connections","settings"]);var lt=Object.freeze({not_verified:"Aun no se ha verificado acceso oficial para esta entidad. No puedes conectar cuentas.",portal_registered:"La inscripcion en un portal de desarrolladores no habilita la consulta de cuentas ni saldos.",sandbox_api_approved:"El acceso de pruebas no autoriza consultar datos reales ni activar sincronizacion bancaria.",production_access_review:"La habilitacion productiva requiere acuerdo verificado, consentimiento y aprobacion humana antes de conectarse."});function he(e){let t=e.providerName.trim()||"Entidad financiera";return Object.freeze({title:"Empieza con tus datos",guidance:"Puedes revisar tus archivos de forma local mientras se verifica el acceso oficial a las APIs financieras.",importCard:Object.freeze({title:"Importar un archivo",description:"Revisa el mapeo, las transacciones y los posibles duplicados antes de confirmar cualquier importacion.",acceptedFormats:Object.freeze(["CSV","XLSX","OFX","PDF"]),storesDataWithoutPreview:!1,action:Object.freeze({id:"review_local_import",label:"Revisar importacion",enabled:e.manualImportPreviewAvailable,requiresUserConfirmation:!0})}),providerCard:Object.freeze({title:t,status:e.providerAccessStage,description:lt[e.providerAccessStage],bankConnected:!1,automaticSyncAvailable:!1,productionAccessImplied:!1,action:Object.freeze({id:"view_provider_requirements",label:"Ver requisitos de conexion",enabled:!0,requiresUserConfirmation:!1})})})}var Qn=Object.freeze({minimumHorizontalDistancePx:64,horizontalDominanceRatio:1.25,singlePointerOnly:!0,destructiveGesturesAllowed:!1,financialActionGesturesAllowed:!1,gestureScope:"primary_navigation_only"});var H=Object.freeze({installable:!0,displayMode:"standalone",cacheApplicationShell:!0,cacheFinancialApiResponses:!1,cacheSensitiveFinancialData:!1,cacheSecretsOrCredentials:!1,offlineMoneyMovementAllowed:!1,offlineTradingAllowed:!1,offlineMode:"shell_and_non_sensitive_guidance_only"});var I=Object.freeze({instant:120,quick:180,standard:280,expressive:420}),Yn=Object.freeze({control:{stiffness:320,damping:28,mass:.8},panel:{stiffness:240,damping:30,mass:1}});var G=Object.freeze({capsulePressScale:.98,hoverLiftPx:2,privacyMorphMs:I.quick,balanceRefreshMs:I.standard}),Zn=Object.freeze({navigation:{durationMs:I.standard,transform:"translate",opacityTransition:!0,spatialContinuity:!0,loops:!1},disclosure:{durationMs:I.quick,transform:"scale",opacityTransition:!0,spatialContinuity:!0,loops:!1},privacy:{durationMs:G.privacyMorphMs,transform:"morph",opacityTransition:!0,spatialContinuity:!0,loops:!1},data_refresh:{durationMs:G.balanceRefreshMs,transform:"none",opacityTransition:!0,spatialContinuity:!1,loops:!1},transfer_reconciliation:{durationMs:I.standard,transform:"translate",opacityTransition:!0,spatialContinuity:!0,loops:!1},investment_contribution:{durationMs:I.standard,transform:"translate",opacityTransition:!0,spatialContinuity:!0,loops:!1},modal:{durationMs:I.standard,transform:"scale",opacityTransition:!0,spatialContinuity:!0,loops:!1}});var be=Object.freeze({continuousDecorationAllowed:!1,balanceCountUpAllowed:!1,hoverOnlyAffordancesAllowed:!1,maxPressScale:G.capsulePressScale,reducedMotionUsesTransform:!1});var $=he({providerName:"Entidades financieras",providerAccessStage:"not_verified",manualImportPreviewAvailable:!0});function ye(){return new Response(JSON.stringify({product:"FinanzasOSS",environment:"staging",currency:"COP",timezone:"America/Bogota",navigation:{primary:W.map(({id:e,label:t})=>({id:e,label:t})),secondary:fe},quick:{read:!0,capture:!0,accountRequired:!1},banks:{connected:0,automaticSync:!1,status:"pending_official_authorization"},investments:{connected:0,actualHoldings:!1,status:"awaiting_authorized_sources"},imports:{formats:["CSV"],engineFormatsNotYetLive:$.importCard.acceptedFormats.filter(e=>e!=="CSV"),maxRowsPerFile:50,requiresExplicitMapping:!0,liveUpload:$.importCard.action.enabled,previewAndConfirmationRequired:$.importCard.action.requiresUserConfirmation},pwa:{standalone:H.installable,cacheFinancialData:H.cacheFinancialApiResponses},experience:{motionMs:I,reducedMotionSupported:be.reducedMotionUsesTransform===!1}}),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}var ve=["day","week","month","year"],A=class extends Error{constructor(o,n=422){super(o);this.status=n}};function V(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function pt(e){let t=new Intl.DateTimeFormat("en-US",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(e)),o=Object.fromEntries(t.map(a=>[a.type,a.value])),n=o.year+"-"+o.month+"-"+o.day,i=new Date(n+"T12:00:00Z");return i.setUTCDate(i.getUTCDate()-(i.getUTCDay()+6)%7),{day:n,week:i.toISOString().slice(0,10),month:n.slice(0,7)+"-01",year:n.slice(0,4)+"-01-01",today:n}}async function xe(e,t,o=Date.now()){let n=pt(o),[i,a]=await Promise.all([e.prepare("SELECT period,limit_minor FROM quick_spending_limits WHERE owner_id=?").bind(t).all(),e.prepare("SELECT COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS day_minor,COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS week_minor,COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS month_minor,COALESCE(SUM(CASE WHEN day>=? THEN amount_minor ELSE 0 END),0) AS year_minor FROM (SELECT amount_minor,substr(datetime(occurred_at,'-5 hours'),1,10) AS day FROM quick_manual_entries WHERE owner_id=? AND kind='purchase' AND currency='COP' AND deleted_at IS NULL UNION ALL SELECT amount_minor,substr(datetime(occurred_at,'-5 hours'),1,10) AS day FROM quick_shortcut_expenses WHERE owner_id=? AND kind='purchase' AND currency='COP' AND deleted_at IS NULL) WHERE day<=?").bind(n.day,n.week,n.month,n.year,t,t,n.today).first()]),r=new Map(i.results.map(s=>[s.period,Number(s.limit_minor)]));return V({currency:"COP",timezone:"America/Bogota",asOf:n.today,periods:Object.fromEntries(ve.map(s=>{let c=n[s],d=Number(a?.[s+"_minor"]??0),p=r.get(s)??null,l=p===null?null:Math.max(0,p-d),m=p===null?null:Math.round(d/p*100),x=p===null?"unconfigured":d>p?"over":d===p?"exhausted":d*100>=p*80?"near":"ok";return[s,{start:c,spentMinor:String(d),limitMinor:p===null?null:String(p),remainingMinor:l===null?null:String(l),usedPercent:m,status:x}]}))})}async function we(e,t,o){if(!o||typeof o!="object"||Array.isArray(o))throw new A("Expected budget object");let n=o;if(Object.keys(n).some(r=>!["period","amountCOP"].includes(r)))throw new A("Unsupported field");if(!ve.includes(n.period))throw new A("Unsupported budget period");let i=n.period;if(n.amountCOP===null)return await e.prepare("DELETE FROM quick_spending_limits WHERE owner_id=? AND period=? RETURNING period").bind(t,i).first(),V({period:i,removed:!0});if(typeof n.amountCOP!="string"||!/^[1-9][0-9]{0,9}$/.test(n.amountCOP)||Number(n.amountCOP)>1e9)throw new A("Limit must be an integer between 1 and 1000000000 COP");let a=Number(n.amountCOP)*100;return await e.prepare("INSERT INTO quick_spending_limits(owner_id,period,limit_minor,updated_at) VALUES(?,?,?,?) ON CONFLICT(owner_id,period) DO UPDATE SET limit_minor=excluded.limit_minor,updated_at=excluded.updated_at RETURNING period").bind(t,i,a,new Date().toISOString()).first(),V({period:i,limitMinor:String(a),saved:!0})}var b=class extends Error{constructor(o,n=422){super(o);this.status=n}},ut=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),ke=new Set(["debit_card","credit_card","bank_transfer"]);function M(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function mt(e){if(!e||typeof e!="object"||Array.isArray(e))throw new b("Object required");let t=e;if(Object.keys(t).some(o=>!["operation","source","id","expectedRevision","confirmed","amount","concept","paymentMethod","bankLabel"].includes(o)))throw new b("Unsupported field");if(t.operation!=="edit"&&t.operation!=="delete")throw new b("Invalid operation");if(t.source!=="manual"&&t.source!=="accountless")throw new b("Invalid movement source");if(typeof t.id!="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id))throw new b("Invalid movement ID");if(typeof t.expectedRevision!="number"||!Number.isSafeInteger(t.expectedRevision)||t.expectedRevision<0||t.expectedRevision>1e8)throw new b("Invalid revision");if(t.confirmed!==!0)throw new b("Explicit confirmation required");return t}function gt(e){if(typeof e!="string"||!/^[0-9]{1,10}(?:\.[0-9]{1,2})?$/.test(e))throw new b("Enter a valid COP amount");let[t,o=""]=e.split("."),n=Number(t)*100+Number(o.padEnd(2,"0"));if(!Number.isSafeInteger(n)||n<=0||n>1e12)throw new b("Amount is outside allowed range");return n}function Ce(e,t){if(typeof e!="string")throw new b("Text expected");let o=e.trim();if(!o||o.length>t||/[\u0000-\u001f\u007f]/.test(o))throw new b("Invalid text");return o}async function Ee(e,t,o){let n=mt(o),i=n.source==="manual"?"quick_manual_entries":"quick_shortcut_expenses",a=n.id,r=n.expectedRevision,s=await e.prepare("SELECT id,kind,currency,deleted_at,revision FROM "+i+" WHERE owner_id=? AND id=?").bind(t,a).first();if(!s)return M({error:"Movement not found"},404);if(s.deleted_at)return M({error:"Movement was already removed"},409);if(s.revision!==r)return M({error:"Movement changed, reload the list"},409);let c=new Date().toISOString();if(n.operation==="delete"){if(Object.keys(n).some(v=>["amount","concept","paymentMethod","bankLabel"].includes(v)))throw new b("Delete does not accept editable fields");let y=await e.prepare("UPDATE "+i+" SET deleted_at=?,revision=revision+1 WHERE owner_id=? AND id=? AND revision=? AND deleted_at IS NULL RETURNING id,revision").bind(c,t,a,r).first();return y?M({deleted:!0,id:a,revision:y.revision}):M({error:"Movement changed, reload the list"},409)}if(s.kind!=="purchase"||s.currency!=="COP")return M({error:"Only COP purchases can be edited here"},422);let d=gt(n.amount),p=Ce(n.concept,120),l=n.paymentMethod;if(typeof l!="string"||!ut.has(l))throw new b("Invalid payment method");let m=n.bankLabel===null||n.bankLabel===void 0||n.bankLabel===""?null:Ce(n.bankLabel,80);if(ke.has(l)&&!m||!ke.has(l)&&m!==null)throw new b("Bank required for cards/transfers only");let x=await e.prepare("UPDATE "+i+" SET amount_minor=?,merchant=?,payment_method=?,bank_label=?,edited_at=?,revision=revision+1 WHERE owner_id=? AND id=? AND revision=? AND kind='purchase' AND currency='COP' AND deleted_at IS NULL RETURNING id,revision").bind(d,p,l,m,c,t,a,r).first();return x?M({saved:!0,id:a,revision:x.revision}):M({error:"Movement changed, reload the list"},409)}var w=class extends Error{constructor(o,n=422){super(o);this.status=n}},ft=300*1e3,Se={month:"BORRAR ESTE MES",all:"BORRAR TODOS LOS MESES"};function Ie(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function Ae(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new w("Invalid reset request");let o=e;if(Object.keys(o).some(n=>!t.includes(n)))throw new w("Unsupported reset field");return o}function Me(e=new Date){let t=new Intl.DateTimeFormat("en-US",{timeZone:"America/Bogota",year:"numeric",month:"2-digit"}).formatToParts(e),o=Object.fromEntries(t.map(n=>[n.type,n.value]));return o.year+"-"+o.month}function _e(e){return e==="month"?" AND substr(datetime(occurred_at,'-5 hours'),1,7)=?":""}function ht(e){if(!e)throw new w("Could not read movement counts",503);return{manualEntries:Number(e.manual_entries),directExpenses:Number(e.direct_expenses)}}async function Te(e,t,o,n){let i=_e(o),a=e.prepare("SELECT (SELECT COUNT(*) FROM quick_manual_entries WHERE owner_id=?"+i+") AS manual_entries,(SELECT COUNT(*) FROM quick_shortcut_expenses WHERE owner_id=?"+i+") AS direct_expenses");return ht(await a.bind(...o==="month"?[t,n,t,n]:[t,t]).first())}async function Oe(e,t,o){let n=Ae(o,["acknowledged","scope"]);if(n.acknowledged!==!0||n.scope!=="month"&&n.scope!=="all")throw new w("Choose monthly or all-month reset explicitly");let i=n.scope,a=i==="month"?Me():null,r=await Te(e,t,i,a),s=crypto.randomUUID(),c=new Date(Date.now()+ft).toISOString();return await e.prepare("DELETE FROM quick_reset_challenges WHERE owner_id=? RETURNING id").bind(t).all(),await e.prepare("INSERT INTO quick_reset_challenges(id,owner_id,expires_at,expected_manual_entries,expected_shortcut_expenses,expected_accounts,expected_devices,scope,month_key) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id").bind(s,t,c,r.manualEntries,r.directExpenses,0,0,i,a).first(),Ie({challengeId:s,expiresAt:c,scope:i,monthKey:a,counts:r,confirmationPhrase:Se[i],preservesAccounts:!0,preservesShortcuts:!0,externalBankBalancesUnaffected:!0})}async function Ne(e,t,o){let n=Ae(o,["challengeId","phrase","scope","confirmed"]);if(n.confirmed!==!0||n.scope!=="month"&&n.scope!=="all"||n.phrase!==Se[n.scope])throw new w("Typed confirmation must match the chosen period");if(typeof n.challengeId!="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(n.challengeId))throw new w("Invalid reset confirmation");let i=await e.prepare("SELECT id,owner_id,scope,month_key,expires_at,expected_manual_entries,expected_shortcut_expenses,confirmation_nonce FROM quick_reset_challenges WHERE id=? AND owner_id=? LIMIT 1").bind(n.challengeId,t).first(),a=new Date().toISOString();if(!i||i.expires_at<=a||i.confirmation_nonce!==null||i.scope!==n.scope||i.scope==="month"&&i.month_key!==Me())throw new w("Confirmation expired or scope changed; review totals again",409);let r=await Te(e,t,i.scope,i.month_key);if(r.manualEntries!==i.expected_manual_entries||r.directExpenses!==i.expected_shortcut_expenses)throw new w("Movements changed since review; refresh the confirmation",409);if(typeof e.batch!="function")throw new w("Atomic reset unavailable",503);let s=crypto.randomUUID(),c=_e(i.scope),d=e.prepare("UPDATE quick_reset_challenges SET confirmation_nonce=? WHERE id=? AND owner_id=? AND scope=? AND expires_at>? AND confirmation_nonce IS NULL AND expected_manual_entries=(SELECT COUNT(*) FROM quick_manual_entries WHERE owner_id=?"+c+")AND expected_shortcut_expenses=(SELECT COUNT(*) FROM quick_shortcut_expenses WHERE owner_id=?"+c+")").bind(s,i.id,t,i.scope,a,...i.scope==="month"?[t,i.month_key,t,i.month_key]:[t,t]),p=" AND EXISTS (SELECT 1 FROM quick_reset_challenges WHERE id=? AND owner_id=? AND confirmation_nonce=?)",l=e.prepare("DELETE FROM quick_manual_entries WHERE owner_id=?"+c+p).bind(...i.scope==="month"?[t,i.month_key,i.id,t,s]:[t,i.id,t,s]),m=e.prepare("DELETE FROM quick_shortcut_expenses WHERE owner_id=?"+c+p).bind(...i.scope==="month"?[t,i.month_key,i.id,t,s]:[t,i.id,t,s]),x=e.prepare("DELETE FROM quick_reset_challenges WHERE id=? AND owner_id=? AND confirmation_nonce=?").bind(i.id,t,s),y=await e.batch([d,l,m,x]);if(y.length!==4||y[0]?.meta?.changes!==1||y[3]?.meta?.changes!==1)throw new w("Confirmation already used, expired or data changed",409);return Ie({reset:!0,scope:i.scope,monthKey:i.month_key,cleared:r,shortcutAuthorizationRevoked:!1,accountsRetained:!0,externalBankBalancesUnaffected:!0})}var L=new TextEncoder,bt=new Set(["fcm.googleapis.com","updates.push.services.mozilla.com","push.services.mozilla.com","web.push.apple.com"]),S=class extends Error{constructor(o,n=422){super(o);this.status=n}};function E(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function N(e){if(typeof e!="string"||e.length<50||e.length>2048)throw new S("Invalid push endpoint");let t;try{t=new URL(e)}catch{throw new S("Invalid push endpoint")}let o=t.hostname.toLowerCase();if(t.protocol!=="https:"||t.port||t.username||t.password||t.search||t.hash||t.pathname==="/"||!(bt.has(o)||o.endsWith(".push.apple.com")))throw new S("Unrecognized push provider");return t.href}function B(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new S("Expected object");let o=e;if(Object.keys(o).some(n=>!t.includes(n)))throw new S("Unsupported field");return o}function z(e){let t="";for(let o of e)t+=String.fromCharCode(o);return btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}async function U(e){return z(new Uint8Array(await crypto.subtle.digest("SHA-256",L.encode(e))))}function O(e){return e.ALLOW_WRITES==="true"&&e.ALLOW_PUSH_SUBSCRIPTIONS==="true"&&/^[a-zA-Z0-9_-]{86,88}$/.test(e.VAPID_PUBLIC_KEY??"")&&!!e.VAPID_PRIVATE_JWK&&!!e.VAPID_SUBJECT?.startsWith("mailto:")}function Pe(e){return E({enabled:O(e),publicKey:O(e)?e.VAPID_PUBLIC_KEY:null,dailyTime:"20:30",timezone:"America/Bogota",deliveryEnabled:e.ALLOW_PUSH_SEND==="true"})}async function De(e,t,o,n){if(!O(o))return E({error:"Notifications not configured"},503);let i=B(n,["endpoint","confirmed"]);if(i.confirmed!==!0)throw new S("Explicit opt-in required");let a=N(i.endpoint),r=await U(a),s=await e.prepare("SELECT endpoint_hash FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?").bind(t,r).first(),c=await e.prepare("SELECT COUNT(*) AS n FROM quick_push_subscriptions WHERE owner_id=?").bind(t).first();return!s&&(c?.n??0)>=5?E({error:"Five devices maximum"},409):(await e.prepare("INSERT INTO quick_push_subscriptions(owner_id,endpoint_hash,endpoint,created_at) VALUES(?,?,?,?) ON CONFLICT(owner_id,endpoint_hash) DO UPDATE SET endpoint=excluded.endpoint RETURNING endpoint_hash").bind(t,r,a,new Date().toISOString()).first(),E({subscribed:!0,replayed:!!s},s?200:201))}async function Re(e,t,o){let n=B(o,["endpoint"]),i=await U(N(n.endpoint)),a=await e.prepare("SELECT endpoint_hash FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?").bind(t,i).first();return E({registered:!!a})}async function Le(e,t,o){let n=B(o,["endpoint"]),i=await U(N(n.endpoint));return await e.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? RETURNING endpoint_hash").bind(t,i).first(),E({subscribed:!1})}function yt(e){let t=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(e)).map(o=>[o.type,o.value]));return t.year+"-"+t.month+"-"+t.day}async function ze(e,t,o){let n=await crypto.subtle.importKey("jwk",JSON.parse(e.VAPID_PRIVATE_JWK??""),{name:"ECDSA",namedCurve:"P-256"},!1,["sign"]),i=z(L.encode(JSON.stringify({typ:"JWT",alg:"ES256"}))),a=z(L.encode(JSON.stringify({aud:t,exp:Math.floor(o/1e3)+3600,sub:e.VAPID_SUBJECT}))),r=i+"."+a,s=new Uint8Array(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},n,L.encode(r)));return r+"."+z(s)}async function Be(e,t=Date.now(),o=fetch){if(!e.DB||!O(e)||e.ALLOW_PUSH_SEND!=="true")return{sent:0,retired:0,skipped:!0};let n=yt(t),i=await e.DB.prepare("SELECT owner_id,endpoint_hash,endpoint FROM quick_push_subscriptions WHERE last_sent_day IS NULL OR last_sent_day<>? ORDER BY created_at LIMIT 100").bind(n).all(),a=0,r=0;for(let s of i.results){let c;try{c=N(s.endpoint)}catch{continue}let d;try{let p=await ze(e,new URL(c).origin,t);d=await o(c,{method:"POST",headers:{Authorization:"vapid t="+p+", k="+e.VAPID_PUBLIC_KEY,TTL:"3600",Urgency:"normal"}})}catch{continue}if(d.status===404||d.status===410){await e.DB.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? RETURNING endpoint_hash").bind(s.owner_id,s.endpoint_hash).first(),r++;continue}d.ok&&(await e.DB.prepare("UPDATE quick_push_subscriptions SET last_sent_day=? WHERE owner_id=? AND endpoint_hash=? AND (last_sent_day IS NULL OR last_sent_day<>?) RETURNING endpoint_hash").bind(n,s.owner_id,s.endpoint_hash,n).first(),a++)}return{sent:a,retired:r,skipped:!1}}async function Ue(e,t,o,n,i=Date.now(),a=fetch){if(!O(o))return E({error:"Push is not configured"},503);let r=B(n,["endpoint","confirmed"]);if(r.confirmed!==!0)throw new S("Explicit test confirmation required");let s=N(r.endpoint),c=await U(s),d=await e.prepare("SELECT endpoint,last_test_at FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=?").bind(t,c).first();if(!d||d.endpoint!==s)return E({error:"Authorize this device before testing"},403);let p=new Date(i-6e5).toISOString(),l=new Date(i).toISOString();if(!await e.prepare("UPDATE quick_push_subscriptions SET last_test_at=? WHERE owner_id=? AND endpoint_hash=? AND (last_test_at IS NULL OR last_test_at<=?) RETURNING endpoint_hash").bind(l,t,c,p).first())return E({error:"Wait 10 minutes between tests"},429);try{let x=await ze(o,new URL(s).origin,i),y=await a(s,{method:"POST",headers:{Authorization:"vapid t="+x+", k="+o.VAPID_PUBLIC_KEY,TTL:"3600",Urgency:"normal"}});return y.status===404||y.status===410?(await e.prepare("DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint_hash=? RETURNING endpoint_hash").bind(t,c).first(),E({error:"Subscription expired; re-enable notifications"},409)):y.ok?E({providerAccepted:!0,deliveryConfirmed:!1}):E({error:"Push provider did not accept the test"},502)}catch{return E({error:"Unable to contact push provider"},502)}}var P=class extends Error{constructor(t){super(t),this.name="ImportMappingError"}},Fe=100;function vt(e){for(let[t,o]of[["postedAt",e.postedAt],["description",e.description],["amount",e.amount]])if(!o.trim())throw new P(`Mapping for ${t} is required`)}function _(e,t){if(!t)return null;let o=e[t];return o==null?null:String(o).trim()}function xt(e,t){return e&&e.startsWith("=")?`active_content_not_allowed:${t}`:null}function je(e,t){if(vt(t),e.length===0)throw new P("At least one import row is required");if(e.length>Fe)throw new P(`Preview is limited to ${Fe} rows`);let o=e.map((i,a)=>{let r=_(i,t.postedAt),s=_(i,t.description),c=_(i,t.amount),d=_(i,t.direction)?.toLowerCase()??null,p=_(i,t.currency),l=_(i,t.externalId),m=[];r||m.push("missing:postedAt"),s||m.push("missing:description"),c||m.push("missing:amount");let x=d==="credit"||d==="debit"?d:null;d&&x===null&&m.push("invalid:direction");for(let[v,T]of[[r,"postedAt"],[s,"description"],[c,"amount"],[p,"currency"],[l,"externalId"]]){let Q=xt(v,T);Q&&m.push(Q)}let y=Object.freeze({postedAt:r,rawDescription:s,amount:c,direction:x,currency:p?p.toUpperCase():null,externalId:l});return Object.freeze({rowIndex:a,status:m.length===0?"ready":"needs_attention",issues:Object.freeze(m),candidate:y})}),n=o.filter(i=>i.status==="ready").length;return Object.freeze({rows:Object.freeze(o),readyCount:n,attentionCount:o.length-n,persistenceAllowed:!1,requiresUserConfirmation:!0})}var g=class extends Error{constructor(o,n=422){super(o);this.status=n}},wt=new Set(["debit_card","credit_card","bank_transfer"]),kt=new Set(["rows","mapping","bankLabel","paymentMethod","selectedIndices","confirmed"]),Ct=/^\d{4}-\d{2}-\d{2}$/;function K(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}})}function Et(e){if(!e||typeof e!="object"||Array.isArray(e))throw new g("Expected import data");let t=e;if(Object.keys(t).some(r=>!kt.has(r)))throw new g("Unexpected import field");if(!Array.isArray(t.rows)||t.rows.length<1||t.rows.length>50)throw new g("CSV import must contain 1\u201350 rows");let o=t.rows.map(r=>{if(!r||typeof r!="object"||Array.isArray(r))throw new g("Invalid CSV row");let s=r,c=Object.keys(s);if(c.length<3||c.length>12||c.some(d=>d.length<1||d.length>80||/[\u0000-\u001f]/.test(d)))throw new g("Invalid CSV headers");for(let d of Object.values(s))if(typeof d!="string"||d.length>260||/[\u0000-\u001f\u007f]/.test(d))throw new g("Invalid CSV cell");return s}),n=t.mapping;if(!n||typeof n!="object"||Array.isArray(n))throw new g("Column mapping required");let i=n;if(Object.keys(i).some(r=>!["postedAt","description","amount","direction","currency","externalId"].includes(r)))throw new g("Unsupported column mapping");for(let r of["postedAt","description","amount","direction"])if(typeof i[r]!="string"||!i[r].length||!Object.prototype.hasOwnProperty.call(o[0],i[r]))throw new g("Map date, concept, amount and debit/credit columns");for(let r of["currency","externalId"])if(i[r]!==void 0&&(typeof i[r]!="string"||!Object.prototype.hasOwnProperty.call(o[0],i[r])))throw new g("Invalid optional mapping");if(typeof t.bankLabel!="string"||!t.bankLabel.trim()||t.bankLabel.trim().length>80||/[\u0000-\u001f]/.test(t.bankLabel))throw new g("Choose the bank shown on the statement");if(typeof t.paymentMethod!="string"||!wt.has(t.paymentMethod))throw new g("Choose a supported statement payment method");let a=t.selectedIndices;if(a!==void 0&&(!Array.isArray(a)||a.length<1||a.length>50||new Set(a).size!==a.length||a.some(r=>!Number.isSafeInteger(r)||r<0||r>=o.length)))throw new g("Invalid row selection");return{rows:o,mapping:i,bankLabel:t.bankLabel.trim(),method:t.paymentMethod,selected:a===void 0?null:a}}function St(e){if(!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(e))return null;let[t,o=""]=e.split("."),n=Number(t)*100+Number(o.padEnd(2,"0"));return n>0&&n<=1e12&&Number.isSafeInteger(n)?n:null}function It(e){if(!Ct.test(e))return!1;let t=new Date(e+"T12:00:00Z");if(!Number.isFinite(t.getTime())||t.toISOString().slice(0,10)!==e)return!1;let o=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date);return e>="2000-01-01"&&t.getTime()<=Date.now()+864e5&&e<=o}async function At(e){let t=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e)));return"import_"+Array.from(t,n=>n.toString(16).padStart(2,"0")).join("")}async function qe(e){let t=Et(e),o=je(t.rows,t.mapping),n=[],i=[];for(let a of o.rows){let r=a.candidate,s=[...a.issues],c=r.postedAt||"",d=r.amount||"",p=(r.rawDescription||"").trim(),l=St(d);if(It(c)||s.push("Fecha: usa AAAA-MM-DD de una fecha pasada"),l||s.push("Monto: COP positivo, sin separadores de miles"),(p.length<1||p.length>120)&&s.push("Concepto no v\xE1lido"),r.direction!=="debit"&&s.push("No es un d\xE9bito confirmado"),r.currency&&r.currency!=="COP"&&s.push("Moneda diferente de COP"),s.length){i.push({index:a.rowIndex,issues:s});continue}let m=r.externalId?.trim()||[c,p.toLowerCase(),l].join("|"),x=await At([t.bankLabel.toLowerCase(),t.method,m].join("|"));n.push({index:a.rowIndex,date:c,concept:p,minor:l,clientId:x,id:crypto.randomUUID()})}return{input:t,candidates:n,issues:i}}async function We(e,t,o){let n=[],i=[];for(let a of o){let r=await e.prepare("SELECT id FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=?").bind(t,a.clientId).first(),s=await e.prepare("SELECT id FROM (SELECT id,amount_minor,merchant,occurred_at FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL UNION ALL SELECT id,amount_minor,merchant,occurred_at FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL) WHERE amount_minor=? AND lower(trim(merchant))=? AND substr(datetime(occurred_at,'-5 hours'),1,10)=? LIMIT 1").bind(t,t,a.minor,a.concept.toLowerCase(),a.date).first();r||s?i.push(a.index):n.push(a)}return{ready:n,duplicates:i}}async function He(e,t,o){let{candidates:n,issues:i}=await qe(o),{ready:a,duplicates:r}=await We(e,t,n);return K({format:"CSV",stored:!1,requiresConfirmation:!0,total:i.length+n.length,ready:a.map(s=>({index:s.index,date:s.date,concept:s.concept,amountCOP:(s.minor/100).toFixed(2)})),skipped:i,possibleDuplicates:r})}async function Ge(e,t,o){let n=o;if(!n||n.confirmed!==!0)throw new g("Explicit confirmation required");let{input:i,candidates:a,issues:r}=await qe(n),s=i.selected;if(!s||s.length<1)throw new g("Choose previewed rows");if(s.some(v=>r.some(T=>T.index===v)))throw new g("Invalid rows cannot be imported");let c=a.filter(v=>s.includes(v.index));if(c.length!==s.length)throw new g("Selected row no longer valid");let{ready:d,duplicates:p}=await We(e,t,c);if(d.length===0)return K({inserted:0,duplicates:p.length,confirmed:!0});if(!e.batch)throw new g("Atomic D1 batch unavailable",503);let l=new Date().toISOString(),m=d.map(v=>e.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at) VALUES(?,?,?,?,'COP',?,'purchase',?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING").bind(v.id,t,v.clientId,v.minor,i.method,v.date+"T17:00:00.000Z",v.concept,i.bankLabel,l)),y=(await e.batch(m)).reduce((v,T)=>v+(T.meta?.changes??0),0);return K({inserted:y,duplicates:p.length+d.length-y,confirmed:!0})}var Mt=/^fosq_[0-9a-f]{64}$/,_t=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,Tt=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),Ot=new Set(["debit_card","credit_card","bank_transfer"]),f=class extends Error{constructor(o,n=422){super(o);this.status=n}};function k(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function j(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new f("JSON object required");let o=e;if(Object.keys(o).some(n=>!t.includes(n)))throw new f("Unsupported field");return o}function F(e,t,o){if(typeof e!="string")throw new f(o+" must be text");let n=e.trim();if(!n||n.length>t||/[\u0000-\u001f\u007f]/.test(n))throw new f(o+" is invalid");return n}function Nt(e,t,o){return e==null||e===""?null:F(e,t,o)}async function Pt(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new f("Content-Type must be application/json",415);let t=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(t)||t<0||t>4096)throw new f("Body too large",413);let o=await e.text();if(o.length>4096)throw new f("Body too large",413);try{return JSON.parse(o)}catch{throw new f("Invalid JSON")}}function Dt(){let e=crypto.getRandomValues(new Uint8Array(32));return"fosq_"+Array.from(e,t=>t.toString(16).padStart(2,"0")).join("")}async function Ke(e){let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return Array.from(new Uint8Array(t),o=>o.toString(16).padStart(2,"0")).join("")}function $e(e){return Ot.has(e)}async function Qe(e,t,o){let n=j(o,["label","confirmed"]);if(n.confirmed!==!0)throw new f("Enrollment confirmation required");let i=F(n.label,50,"Device label"),a=Dt(),r=new Date(Date.now()+90*864e5).toISOString(),s=crypto.randomUUID();return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),t).all(),await e.prepare("INSERT INTO quick_shortcut_devices(id,owner_id,token_hash,label,expires_at) VALUES(?,?,?,?,?) RETURNING id").bind(s,t,await Ke(a),i,r).first(),k({deviceId:s,token:a,expiresAt:r},201)}async function Je(e,t){let o=await e.prepare("SELECT id,label,expires_at FROM quick_shortcut_devices WHERE owner_id=? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 5").bind(t).all();return k({devices:o.results})}async function Ye(e,t,o){if(j(o,["confirmed"]).confirmed!==!0)throw new f("Revocation confirmation required");return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),t).all(),k({revoked:!0})}function Ve(e,t){return e.amount_minor!==t.amountMinor||e.currency!=="COP"||e.payment_method!==t.paymentMethod||e.kind!==t.kind||e.merchant!==t.merchant||e.bank_label!==t.bankLabel?k({error:"Entry idempotency key reused with different data"},409):k({entryId:e.id,replayed:!0})}async function Ze(e,t,o){if(!t.ACCESS_AUD||o.access?.aud!==t.ACCESS_AUD)return k({error:"Cloudflare Access required"},401);if(t.ALLOW_WRITES!=="true"||t.ALLOW_SHORTCUT_WRITES!=="true")return k({error:"Direct shortcuts disabled"},503);let n=e.headers.get("Authorization")??"",i=n.startsWith("Bearer ")?n.slice(7):"";if(!Mt.test(i))return k({error:"Device authorization required"},401);let a=await t.DB.prepare("SELECT owner_id FROM quick_shortcut_devices WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? LIMIT 1").bind(await Ke(i),new Date().toISOString()).first();if(!a)return k({error:"Device authorization expired or revoked"},401);let r=j(await Pt(e),["clientEntryId","amount","concept","paymentMethod","bankLabel"]);return et(t.DB,a.owner_id,r)}async function Xe(e,t,o){let n=j(o,["clientEntryId","amount","concept","paymentMethod","bankLabel","confirmed"]);if(n.confirmed!==!0)throw new f("Expense confirmation required");return et(e,t,n)}async function et(e,t,o){let n=F(o.clientEntryId,96,"clientEntryId");if(!_t.test(n))throw new f("Invalid clientEntryId");let i=F(o.concept,120,"Concept");if(typeof o.amount!="string")throw new f("Amount must be text");let a=o.paymentMethod;if(typeof a!="string"||!Tt.has(a))throw new f("Invalid payment method");let r=Nt(o.bankLabel,80,"Bank");if($e(a)&&!r||!$e(a)&&r!==null)throw new f("Bank is required for cards/transfers only");let s=R({tenantId:t,actorId:t,clientEntryId:n,amount:o.amount,currency:"COP",paymentMethod:a,classification:"expense",occurredAt:new Date().toISOString(),merchant:i,...r===null?{}:{bankLabel:r}}),c=Number(s.money.amountMinor);if(!Number.isSafeInteger(c))throw new f("Invalid amount");let d={ownerId:t,clientEntryId:n,amountMinor:c,paymentMethod:s.paymentMethod,kind:s.kind,merchant:s.merchant,bankLabel:s.bankLabel},p=await e.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(d.ownerId,n).first();if(p)return Ve(p,d);let l=await e.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),d.ownerId,n,c,"COP",s.paymentMethod,s.kind,s.occurredAt,s.merchant,s.bankLabel).first();if(l)return k({entryId:l.id,replayed:!1},201);let m=await e.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(d.ownerId,n).first();return m?Ve(m,d):k({error:"Unable to verify write"},503)}function tt(e){return e instanceof f?k({error:e.message},e.status):e instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(e.message)?k({error:"Invalid financial entry"},422):k({error:"Unable to process request"},500)}var Rt=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,Lt=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/,zt=new Set(["cash","bank_manual","credit_manual","wallet_manual"]),h=class extends Error{constructor(o,n=422){super(o);this.status=n}};function u(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function C(e,t){let o=t==="text/html"?"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; manifest-src 'self'; img-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'":"default-src 'none'; frame-ancestors 'none'";return new Response(e,{status:200,headers:{"Content-Type":t+"; charset=utf-8","Cache-Control":"no-store, private","Content-Security-Policy":o,"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"}})}function nt(e,t,o){if(typeof e!="string")throw new h(t+" is invalid");let n=e.trim();if(!n||n.length>o||/[\u0000-\u001f\u007f]/.test(n))throw new h(t+" is invalid");return n}function Bt(e,t,o){return e==null||e===""?null:nt(e,t,o)}function Ut(e,t){if(typeof e!="string"||!Rt.test(e))throw new h(t+" is invalid");return e}function Ft(e,t){if(typeof e!="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))throw new h(t+" must be a UUID");return e.toLowerCase()}function ot(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new h("Expected a JSON object");let o=e;for(let n of Object.keys(o))if(!t.includes(n))throw new h("Unsupported field: "+n);return o}async function jt(e,t=4096){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new h("Content-Type must be application/json",415);let o=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(o)||o<0||o>t)throw new h("Request body exceeds limit",413);let n=await e.text();if(n.length>t)throw new h("Request body exceeds limit",413);try{return JSON.parse(n)}catch{throw new h("Invalid JSON")}}function qt(e){let t=new URL(e.url);if(e.headers.get("Origin")!==t.origin)throw new h("Same-origin request required",403);let o=e.headers.get("Sec-Fetch-Site");if(o&&o!=="same-origin")throw new h("Cross-site request denied",403)}async function Wt(e,t){if(!e.access||!t.ACCESS_AUD||e.access.aud!==t.ACCESS_AUD)return null;try{let o=await e.access.getIdentity(),n=o?.user_uuid??o?.id;return typeof n=="string"&&Lt.test(n)?n:null}catch{return null}}async function Ht(e,t){let o=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? ORDER BY created_at DESC LIMIT 100").bind(t).all();return u({accounts:o.results})}async function Gt(e,t,o){let n=ot(o,["clientAccountId","label","accountKind","currency","bankLabel"]),i=Ut(n.clientAccountId,"clientAccountId"),a=nt(n.label,"label",100),r=n.accountKind;if(typeof r!="string"||!zt.has(r))throw new h("Invalid manual account kind");if(n.currency!=="COP"&&n.currency!=="USD")throw new h("Only COP and USD are supported");let s=n.currency,c=Bt(n.bankLabel,"bankLabel",80),d=crypto.randomUUID(),p=await e.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency,bank_label) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_account_id) DO NOTHING RETURNING id").bind(d,t,i,a,r,s,c).first();if(p)return u({accountId:p.id,replayed:!1},201);let l=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? AND client_account_id=?").bind(t,i).first();return l?l.label!==a||l.account_kind!==r||l.currency!==s||l.bank_label!==c?u({error:"Account idempotency key was already used for different data"},409):u({accountId:l.id,replayed:!0}):u({error:"Account creation could not be confirmed"},503)}async function $t(e,t){let o=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL UNION ALL SELECT id,NULL AS account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL ORDER BY occurred_at DESC,id DESC LIMIT 100").bind(t,t).all();return u({entries:o.results.map(n=>({...n,amount_minor:String(n.amount_minor)}))})}async function Vt(e,t,o,n=!1){let i=ot(o,["accountId","clientEntryId","amount","currency","paymentMethod","classification","occurredAt","merchant","bankLabel","confirmed"]);if(i.confirmed!==!0)throw new h("Explicit confirmation required");let a=Ft(i.accountId,"accountId"),r=R({tenantId:t,actorId:t,clientEntryId:i.clientEntryId,amount:i.amount,currency:i.currency,paymentMethod:i.paymentMethod,classification:i.classification,occurredAt:i.occurredAt,...i.merchant===void 0?{}:{merchant:i.merchant},...i.bankLabel===void 0?{}:{bankLabel:i.bankLabel}}),s=r.paymentMethod==="debit_card"||r.paymentMethod==="credit_card"||r.paymentMethod==="bank_transfer";if(s&&!r.bankLabel)return u({error:"Bank name required for card or bank transfer"},422);if(!s&&r.bankLabel!==null)return u({error:"Bank name only allowed for card or bank transfer"},422);let c=Number(r.money.amountMinor);if(!Number.isSafeInteger(c))throw new h("Amount exceeds supported integer range");if(!await e.prepare("SELECT id FROM quick_manual_accounts WHERE id=? AND owner_id=? AND currency=?").bind(a,t,r.money.currency).first())return u({error:"Manual account unavailable or currency mismatch"},403);let p=await e.prepare("INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),t,a,r.clientEntryId,c,r.money.currency,r.paymentMethod,r.kind,r.occurredAt,r.merchant,r.bankLabel).first();if(p)return u({entryId:p.id,replayed:!1},201);let l=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=?").bind(t,r.clientEntryId).first();return l?l.account_id!==a||l.amount_minor!==c||l.currency!==r.money.currency||l.payment_method!==r.paymentMethod||l.kind!==r.kind||!n&&l.occurred_at!==r.occurredAt||l.merchant!==r.merchant||l.bank_label!==r.bankLabel?u({error:"Entry idempotency key reused with different data"},409):u({entryId:l.id,replayed:!0}):u({error:"Unable to verify write"},503)}async function Kt(e,t,o){let{pathname:n}=new URL(e.url);if(n==="/healthz"&&e.method==="GET")return u({status:"ok",service:"finanzasoss-quick-staging",writesConfigured:t.ALLOW_WRITES==="true",shortcutsConfigured:t.ALLOW_SHORTCUT_WRITES==="true"});let i=new Set(["/","/quick.css","/quick.js","/dashboard","/dashboard.css","/dashboard.js","/dashboard.webmanifest","/dashboard-icon.svg","/dashboard-icon-180.png","/dashboard-sw.js","/studio.js","/budgets.js","/movement-editor.js","/statement-import.js"]).has(n);if(!i&&!n.startsWith("/api/quick/"))return u({error:"Not found"},404);if(n==="/api/quick/shortcut/expense"&&e.method==="POST")try{return await Ze(e,t,o)}catch(r){return tt(r)}let a=await Wt(o,t);if(!a){if(e.method==="GET"&&(n==="/"||n==="/dashboard")&&e.headers.get("Accept")?.includes("text/html")){let r=C('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111b1d"><title>Iniciar sesi\xF3n \xB7 FinanzasOSS</title><style>body{background:#111b1d;color:#edf1ea;font:16px system-ui,sans-serif;min-height:100dvh;display:grid;place-items:center;margin:0;padding:20px;box-sizing:border-box}main{width:min(100%,400px);padding:32px;background:#1d2c2a;border:1px solid #3c5149;border-radius:16px}h1{font-size:26px;margin:0 0 12px}p{color:#cfddd3;line-height:1.6}a{display:block;background:#d8e7da;color:#19352c;padding:15px 20px;border-radius:8px;text-align:center;font-weight:750;margin-top:24px;text-decoration:none}a:focus-visible{outline:3px solid #e1ae8c;outline-offset:4px}</style></head><body><main><h1>FinanzasOSS</h1><p>Tu sesi\xF3n necesita una nueva verificaci\xF3n. Tus gastos y presupuestos siguen guardados.</p><a href="/cdn-cgi/access/login?redirect_url=%2Fdashboard">Iniciar sesi\xF3n de forma segura</a><p>Vuelve a abrir FinanzasOSS desde el icono de tu iPhone despu\xE9s de entrar.</p></main></body></html>',"text/html");return r.headers.set("Content-Security-Policy","default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"),r}return u({error:"Cloudflare Access required"},401)}if(!t.DB)return u({error:"Database not configured"},503);if(e.method==="GET"&&i)return n==="/"?C(Z,"text/html"):n==="/quick.css"?C(X,"text/css"):n==="/quick.js"?C(ee,"application/javascript"):n==="/dashboard"?C(te,"text/html"):n==="/dashboard.css"?C(ne,"text/css"):n==="/dashboard.js"?C(oe,"application/javascript"):n==="/studio.js"?C(re,"application/javascript"):n==="/budgets.js"?C(ie,"application/javascript"):n==="/movement-editor.js"?C(ae,"application/javascript"):n==="/statement-import.js"?C(se,"application/javascript"):n==="/dashboard.webmanifest"?C(ce,"application/manifest+json"):n==="/dashboard-icon.svg"?C(de,"image/svg+xml"):n==="/dashboard-sw.js"?C(pe,"application/javascript"):new Response(Uint8Array.from(atob(le),r=>r.charCodeAt(0)),{headers:{"Content-Type":"image/png","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});try{if(e.method==="POST"){if(t.ALLOW_WRITES!=="true")return u({error:"Staging writes disabled"},503);qt(e);let r=await jt(e,n.startsWith("/api/quick/import/")?85e3:4096);if(n==="/api/quick/accounts")return await Gt(t.DB,a,r);if(n==="/api/quick/entries")return await Vt(t.DB,a,r);if(n==="/api/quick/studio/expense")return await Xe(t.DB,a,r);if(n==="/api/quick/budgets")return await we(t.DB,a,r);if(n==="/api/quick/studio/movement/change")return await Ee(t.DB,a,r);if(n==="/api/quick/push/subscribe")return await De(t.DB,a,t,r);if(n==="/api/quick/push/unsubscribe")return await Le(t.DB,a,r);if(n==="/api/quick/push/status")return await Re(t.DB,a,r);if(n==="/api/quick/push/test")return await Ue(t.DB,a,t,r);if(n==="/api/quick/import/preview")return await He(t.DB,a,r);if(n==="/api/quick/import/commit")return await Ge(t.DB,a,r);if(n==="/api/quick/studio/reset/prepare"||n==="/api/quick/studio/reset/confirm")return t.ALLOW_RESET_WRITES!=="true"||new URL(e.url).hostname!=="finanzasoss-quick-staging.socampoecheverry.workers.dev"?u({error:"Account reset unavailable outside private staging"},403):n.endsWith("/prepare")?await Oe(t.DB,a,r):await Ne(t.DB,a,r);if(n==="/api/quick/shortcut/enroll")return t.ALLOW_SHORTCUT_WRITES!=="true"?u({error:"Direct shortcuts disabled"},503):await Qe(t.DB,a,r);if(n==="/api/quick/shortcut/revoke")return await Ye(t.DB,a,r)}else if(e.method==="GET"){if(n==="/api/quick/profile"){let r=await o.access?.getIdentity();return!r||typeof r.email!="string"||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)?u({error:"Authenticated email unavailable"},401):u({email:r.email,profile:"personal"})}if(n==="/api/quick/accounts")return await Ht(t.DB,a);if(n==="/api/quick/entries")return await $t(t.DB,a);if(n==="/api/quick/dashboard/overview")return await me(t.DB,a);if(n==="/api/quick/budgets")return await xe(t.DB,a);if(n==="/api/quick/studio/capabilities")return ye();if(n==="/api/quick/push/config")return Pe(t);if(n==="/api/quick/dashboard/movements")return await ge(t.DB,a,new URL(e.url));if(n==="/api/quick/shortcut/devices")return await Je(t.DB,a)}return u({error:"Not found"},404)}catch(r){return r instanceof h||r instanceof f||r instanceof w||r instanceof S||r instanceof A||r instanceof b||r instanceof g?u({error:r.message},r.status):r instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(r.message)?u({error:"Invalid financial entry"},422):u({error:"Unable to process request"},500)}}var Po={fetch(e,t,o){return Kt(e,t,o)},async scheduled(e,t){e.cron==="30 1 * * *"&&await Be(t,e.scheduledTime)}};export{Po as default,Kt as handleQuickRequest};
