var Je=Object.freeze({automaticActivationAllowed:!1,automaticChargingAllowed:!1,paymentProcessorCallsEnabled:!1,pricesMayBeInvented:!1,pendingAssignmentGrantsEntitlements:!1,productionBillingRequiresExplicitAuthorization:!0});function E(e){switch(e){case"purchase":case"fee":case"tax":return"expense";case"income":return"income";case"refund":return"refund";case"transfer":return"internal_transfer";case"investment_transfer":return"investment_flow";case"investment_activity":return"investment_activity";case"debt_payment":return"debt_flow";case"cash_withdrawal":case"cash_deposit":return"cash_movement";case"adjustment":return"neutral";case"unknown":return"unknown"}}var ae=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),se=new Set(["expense","own_transfer","investment_transfer"]);function y(e,t,o){if(typeof e!="string")throw new Error(t+" must be text");let n=e.trim();if(!n||n.length>o||/[\u0000-\u001f\u007f]/.test(n))throw new Error(t+" is invalid");return n}function T(e,t,o){return e==null||e===""?null:y(e,t,o)}function ce(e){if(typeof e!="string"||!/^(?:0|[1-9][0-9]{0,10})(?:\.[0-9]{1,2})?$/.test(e))throw new Error("Amount must be an ungrouped decimal with at most two fractional digits");let t=e.split("."),o=t[0],n=(t[1]??"").padEnd(2,"0"),a=BigInt(o)*100n+BigInt(n||"0");if(a<=0n||a>1000000000000n)throw new Error("Amount must be positive and within the permitted limit");return a}function le(e){if(typeof e!="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{3})?Z$/.test(e))throw new Error("occurredAt must be canonical UTC");let t=new Date(e);if(Number.isNaN(t.getTime())||(e.endsWith(".000Z")?t.toISOString()!==e:t.toISOString().replace(".000Z","Z")!==e))throw new Error("occurredAt is invalid");return e}function v(e){if(e===null||typeof e!="object"||Array.isArray(e))throw new Error("Quick entry input must be an object");let t=y(e.tenantId,"tenantId",128),o=y(e.actorId,"actorId",128),n=y(e.clientEntryId,"clientEntryId",96);if(!/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(n))throw new Error("clientEntryId must be a stable, caller-generated idempotency key");if(e.currency!=="COP"&&e.currency!=="USD")throw new Error("Only explicitly supported currencies COP and USD are allowed");if(!ae.has(e.paymentMethod))throw new Error("Payment method is not supported");if(!se.has(e.classification))throw new Error("Classification must be explicitly selected");let a=e.classification==="expense"?"purchase":e.classification==="own_transfer"?"transfer":"investment_transfer",i=Object.freeze({amountMinor:ce(e.amount),currency:e.currency});return Object.freeze({tenantId:t,actorId:o,clientEntryId:n,money:i,occurredAt:le(e.occurredAt),paymentMethod:e.paymentMethod,bankLabel:T(e.bankLabel,"bankLabel",80),merchant:T(e.merchant,"merchant",120),classification:e.classification,kind:a,economicClass:E(a),direction:"debit",sourceType:"manual",requiresUserConfirmation:!0,persistenceEnabled:!1,accountSelectionRequiredBeforePosting:!0})}var O=`<!doctype html>
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
</body></html>`,_='.dash-shortcut{display:inline-flex;align-items:center;gap:.4rem;text-decoration:none;border:1px solid #38574d;color:#a9f4d6;padding:.6rem .85rem;border-radius:10px;font-weight:750;font-size:12px;white-space:nowrap}.dash-shortcut:hover{background:#15352a}.top{flex-wrap:wrap;gap:10px} :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#16242c;background:#f4f3f0;font-synthesis:none}*{box-sizing:border-box}body{margin:0}.shell{max-width:820px;margin:0 auto;padding:0 24px 52px}.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d3d6d3;padding:25px 0 22px;gap:12px}.brand{display:flex;align-items:center;gap:10px;font-size:14px;letter-spacing:.075em;font-weight:800}.brand-light{font-weight:450;color:#6a7c83}.brand-icon{display:grid;place-content:center;height:35px;width:35px;border-radius:7px;background:#16242c;color:#fff;font-size:19px;letter-spacing:-.08em}.brand-icon span{color:#8cf0bb}.env{display:flex;align-items:center;gap:7px;border:1px solid #cbd6d1;border-radius:4px;padding:8px 10px;color:#53665c;font-size:10px;font-weight:750;letter-spacing:.065em;white-space:nowrap}.env-dot{height:7px;width:7px;border-radius:50%;background:#53b585}.intro{padding:50px 0 20px}.eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#6e8b7b}.intro h1{font-size:clamp(36px,7vw,60px);letter-spacing:-.065em;line-height:1.06;margin:14px 0 12px;font-weight:780}.intro em{font-style:normal;color:#478c68}.intro p{font-size:14px;line-height:1.65;max-width:440px;color:#63747a}.warning{display:flex;gap:12px;background:#edf2ea;border:1px solid #d3dfd1;padding:13px 16px;font-size:12px;line-height:1.5;color:#416147;margin:16px 0 26px;border-radius:4px}.warning>span:first-child{font-size:13px}.panel{background:#fff;border:1px solid #d9deda;border-radius:7px;padding:29px;margin-bottom:16px;box-shadow:0 4px 18px rgba(18,36,27,.025)}.panel.compact{padding:25px 29px}.panel-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:23px}.panel h2,.history h2{font-size:21px;letter-spacing:-.035em;margin:6px 0 0;font-weight:720}.pill{background:#f2f3f0;color:#73817c;font-size:10px;border:1px solid #dfe4e0;border-radius:4px;padding:7px 9px;white-space:nowrap}.pill.enabled{color:#287d4b;background:#e8f6ec;border-color:#c4e4cf}.field-label{display:block;font-size:11px;letter-spacing:.03em;font-weight:720;margin-bottom:9px;color:#3b4c50}.amount-field{height:78px;display:flex;align-items:center;border-bottom:2px solid #1e3c32;gap:12px;margin-bottom:8px}.amount-field>span{font-size:30px;font-weight:500;color:#4d6858}.amount-field input{border:0;outline:0;flex:1;min-width:0;font-size:44px;letter-spacing:-.05em;font-weight:750;font-variant-numeric:tabular-nums;padding:0;background:transparent;color:#16242c}.amount-field small{font-size:12px;color:#7b8982;letter-spacing:.06em}.hint{font-size:11px;line-height:1.5;color:#82918c}.grid-fields{display:grid;grid-template-columns:1fr 1fr;gap:22px 17px;margin-top:29px}input:not(.amount-field input),select{display:block;width:100%;height:45px;border:1px solid #d8dfda;border-radius:4px;padding:10px 11px;color:#253730;background:#fafbf8;font-size:13px;font:inherit;outline-offset:3px}input:focus,select:focus{border-color:#5aa078}.submit-zone{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #e8ebe7;padding-top:24px;margin-top:25px}.submit-zone .hint{max-width:260px}button{border:0;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:space-between;gap:20px;font-size:13px;font-weight:750;transition:transform .12s,background .12s}button:not(:disabled):active{transform:translateY(1px)}button:disabled{cursor:not-allowed;opacity:.5}button[type=submit]:not(.secondary){min-height:46px;color:#fff;background:#1d4b37;padding:12px 18px}button[type=submit]:not(.secondary):hover:not(:disabled){background:#28704e}.account-row{display:flex;align-items:end;gap:12px}.account-row>.grow{flex:1}.account-row>div:last-child{width:155px}.secondary{min-height:43px;padding:10px 14px;border:1px solid #cbd6cf;background:#e9f2ed;color:#285b3e;margin-top:17px}.subline{font-size:12px;color:#738078;margin:-14px 0 18px}.feedback{min-height:0;font-size:12px;line-height:1.55;margin-top:12px}.feedback:empty{display:none}.feedback.error{color:#ae3e3e}.feedback.good{color:#217448}.history{padding:27px 5px 15px;margin-bottom:8px}.history .panel-title{padding:0 3px}.mini{font-size:11px;color:#37674d;background:transparent;padding:9px 3px}.history-body{border-top:1px solid #d7ddd8}.entry-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:17px 4px;border-bottom:1px solid #e0e4df}.entry-description{font-size:13px;font-weight:720}.entry-meta{font-size:11px;color:#728079;margin-top:5px}.entry-amount{font-size:15px;font-weight:760;font-variant-numeric:tabular-nums;white-space:nowrap}.empty{padding:24px 4px;color:#89968e;font-size:13px}footer{text-align:center;border-top:1px solid #d7ded7;padding:24px 0;color:#96a19a;font-size:9px;letter-spacing:.1em}@media(max-width:560px){.shell{padding:0 18px 30px}.intro{padding:32px 0 13px}.intro h1{font-size:45px}.panel,.panel.compact{padding:21px 18px}.grid-fields{grid-template-columns:1fr 1fr;gap:18px 11px}.submit-zone{flex-direction:column;align-items:stretch}.submit-zone .hint{max-width:none}button[type=submit]:not(.secondary){width:100%}.amount-field input{font-size:37px}.env{font-size:9px}.account-row{flex-direction:column;align-items:stretch}.account-row>div:last-child{width:100%}}@media(prefers-reduced-motion:reduce){button{transition:none}}.token-once{word-break:break-all;user-select:all;font:12px ui-monospace,monospace;margin-top:12px;color:#285b3e;line-height:1.5}',N=`"use strict";
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
})();`;var P=`<!doctype html>
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
        <button id="reload" class="icon-button" type="button" aria-label="Actualizar movimientos" title="Actualizar"><span aria-hidden="true">\u21BB</span></button>
        <button id="add-top" class="new-button" type="button"><span aria-hidden="true">\uFF0B</span> Registrar gasto</button>
      </div>
    </header>
    <main id="contenido" class="main">
      <p id="live-announcement" class="sr-only" role="status" aria-live="polite"></p>
      <div id="error" class="alert" role="alert" hidden></div>
      <section class="space is-visible" id="space-today" data-space="today" aria-labelledby="heading-today">
        <div class="intro-line"><span class="intro-index">01 \u2014 RESUMEN</span><span class="intro-right">TU DINERO, SIN RUIDO <span aria-hidden="true">\u2197</span></span></div>
        <div class="editorial-hero">
          <div class="hero-copy">
            <p class="eyebrow">FINANZAS PERSONALES / BOGOT\xC1</p>
            <h1 id="heading-today">Un poco m\xE1s <em>de claridad.</em></h1>
            <p class="hero-sub">Lo que gastas, c\xF3mo lo gastas y lo que vale la pena mirar. Todo en un solo espacio.</p>
            <div class="hero-status"><span class="live-led"></span><span id="hero-status">Sincronizando tus registros\u2026</span></div>
          </div>
          <div class="hero-stamp" aria-hidden="true"><span>F</span><span class="stamp-arrow">\u2197</span><small>FI<span>NA</span>NZAS</small></div>
        </div>
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
        <button type="button" class="full-link" data-view="movement"><span>Explora el historial de movimientos</span><span>VER TODOS <b aria-hidden="true">\u2197</b></span></button>
      </section>
      <section class="space" id="space-movement" data-space="movement" aria-labelledby="heading-movement" hidden>
        <div class="intro-line"><span class="intro-index">02 \u2014 MOVIMIENTOS</span><span class="intro-right">SIN SALDOS SUPUESTOS</span></div>
        <div class="page-intro"><p class="eyebrow">TU LIBRO DE REGISTRO</p><h1 id="heading-movement">Cada peso <em>cuenta algo.</em></h1><p>Una cronolog\xEDa honesta de todos los gastos ingresados desde tu iPhone y la captura manual.</p></div>
        <div class="history-toolbar"><div class="history-left"><span id="history-count" class="history-count">\u2014 movimientos</span><span class="history-note">M\xE1s recientes primero</span></div><div class="history-right"><button id="refresh-history" type="button" class="soft-button">\u21BB Actualizar</button><button id="add-movement" type="button" class="solid-button">\uFF0B A\xF1adir gasto</button></div></div>
        <article class="table-panel"><div class="table-scroll"><table aria-label="Historial de movimientos financieros"><thead><tr><th>CONCEPTO / TIPO</th><th>FECHA</th><th>M\xC9TODO</th><th class="align-right">VALOR</th></tr></thead><tbody id="history-body"><tr><td colspan="4" class="empty-row">Cargando tus movimientos\u2026</td></tr></tbody></table></div><div class="history-bottom"><p id="history-status">Consultando historial\u2026</p><button id="load-more" type="button" class="soft-button" hidden>Cargar movimientos anteriores <span aria-hidden="true">\u2193</span></button></div></article>
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
        <div class="guidance"><span class="guidance-mark" aria-hidden="true">\u2197</span><div><h3>El sistema original sigue aqu\xED.</h3><p>Los modelos de posiciones, aportes netos, dividendos, costo base y rentabilidad se conservan en el repositorio. Todav\xEDa no se alimentan de fuentes autorizadas en este entorno.</p></div><button class="soft-button" data-view="imports" type="button">Explorar importaci\xF3n</button></div>
      </section>
      <section class="space" id="space-plan" data-space="plan" aria-labelledby="heading-plan" hidden>
        <div class="intro-line"><span class="intro-index">04 \u2014 PLAN</span><span class="intro-right">OBSERVACIONES / NO PRON\xD3STICOS</span></div>
        <div class="page-intro"><p class="eyebrow">CONOCE TUS H\xC1BITOS</p><h1 id="heading-plan">Poner intenci\xF3n <em>a cada gasto.</em></h1><p>Lecturas basadas en tu historial, sin presupuestos inventados ni compromisos financieros autom\xE1ticos.</p></div>
        <div class="three-columns">
          <article class="module"><span class="module-no">GASTOS / MES ACTUAL</span><strong id="plan-month" data-private class="module-value">\u2014</strong><p>El total registrado hasta hoy, no tu gasto bancario completo.</p></article>
          <article class="module"><span class="module-no">D\xCDAS CON GASTOS / MES</span><strong id="plan-days" class="module-value">\u2014</strong><p>D\xEDas en los que a\xF1adiste al menos un movimiento.</p></article>
          <article class="module"><span class="module-no">PROMEDIO DIARIO REGISTRADO</span><strong id="plan-average" data-private class="module-value">\u2014</strong><p>Distribuido entre los d\xEDas transcurridos este mes.</p></article>
        </div>
        <div class="guidance"><span class="guidance-mark" aria-hidden="true">\u25CE</span><div><h3>Pr\xF3ximo paso: presupuestos personalizados</h3><p>Los modelos de metas y planificaci\xF3n est\xE1n desarrollados en el sistema original. No activar\xE9 l\xEDmites, recomendaciones de aporte o alertas sin informaci\xF3n verificada y tu configuraci\xF3n.</p></div></div>
      </section>
      <section class="space" id="space-map" data-space="map" aria-labelledby="heading-map" hidden>
        <div class="intro-line"><span class="intro-index">05 \u2014 MAPA FINANCIERO</span><span class="intro-right">ORIGEN / DESTINO</span></div>
        <div class="page-intro"><p class="eyebrow">ENTENDER EL RECORRIDO</p><h1 id="heading-map">Por d\xF3nde <em>se va.</em></h1><p>Mapa de tus gastos realmente registrados, agrupados por m\xE9todo. No representa conexiones bancarias ni dinero disponible.</p></div>
        <article class="flow-panel">
          <div class="flow-source"><span>REGISTROS DE GASTO</span><strong id="map-total" data-private>\u2014</strong><small>Acumulado registrado en COP</small></div>
          <div class="flow-channel" aria-hidden="true"><span></span><i>\u2192</i></div>
          <div id="map-targets" class="flow-targets"><p>Cargando m\xE9todos de pago\u2026</p></div>
        </article>
        <div class="guidance"><span class="guidance-mark" aria-hidden="true">\u203B</span><div><h3>Un mapa sin duplicar movimientos.</h3><p>Los movimientos de bancos y portafolios solo podr\xE1n agregarse con reconciliaci\xF3n verificada para no sumar dos veces una misma operaci\xF3n.</p></div></div>
      </section>
      <section class="space" id="space-imports" data-space="imports" aria-labelledby="heading-imports" hidden>
        <div class="intro-line"><span class="intro-index">06 \u2014 IMPORTAR DATOS</span><span class="intro-right">CONTROLADO / SIN ACCESOS IMPROVISADOS</span></div>
        <div class="page-intro"><p class="eyebrow">TUS DATOS SIGUEN SIENDO TUYOS</p><h1 id="heading-imports">M\xE1s informaci\xF3n. <em>Sin perder control.</em></h1><p>Ya existe un motor de lectura de extractos en FinanzasOSS. Antes de admitir archivos reales debemos conectar su revisi\xF3n y persistencia al entorno autenticado.</p></div>
        <div class="import-layout"><article class="module wide"><span class="module-no">FORMATOS DEL MOTOR ORIGINAL</span><div class="format-row"><span>CSV</span><span>XLSX</span><span>OFX</span><span>PDF</span></div><div class="how-steps"><div><b>01</b><span>Seleccionar un extracto oficial</span></div><div><b>02</b><span>Revisar y conciliar duplicados</span></div><div><b>03</b><span>Confirmar antes de guardar</span></div></div><span class="state-pill pending">Subida de archivos a\xFAn no habilitada en esta PWA</span></article><article class="module note-card"><span class="module-no">POR QU\xC9 NO PEDIMOS ARCHIVOS TODAV\xCDA</span><h3>Primero, confianza.</h3><p>La pantalla anterior era solo una vista previa. No vamos a recibir extractos personales hasta completar la conexi\xF3n autenticada, revisi\xF3n y seguridad correspondientes.</p><button class="soft-button" data-view="connections" type="button">Estado de las conexiones \u2192</button></article></div>
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
        <div class="settings-panel"><div class="setting-row"><div><h3>Modo privacidad</h3><p>Oculta visualmente los montos cuando alguien mire tu pantalla.</p></div><button id="privacy-setting" type="button" class="toggle-button" role="switch" aria-checked="false">Desactivado</button></div><div class="setting-row"><div><h3>Movimiento reducido</h3><p>Desactiva las transiciones decorativas. Respeta la preferencia de accesibilidad del sistema.</p></div><button id="motion-setting" type="button" class="toggle-button" role="switch" aria-checked="false">Seg\xFAn sistema</button></div><div class="setting-row"><div><h3>Apariencia</h3><p>Un estilo editorial luminoso o una variante nocturna.</p></div><button id="theme-setting" type="button" class="toggle-button">Modo oscuro</button></div><div class="setting-row"><div><h3>Datos y almacenamiento</h3><p>La PWA funciona en l\xEDnea. No almacena tu historial, credenciales ni saldos sin conexi\xF3n.</p></div><span class="state-pill">Datos privados</span></div></div>
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
<button type="button" data-view="today"><span>01</span>Hoy <b>\u2197</b></button>
<button type="button" data-view="movement"><span>02</span>Movimientos <b>\u2197</b></button>
<button type="button" data-view="portfolio"><span>03</span>Portafolios <b>\u2197</b></button>
<button type="button" data-view="plan"><span>04</span>Plan <b>\u2197</b></button>
<button type="button" data-view="map"><span>05</span>Mapa financiero <b>\u2197</b></button>
<button type="button" data-view="imports"><span>06</span>Importar <b>\u2197</b></button>
<button type="button" data-view="connections"><span>07</span>Conexiones <b>\u2197</b></button>
<button type="button" data-view="settings"><span>08</span>Ajustes <b>\u2197</b></button>
</div>
<p class="more-foot">Un mismo espacio, todos tus movimientos.</p>
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
    <button id="expense-submit" class="save-button" type="submit">Revisar movimiento <span aria-hidden="true">\u2192</span></button>
    <small class="dialog-foot">Solo staging. No registres datos financieros reales todav\xEDa.</small>
  </form>
</dialog>
</body></html>`;var D=`
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
`;var R=`(() => {
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
    navigator.serviceWorker.register("/dashboard-sw.js", { scope: "/dashboard" }).catch(() => {});
  }
  void refresh();
})();`;var z=`(() => {
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
  byId("theme-setting").addEventListener("click",()=>{
    const night = studio.classList.toggle("theme-night");
    document.body.classList.toggle("theme-night", night);
    document.querySelector('meta[name="theme-color"]').setAttribute("content",night?"#111c1c":"#172c2c");
    byId("theme-setting").textContent=night?"Modo claro":"Modo oscuro";
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
})();
`;var L=JSON.stringify({id:"/dashboard",name:"FinanzasOSS \xB7 Mi panel",short_name:"FinanzasOSS",description:"Consulta tus movimientos y gastos desde tu iPhone de forma privada.",start_url:"/dashboard",scope:"/",display:"standalone",background_color:"#080d13",theme_color:"#0b1016",lang:"es-CO",categories:["finance","productivity"],icons:[{src:"/dashboard-icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any maskable"},{src:"/dashboard-icon-180.png",sizes:"180x180",type:"image/png",purpose:"any"}]}),F='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="FinanzasOSS"><rect width="180" height="180" rx="41" fill="#091c1d"/><rect x="11" y="11" width="158" height="158" rx="34" fill="none" stroke="#23584d" stroke-width="2"/><g fill="#7cedc5"><rect x="41" y="36" width="18" height="107" rx="6"/><rect x="41" y="36" width="83" height="18" rx="6"/><rect x="41" y="86" width="68" height="18" rx="6"/></g><path d="M103 124 137 90m0 0-20 2m20-2-1 17" stroke="#b6d2f4" stroke-width="8" fill="none" stroke-linejoin="round"/></svg>',B="iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAEjUlEQVR42u3dvVHcQBiAYbEoudjZjV0AkSmACkhJ3Ad1uA8Sp66AAiByB7RAxODAvhl+dD+Sdle7q+eNmGEYhPTcx3fi5jjbfNm+dqW0Oe9UYc8vxRxKD7CiX8cFgfcAqyXgPcjKdv0zwO5BVkuwe5DVEuweZLUEO8Cs4p5ELg4aZhViqAdZLa0gAWa1NK370jFvry5d4MJ6un/Ig3rCpD4b/VqOxJgBBvxdI1GPA50I8yHEWaaByr5eI1CfDjoy5n0nBeB2gEe9lieiPg10YswQt4s7N+qsoEEGe3nQCTCDvE7YOVAfBh0BM8iK7uAA6gCzcvT2+s++NXvAZqjiESmoT2x45Zg5nXcHC7KSGhlYPUKRB6rVTOvYkzrEnM4wKyvqAavRJrTXYKgEPyHm7mw6K7uXD2ZDzEcXzFp6nw5zpzPMWhz1G7vBqVRLzQJtOqu01SPMxSylaKqvMGd/Np2VakpP3aPt0LJD251V6i5tQquxCe0NY9RKm/PubPP126j35Shh3bh9vHPxRvTz+48qj3uKtepWDpids2ZAw+zcNQMaZucwOuil9meY13kup9y+c9tOVg4JaAloCWgBLQEtAS0BLQEtoNV8tb6UFGitDjPQMAMtmEuud3FlQktAS0BLQAtoCWgJaAloCWgBLQEtAS0BLQEtoCWgJaAloCWgBbQEtAS0BLQEtICWgJaAloCWgBbQUvmt7u10bx/vqjxubwNsQnsgAi2o//Xr95/Bj60cio461vpxDGpNkIFuGHWNEK0c2tvN9QXQgrqF9QNoqJtCDTTUTa0yQK8E9VyMtezlQJvWnhQKaqBVRFOe2NX0IAAaZhNaMAOtaI19Lcea/hQONMxAqz3MMe5VA61iMA99XGM9GOt+AjgE+Ob6otpVxYSGefTngFZVmGtGDTTMTaEGGuamAhpmoAUz0IIZaMEMNMwrxQw0zEALZqAFM9CCGWiYgRbMQAtmoAUz0CvrVKQwA90MapiBbgY1zEA3gxpmoJtBDTPQq3uiKKAFtAS0BLQEtICWgJaAloCWgBbQEtA5ivVvJNbw7yiAHtHT/UPXdV23vbqsDjXM9bVztnPX3MoxFSXMJnQzqGFeV1X+WzdItX9CP7+M+oIl92jZnw/2/OK2nezQUlugrR0qbt14B3rkHi0V13/DIdajSYo5nbPv0FN+HUipfYUY39SU1tK782fQ9mhVvj9H2aFNaZUynT+DnjilodZimD+YDakOTlrCSzgmPvWzUinWdI4+oa0eWmJvPg56xh0PqJUF8x6jZ5sv29fBz2zOo+1G1hFFd7EHdBj7BVN2ItNaOTAf36GhVkWYD68cEdcPKwjIUa77CQM2G+ihKQ32OiBHu9bRQEdEDTbIqTCPA50YNdztIF4K83jQkVGf8oQR8HoAJ7leI29MjAedCPUpJ0tllmzoTLjLNg10YtSArxTwTMzzQGdErZU14+8ffZRvDLYWhrwrlHIggjlGobQDEsxz6pMcmBVECw3BPumBgq3Mv837LAcOtjKtpX3WHwRskJsAve8HAxzgqkEDDnDi/gLvSxzb9b7BbwAAAABJRU5ErkJggg==",U=`// Network-only service worker. Never cache financial API responses,
 // HTML pages, authentication state, or credentials. Offline use is intentionally unavailable.
 self.addEventListener("install", () => { self.skipWaiting(); });
 self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
 self.addEventListener("fetch", (event) => {
   if (event.request.method === "GET" && new URL(event.request.url).origin === self.location.origin) {
     event.respondWith(fetch(event.request));
   }
 });`;var de="SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_manual_entries WHERE owner_id=?",pe="SELECT id,NULL AS account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_shortcut_expenses WHERE owner_id=?",k=de+" UNION ALL "+pe;function j(e){return new Response(JSON.stringify(e),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'","Referrer-Policy":"no-referrer"}})}async function q(e,t){let[o,n]=await Promise.all([e.prepare("SELECT substr(datetime(occurred_at,'-5 hours'),1,10) AS day,payment_method, SUM(amount_minor) AS amount_minor, COUNT(*) AS quantity FROM ("+k+") WHERE currency='COP' AND kind='purchase' GROUP BY day,payment_method ORDER BY day DESC LIMIT 40001").bind(t,t).all(),e.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN currency='USD' THEN 1 ELSE 0 END),0) AS usd,COALESCE(SUM(CASE WHEN kind!='purchase' THEN 1 ELSE 0 END),0) AS non_expenses FROM ("+k+")").bind(t,t).first()]),a=o.results.length>4e4;return j({timezone:"America/Bogota",currency:"COP",movementCount:n?.total??0,excludedUsd:n?.usd??0,transfersAndInvestments:n?.non_expenses??0,truncated:a,daily:o.results.slice(0,4e4).map(i=>({day:i.day,method:i.payment_method,minor:String(i.amount_minor),count:i.quantity}))})}async function W(e,t,o){let n=o.searchParams.get("page")??"0";if(!/^(0|[1-9][0-9]{0,4})$/.test(n)||Number(n)>1e4||[...o.searchParams.keys()].some(s=>s!=="page"))return new Response(JSON.stringify({error:"Invalid page"}),{status:422,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});let a=Number(n),i=40,r=await e.prepare("SELECT id,account_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM ("+k+") ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?").bind(t,t,i+1,a*i).all();return j({page:a,hasMore:r.results.length>i,entries:r.results.slice(0,i).map(s=>({...s,amount_minor:String(s.amount_minor)}))})}var C=Object.freeze([{id:"today",label:"Hoy",shortLabel:"Hoy",priority:1},{id:"movement",label:"Movimientos",shortLabel:"Mov.",priority:2},{id:"portfolio",label:"Portafolios",shortLabel:"Portaf.",priority:3},{id:"plan",label:"Plan",shortLabel:"Plan",priority:4},{id:"map",label:"Mapa financiero",shortLabel:"Mapa",priority:5}]),G=Object.freeze(["profile","connections","settings"]);var ue=Object.freeze({not_verified:"Aun no se ha verificado acceso oficial para esta entidad. No puedes conectar cuentas.",portal_registered:"La inscripcion en un portal de desarrolladores no habilita la consulta de cuentas ni saldos.",sandbox_api_approved:"El acceso de pruebas no autoriza consultar datos reales ni activar sincronizacion bancaria.",production_access_review:"La habilitacion productiva requiere acuerdo verificado, consentimiento y aprobacion humana antes de conectarse."});function H(e){let t=e.providerName.trim()||"Entidad financiera";return Object.freeze({title:"Empieza con tus datos",guidance:"Puedes revisar tus archivos de forma local mientras se verifica el acceso oficial a las APIs financieras.",importCard:Object.freeze({title:"Importar un archivo",description:"Revisa el mapeo, las transacciones y los posibles duplicados antes de confirmar cualquier importacion.",acceptedFormats:Object.freeze(["CSV","XLSX","OFX","PDF"]),storesDataWithoutPreview:!1,action:Object.freeze({id:"review_local_import",label:"Revisar importacion",enabled:e.manualImportPreviewAvailable,requiresUserConfirmation:!0})}),providerCard:Object.freeze({title:t,status:e.providerAccessStage,description:ue[e.providerAccessStage],bankConnected:!1,automaticSyncAvailable:!1,productionAccessImplied:!1,action:Object.freeze({id:"view_provider_requirements",label:"Ver requisitos de conexion",enabled:!0,requiresUserConfirmation:!1})})})}var Ot=Object.freeze({minimumHorizontalDistancePx:64,horizontalDominanceRatio:1.25,singlePointerOnly:!0,destructiveGesturesAllowed:!1,financialActionGesturesAllowed:!1,gestureScope:"primary_navigation_only"});var M=Object.freeze({installable:!0,displayMode:"standalone",cacheApplicationShell:!0,cacheFinancialApiResponses:!1,cacheSensitiveFinancialData:!1,cacheSecretsOrCredentials:!1,offlineMoneyMovementAllowed:!1,offlineTradingAllowed:!1,offlineMode:"shell_and_non_sensitive_guidance_only"});var g=Object.freeze({instant:120,quick:180,standard:280,expressive:420}),Nt=Object.freeze({control:{stiffness:320,damping:28,mass:.8},panel:{stiffness:240,damping:30,mass:1}});var I=Object.freeze({capsulePressScale:.98,hoverLiftPx:2,privacyMorphMs:g.quick,balanceRefreshMs:g.standard}),Pt=Object.freeze({navigation:{durationMs:g.standard,transform:"translate",opacityTransition:!0,spatialContinuity:!0,loops:!1},disclosure:{durationMs:g.quick,transform:"scale",opacityTransition:!0,spatialContinuity:!0,loops:!1},privacy:{durationMs:I.privacyMorphMs,transform:"morph",opacityTransition:!0,spatialContinuity:!0,loops:!1},data_refresh:{durationMs:I.balanceRefreshMs,transform:"none",opacityTransition:!0,spatialContinuity:!1,loops:!1},transfer_reconciliation:{durationMs:g.standard,transform:"translate",opacityTransition:!0,spatialContinuity:!0,loops:!1},investment_contribution:{durationMs:g.standard,transform:"translate",opacityTransition:!0,spatialContinuity:!0,loops:!1},modal:{durationMs:g.standard,transform:"scale",opacityTransition:!0,spatialContinuity:!0,loops:!1}});var K=Object.freeze({continuousDecorationAllowed:!1,balanceCountUpAllowed:!1,hoverOnlyAffordancesAllowed:!1,maxPressScale:I.capsulePressScale,reducedMotionUsesTransform:!1});var A=H({providerName:"Entidades financieras",providerAccessStage:"not_verified",manualImportPreviewAvailable:!1});function V(){return new Response(JSON.stringify({product:"FinanzasOSS",environment:"staging",currency:"COP",timezone:"America/Bogota",navigation:{primary:C.map(({id:e,label:t})=>({id:e,label:t})),secondary:G},quick:{read:!0,capture:!0,accountRequired:!1},banks:{connected:0,automaticSync:!1,status:"pending_official_authorization"},investments:{connected:0,actualHoldings:!1,status:"awaiting_authorized_sources"},imports:{formats:A.importCard.acceptedFormats,liveUpload:A.importCard.action.enabled,previewAndConfirmationRequired:A.importCard.action.requiresUserConfirmation},pwa:{standalone:M.installable,cacheFinancialData:M.cacheFinancialApiResponses},experience:{motionMs:g,reducedMotionSupported:K.reducedMotionUsesTransform===!1}}),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}var me=/^fosq_[0-9a-f]{64}$/,fe=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,ge=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),he=new Set(["debit_card","credit_card","bank_transfer"]),l=class extends Error{constructor(o,n=422){super(o);this.status=n}};function u(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function w(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new l("JSON object required");let o=e;if(Object.keys(o).some(n=>!t.includes(n)))throw new l("Unsupported field");return o}function x(e,t,o){if(typeof e!="string")throw new l(o+" must be text");let n=e.trim();if(!n||n.length>t||/[\u0000-\u001f\u007f]/.test(n))throw new l(o+" is invalid");return n}function be(e,t,o){return e==null||e===""?null:x(e,t,o)}async function ye(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new l("Content-Type must be application/json",415);let t=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(t)||t<0||t>4096)throw new l("Body too large",413);let o=await e.text();if(o.length>4096)throw new l("Body too large",413);try{return JSON.parse(o)}catch{throw new l("Invalid JSON")}}function ve(){let e=crypto.getRandomValues(new Uint8Array(32));return"fosq_"+Array.from(e,t=>t.toString(16).padStart(2,"0")).join("")}async function Y(e){let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return Array.from(new Uint8Array(t),o=>o.toString(16).padStart(2,"0")).join("")}function $(e){return he.has(e)}async function J(e,t,o){let n=w(o,["label","confirmed"]);if(n.confirmed!==!0)throw new l("Enrollment confirmation required");let a=x(n.label,50,"Device label"),i=ve(),r=new Date(Date.now()+90*864e5).toISOString(),s=crypto.randomUUID();return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),t).all(),await e.prepare("INSERT INTO quick_shortcut_devices(id,owner_id,token_hash,label,expires_at) VALUES(?,?,?,?,?) RETURNING id").bind(s,t,await Y(i),a,r).first(),u({deviceId:s,token:i,expiresAt:r},201)}async function Z(e,t){let o=await e.prepare("SELECT id,label,expires_at FROM quick_shortcut_devices WHERE owner_id=? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 5").bind(t).all();return u({devices:o.results})}async function X(e,t,o){if(w(o,["confirmed"]).confirmed!==!0)throw new l("Revocation confirmation required");return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),t).all(),u({revoked:!0})}function Q(e,t){return e.amount_minor!==t.amountMinor||e.currency!=="COP"||e.payment_method!==t.paymentMethod||e.kind!==t.kind||e.merchant!==t.merchant||e.bank_label!==t.bankLabel?u({error:"Entry idempotency key reused with different data"},409):u({entryId:e.id,replayed:!0})}async function ee(e,t,o){if(!t.ACCESS_AUD||o.access?.aud!==t.ACCESS_AUD)return u({error:"Cloudflare Access required"},401);if(t.ALLOW_WRITES!=="true"||t.ALLOW_SHORTCUT_WRITES!=="true")return u({error:"Direct shortcuts disabled"},503);let n=e.headers.get("Authorization")??"",a=n.startsWith("Bearer ")?n.slice(7):"";if(!me.test(a))return u({error:"Device authorization required"},401);let i=await t.DB.prepare("SELECT owner_id FROM quick_shortcut_devices WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? LIMIT 1").bind(await Y(a),new Date().toISOString()).first();if(!i)return u({error:"Device authorization expired or revoked"},401);let r=w(await ye(e),["clientEntryId","amount","concept","paymentMethod","bankLabel"]);return ne(t.DB,i.owner_id,r)}async function te(e,t,o){let n=w(o,["clientEntryId","amount","concept","paymentMethod","bankLabel","confirmed"]);if(n.confirmed!==!0)throw new l("Expense confirmation required");return ne(e,t,n)}async function ne(e,t,o){let n=x(o.clientEntryId,96,"clientEntryId");if(!fe.test(n))throw new l("Invalid clientEntryId");let a=x(o.concept,120,"Concept");if(typeof o.amount!="string")throw new l("Amount must be text");let i=o.paymentMethod;if(typeof i!="string"||!ge.has(i))throw new l("Invalid payment method");let r=be(o.bankLabel,80,"Bank");if($(i)&&!r||!$(i)&&r!==null)throw new l("Bank is required for cards/transfers only");let s=v({tenantId:t,actorId:t,clientEntryId:n,amount:o.amount,currency:"COP",paymentMethod:i,classification:"expense",occurredAt:new Date().toISOString(),merchant:a,...r===null?{}:{bankLabel:r}}),m=Number(s.money.amountMinor);if(!Number.isSafeInteger(m))throw new l("Invalid amount");let h={ownerId:t,clientEntryId:n,amountMinor:m,paymentMethod:s.paymentMethod,kind:s.kind,merchant:s.merchant,bankLabel:s.bankLabel},b=await e.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(h.ownerId,n).first();if(b)return Q(b,h);let d=await e.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),h.ownerId,n,m,"COP",s.paymentMethod,s.kind,s.occurredAt,s.merchant,s.bankLabel).first();if(d)return u({entryId:d.id,replayed:!1},201);let S=await e.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(h.ownerId,n).first();return S?Q(S,h):u({error:"Unable to verify write"},503)}function oe(e){return e instanceof l?u({error:e.message},e.status):e instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(e.message)?u({error:"Invalid financial entry"},422):u({error:"Unable to process request"},500)}var xe=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,we=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/,ke=new Set(["cash","bank_manual","credit_manual","wallet_manual"]),p=class extends Error{constructor(o,n=422){super(o);this.status=n}};function c(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function f(e,t){let o=t==="text/html"?"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; manifest-src 'self'; img-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'":"default-src 'none'; frame-ancestors 'none'";return new Response(e,{status:200,headers:{"Content-Type":t+"; charset=utf-8","Cache-Control":"no-store, private","Content-Security-Policy":o,"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"}})}function re(e,t,o){if(typeof e!="string")throw new p(t+" is invalid");let n=e.trim();if(!n||n.length>o||/[\u0000-\u001f\u007f]/.test(n))throw new p(t+" is invalid");return n}function Ce(e,t,o){return e==null||e===""?null:re(e,t,o)}function Me(e,t){if(typeof e!="string"||!xe.test(e))throw new p(t+" is invalid");return e}function Ie(e,t){if(typeof e!="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))throw new p(t+" must be a UUID");return e.toLowerCase()}function ie(e,t){if(!e||typeof e!="object"||Array.isArray(e))throw new p("Expected a JSON object");let o=e;for(let n of Object.keys(o))if(!t.includes(n))throw new p("Unsupported field: "+n);return o}async function Ae(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new p("Content-Type must be application/json",415);let t=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(t)||t<0||t>4096)throw new p("Request body exceeds limit",413);let o=await e.text();if(o.length>4096)throw new p("Request body exceeds limit",413);try{return JSON.parse(o)}catch{throw new p("Invalid JSON")}}function Se(e){let t=new URL(e.url);if(e.headers.get("Origin")!==t.origin)throw new p("Same-origin request required",403);let o=e.headers.get("Sec-Fetch-Site");if(o&&o!=="same-origin")throw new p("Cross-site request denied",403)}async function Ee(e,t){if(!e.access||!t.ACCESS_AUD||e.access.aud!==t.ACCESS_AUD)return null;try{let o=await e.access.getIdentity(),n=o?.user_uuid??o?.id;return typeof n=="string"&&we.test(n)?n:null}catch{return null}}async function Te(e,t){let o=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? ORDER BY created_at DESC LIMIT 100").bind(t).all();return c({accounts:o.results})}async function Oe(e,t,o){let n=ie(o,["clientAccountId","label","accountKind","currency","bankLabel"]),a=Me(n.clientAccountId,"clientAccountId"),i=re(n.label,"label",100),r=n.accountKind;if(typeof r!="string"||!ke.has(r))throw new p("Invalid manual account kind");if(n.currency!=="COP"&&n.currency!=="USD")throw new p("Only COP and USD are supported");let s=n.currency,m=Ce(n.bankLabel,"bankLabel",80),h=crypto.randomUUID(),b=await e.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency,bank_label) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_account_id) DO NOTHING RETURNING id").bind(h,t,a,i,r,s,m).first();if(b)return c({accountId:b.id,replayed:!1},201);let d=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? AND client_account_id=?").bind(t,a).first();return d?d.label!==i||d.account_kind!==r||d.currency!==s||d.bank_label!==m?c({error:"Account idempotency key was already used for different data"},409):c({accountId:d.id,replayed:!0}):c({error:"Account creation could not be confirmed"},503)}async function _e(e,t){let o=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_manual_entries WHERE owner_id=? UNION ALL SELECT id,NULL AS account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_shortcut_expenses WHERE owner_id=? ORDER BY occurred_at DESC,id DESC LIMIT 100").bind(t,t).all();return c({entries:o.results.map(n=>({...n,amount_minor:String(n.amount_minor)}))})}async function Ne(e,t,o,n=!1){let a=ie(o,["accountId","clientEntryId","amount","currency","paymentMethod","classification","occurredAt","merchant","bankLabel","confirmed"]);if(a.confirmed!==!0)throw new p("Explicit confirmation required");let i=Ie(a.accountId,"accountId"),r=v({tenantId:t,actorId:t,clientEntryId:a.clientEntryId,amount:a.amount,currency:a.currency,paymentMethod:a.paymentMethod,classification:a.classification,occurredAt:a.occurredAt,...a.merchant===void 0?{}:{merchant:a.merchant},...a.bankLabel===void 0?{}:{bankLabel:a.bankLabel}}),s=r.paymentMethod==="debit_card"||r.paymentMethod==="credit_card"||r.paymentMethod==="bank_transfer";if(s&&!r.bankLabel)return c({error:"Bank name required for card or bank transfer"},422);if(!s&&r.bankLabel!==null)return c({error:"Bank name only allowed for card or bank transfer"},422);let m=Number(r.money.amountMinor);if(!Number.isSafeInteger(m))throw new p("Amount exceeds supported integer range");if(!await e.prepare("SELECT id FROM quick_manual_accounts WHERE id=? AND owner_id=? AND currency=?").bind(i,t,r.money.currency).first())return c({error:"Manual account unavailable or currency mismatch"},403);let b=await e.prepare("INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),t,i,r.clientEntryId,m,r.money.currency,r.paymentMethod,r.kind,r.occurredAt,r.merchant,r.bankLabel).first();if(b)return c({entryId:b.id,replayed:!1},201);let d=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=?").bind(t,r.clientEntryId).first();return d?d.account_id!==i||d.amount_minor!==m||d.currency!==r.money.currency||d.payment_method!==r.paymentMethod||d.kind!==r.kind||!n&&d.occurred_at!==r.occurredAt||d.merchant!==r.merchant||d.bank_label!==r.bankLabel?c({error:"Entry idempotency key reused with different data"},409):c({entryId:d.id,replayed:!0}):c({error:"Unable to verify write"},503)}async function Pe(e,t,o){let{pathname:n}=new URL(e.url);if(n==="/healthz"&&e.method==="GET")return c({status:"ok",service:"finanzasoss-quick-staging",writesConfigured:t.ALLOW_WRITES==="true",shortcutsConfigured:t.ALLOW_SHORTCUT_WRITES==="true"});let a=new Set(["/","/quick.css","/quick.js","/dashboard","/dashboard.css","/dashboard.js","/dashboard.webmanifest","/dashboard-icon.svg","/dashboard-icon-180.png","/dashboard-sw.js","/studio.js"]).has(n);if(!a&&!n.startsWith("/api/quick/"))return c({error:"Not found"},404);if(n==="/api/quick/shortcut/expense"&&e.method==="POST")try{return await ee(e,t,o)}catch(r){return oe(r)}let i=await Ee(o,t);if(!i)return c({error:"Cloudflare Access required"},401);if(!t.DB)return c({error:"Database not configured"},503);if(e.method==="GET"&&a)return n==="/"?f(O,"text/html"):n==="/quick.css"?f(_,"text/css"):n==="/quick.js"?f(N,"application/javascript"):n==="/dashboard"?f(P,"text/html"):n==="/dashboard.css"?f(D,"text/css"):n==="/dashboard.js"?f(R,"application/javascript"):n==="/studio.js"?f(z,"application/javascript"):n==="/dashboard.webmanifest"?f(L,"application/manifest+json"):n==="/dashboard-icon.svg"?f(F,"image/svg+xml"):n==="/dashboard-sw.js"?f(U,"application/javascript"):new Response(Uint8Array.from(atob(B),r=>r.charCodeAt(0)),{headers:{"Content-Type":"image/png","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});try{if(e.method==="POST"){if(t.ALLOW_WRITES!=="true")return c({error:"Staging writes disabled"},503);Se(e);let r=await Ae(e);if(n==="/api/quick/accounts")return await Oe(t.DB,i,r);if(n==="/api/quick/entries")return await Ne(t.DB,i,r);if(n==="/api/quick/studio/expense")return await te(t.DB,i,r);if(n==="/api/quick/shortcut/enroll")return t.ALLOW_SHORTCUT_WRITES!=="true"?c({error:"Direct shortcuts disabled"},503):await J(t.DB,i,r);if(n==="/api/quick/shortcut/revoke")return await X(t.DB,i,r)}else if(e.method==="GET"){if(n==="/api/quick/accounts")return await Te(t.DB,i);if(n==="/api/quick/entries")return await _e(t.DB,i);if(n==="/api/quick/dashboard/overview")return await q(t.DB,i);if(n==="/api/quick/studio/capabilities")return V();if(n==="/api/quick/dashboard/movements")return await W(t.DB,i,new URL(e.url));if(n==="/api/quick/shortcut/devices")return await Z(t.DB,i)}return c({error:"Not found"},404)}catch(r){return r instanceof p||r instanceof l?c({error:r.message},r.status):r instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(r.message)?c({error:"Invalid financial entry"},422):c({error:"Unable to process request"},500)}}var Zt={fetch(e,t,o){return Pe(e,t,o)}};export{Zt as default,Pe as handleQuickRequest};
