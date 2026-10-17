var Te=Object.freeze({automaticActivationAllowed:!1,automaticChargingAllowed:!1,paymentProcessorCallsEnabled:!1,pricesMayBeInvented:!1,pendingAssignmentGrantsEntitlements:!1,productionBillingRequiresExplicitAuthorization:!0});function E(e){switch(e){case"purchase":case"fee":case"tax":return"expense";case"income":return"income";case"refund":return"refund";case"transfer":return"internal_transfer";case"investment_transfer":return"investment_flow";case"investment_activity":return"investment_activity";case"debt_payment":return"debt_flow";case"cash_withdrawal":case"cash_deposit":return"cash_movement";case"adjustment":return"neutral";case"unknown":return"unknown"}}var q=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),W=new Set(["expense","own_transfer","investment_transfer"]);function y(e,n,r){if(typeof e!="string")throw new Error(n+" must be text");let t=e.trim();if(!t||t.length>r||/[\u0000-\u001f\u007f]/.test(t))throw new Error(n+" is invalid");return t}function A(e,n,r){return e==null||e===""?null:y(e,n,r)}function j(e){if(typeof e!="string"||!/^(?:0|[1-9][0-9]{0,10})(?:\.[0-9]{1,2})?$/.test(e))throw new Error("Amount must be an ungrouped decimal with at most two fractional digits");let n=e.split("."),r=n[0],t=(n[1]??"").padEnd(2,"0"),i=BigInt(r)*100n+BigInt(t||"0");if(i<=0n||i>1000000000000n)throw new Error("Amount must be positive and within the permitted limit");return i}function K(e){if(typeof e!="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{3})?Z$/.test(e))throw new Error("occurredAt must be canonical UTC");let n=new Date(e);if(Number.isNaN(n.getTime())||(e.endsWith(".000Z")?n.toISOString()!==e:n.toISOString().replace(".000Z","Z")!==e))throw new Error("occurredAt is invalid");return e}function b(e){if(e===null||typeof e!="object"||Array.isArray(e))throw new Error("Quick entry input must be an object");let n=y(e.tenantId,"tenantId",128),r=y(e.actorId,"actorId",128),t=y(e.clientEntryId,"clientEntryId",96);if(!/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(t))throw new Error("clientEntryId must be a stable, caller-generated idempotency key");if(e.currency!=="COP"&&e.currency!=="USD")throw new Error("Only explicitly supported currencies COP and USD are allowed");if(!q.has(e.paymentMethod))throw new Error("Payment method is not supported");if(!W.has(e.classification))throw new Error("Classification must be explicitly selected");let i=e.classification==="expense"?"purchase":e.classification==="own_transfer"?"transfer":"investment_transfer",s=Object.freeze({amountMinor:j(e.amount),currency:e.currency});return Object.freeze({tenantId:n,actorId:r,clientEntryId:t,money:s,occurredAt:K(e.occurredAt),paymentMethod:e.paymentMethod,bankLabel:A(e.bankLabel,"bankLabel",80),merchant:A(e.merchant,"merchant",120),classification:e.classification,kind:i,economicClass:E(i),direction:"debit",sourceType:"manual",requiresUserConfirmation:!0,persistenceEnabled:!1,accountSelectionRequiredBeforePosting:!0})}var _=`<!doctype html>
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
</body></html>`,T=':root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#16242c;background:#f4f3f0;font-synthesis:none}*{box-sizing:border-box}body{margin:0}.shell{max-width:820px;margin:0 auto;padding:0 24px 52px}.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d3d6d3;padding:25px 0 22px;gap:12px}.brand{display:flex;align-items:center;gap:10px;font-size:14px;letter-spacing:.075em;font-weight:800}.brand-light{font-weight:450;color:#6a7c83}.brand-icon{display:grid;place-content:center;height:35px;width:35px;border-radius:7px;background:#16242c;color:#fff;font-size:19px;letter-spacing:-.08em}.brand-icon span{color:#8cf0bb}.env{display:flex;align-items:center;gap:7px;border:1px solid #cbd6d1;border-radius:4px;padding:8px 10px;color:#53665c;font-size:10px;font-weight:750;letter-spacing:.065em;white-space:nowrap}.env-dot{height:7px;width:7px;border-radius:50%;background:#53b585}.intro{padding:50px 0 20px}.eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#6e8b7b}.intro h1{font-size:clamp(36px,7vw,60px);letter-spacing:-.065em;line-height:1.06;margin:14px 0 12px;font-weight:780}.intro em{font-style:normal;color:#478c68}.intro p{font-size:14px;line-height:1.65;max-width:440px;color:#63747a}.warning{display:flex;gap:12px;background:#edf2ea;border:1px solid #d3dfd1;padding:13px 16px;font-size:12px;line-height:1.5;color:#416147;margin:16px 0 26px;border-radius:4px}.warning>span:first-child{font-size:13px}.panel{background:#fff;border:1px solid #d9deda;border-radius:7px;padding:29px;margin-bottom:16px;box-shadow:0 4px 18px rgba(18,36,27,.025)}.panel.compact{padding:25px 29px}.panel-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:23px}.panel h2,.history h2{font-size:21px;letter-spacing:-.035em;margin:6px 0 0;font-weight:720}.pill{background:#f2f3f0;color:#73817c;font-size:10px;border:1px solid #dfe4e0;border-radius:4px;padding:7px 9px;white-space:nowrap}.pill.enabled{color:#287d4b;background:#e8f6ec;border-color:#c4e4cf}.field-label{display:block;font-size:11px;letter-spacing:.03em;font-weight:720;margin-bottom:9px;color:#3b4c50}.amount-field{height:78px;display:flex;align-items:center;border-bottom:2px solid #1e3c32;gap:12px;margin-bottom:8px}.amount-field>span{font-size:30px;font-weight:500;color:#4d6858}.amount-field input{border:0;outline:0;flex:1;min-width:0;font-size:44px;letter-spacing:-.05em;font-weight:750;font-variant-numeric:tabular-nums;padding:0;background:transparent;color:#16242c}.amount-field small{font-size:12px;color:#7b8982;letter-spacing:.06em}.hint{font-size:11px;line-height:1.5;color:#82918c}.grid-fields{display:grid;grid-template-columns:1fr 1fr;gap:22px 17px;margin-top:29px}input:not(.amount-field input),select{display:block;width:100%;height:45px;border:1px solid #d8dfda;border-radius:4px;padding:10px 11px;color:#253730;background:#fafbf8;font-size:13px;font:inherit;outline-offset:3px}input:focus,select:focus{border-color:#5aa078}.submit-zone{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #e8ebe7;padding-top:24px;margin-top:25px}.submit-zone .hint{max-width:260px}button{border:0;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:space-between;gap:20px;font-size:13px;font-weight:750;transition:transform .12s,background .12s}button:not(:disabled):active{transform:translateY(1px)}button:disabled{cursor:not-allowed;opacity:.5}button[type=submit]:not(.secondary){min-height:46px;color:#fff;background:#1d4b37;padding:12px 18px}button[type=submit]:not(.secondary):hover:not(:disabled){background:#28704e}.account-row{display:flex;align-items:end;gap:12px}.account-row>.grow{flex:1}.account-row>div:last-child{width:155px}.secondary{min-height:43px;padding:10px 14px;border:1px solid #cbd6cf;background:#e9f2ed;color:#285b3e;margin-top:17px}.subline{font-size:12px;color:#738078;margin:-14px 0 18px}.feedback{min-height:0;font-size:12px;line-height:1.55;margin-top:12px}.feedback:empty{display:none}.feedback.error{color:#ae3e3e}.feedback.good{color:#217448}.history{padding:27px 5px 15px;margin-bottom:8px}.history .panel-title{padding:0 3px}.mini{font-size:11px;color:#37674d;background:transparent;padding:9px 3px}.history-body{border-top:1px solid #d7ddd8}.entry-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:17px 4px;border-bottom:1px solid #e0e4df}.entry-description{font-size:13px;font-weight:720}.entry-meta{font-size:11px;color:#728079;margin-top:5px}.entry-amount{font-size:15px;font-weight:760;font-variant-numeric:tabular-nums;white-space:nowrap}.empty{padding:24px 4px;color:#89968e;font-size:13px}footer{text-align:center;border-top:1px solid #d7ded7;padding:24px 0;color:#96a19a;font-size:9px;letter-spacing:.1em}@media(max-width:560px){.shell{padding:0 18px 30px}.intro{padding:32px 0 13px}.intro h1{font-size:45px}.panel,.panel.compact{padding:21px 18px}.grid-fields{grid-template-columns:1fr 1fr;gap:18px 11px}.submit-zone{flex-direction:column;align-items:stretch}.submit-zone .hint{max-width:none}button[type=submit]:not(.secondary){width:100%}.amount-field input{font-size:37px}.env{font-size:9px}.account-row{flex-direction:column;align-items:stretch}.account-row>div:last-child{width:100%}}@media(prefers-reduced-motion:reduce){button{transition:none}}.token-once{word-break:break-all;user-select:all;font:12px ui-monospace,monospace;margin-top:12px;color:#285b3e;line-height:1.5}',S=`"use strict";
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
})();`;var G=/^fosq_[0-9a-f]{64}$/,H=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,$=new Set(["cash","debit_card","credit_card","bank_transfer","digital_wallet","other"]),V=new Set(["debit_card","credit_card","bank_transfer"]),l=class extends Error{constructor(r,t=422){super(r);this.status=t}};function m(e,n=200){return new Response(JSON.stringify(e),{status:n,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function M(e,n){if(!e||typeof e!="object"||Array.isArray(e))throw new l("JSON object required");let r=e;if(Object.keys(r).some(t=>!n.includes(t)))throw new l("Unsupported field");return r}function w(e,n,r){if(typeof e!="string")throw new l(r+" must be text");let t=e.trim();if(!t||t.length>n||/[\u0000-\u001f\u007f]/.test(t))throw new l(r+" is invalid");return t}function Q(e,n,r){return e==null||e===""?null:w(e,n,r)}async function Y(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new l("Content-Type must be application/json",415);let n=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(n)||n<0||n>4096)throw new l("Body too large",413);let r=await e.text();if(r.length>4096)throw new l("Body too large",413);try{return JSON.parse(r)}catch{throw new l("Invalid JSON")}}function Z(){let e=crypto.getRandomValues(new Uint8Array(32));return"fosq_"+Array.from(e,n=>n.toString(16).padStart(2,"0")).join("")}async function D(e){let n=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return Array.from(new Uint8Array(n),r=>r.toString(16).padStart(2,"0")).join("")}function P(e){return V.has(e)}async function N(e,n,r){let t=M(r,["label","confirmed"]);if(t.confirmed!==!0)throw new l("Enrollment confirmation required");let i=w(t.label,50,"Device label"),s=Z(),o=new Date(Date.now()+90*864e5).toISOString(),u=crypto.randomUUID();return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),n).all(),await e.prepare("INSERT INTO quick_shortcut_devices(id,owner_id,token_hash,label,expires_at) VALUES(?,?,?,?,?) RETURNING id").bind(u,n,await D(s),i,o).first(),m({deviceId:u,token:s,expiresAt:o},201)}async function R(e,n){let r=await e.prepare("SELECT id,label,expires_at FROM quick_shortcut_devices WHERE owner_id=? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 5").bind(n).all();return m({devices:r.results})}async function F(e,n,r){if(M(r,["confirmed"]).confirmed!==!0)throw new l("Revocation confirmation required");return await e.prepare("UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id").bind(new Date().toISOString(),n).all(),m({revoked:!0})}function O(e,n){return e.amount_minor!==n.amountMinor||e.currency!=="COP"||e.payment_method!==n.paymentMethod||e.kind!==n.kind||e.merchant!==n.merchant||e.bank_label!==n.bankLabel?m({error:"Entry idempotency key reused with different data"},409):m({entryId:e.id,replayed:!0})}async function B(e,n,r){if(!n.ACCESS_AUD||r.access?.aud!==n.ACCESS_AUD)return m({error:"Cloudflare Access required"},401);if(n.ALLOW_WRITES!=="true"||n.ALLOW_SHORTCUT_WRITES!=="true")return m({error:"Direct shortcuts disabled"},503);let t=e.headers.get("Authorization")??"",i=t.startsWith("Bearer ")?t.slice(7):"";if(!G.test(i))return m({error:"Device authorization required"},401);let s=await n.DB.prepare("SELECT owner_id FROM quick_shortcut_devices WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? LIMIT 1").bind(await D(i),new Date().toISOString()).first();if(!s)return m({error:"Device authorization expired or revoked"},401);let o=M(await Y(e),["clientEntryId","amount","concept","paymentMethod","bankLabel"]),u=w(o.clientEntryId,96,"clientEntryId");if(!H.test(u))throw new l("Invalid clientEntryId");let p=w(o.concept,120,"Concept");if(typeof o.amount!="string")throw new l("Amount must be text");let g=o.paymentMethod;if(typeof g!="string"||!$.has(g))throw new l("Invalid payment method");let f=Q(o.bankLabel,80,"Bank");if(P(g)&&!f||!P(g)&&f!==null)throw new l("Bank is required for cards/transfers only");let a=b({tenantId:s.owner_id,actorId:s.owner_id,clientEntryId:u,amount:o.amount,currency:"COP",paymentMethod:g,classification:"expense",occurredAt:new Date().toISOString(),merchant:p,...f===null?{}:{bankLabel:f}}),v=Number(a.money.amountMinor);if(!Number.isSafeInteger(v))throw new l("Invalid amount");let h={ownerId:s.owner_id,clientEntryId:u,amountMinor:v,paymentMethod:a.paymentMethod,kind:a.kind,merchant:a.merchant,bankLabel:a.bankLabel},I=await n.DB.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(h.ownerId,u).first();if(I)return O(I,h);let C=await n.DB.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),h.ownerId,u,v,"COP",a.paymentMethod,a.kind,a.occurredAt,a.merchant,a.bankLabel).first();if(C)return m({entryId:C.id,replayed:!1},201);let k=await n.DB.prepare("SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=? LIMIT 1").bind(h.ownerId,u).first();return k?O(k,h):m({error:"Unable to verify write"},503)}function L(e){return e instanceof l?m({error:e.message},e.status):e instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(e.message)?m({error:"Invalid financial entry"},422):m({error:"Unable to process request"},500)}var J=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/,X=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/,ee=new Set(["cash","bank_manual","credit_manual","wallet_manual"]),d=class extends Error{constructor(r,t=422){super(r);this.status=t}};function c(e,n=200){return new Response(JSON.stringify(e),{status:n,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"}})}function x(e,n){let r=n==="text/html"?"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'":"default-src 'none'; frame-ancestors 'none'";return new Response(e,{status:200,headers:{"Content-Type":n+"; charset=utf-8","Cache-Control":"no-store, private","Content-Security-Policy":r,"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"}})}function U(e,n,r){if(typeof e!="string")throw new d(n+" is invalid");let t=e.trim();if(!t||t.length>r||/[\u0000-\u001f\u007f]/.test(t))throw new d(n+" is invalid");return t}function ne(e,n,r){return e==null||e===""?null:U(e,n,r)}function te(e,n){if(typeof e!="string"||!J.test(e))throw new d(n+" is invalid");return e}function re(e,n){if(typeof e!="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))throw new d(n+" must be a UUID");return e.toLowerCase()}function z(e,n){if(!e||typeof e!="object"||Array.isArray(e))throw new d("Expected a JSON object");let r=e;for(let t of Object.keys(r))if(!n.includes(t))throw new d("Unsupported field: "+t);return r}async function oe(e){if(e.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")throw new d("Content-Type must be application/json",415);let n=Number(e.headers.get("Content-Length")??"0");if(!Number.isFinite(n)||n<0||n>4096)throw new d("Request body exceeds limit",413);let r=await e.text();if(r.length>4096)throw new d("Request body exceeds limit",413);try{return JSON.parse(r)}catch{throw new d("Invalid JSON")}}function ie(e){let n=new URL(e.url);if(e.headers.get("Origin")!==n.origin)throw new d("Same-origin request required",403);let r=e.headers.get("Sec-Fetch-Site");if(r&&r!=="same-origin")throw new d("Cross-site request denied",403)}async function ae(e,n){if(!e.access||!n.ACCESS_AUD||e.access.aud!==n.ACCESS_AUD)return null;try{let r=await e.access.getIdentity(),t=r?.user_uuid??r?.id;return typeof t=="string"&&X.test(t)?t:null}catch{return null}}async function se(e,n){let r=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? ORDER BY created_at DESC LIMIT 100").bind(n).all();return c({accounts:r.results})}async function ce(e,n,r){let t=z(r,["clientAccountId","label","accountKind","currency","bankLabel"]),i=te(t.clientAccountId,"clientAccountId"),s=U(t.label,"label",100),o=t.accountKind;if(typeof o!="string"||!ee.has(o))throw new d("Invalid manual account kind");if(t.currency!=="COP"&&t.currency!=="USD")throw new d("Only COP and USD are supported");let u=t.currency,p=ne(t.bankLabel,"bankLabel",80),g=crypto.randomUUID(),f=await e.prepare("INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency,bank_label) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_account_id) DO NOTHING RETURNING id").bind(g,n,i,s,o,u,p).first();if(f)return c({accountId:f.id,replayed:!1},201);let a=await e.prepare("SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? AND client_account_id=?").bind(n,i).first();return a?a.label!==s||a.account_kind!==o||a.currency!==u||a.bank_label!==p?c({error:"Account idempotency key was already used for different data"},409):c({accountId:a.id,replayed:!0}):c({error:"Account creation could not be confirmed"},503)}async function le(e,n){let r=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_manual_entries WHERE owner_id=? UNION ALL SELECT id,NULL AS account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at FROM quick_shortcut_expenses WHERE owner_id=? ORDER BY occurred_at DESC,id DESC LIMIT 100").bind(n,n).all();return c({entries:r.results.map(t=>({...t,amount_minor:String(t.amount_minor)}))})}async function de(e,n,r,t=!1){let i=z(r,["accountId","clientEntryId","amount","currency","paymentMethod","classification","occurredAt","merchant","bankLabel","confirmed"]);if(i.confirmed!==!0)throw new d("Explicit confirmation required");let s=re(i.accountId,"accountId"),o=b({tenantId:n,actorId:n,clientEntryId:i.clientEntryId,amount:i.amount,currency:i.currency,paymentMethod:i.paymentMethod,classification:i.classification,occurredAt:i.occurredAt,...i.merchant===void 0?{}:{merchant:i.merchant},...i.bankLabel===void 0?{}:{bankLabel:i.bankLabel}}),u=o.paymentMethod==="debit_card"||o.paymentMethod==="credit_card"||o.paymentMethod==="bank_transfer";if(u&&!o.bankLabel)return c({error:"Bank name required for card or bank transfer"},422);if(!u&&o.bankLabel!==null)return c({error:"Bank name only allowed for card or bank transfer"},422);let p=Number(o.money.amountMinor);if(!Number.isSafeInteger(p))throw new d("Amount exceeds supported integer range");if(!await e.prepare("SELECT id FROM quick_manual_accounts WHERE id=? AND owner_id=? AND currency=?").bind(s,n,o.money.currency).first())return c({error:"Manual account unavailable or currency mismatch"},403);let f=await e.prepare("INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id").bind(crypto.randomUUID(),n,s,o.clientEntryId,p,o.money.currency,o.paymentMethod,o.kind,o.occurredAt,o.merchant,o.bankLabel).first();if(f)return c({entryId:f.id,replayed:!1},201);let a=await e.prepare("SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=?").bind(n,o.clientEntryId).first();return a?a.account_id!==s||a.amount_minor!==p||a.currency!==o.money.currency||a.payment_method!==o.paymentMethod||a.kind!==o.kind||!t&&a.occurred_at!==o.occurredAt||a.merchant!==o.merchant||a.bank_label!==o.bankLabel?c({error:"Entry idempotency key reused with different data"},409):c({entryId:a.id,replayed:!0}):c({error:"Unable to verify write"},503)}async function ue(e,n,r){let{pathname:t}=new URL(e.url);if(t==="/healthz"&&e.method==="GET")return c({status:"ok",service:"finanzasoss-quick-staging",writesConfigured:n.ALLOW_WRITES==="true",shortcutsConfigured:n.ALLOW_SHORTCUT_WRITES==="true"});let i=t==="/"||t==="/quick.css"||t==="/quick.js";if(!i&&!t.startsWith("/api/quick/"))return c({error:"Not found"},404);if(t==="/api/quick/shortcut/expense"&&e.method==="POST")try{return await B(e,n,r)}catch(o){return L(o)}let s=await ae(r,n);if(!s)return c({error:"Cloudflare Access required"},401);if(!n.DB)return c({error:"Database not configured"},503);if(e.method==="GET"&&i)return t==="/"?x(_,"text/html"):t==="/quick.css"?x(T,"text/css"):x(S,"application/javascript");try{if(e.method==="POST"){if(n.ALLOW_WRITES!=="true")return c({error:"Staging writes disabled"},503);ie(e);let o=await oe(e);if(t==="/api/quick/accounts")return await ce(n.DB,s,o);if(t==="/api/quick/entries")return await de(n.DB,s,o);if(t==="/api/quick/shortcut/enroll")return n.ALLOW_SHORTCUT_WRITES!=="true"?c({error:"Direct shortcuts disabled"},503):await N(n.DB,s,o);if(t==="/api/quick/shortcut/revoke")return await F(n.DB,s,o)}else if(e.method==="GET"){if(t==="/api/quick/accounts")return await se(n.DB,s);if(t==="/api/quick/entries")return await le(n.DB,s);if(t==="/api/quick/shortcut/devices")return await R(n.DB,s)}return c({error:"Not found"},404)}catch(o){return o instanceof d||o instanceof l?c({error:o.message},o.status):o instanceof Error&&/^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(o.message)?c({error:"Invalid financial entry"},422):c({error:"Unable to process request"},500)}}var on={fetch(e,n,r){return ue(e,n,r)}};export{on as default,ue as handleQuickRequest};
