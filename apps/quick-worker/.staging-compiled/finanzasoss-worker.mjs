var qe=Object.freeze({automaticActivationAllowed:!1,automaticChargingAllowed:!1,paymentProcessorCallsEnabled:!1,pricesMayBeInvented:!1,pendingAssignmentGrantsEntitlements:!1,productionBillingRequiresExplicitAuthorization:!0});function E(e){switch(e){case"purchase":case"fee":case"tax":return"expense";case"income":return"income";case"refund":return"refund";case"transfer":return"internal_transfer";case"investment_transfer":return"investment_flow";case"investment_activity":return"investment_activity";case"debt_payment":return"debt_flow";case"cash_withdrawal":case"cash_deposit":return"cash_movement";case"adjustment":return"neutral";case"unknown":return"unknown"}}var J=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),X=new Set(["expense","own_transfer","investment_transfer"]);function y(e,t,r){if(typeof e!="string")throw new Error(t+" must be text");let n=e.trim();if(!n||n.length>r||/[\u0000-\u001f\u007f]/.test(n))throw new Error(t+" is invalid");return n}function S(e,t,r){return e==null||e===""?null:y(e,t,r)}function ee(e){if(typeof e!="string"||!/^(?:0|[1-9][0-9]{0,10})(?:\.[0-9]{1,2})?$/.test(e))throw new Error("Amount must be an ungrouped decimal with at most two fractional digits");let t=e.split("."),r=t[0],n=(t[1]??"").padEnd(2,"0"),a=BigInt(r)*100n+BigInt(n||"0");if(a<=0n||a>1000000000000n)throw new Error("Amount must be positive and within the permitted limit");return a}function te(e){if(typeof e!="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{3})?Z$/.test(e))throw new Error("occurredAt must be canonical UTC");let t=new Date(e);if(Number.isNaN(t.getTime())||(e.endsWith(".000Z")?t.toISOString()!==e:t.toISOString().replace(".000Z","Z")!==e))throw new Error("occurredAt is invalid");return e}function v(e){if(e===null||typeof e!="object"||Array.isArray(e))throw new Error("Quick entry input must be an object");let t=y(e.tenantId,"tenantId",128),r=y(e.actorId,"actorId",128),n=y(e.clientEntryId,"clientEntryId",96);if(!/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(n))throw new Error("clientEntryId must be a stable, caller-generated idempotency key");if(e.currency!=="COP"&&e.currency!=="USD")throw new Error("Only explicitly supported currencies COP and USD are allowed");if(!J.has(e.paymentMethod))throw new Error("Payment method is not supported");if(!X.has(e.classification))throw new Error("Classification must be explicitly selected");let a=e.classification==="expense"?"purchase":e.classification==="own_transfer"?"transfer":"investment_transfer",i=Object.freeze({amountMinor:ee(e.amount),currency:e.currency});return Object.freeze({tenantId:t,actorId:r,clientEntryId:n,money:i,occurredAt:te(e.occurredAt),paymentMethod:e.paymentMethod,bankLabel:S(e.bankLabel,"bankLabel",80),merchant:S(e.merchant,"merchant",120),classification:e.classification,kind:a,economicClass:E(a),direction:"debit",sourceType:"manual",requiresUserConfirmation:!0,persistenceEnabled:!1,accountSelectionRequiredBeforePosting:!0})}var T=`<!doctype html>
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
</body></html>`,_='.dash-shortcut{display:inline-flex;align-items:center;gap:.4rem;text-decoration:none;border:1px solid #38574d;color:#a9f4d6;padding:.6rem .85rem;border-radius:10px;font-weight:750;font-size:12px;white-space:nowrap}.dash-shortcut:hover{background:#15352a}.top{flex-wrap:wrap;gap:10px} :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#16242c;background:#f4f3f0;font-synthesis:none}*{box-sizing:border-box}body{margin:0}.shell{max-width:820px;margin:0 auto;padding:0 24px 52px}.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d3d6d3;padding:25px 0 22px;gap:12px}.brand{display:flex;align-items:center;gap:10px;font-size:14px;letter-spacing:.075em;font-weight:800}.brand-light{font-weight:450;color:#6a7c83}.brand-icon{display:grid;place-content:center;height:35px;width:35px;border-radius:7px;background:#16242c;color:#fff;font-size:19px;letter-spacing:-.08em}.brand-icon span{color:#8cf0bb}.env{display:flex;align-items:center;gap:7px;border:1px solid #cbd6d1;border-radius:4px;padding:8px 10px;color:#53665c;font-size:10px;font-weight:750;letter-spacing:.065em;white-space:nowrap}.env-dot{height:7px;width:7px;border-radius:50%;background:#53b585}.intro{padding:50px 0 20px}.eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#6e8b7b}.intro h1{font-size:clamp(36px,7vw,60px);letter-spacing:-.065em;line-height:1.06;margin:14px 0 12px;font-weight:780}.intro em{font-style:normal;color:#478c68}.intro p{font-size:14px;line-height:1.65;max-width:440px;color:#63747a}.warning{display:flex;gap:12px;background:#edf2ea;border:1px solid #d3dfd1;padding:13px 16px;font-size:12px;line-height:1.5;color:#416147;margin:16px 0 26px;border-radius:4px}.warning>span:first-child{font-size:13px}.panel{background:#fff;border:1px solid #d9deda;border-radius:7px;padding:29px;margin-bottom:16px;box-shadow:0 4px 18px rgba(18,36,27,.025)}.panel.compact{padding:25px 29px}.panel-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:23px}.panel h2,.history h2{font-size:21px;letter-spacing:-.035em;margin:6px 0 0;font-weight:720}.pill{background:#f2f3f0;color:#73817c;font-size:10px;border:1px solid #dfe4e0;border-radius:4px;padding:7px 9px;white-space:nowrap}.pill.enabled{color:#287d4b;background:#e8f6ec;border-color:#c4e4cf}.field-label{display:block;font-size:11px;letter-spacing:.03em;font-weight:720;margin-bottom:9px;color:#3b4c50}.amount-field{height:78px;display:flex;align-items:center;border-bottom:2px solid #1e3c32;gap:12px;margin-bottom:8px}.amount-field>span{font-size:30px;font-weight:500;color:#4d6858}.amount-field input{border:0;outline:0;flex:1;min-width:0;font-size:44px;letter-spacing:-.05em;font-weight:750;font-variant-numeric:tabular-nums;padding:0;background:transparent;color:#16242c}.amount-field small{font-size:12px;color:#7b8982;letter-spacing:.06em}.hint{font-size:11px;line-height:1.5;color:#82918c}.grid-fields{display:grid;grid-template-columns:1fr 1fr;gap:22px 17px;margin-top:29px}input:not(.amount-field input),select{display:block;width:100%;height:45px;border:1px solid #d8dfda;border-radius:4px;padding:10px 11px;color:#253730;background:#fafbf8;font-size:13px;font:inherit;outline-offset:3px}input:focus,select:focus{border-color:#5aa078}.submit-zone{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #e8ebe7;padding-top:24px;margin-top:25px}.submit-zone .hint{max-width:260px}button{border:0;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:space-between;gap:20px;font-size:13px;font-weight:750;transition:transform .12s,background .12s}button:not(:disabled):active{transform:translateY(1px)}button:disabled{cursor:not-allowed;opacity:.5}button[type=submit]:not(.secondary){min-height:46px;color:#fff;background:#1d4b37;padding:12px 18px}button[type=submit]:not(.secondary):hover:not(:disabled){background:#28704e}.account-row{display:flex;align-items:end;gap:12px}.account-row>.grow{flex:1}.account-row>div:last-child{width:155px}.secondary{min-height:43px;padding:10px 14px;border:1px solid #cbd6cf;background:#e9f2ed;color:#285b3e;margin-top:17px}.subline{font-size:12px;color:#738078;margin:-14px 0 18px}.feedback{min-height:0;font-size:12px;line-height:1.55;margin-top:12px}.feedback:empty{display:none}.feedback.error{color:#ae3e3e}.feedback.good{color:#217448}.history{padding:27px 5px 15px;margin-bottom:8px}.history .panel-title{padding:0 3px}.mini{font-size:11px;color:#37674d;background:transparent;padding:9px 3px}.history-body{border-top:1px solid #d7ddd8}.entry-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:17px 4px;border-bottom:1px solid #e0e4df}.entry-description{font-size:13px;font-weight:720}.entry-meta{font-size:11px;color:#728079;margin-top:5px}.entry-amount{font-size:15px;font-weight:760;font-variant-numeric:tabular-nums;white-space:nowrap}.empty{padding:24px 4px;color:#89968e;font-size:13px}footer{text-align:center;border-top:1px solid #d7ded7;padding:24px 0;color:#96a19a;font-size:9px;letter-spacing:.1em}@media(max-width:560px){.shell{padding:0 18px 30px}.intro{padding:32px 0 13px}.intro h1{font-size:45px}.panel,.panel.compact{padding:21px 18px}.grid-fields{grid-template-columns:1fr 1fr;gap:18px 11px}.submit-zone{flex-direction:column;align-items:stretch}.submit-zone .hint{max-width:none}button[type=submit]:not(.secondary){width:100%}.amount-field input{font-size:37px}.env{font-size:9px}.account-row{flex-direction:column;align-items:stretch}.account-row>div:last-child{width:100%}}@media(prefers-reduced-motion:reduce){button{transition:none}}.token-once{word-break:break-all;user-select:all;font:12px ui-monospace,monospace;margin-top:12px;color:#285b3e;line-height:1.5}',O=`"use strict";
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
})();`;var D=`<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1016">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FinanzasOSS">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="description" content="Tu espacio financiero privado. Revisa tus gastos diarios, semanales y mensuales.">
<link rel="manifest" href="/dashboard.webmanifest">
<link rel="icon" type="image/svg+xml" href="/dashboard-icon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/dashboard-icon-180.png">
<link rel="stylesheet" href="/dashboard.css">
<title>Panel financiero \xB7 FinanzasOSS</title>
<script src="/dashboard.js" defer><\/script>
</head>
<body>
<div class="app">
  <aside class="sidebar" aria-label="Navegaci\xF3n principal">
    <a href="/dashboard" class="logo" aria-label="FinanzasOSS, inicio">
      <span class="logo-mark" aria-hidden="true">F<span>\u2197</span></span>
      <span class="logo-type">FINANZAS<span>OSS</span><small>PRIVATE STUDIO</small></span>
    </a>
    <div class="side-caption">ESPACIO PERSONAL</div>
    <nav class="side-nav" aria-label="Secciones">
      <a href="#resumen" class="nav-item selected" aria-current="page"><span aria-hidden="true">\u25EB</span> Resumen <i>01</i></a>
      <a href="#movimientos" class="nav-item"><span aria-hidden="true">\u21C4</span> Movimientos</a>
      <a href="#metodos" class="nav-item"><span aria-hidden="true">\u25C9</span> M\xE9todos de pago</a>
      <a href="/" class="nav-item"><span aria-hidden="true">\uFF0B</span> Captura web</a>
    </nav>
    <div class="side-bottom">
      <div class="safe-badge"><span class="live-dot"></span> ACCESO PRIVADO</div>
      <p>Los registros se consultan en vivo. No guardamos tu historial financiero en este dispositivo.</p>
      <div class="build-tag">FINANZASOSS \xB7 BETA</div>
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar">
      <div class="topbar-left"><span class="mobile-symbol" aria-hidden="true">F<span>\u2197</span></span><span>Mi espacio financiero</span><span class="top-slash">/</span><span class="top-muted">Panel</span></div>
      <div class="top-actions">
        <span id="today" class="date-pill">Bogot\xE1</span>
        <button id="reload" class="round-action" type="button" aria-label="Actualizar datos" title="Actualizar">\u21BB</button>
        <span class="profile" aria-label="Cuenta privada">SO</span>
      </div>
    </header>
    <main id="resumen" class="main">
      <div class="hero-header">
        <div><div class="eyebrow"><span class="small-spark">\u2726</span> TU PERSPECTIVA FINANCIERA</div><h1>Todo bajo <em>control.</em></h1><p>Una mirada clara a cada peso que sale.</p></div>
        <a href="/" class="capture-link"><span aria-hidden="true">\uFF0B</span> Nuevo movimiento</a>
      </div>
      <div class="period-strip" aria-label="Seleccionar per\xEDodo">
        <div class="period-controls" role="group" aria-label="Per\xEDodo de an\xE1lisis">
          <button type="button" data-period="day" class="period-btn">Hoy</button>
          <button type="button" data-period="week" class="period-btn">Semana</button>
          <button type="button" data-period="month" class="period-btn active" aria-pressed="true">Mes</button>
          <button type="button" data-period="year" class="period-btn">A\xF1o</button>
          <button type="button" data-period="all" class="period-btn">Todo</button>
        </div>
        <span class="period-caption" id="period-label">Cargando per\xEDodo...</span>
      </div>
      <div id="error" class="alert" role="alert" hidden></div>
      <div id="testing" class="testing"><span class="live-dot"></span> ENTORNO STAGING \xB7 Movimientos de prueba, no saldos bancarios reales</div>
      <section class="kpis" aria-label="Indicadores financieros">
        <article class="kpi kpi-main">
          <div class="kpi-label">GASTOS DEL PER\xCDODO <span class="kpi-icon">\u2197</span></div>
          <div class="kpi-number" id="kpi-total" aria-live="polite">\u2014</div>
          <div class="kpi-footer"><span id="kpi-compare" class="delta muted">Calculando...</span><span class="kpi-note">vs. per\xEDodo anterior</span></div>
          <div class="kpi-decoration" aria-hidden="true">\u25CC</div>
        </article>
        <article class="kpi"><div class="kpi-label">MOVIMIENTOS <span class="kpi-icon">\u21C4</span></div><div class="kpi-number" id="kpi-count">\u2014</div><div class="kpi-footer"><span class="kpi-note">Gastos registrados en el per\xEDodo</span></div></article>
        <article class="kpi"><div class="kpi-label">PROMEDIO POR GASTO <span class="kpi-icon">\u25C8</span></div><div class="kpi-number" id="kpi-average">\u2014</div><div class="kpi-footer"><span class="kpi-note">Monto medio de tus registros</span></div></article>
        <article class="kpi"><div class="kpi-label">TOTAL HIST\xD3RICO <span class="kpi-icon">\u25A4</span></div><div class="kpi-number" id="kpi-all">\u2014</div><div class="kpi-footer"><span class="kpi-note" id="all-count">Todos tus gastos en COP</span></div></article>
      </section>
      <section class="analytics">
        <article class="panel trend-panel">
          <div class="panel-heading"><div><div class="panel-eyebrow">01 / TENDENCIAS</div><h2>El ritmo de tus gastos</h2><p id="trend-subtitle">Evoluci\xF3n durante el per\xEDodo</p></div><div class="chart-tag"><span></span> Gasto COP</div></div>
          <div class="chart-wrap"><svg id="trend" role="img" aria-label="Gr\xE1fico de evoluci\xF3n de gastos" viewBox="0 0 800 255" preserveAspectRatio="none">
              <defs><linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#73dfc0" stop-opacity=".28"/><stop offset="100%" stop-color="#73dfc0" stop-opacity="0"/></linearGradient></defs>
              <g id="gridlines"></g><path id="trend-area" fill="url(#trendGradient)"></path><path id="trend-line" fill="none" stroke="#80ebcb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path><g id="trend-dots"></g>
          </svg><div class="chart-ends"><span id="chart-first">\u2014</span><span id="chart-last">\u2014</span></div></div>
          <div class="chart-foot"><span><i class="mint-indicator"></i> Gastos registrados</span><span id="trend-total">\u2014</span></div>
        </article>
        <article id="metodos" class="panel method-panel">
          <div class="panel-heading"><div><div class="panel-eyebrow">02 / DISTRIBUCI\xD3N</div><h2>As\xED est\xE1s pagando</h2><p>M\xE9todos utilizados</p></div></div>
          <div class="donut-area"><div id="donut" class="donut" role="img" aria-label="Distribuci\xF3n del gasto por m\xE9todo de pago"><div class="donut-hole"><span>DISTRIBUIDO</span><strong id="donut-total">\u2014</strong><small>Gastos COP</small></div></div></div>
          <div id="methods" class="methods" aria-live="polite"><p class="empty-small">Cargando...</p></div>
        </article>
      </section>
      <section class="secondary-analytics">
        <article class="panel bars-panel"><div class="panel-heading"><div><div class="panel-eyebrow">03 / ACTIVIDAD</div><h2>Movimiento por d\xEDa</h2><p>\xDAltimos 7 d\xEDas \xB7 horario de Colombia</p></div></div><div id="week-bars" class="week-bars"></div></article>
        <article class="panel insight-panel"><div class="panel-heading"><div><div class="panel-eyebrow">04 / PERSPECTIVA</div><h2>En cifras</h2><p>Lo que registraste hasta ahora</p></div></div><div class="insight-row"><span>D\xEDa con m\xE1s gastos</span><strong id="peak-day">\u2014</strong></div><div class="insight-row"><span>M\xE9todo predominante</span><strong id="top-method">\u2014</strong></div><div class="insight-row"><span>Movimientos en el historial</span><strong id="all-movements">\u2014</strong></div><div class="insight-note">Solo se consideran gastos para los totales; las transferencias propias no se suman como gasto.</div></article>
      </section>
      <section id="movimientos" class="panel history">
        <div class="history-heading"><div><div class="panel-eyebrow">05 / TU HISTORIAL</div><h2>Todos tus movimientos</h2><p>Sin cuentas inventadas. Cada registro, tal como ocurri\xF3.</p></div><div class="history-actions"><span id="history-count" class="history-count">\u2014 movimientos</span><button id="refresh-history" type="button" class="text-button">Actualizar \u21BB</button></div></div>
        <div class="table-wrap"><table aria-label="Historial de movimientos financieros"><thead><tr><th>CONCEPTO</th><th>FECHA</th><th>M\xC9TODO</th><th class="align-right">MONTO</th></tr></thead><tbody id="history-body"><tr><td colspan="4" class="empty-row">Cargando historial...</td></tr></tbody></table></div>
        <div class="history-bottom"><p id="history-status">Mostrando movimientos recientes</p><button type="button" id="load-more" class="more-btn" hidden>Cargar m\xE1s movimientos <span>\u2193</span></button></div>
      </section>
      <footer class="footer"><span>FINANZASOSS <i>\u25CF</i> CONTROLA TU DINERO CON CLARIDAD</span><span>Datos privados \xB7 America/Bogota \xB7 COP</span></footer>
    </main>
  </div>
  <nav class="mobile-bottom" aria-label="Navegaci\xF3n m\xF3vil"><a href="#resumen" class="selected">\u2302<small>Resumen</small></a><a href="#movimientos">\u21C4<small>Actividad</small></a><a href="/" class="mobile-add">\uFF0B<small>Registrar</small></a><a href="#metodos">\u25C9<small>M\xE9todos</small></a></nav>
</div>
</body></html>`;var N=`:root{color-scheme:dark;--bg:#080d13;--sidebar:#0b1119;--surface:#101923;--surface2:#141e29;--surface3:#1b2632;--line:#25313d;--line2:#1c2732;--ink:#ecf5f7;--muted:#92a2ad;--subtle:#647784;--mint:#82eac9;--mintdark:#12392f;--lilac:#b6bafa;--gold:#f3c88c;--red:#fb9d9c;--radius:20px;--shadow:0 14px 45px #00000018;font-family:Inter,"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-synthesis:none}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-size:14px;-webkit-font-smoothing:antialiased}button,a{-webkit-tap-highlight-color:transparent}button{font:inherit;cursor:pointer}a{color:inherit;text-decoration:none}button:focus-visible,a:focus-visible{outline:2px solid var(--mint);outline-offset:4px}::selection{background:#73dfc055}button:disabled{opacity:.4;cursor:not-allowed}[hidden]{display:none!important}
.app{min-height:100svh;display:grid;grid-template-columns:244px minmax(0,1fr)}
.sidebar{position:sticky;top:0;height:100svh;padding:32px 17px 21px;background:var(--sidebar);border-right:1px solid #202b35;display:flex;flex-direction:column;gap:26px}
.logo{display:flex;align-items:center;gap:12px;padding:0 10px;letter-spacing:.14em}.logo-mark,.mobile-symbol{width:39px;height:39px;display:grid;place-items:center;border-radius:12px;background:var(--mint);color:#092b26;font-size:24px;font-weight:900;letter-spacing:-.12em;position:relative}.logo-mark span,.mobile-symbol span{font-size:10px;position:absolute;right:6px;top:5px}.logo-type{font-weight:900;font-size:13px;letter-spacing:.13em}.logo-type>span{font-weight:400;color:var(--muted)}.logo-type small{display:block;font-size:9px;letter-spacing:.23em;margin-top:7px;color:#698078}
.side-caption{padding:20px 14px 3px;color:#667988;font-size:10px;font-weight:750;letter-spacing:.2em}.side-nav{display:grid;gap:7px}.nav-item{border-radius:12px;color:#9aa8b3;display:flex;align-items:center;gap:13px;padding:13px 15px;font-size:13px;font-weight:590;transition:background .2s,color .2s}.nav-item>span{font-size:23px;display:inline-grid;width:24px;place-items:center;font-weight:300}.nav-item:hover{background:#17212d;color:#fff}.nav-item.selected{background:#182b30;color:var(--mint)}.nav-item i{margin-left:auto;font-size:10px;font-style:normal;opacity:.7}.side-bottom{margin-top:auto;padding:15px 11px 0}.safe-badge{font-size:9px;letter-spacing:.16em;color:var(--mint);font-weight:850;display:flex;align-items:center;gap:9px}.live-dot{width:7px;height:7px;background:var(--mint);border-radius:100%;box-shadow:0 0 12px #82eac960;display:inline-block;flex-shrink:0}.side-bottom p{font-size:11px;line-height:1.75;color:#657985;max-width:185px}.build-tag{margin-top:18px;padding-top:18px;border-top:1px solid #27323c;color:#627887;font-size:9px;letter-spacing:.13em}
.workspace{min-width:0}.topbar{height:78px;border-bottom:1px solid #1c2730;display:flex;justify-content:space-between;align-items:center;padding:0 clamp(20px,3.4vw,58px)}.topbar-left,.top-actions{display:flex;align-items:center;gap:13px}.topbar-left{font-size:12px;font-weight:650;color:#d2dce1}.top-muted,.top-slash{color:#5c737e}.top-actions{gap:17px}.date-pill{color:#b3c2cb;font-size:11px;white-space:nowrap}.round-action{width:35px;height:35px;border:1px solid #293744;border-radius:12px;background:#121c26;color:var(--mint);font-size:23px}.round-action:hover{background:#1a2c2f}.profile{width:33px;height:33px;border-radius:50%;background:linear-gradient(145deg,#5a7776,#1a3d35);color:#dcfff4;font-size:10px;display:grid;place-items:center;font-weight:800;border:1px solid #48685e}.mobile-symbol{display:none}
.main{max-width:1620px;margin:0 auto;padding:43px clamp(20px,3.4vw,58px) 50px}.hero-header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.eyebrow,.panel-eyebrow{font-size:10px;font-weight:800;letter-spacing:.18em;color:var(--mint)}.small-spark{font-size:17px;margin-right:7px}.hero-header h1{font-weight:700;font-size:clamp(32px,3.7vw,54px);letter-spacing:-.055em;line-height:1.12;margin:14px 0 8px}.hero-header h1 em{font-style:normal;color:var(--mint)}.hero-header p{margin:0;color:#97a9b5;font-size:13px;line-height:1.7}.capture-link{display:flex;align-items:center;gap:12px;background:var(--mint);color:#0b2d27;font-size:12px;font-weight:850;padding:13px 17px;border-radius:11px;box-shadow:0 8px 24px #5af0c914;white-space:nowrap}.capture-link span{font-size:21px;font-weight:400;line-height:14px}.capture-link:hover{background:#b6ffe2}
.period-strip{margin:34px 0 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}.period-controls{display:inline-flex;background:#121b24;border:1px solid var(--line);border-radius:13px;padding:4px;gap:3px}.period-btn{border:0;border-radius:9px;background:transparent;color:#90a4af;font-size:12px;font-weight:650;min-width:62px;padding:11px 13px;transition:background .15s}.period-btn:hover{color:white;background:#24303c}.period-btn.active{background:var(--surface3);color:var(--mint);box-shadow:0 2px 4px #0002}.period-caption{color:#8a9eaa;font-size:12px;text-align:right}.testing{display:flex;align-items:center;gap:10px;font-size:10px;letter-spacing:.06em;font-weight:700;color:#b49d79;background:#352b1d44;border:1px solid #493b2766;border-radius:10px;padding:12px 15px;margin-bottom:19px}.testing .live-dot{background:var(--gold);box-shadow:none}.alert{margin-bottom:20px;padding:14px 16px;background:#3d2028;border:1px solid #78434a;color:#ffcac7;border-radius:12px;line-height:1.6}
.kpis{display:grid;grid-template-columns:1.32fr 1fr 1fr 1fr;gap:14px}.kpi{border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(155deg,#16212d,#101922);min-height:173px;padding:23px 21px 19px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}.kpi-main{background:radial-gradient(ellipse at 130% -50%,#4d917c3b,transparent 65%),linear-gradient(125deg,#17342e,#162129 72%);border-color:#356457}.kpi-decoration{position:absolute;right:-15px;bottom:-74px;font-size:190px;color:#baffdf09;pointer-events:none}.kpi-label{font-size:10px;letter-spacing:.14em;color:#a2b4bc;font-weight:750;display:flex;align-items:center;justify-content:space-between;gap:6px;position:relative;z-index:1}.kpi-main .kpi-label{color:#a7d2c3}.kpi-icon{font-size:21px;color:#7eaba0;font-weight:400;line-height:1}.kpi-number{font-size:clamp(21px,2vw,33px);line-height:1.25;letter-spacing:-.065em;font-weight:800;position:relative;z-index:1;font-variant-numeric:tabular-nums;white-space:nowrap}.kpi-main .kpi-number{color:#aaffde;font-size:clamp(23px,2.15vw,36px)}.kpi-footer{display:flex;gap:8px;align-items:center;flex-wrap:wrap;position:relative;z-index:1}.delta{border-radius:5px;font-size:10px;padding:5px 6px;font-weight:800;white-space:nowrap}.delta.muted{color:#b3c8be;background:#ffffff14}.delta.up{color:#ffc3b9;background:#733a3a66}.delta.down{color:#adf7ce;background:#28644c66}.kpi-note{color:#8b9eaa;font-size:10px;line-height:1.5}
.analytics{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(305px,1fr);gap:16px;margin-top:18px}.panel{border:1px solid var(--line);background:linear-gradient(135deg,#111b25,#101821);border-radius:var(--radius);min-width:0;box-shadow:var(--shadow)}.trend-panel,.method-panel,.bars-panel,.insight-panel{padding:25px 25px 21px}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.panel-eyebrow{font-size:9px;color:#78998e}.panel-heading h2,.history-heading h2{margin:10px 0 7px;font-size:18px;letter-spacing:-.025em;font-weight:750}.panel-heading p,.history-heading p{font-size:11px;color:#8095a1;margin:0;line-height:1.6}.chart-tag{font-size:10px;display:flex;align-items:center;gap:8px;color:#94b5a9;white-space:nowrap;margin-top:25px}.chart-tag span,.mint-indicator{width:7px;height:7px;border-radius:50%;background:var(--mint);display:inline-block}.chart-wrap{width:100%;margin-top:31px}.chart-wrap svg{display:block;width:100%;height:225px;overflow:visible}.chart-ends{display:flex;justify-content:space-between;color:#68808c;font-size:10px;font-weight:650;padding:3px 4px 0}.chart-foot{border-top:1px solid #29353f;margin-top:24px;padding-top:16px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#91a5b0}.chart-foot span:first-child{display:flex;align-items:center;gap:8px}.chart-foot span:last-child{font-weight:800;color:#d3f9e7}
.method-panel .panel-heading{padding-bottom:5px}.donut-area{display:grid;place-items:center;padding:17px 0 12px}.donut{width:174px;height:174px;border-radius:50%;background:conic-gradient(#203039 0deg 360deg);display:grid;place-items:center;transition:background .3s}.donut-hole{width:128px;height:128px;border-radius:50%;background:#111a23;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 0 4px #141d2655}.donut-hole span{font-size:9px;font-weight:800;letter-spacing:.14em;color:#698d80}.donut-hole strong{font-size:24px;font-weight:800;letter-spacing:-.05em;margin:7px 0}.donut-hole small{color:#859ba5;font-size:10px}.methods{display:grid;gap:13px;margin-top:9px}.method-row{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:10px;font-size:11px;color:#b7c6cb}.method-row i{width:9px;height:9px;border-radius:3px;display:block}.method-row b{font-weight:800;color:#dbe8eb}.empty-small{color:#758b98;text-align:center;font-size:12px}.method-meter{grid-column:2/4;height:4px;border-radius:4px;background:#29343b;overflow:hidden;margin-top:-5px}.method-meter span{display:block;height:100%;border-radius:4px}
.secondary-analytics{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(305px,1fr);gap:16px;margin-top:16px}.week-bars{height:180px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:end;gap:18px;padding:26px 5px 2px}.bar-day{height:100%;display:flex;flex-direction:column;align-items:center;gap:9px;justify-content:flex-end}.bar-value{color:#a1b6be;font-size:10px;white-space:nowrap}.bar-track{width:min(100%,37px);flex:1;position:relative;background:#1e2a35;border-radius:7px;min-height:90px;overflow:hidden}.bar-fill{position:absolute;bottom:0;left:0;right:0;border-radius:7px;background:linear-gradient(0deg,#315d57,#7de4c2);min-height:2px}.bar-day.today .bar-fill{background:linear-gradient(0deg,#468777,#baffde)}.bar-label{color:#92a6b0;font-size:10px;font-weight:700}.insight-panel{display:flex;flex-direction:column}.insight-row{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:17px 0;border-bottom:1px solid #28343e;font-size:12px;color:#95a8b1}.insight-row:first-of-type{margin-top:10px}.insight-row strong{color:#d8e7ea;font-weight:750;text-align:right;max-width:55%;overflow-wrap:anywhere}.insight-note{margin-top:auto;padding-top:18px;color:#708995;font-size:10px;line-height:1.8}
.history{margin-top:16px;padding:26px 26px 0;scroll-margin-top:20px}.history-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.history-heading h2{font-size:20px}.history-actions{display:flex;align-items:center;gap:18px}.history-count{font-size:11px;font-weight:750;background:#21302f;color:#b1e8d4;padding:8px 12px;border-radius:8px;white-space:nowrap}.text-button{border:0;background:none;color:var(--mint);font-size:11px;font-weight:750}.text-button:hover{text-decoration:underline}.table-wrap{margin-top:27px;overflow-x:auto;scrollbar-color:#30424d transparent}table{width:100%;border-collapse:collapse;text-align:left;min-width:480px}th{color:#7e949f;font-weight:800;font-size:9px;letter-spacing:.13em;padding:12px 10px 17px;border-bottom:1px solid #2a3741}td{padding:18px 10px;border-bottom:1px solid #23303a;font-size:12px;color:#97aab2}tr:last-child td{border-bottom:0}.align-right{text-align:right}.history-name{color:#e8f1f0;font-weight:720;font-size:12px}.history-kind{display:block;margin-top:6px;font-size:10px;color:#748f99;font-weight:500}.history-amount{color:#e2f0ec;font-weight:850;white-space:nowrap;font-variant-numeric:tabular-nums}.history-method{color:#b7c4c9}.method-sub{display:block;color:#698692;font-size:10px;margin-top:4px}.method-badge{display:inline-flex;align-items:center;gap:7px}.method-badge i{width:7px;height:7px;background:#7be8c3;border-radius:50%}.empty-row{text-align:center;color:#8199a5;padding:42px 12px}.history-bottom{border-top:1px solid #2a3741;display:flex;justify-content:space-between;align-items:center;min-height:75px;gap:15px}.history-bottom p{font-size:10px;color:#7f94a2}.more-btn{border:1px solid #354841;background:#1b302d;color:#b2f4d8;border-radius:10px;padding:10px 15px;font-size:11px;font-weight:700}.more-btn:hover{background:#25483d}.more-btn span{margin-left:8px}.footer{display:flex;justify-content:space-between;gap:15px;margin-top:33px;color:#596f7e;font-size:9px;letter-spacing:.11em}.footer i{color:var(--mint);font-style:normal;font-size:8px;margin:0 7px}.mobile-bottom{display:none}
@media(max-width:1300px){.app{grid-template-columns:210px minmax(0,1fr)}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{min-height:142px}.kpi-number,.kpi-main .kpi-number{font-size:clamp(24px,3vw,32px)}.analytics,.secondary-analytics{grid-template-columns:minmax(0,1.35fr) minmax(265px,1fr)}}
@media(max-width:970px){.sidebar{display:none}.app{display:block}.topbar{height:70px}.main{max-width:940px}.mobile-symbol{display:grid;width:31px;height:31px;border-radius:9px;font-size:20px}.mobile-symbol span{font-size:8px;top:3px;right:4px}}
@media(max-width:720px){.topbar{height:62px;padding:0 18px}.topbar-left{gap:9px;font-size:11px}.top-slash,.top-muted{display:none}.top-actions{gap:8px}.date-pill{font-size:10px}.profile{width:30px;height:30px}.main{padding:29px 17px calc(110px + env(safe-area-inset-bottom))}.hero-header{align-items:flex-start;gap:12px}.hero-header h1{font-size:35px;margin:11px 0 7px}.hero-header p{font-size:12px}.eyebrow{font-size:9px}.capture-link{display:none}.period-strip{margin:25px 0 17px;display:block}.period-controls{width:100%;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px}.period-btn{min-width:0;padding:10px 3px;font-size:11px}.period-caption{display:block;text-align:left;margin-top:13px}.testing{font-size:9px;line-height:1.7;padding:10px}.kpis{gap:10px}.kpi{min-height:133px;padding:16px 13px;border-radius:15px}.kpi-label{font-size:8px;letter-spacing:.1em}.kpi-icon{font-size:18px}.kpi-number,.kpi-main .kpi-number{font-size:clamp(19px,5.2vw,28px)}.kpi-note,.delta{font-size:9px}.kpi-footer{gap:4px}.analytics,.secondary-analytics{grid-template-columns:minmax(0,1fr);gap:12px;margin-top:12px}.trend-panel,.method-panel,.bars-panel,.insight-panel{padding:19px 17px 18px;border-radius:16px}.panel-heading h2{font-size:17px}.chart-wrap{margin-top:22px}.chart-wrap svg{height:190px}.chart-foot{margin-top:18px}.chart-tag{margin-top:26px;font-size:9px}.method-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:10px;align-items:center}.method-panel .panel-heading{grid-column:1/-1}.donut{width:min(36vw,155px);height:min(36vw,155px)}.donut-hole{width:74%;height:74%}.donut-hole strong{font-size:18px}.donut-hole span{font-size:7px}.donut-area{padding:16px 0}.methods{gap:10px}.method-row{font-size:10px;gap:7px}.week-bars{gap:9px}.history{padding:20px 17px 0;border-radius:16px;margin-top:12px;scroll-margin-top:18px}.history-heading{display:block}.history-heading h2{margin-top:9px}.history-actions{margin-top:14px;justify-content:space-between}.history-count{font-size:10px}.table-wrap{margin-top:17px}.history-bottom{min-height:65px}.more-btn{font-size:10px}.footer{display:grid;font-size:8px;line-height:1.5}.mobile-bottom{display:flex;position:fixed;left:0;right:0;bottom:0;background:#0d151df5;backdrop-filter:blur(16px);border-top:1px solid #293943;justify-content:space-around;align-items:center;height:calc(67px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);z-index:99}.mobile-bottom a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:65px;height:57px;color:#7f929d;font-size:24px;font-weight:300}.mobile-bottom a small{font-size:9px;font-weight:650}.mobile-bottom a.selected{color:var(--mint)}.mobile-bottom a.mobile-add{color:#99f5d2}}
@media(max-width:355px){.kpi-number,.kpi-main .kpi-number{font-size:18px}.topbar-left{font-size:10px}.date-pill{display:none}.method-panel{display:block}.donut{width:160px;height:160px}.methods{max-width:300px;margin:8px auto}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation:none!important;transition:none!important}}
`;var P=`(() => {
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
  const COLORS = ["#82eac9", "#b1b4fb", "#e9c28f", "#78b6ee", "#f19caa", "#9fbf9a"];
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
      cell.colSpan = 4;
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
      method.textContent = LABELS[x.payment_method] || "Otro";
      if (x.bank_label) {
        const bank = document.createElement("small");
        bank.className = "method-sub";
        bank.textContent = x.bank_label;
        method.appendChild(bank);
      }
      const amount = document.createElement("strong");
      amount.className = "history-amount";
      amount.textContent = (x.kind === "purchase" ? "\u2212 " : "\u2194 ") +
        (x.currency === "COP" ? asCOP(x.amount_minor) :
          new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD" }).format(Number(x.amount_minor) / 100));
      tr.append(td(desc), td(fmtFull.format(new Date(x.occurred_at))), td(method), td(amount, "align-right"));
      body.appendChild(tr);
    });
    $("history-status").textContent = "Mostrando " + state.history.length.toLocaleString("es-CO") +
      " movimiento(s) \xB7 m\xE1s antiguos al final";
    $("load-more").hidden = !state.hasMore;
  }
  async function fetchJson(url) {
    const r = await fetch(url, { method: "GET", credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" } });
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
      if (overview.excludedUsd) {
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
    navigator.serviceWorker.register("/dashboard-sw.js", { scope: "/dashboard" }).catch(() => {});
  }
  void refresh();
})();`;var R=JSON.stringify({id:"/dashboard",name:"FinanzasOSS \xB7 Mi panel",short_name:"FinanzasOSS",description:"Consulta tus movimientos y gastos desde tu iPhone de forma privada.",start_url:"/dashboard",scope:"/",display:"standalone",background_color:"#080d13",theme_color:"#0b1016",lang:"es-CO",categories:["finance","productivity"],icons:[{src:"/dashboard-icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any maskable"},{src:"/dashboard-icon-180.png",sizes:"180x180",type:"image/png",purpose:"any"}]}),z='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="FinanzasOSS"><rect width="180" height="180" rx="41" fill="#091c1d"/><rect x="11" y="11" width="158" height="158" rx="34" fill="none" stroke="#23584d" stroke-width="2"/><g fill="#7cedc5"><rect x="41" y="36" width="18" height="107" rx="6"/><rect x="41" y="36" width="83" height="18" rx="6"/><rect x="41" y="86" width="68" height="18" rx="6"/></g><path d="M103 124 137 90m0 0-20 2m20-2-1 17" stroke="#b6d2f4" stroke-width="8" fill="none" stroke-linejoin="round"/></svg>',L="iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAEjUlEQVR42u3dvVHcQBiAYbEoudjZjV0AkSmACkhJ3Ad1uA8Sp66AAiByB7RAxODAvhl+dD+Sdle7q+eNmGEYhPTcx3fi5jjbfNm+dqW0Oe9UYc8vxRxKD7CiX8cFgfcAqyXgPcjKdv0zwO5BVkuwe5DVEuweZLUEO8Cs4p5ELg4aZhViqAdZLa0gAWa1NK370jFvry5d4MJ6un/Ig3rCpD4b/VqOxJgBBvxdI1GPA50I8yHEWaaByr5eI1CfDjoy5n0nBeB2gEe9lieiPg10YswQt4s7N+qsoEEGe3nQCTCDvE7YOVAfBh0BM8iK7uAA6gCzcvT2+s++NXvAZqjiESmoT2x45Zg5nXcHC7KSGhlYPUKRB6rVTOvYkzrEnM4wKyvqAavRJrTXYKgEPyHm7mw6K7uXD2ZDzEcXzFp6nw5zpzPMWhz1G7vBqVRLzQJtOqu01SPMxSylaKqvMGd/Np2VakpP3aPt0LJD251V6i5tQquxCe0NY9RKm/PubPP126j35Shh3bh9vHPxRvTz+48qj3uKtepWDpids2ZAw+zcNQMaZucwOuil9meY13kup9y+c9tOVg4JaAloCWgBLQEtAS0BLQEtoNV8tb6UFGitDjPQMAMtmEuud3FlQktAS0BLQAtoCWgJaAloCWgBLQEtAS0BLQEtoCWgJaAloCWgBbQEtAS0BLQEtICWgJaAloCWgBbQUvmt7u10bx/vqjxubwNsQnsgAi2o//Xr95/Bj60cio461vpxDGpNkIFuGHWNEK0c2tvN9QXQgrqF9QNoqJtCDTTUTa0yQK8E9VyMtezlQJvWnhQKaqBVRFOe2NX0IAAaZhNaMAOtaI19Lcea/hQONMxAqz3MMe5VA61iMA99XGM9GOt+AjgE+Ob6otpVxYSGefTngFZVmGtGDTTMTaEGGuamAhpmoAUz0IIZaMEMNMwrxQw0zEALZqAFM9CCGWiYgRbMQAtmoAUz0CvrVKQwA90MapiBbgY1zEA3gxpmoJtBDTPQq3uiKKAFtAS0BLQEtICWgJaAloCWgBbQEtA5ivVvJNbw7yiAHtHT/UPXdV23vbqsDjXM9bVztnPX3MoxFSXMJnQzqGFeV1X+WzdItX9CP7+M+oIl92jZnw/2/OK2nezQUlugrR0qbt14B3rkHi0V13/DIdajSYo5nbPv0FN+HUipfYUY39SU1tK782fQ9mhVvj9H2aFNaZUynT+DnjilodZimD+YDakOTlrCSzgmPvWzUinWdI4+oa0eWmJvPg56xh0PqJUF8x6jZ5sv29fBz2zOo+1G1hFFd7EHdBj7BVN2ItNaOTAf36GhVkWYD68cEdcPKwjIUa77CQM2G+ihKQ32OiBHu9bRQEdEDTbIqTCPA50YNdztIF4K83jQkVGf8oQR8HoAJ7leI29MjAedCPUpJ0tllmzoTLjLNg10YtSArxTwTMzzQGdErZU14+8ffZRvDLYWhrwrlHIggjlGobQDEsxz6pMcmBVECw3BPumBgq3Mv837LAcOtjKtpX3WHwRskJsAve8HAxzgqkEDDnDi/gLvSxzb9b7BbwAAAABJRU5ErkJggg==",B=`// Network-only service worker. Never cache financial API responses,
 // HTML pages, authentication state, or credentials. Offline use is intentionally unavailable.
 self.addEventListener("install", () => { self.skipWaiting(); });
 self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
 self.addEventListener("fetch", (event) => {
   if (event.request.method === "GET" && new URL(event.request.url).origin === self.location.origin) {
     event.respondWith(fetch(event.request));
   }
 });`;var ne="SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_manual_entries WHERE owner_id=?",re="SELECT id,NULL AS account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_shortcut_expenses WHERE owner_id=?",C=ne+" UNION ALL "+re;function F(e){return new Response(JSON.stringify(e),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'","Referrer-Policy":"no-referrer"}})}async function U(e,t){let[r,n]=await Promise.all([e.prepare("SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day,payment_method, SUM(amount_minor) AS amount_minor, COUNT(*) AS quantity FROM ("+C+") WHERE currency='COP' AND kind='purchase' GROUP BY day,payment_method ORDER BY day DESC LIMIT 40001").bind(t,t).all(),e.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN currency='USD' THEN 1 ELSE 0 END),0) AS usd,COALESCE(SUM(CASE WHEN kind!='purchase' THEN 1 ELSE 0 END),0) AS non_expenses FROM ("+C+")").bind(t,t).first()]),a=r.results.length>4e4;return F({timezone:"America/Bogota",currency:"COP",movementCount:n?.total??0,excludedUsd:n?.usd??0,transfersAndInvestments:n?.non_expenses??0,truncated:a,daily:r.results.slice(0,4e4).map(i=>({day:i.day,method:i.payment_method,minor:String(i.amount_minor),count:i.quantity}))})}async function j(e,t,r){let n=r.searchParams.get("page")??"0";if(!/^(0|[1-9][0-9]{0,4})$/.test(n)||Number(n)>1e4||[...r.searchParams.keys()].some(l=>l!=="page"))return new Response(JSON.stringify({error:"Invalid page"}),{status:422,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});let a=Number(n),i=40,o=await e.prepare("SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM ("+C+") ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?").bind(t,t,i+1,a*i).all();return F({page:a,hasMore:o.results.length>i,entries:o.results.slice(0,i).map(l=>({...l,amount_minor:String(l.amount_minor)}))})}var oe=/^fosq_[0-9a-f]{64}$/,ie=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,ae=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),se=new Set(["debit_card","credit_card","bank_transfer"]),d=class extends Error{constructor(r,n=422){super(r);this.status=n}};function p(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function k(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new d("JSON object required");let r=e;if(Object.keys(r).some(n=>!t.includes(n)))throw new d("Unsupported field");return r}function x(e,t,r){if(typeof e!="string")throw new d(r+" must be text");let n=e.trim();if(!n||n.length>t||/[\u0000-\u001f\u007f]/.test(n))throw new d(r+" is invalid");return n}function ce(e,t,r){return e==null||e===""?null:x(e,t,r)}async function le(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new d("Content-Type must be application/json",415);let t=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(t)||t<0||t>4096)throw new d("Body too large",413);let r=await e.text();if(r.length>4096)throw new d("Body too large",413);try{return JSON.parse(r)}catch{throw new d("Invalid JSON")}}function de(){let e=crypto.getRandomValues(new Uint8Array(32));return"fosq_"+Array.from(e,t=>t.toString(16).padStart(2,"0")).join("")}async function K(e){let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return Array.from(new Uint8Array(t),r=>r.toString(16).padStart(2,"0")).join("")}function q(e){return se.has(e)}async function H(e,t,r){let n=k(r,["label","confirmed"]);if(n.confirmed!==!0)throw new d("Enrollment confirmation required");let a=x(n.label,50,"Device label"),i=de(),o=new Date(Date.now()+90*864e5).toISOString(),l=crypto.randomUUID();return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),t).all(),await e.prepare("INSERT INTO quick_shortcut_devices(id,owner_id,token_hash,label,expires_at) VALUES(?,?,?,?,?) RETURNING id").bind(l,t,await K(i),a,o).first(),p({deviceId:l,token:i,expiresAt:o},201)}async function G(e,t){let r=await e.prepare("SELECT id,label,expires_at FROM quick_shortcut_devices WHERE owner_id=? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 5").bind(t).all();return p({devices:r.results})}async function $(e,t,r){if(k(r,["confirmed"]).confirmed!==!0)throw new d("Revocation confirmation required");return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),t).all(),p({revoked:!0})}function W(e,t){return e.amount_minor!==t.amountMinor||e.currency!=="COP"||e.payment_method!==t.paymentMethod||e.kind!==t.kind||e.merchant!==t.merchant||e.bank_label!==t.bankLabel?p({error:"Entry idempotency key reused with different data"},409):p({entryId:e.id,replayed:!0})}async function V(e,t,r){if(!t.ACCESS_AUD||r.access?.aud!==t.ACCESS_AUD)return p({error:"Cloudflare Access required"},401);if(t.ALLOW_WRITES!=="true"||t.ALLOW_SHORTCUT_WRITES!=="true")return p({error:"Direct shortcuts disabled"},503);let n=e.headers.get("Authorization")??"",a=n.startsWith("Bearer ")?n.slice(7):"";if(!oe.test(a))return p({error:"Device authorization required"},401);let i=await t.DB.prepare("SELECT owner_id FROM quick_shortcut_devices WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? LIMIT 1").bind(await K(a),new Date().toISOString()).first();if(!i)return p({error:"Device authorization expired or revoked"},401);let o=k(await le(e),["clientEntryId","amount","concept","paymentMethod","bankLabel"]),l=x(o.clientEntryId,96,"clientEntryId");if(!ie.test(l))throw new d("Invalid clientEntryId");let g=x(o.concept,120,"Concept");if(typeof o.amount!="string")throw new d("Amount must be text");let h=o.paymentMethod;if(typeof h!="string"||!ae.has(h))throw new d("Invalid payment method");let m=ce(o.bankLabel,80,"Bank");if(q(h)&&!m||!q(h)&&m!==null)throw new d("Bank is required for cards/transfers only");let s=v({tenantId:i.owner_id,actorId:i.owner_id,clientEntryId:l,amount:o.amount,currency:"COP",paymentMethod:h,classification:"expense",occurredAt:new Date().toISOString(),merchant:g,...m===null?{}:{bankLabel:m}}),w=Number(s.money.amountMinor);if(!Number.isSafeInteger(w))throw new d("Invalid amount");let b={ownerId:i.owner_id,clientEntryId:l,amountMinor:w,paymentMethod:s.paymentMethod,kind:s.kind,merchant:s.merchant,bankLabel:s.bankLabel},M=await t.DB.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(b.ownerId,l).first();if(M)return W(M,b);let I=await t.DB.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),b.ownerId,l,w,"COP",s.paymentMethod,s.kind,s.occurredAt,s.merchant,s.bankLabel).first();if(I)return p({entryId:I.id,replayed:!1},201);let A=await t.DB.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(b.ownerId,l).first();return A?W(A,b):p({error:"Unable to verify write"},503)}function Q(e){return e instanceof d?p({error:e.message},e.status):e instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(e.message)?p({error:"Invalid financial entry"},422):p({error:"Unable to process request"},500)}var ue=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,pe=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/,me=new Set(["cash","bank_manual","credit_manual","wallet_manual"]),u=class extends Error{constructor(r,n=422){super(r);this.status=n}};function c(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function f(e,t){let r=t==="text/html"?"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; manifest-src 'self'; img-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'":"default-src 'none'; frame-ancestors 'none'";return new Response(e,{status:200,headers:{"Content-Type":t+"; charset=utf-8","Cache-Control":"no-store, private","Content-Security-Policy":r,"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"}})}function Y(e,t,r){if(typeof e!="string")throw new u(t+" is invalid");let n=e.trim();if(!n||n.length>r||/[\u0000-\u001f\u007f]/.test(n))throw new u(t+" is invalid");return n}function fe(e,t,r){return e==null||e===""?null:Y(e,t,r)}function ge(e,t){if(typeof e!="string"||!ue.test(e))throw new u(t+" is invalid");return e}function he(e,t){if(typeof e!="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))throw new u(t+" must be a UUID");return e.toLowerCase()}function Z(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new u("Expected a JSON object");let r=e;for(let n of Object.keys(r))if(!t.includes(n))throw new u("Unsupported field: "+n);return r}async function be(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new u("Content-Type must be application/json",415);let t=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(t)||t<0||t>4096)throw new u("Request body exceeds limit",413);let r=await e.text();if(r.length>4096)throw new u("Request body exceeds limit",413);try{return JSON.parse(r)}catch{throw new u("Invalid JSON")}}function ye(e){let t=new URL(e.url);if(e.headers.get("Origin")!==t.origin)throw new u("Same-origin request required",403);let r=e.headers.get("Sec-Fetch-Site");if(r&&r!=="same-origin")throw new u("Cross-site request denied",403)}async function ve(e,t){if(!e.access||!t.ACCESS_AUD||e.access.aud!==t.ACCESS_AUD)return null;try{let r=await e.access.getIdentity(),n=r?.user_uuid??r?.id;return typeof n=="string"&&pe.test(n)?n:null}catch{return null}}async function xe(e,t){let r=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? ORDER BY created_at DESC LIMIT 100").bind(t).all();return c({accounts:r.results})}async function we(e,t,r){let n=Z(r,["clientAccountId","label","accountKind","currency","bankLabel"]),a=ge(n.clientAccountId,"clientAccountId"),i=Y(n.label,"label",100),o=n.accountKind;if(typeof o!="string"||!me.has(o))throw new u("Invalid manual account kind");if(n.currency!=="COP"&&n.currency!=="USD")throw new u("Only COP and USD are supported");let l=n.currency,g=fe(n.bankLabel,"bankLabel",80),h=crypto.randomUUID(),m=await e.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency,bank_label) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_account_id) DO NOTHING RETURNING id").bind(h,t,a,i,o,l,g).first();if(m)return c({accountId:m.id,replayed:!1},201);let s=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? AND client_account_id=?").bind(t,a).first();return s?s.label!==i||s.account_kind!==o||s.currency!==l||s.bank_label!==g?c({error:"Account idempotency key was already used for different data"},409):c({accountId:s.id,replayed:!0}):c({error:"Account creation could not be confirmed"},503)}async function Ce(e,t){let r=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_manual_entries WHERE owner_id=? UNION ALL SELECT id,NULL AS account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_shortcut_expenses WHERE owner_id=? ORDER BY occurred_at DESC,id DESC LIMIT 100").bind(t,t).all();return c({entries:r.results.map(n=>({...n,amount_minor:String(n.amount_minor)}))})}async function ke(e,t,r,n=!1){let a=Z(r,["accountId","clientEntryId","amount","currency","paymentMethod","classification","occurredAt","merchant","bankLabel","confirmed"]);if(a.confirmed!==!0)throw new u("Explicit confirmation required");let i=he(a.accountId,"accountId"),o=v({tenantId:t,actorId:t,clientEntryId:a.clientEntryId,amount:a.amount,currency:a.currency,paymentMethod:a.paymentMethod,classification:a.classification,occurredAt:a.occurredAt,...a.merchant===void 0?{}:{merchant:a.merchant},...a.bankLabel===void 0?{}:{bankLabel:a.bankLabel}}),l=o.paymentMethod==="debit_card"||o.paymentMethod==="credit_card"||o.paymentMethod==="bank_transfer";if(l&&!o.bankLabel)return c({error:"Bank name required for card or bank transfer"},422);if(!l&&o.bankLabel!==null)return c({error:"Bank name only allowed for card or bank transfer"},422);let g=Number(o.money.amountMinor);if(!Number.isSafeInteger(g))throw new u("Amount exceeds supported integer range");if(!await e.prepare("SELECT id FROM quick_manual_accounts WHERE id=? AND owner_id=? AND currency=?").bind(i,t,o.money.currency).first())return c({error:"Manual account unavailable or currency mismatch"},403);let m=await e.prepare("INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),t,i,o.clientEntryId,g,o.money.currency,o.paymentMethod,o.kind,o.occurredAt,o.merchant,o.bankLabel).first();if(m)return c({entryId:m.id,replayed:!1},201);let s=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=?").bind(t,o.clientEntryId).first();return s?s.account_id!==i||s.amount_minor!==g||s.currency!==o.money.currency||s.payment_method!==o.paymentMethod||s.kind!==o.kind||!n&&s.occurred_at!==o.occurredAt||s.merchant!==o.merchant||s.bank_label!==o.bankLabel?c({error:"Entry idempotency key reused with different data"},409):c({entryId:s.id,replayed:!0}):c({error:"Unable to verify write"},503)}async function Me(e,t,r){let{pathname:n}=new URL(e.url);if(n==="/healthz"&&e.method==="GET")return c({status:"ok",service:"finanzasoss-quick-staging",writesConfigured:t.ALLOW_WRITES==="true",shortcutsConfigured:t.ALLOW_SHORTCUT_WRITES==="true"});let a=new Set(["/","/quick.css","/quick.js","/dashboard","/dashboard.css","/dashboard.js","/dashboard.webmanifest","/dashboard-icon.svg","/dashboard-icon-180.png","/dashboard-sw.js"]).has(n);if(!a&&!n.startsWith("/api/quick/"))return c({error:"Not found"},404);if(n==="/api/quick/shortcut/expense"&&e.method==="POST")try{return await V(e,t,r)}catch(o){return Q(o)}let i=await ve(r,t);if(!i)return c({error:"Cloudflare Access required"},401);if(!t.DB)return c({error:"Database not configured"},503);if(e.method==="GET"&&a)return n==="/"?f(T,"text/html"):n==="/quick.css"?f(_,"text/css"):n==="/quick.js"?f(O,"application/javascript"):n==="/dashboard"?f(D,"text/html"):n==="/dashboard.css"?f(N,"text/css"):n==="/dashboard.js"?f(P,"application/javascript"):n==="/dashboard.webmanifest"?f(R,"application/manifest+json"):n==="/dashboard-icon.svg"?f(z,"image/svg+xml"):n==="/dashboard-sw.js"?f(B,"application/javascript"):new Response(Uint8Array.from(atob(L),o=>o.charCodeAt(0)),{headers:{"Content-Type":"image/png","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});try{if(e.method==="POST"){if(t.ALLOW_WRITES!=="true")return c({error:"Staging writes disabled"},503);ye(e);let o=await be(e);if(n==="/api/quick/accounts")return await we(t.DB,i,o);if(n==="/api/quick/entries")return await ke(t.DB,i,o);if(n==="/api/quick/shortcut/enroll")return t.ALLOW_SHORTCUT_WRITES!=="true"?c({error:"Direct shortcuts disabled"},503):await H(t.DB,i,o);if(n==="/api/quick/shortcut/revoke")return await $(t.DB,i,o)}else if(e.method==="GET"){if(n==="/api/quick/accounts")return await xe(t.DB,i);if(n==="/api/quick/entries")return await Ce(t.DB,i);if(n==="/api/quick/dashboard/overview")return await U(t.DB,i);if(n==="/api/quick/dashboard/movements")return await j(t.DB,i,new URL(e.url));if(n==="/api/quick/shortcut/devices")return await G(t.DB,i)}return c({error:"Not found"},404)}catch(o){return o instanceof u||o instanceof d?c({error:o.message},o.status):o instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(o.message)?c({error:"Invalid financial entry"},422):c({error:"Unable to process request"},500)}}var Et={fetch(e,t,r){return Me(e,t,r)}};export{Et as default,Me as handleQuickRequest};
