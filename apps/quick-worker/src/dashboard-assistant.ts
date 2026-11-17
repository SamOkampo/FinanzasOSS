export const ASSISTANT_HTML = `
<button id="assistant-open" data-assistant-enabled="false" hidden type="button" class="assistant-launch"
  aria-haspopup="dialog" aria-controls="assistant-dialog" aria-label="Abrir asistente financiero con IA">
  <span class="assistant-launch-icon" aria-hidden="true">
    <span class="assistant-launch-chart"><i></i><i></i><i></i></span>
  </span>
  <span class="assistant-launch-label">Asistente financiero</span>
  <span class="assistant-launch-ai" aria-hidden="true">IA</span>
  <span id="assistant-launch-count" class="assistant-launch-count" aria-hidden="true" hidden></span>
</button>
<dialog id="assistant-dialog" class="assistant-dialog" aria-labelledby="assistant-title">
  <div class="assistant-heading">
    <div class="assistant-identity">
      <span class="assistant-avatar" aria-hidden="true">Q</span>
      <div><h2 id="assistant-title">Qwen</h2><p>Asistente de FinanzasOSS</p></div>
    </div>
    <form method="dialog"><button autofocus class="assistant-close" aria-label="Cerrar asistente">×</button></form>
  </div>
  <nav class="assistant-nav" aria-label="Secciones de Qwen">
    <button type="button" data-assistant-view="chat" aria-controls="assistant-chat" aria-pressed="false" hidden>Chat</button>
    <button type="button" data-assistant-view="pending" aria-controls="assistant-pending" aria-pressed="false">Pendientes<span id="assistant-count" hidden></span></button>
    <button type="button" data-assistant-view="settings" aria-controls="assistant-settings" aria-pressed="false">Ajustes</button>
  </nav>
  <section id="assistant-chat" class="assistant-chat" data-assistant-chat="false" aria-label="Chat con Qwen" hidden>
    <div class="assistant-chat-tools">
      <button type="button" class="assistant-text-button" id="assistant-chat-threads" aria-expanded="false" aria-controls="assistant-chat-library">Historial</button>
      <button type="button" class="assistant-text-button" id="assistant-chat-new">+ Nuevo chat</button>
    </div>
    <div id="assistant-chat-library" class="assistant-chat-library assistant-fields" hidden>
      <label>Conversaciones guardadas <select id="assistant-chat-history"><option value="">Elige una conversación</option></select></label>
      <div class="assistant-chat-actions">
        <button type="button" class="soft-button" id="assistant-chat-delete" hidden>Borrar conversación</button>
      </div>
    </div>
    <div id="assistant-chat-scroll" class="assistant-chat-scroll" tabindex="0" aria-label="Mensajes de la conversación">
      <div id="assistant-chat-welcome" class="assistant-chat-welcome">
        <div class="assistant-bubble assistant-bubble-qwen"><span class="assistant-speaker">Qwen</span>
          <p>Hola, soy Qwen. ¿Qué quieres revisar hoy?</p>
        </div>
        <div class="assistant-chat-actions" aria-label="Preguntas sugeridas">
          <button type="button" class="assistant-chip" data-question="¿Cuánto gasté por categoría este mes?">Gastos del mes</button>
          <button type="button" class="assistant-chip" data-question="¿Cuáles son mis aportes pendientes en Hapi?">Aportes Hapi</button>
          <button type="button" class="assistant-chip" data-question="¿Cómo va mi portafolio en Hapi?">Portafolio Hapi</button>
          <button type="button" class="assistant-chip" data-question="¿Qué compré en Hapi este mes?">Compras en Hapi</button>
        </div>
      </div>
      <div id="assistant-chat-turns" role="log" aria-label="Conversación" aria-relevant="additions text"></div>
      <div id="assistant-chat-pending" class="assistant-bubble assistant-bubble-qwen assistant-typing" hidden aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
    <form id="assistant-chat-form" class="assistant-compose" autocomplete="off">
      <p id="assistant-chat-status" role="status" aria-live="polite"></p>
      <div class="assistant-compose-row">
        <label class="sr-only" for="assistant-chat-question">Escribe tu mensaje</label>
        <input id="assistant-chat-question" maxlength="200" required placeholder="Escribe tu mensaje…" autocomplete="off" enterkeyhint="send">
        <button type="submit" class="solid-button">Enviar</button>
      </div>
      <details id="assistant-chat-ai-label" class="assistant-chat-options" hidden>
        <summary>Interpretar con IA</summary>
        <label class="ai-document-consent"><input id="assistant-chat-ai" type="checkbox">
          <span>Autorizo enviar a Qwen el texto de este mensaje si hay que interpretarlo.</span>
        </label>
      </details>
    </form>
  </section>
  <div id="assistant-pending" class="assistant-side" hidden>
    <p id="assistant-status" role="status" aria-live="polite"></p>
    <section id="assistant-alerts" class="assistant-fields" aria-label="Alertas financieras"></section>
    <div id="assistant-items"></div>
  </div>
  <div id="assistant-settings" class="assistant-side" hidden>
  <details id="assistant-notice-rules">
    <summary>Avisos y horario</summary>
    <form id="assistant-notice-form" class="assistant-fields" hidden>
      <label class="ai-document-consent">
        <input id="assistant-notices" type="checkbox">
        <span>Avisarme de pendientes financieros</span>
      </label>
      <p class="budget-note" id="assistant-notice-hint"></p>
      <label>Hora del resumen (Bogotá) <select id="assistant-digest-hour"></select></label>
      <label class="ai-document-consent">
        <input id="assistant-quiet" type="checkbox"><span>Silenciar avisos de Qwen durante un horario</span>
      </label>
      <div class="assistant-fields" id="assistant-quiet-hours" hidden>
        <label>Silencio desde <select id="assistant-quiet-start"></select></label>
        <label>Silencio hasta <select id="assistant-quiet-end"></select></label>
        <p class="budget-note">Si el resumen cae en ese horario, saldrá al terminar el silencio.</p>
      </div>
      <div class="assistant-fields" id="assistant-rule-list" role="group" aria-label="Tipos de aviso"></div>
      <button type="submit" class="solid-button">Guardar avisos</button>
      <p id="assistant-notice-status" role="status"></p>
    </form>
  </details>
  <details id="assistant-merchants">
    <summary>Comercios recordados</summary>
    <p class="budget-note">Estas reglas se aplican a compras futuras. Puedes quitarlas y conservar las categorías guardadas.</p>
    <p id="assistant-merchants-status" role="status"></p>
    <div class="assistant-fields" id="assistant-merchants-list"></div>
    <button type="button" class="soft-button" id="assistant-merchants-more" hidden>Ver más comercios</button>
  </details>
  <details id="assistant-credit" hidden>
    <summary>Vencimientos de tarjetas</summary>
    <p id="assistant-credit-empty" hidden>Primero registra la tarjeta en Saldos.</p>
    <form id="assistant-credit-form" class="assistant-fields" hidden>
      <label>Tarjeta <select id="assistant-credit-account" required></select></label>
      <label>Fecha de vencimiento <input id="assistant-credit-date" type="date" required></label>
      <button type="submit" class="soft-button">Guardar vencimiento verificado</button>
    </form>
    <div id="assistant-credit-list" class="assistant-fields"></div>
  </details>
  <p id="assistant-settings-status" role="status"></p>
  </div>
  <section id="assistant-movement" hidden>
    <button id="assistant-back" type="button" class="soft-button">Volver a pendientes</button>
    <button id="assistant-dismiss-category" type="button" class="soft-button">No volver a preguntar por esta compra</button>
    <p id="assistant-movement-status" role="status"></p>
    <h3 id="assistant-concept"></h3>
    <p id="assistant-question"></p>
    <form id="assistant-answer-form" class="assistant-fields" autocomplete="off">
      <label>Tu respuesta <input id="assistant-answer" maxlength="180" required></label>
      <label class="ai-document-consent"><input id="assistant-ai" type="checkbox">
        <span>Autorizo a Qwen a interpretar esta aclaración. Evita escribir datos personales.</span></label>
      <button type="submit" class="soft-button">Continuar</button>
    </form>
    <form id="assistant-category-form" class="assistant-fields">
      <label>Categoría <select id="assistant-category" required></select></label>
      <label>Subcategoría <select id="assistant-subcategory" required></select></label>
      <button type="submit" class="soft-button">Revisar categoría</button>
    </form>
    <div id="assistant-confirmation" class="assistant-fields" hidden>
      <p id="assistant-proposal"></p>
      <label class="ai-document-consent" id="assistant-remember-option">
        <input id="assistant-remember" type="checkbox"><span>Recordar este comercio para futuras compras equivalentes</span>
      </label>
      <button type="button" id="assistant-save" class="solid-button">Confirmar categoría</button>
    </div>
  </section>
</dialog>`;

export const ASSISTANT_CSS = `
.assistant-chat-actions{display:flex;flex-wrap:wrap;gap:8px}
.assistant-chat-turn{padding:12px;border:1px solid var(--rule);border-radius:12px;overflow-wrap:anywhere}
.assistant-chat-chart{margin:12px 0;min-width:0}
.assistant-chat-chart figcaption{font-weight:700}
.assistant-chat-chart p{margin:6px 0}
.assistant-chat-chart meter{width:100%;height:12px;display:block}
.assistant-dialog[open]{display:flex;flex-direction:column;position:fixed;inset:auto 20px 22px auto;margin:0;
  width:min(420px,calc(100% - 40px));height:min(660px,calc(100dvh - 44px));max-width:none;max-height:none;
  padding:0;border:1px solid var(--rule);border-radius:22px;overflow:hidden;
  background:var(--surface);color:var(--ink);box-shadow:0 20px 68px rgba(0,0,0,.22)}
.assistant-launch{position:fixed;z-index:7;right:20px;bottom:22px;
  display:inline-flex;align-items:center;gap:8px;min-height:48px;max-width:calc(100% - 24px);
  padding:6px 10px 6px 6px;border:1px solid #538177;border-radius:16px;
  background:#173c35;color:#f4faf5;box-shadow:0 6px 18px #0a292548;
  font-size:13px;font-weight:750;line-height:1.2;text-align:start}
.assistant-launch:hover{background:#234b43}
.assistant-launch-label{min-width:0}
.assistant-launch-icon{--icon-surface:#c8ead9;flex:none;display:grid;place-items:center;
  width:34px;height:34px;border-radius:10px;background:var(--icon-surface);color:#173c35}
.assistant-launch-chart{position:relative;display:flex;align-items:flex-end;justify-content:center;
  gap:2px;width:22px;height:17px;padding:2px;border:1.5px solid currentColor;border-radius:5px}
.assistant-launch-chart::after{content:"";position:absolute;bottom:-3px;left:3px;width:5px;height:5px;
  background:var(--icon-surface);border:solid currentColor;border-width:0 0 1.5px 1.5px;
  transform:skewY(-35deg)}
.assistant-launch-chart i{width:2px;height:4px;border-radius:1px;background:currentColor}
.assistant-launch-chart i:nth-child(2){height:7px}
.assistant-launch-chart i:nth-child(3){height:10px}
.assistant-launch-ai{flex:none;padding:3px 5px;border:1px solid #6f9e90;border-radius:6px;
  color:#daf2e7;font-size:10px;font-weight:800}
.assistant-launch-count{position:absolute;right:2px;top:-7px;min-width:19px;padding:2px 4px;
  border:1px solid #173c35;border-radius:12px;background:#f3c39b;color:#24332b;
  font-size:10px;font-weight:800;text-align:center}
.assistant-launch-count[hidden]{display:none}
@media(max-width:980px){
  .assistant-launch{right:max(12px,env(safe-area-inset-right));bottom:calc(var(--app-bottom-navigation) + 8px)}
  body:has(.assistant-launch:not([hidden])) .stage>.main{padding-bottom:calc(var(--app-bottom-navigation) + 68px)}
}
.assistant-dialog::backdrop{background:rgba(10,26,25,.42)}
.assistant-heading{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:12px 14px;background:#172e2c;color:#f7faf6}
.assistant-identity{display:flex;align-items:center;gap:10px;min-width:0}
.assistant-heading h2{margin:0;font-size:18px;line-height:1.15}
.assistant-heading p{margin:3px 0 0;color:#d3e2d8;font-size:12px}
.assistant-avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:14px;
  background:#dcecd9;color:#172e2c;font-size:19px;font-weight:800}
.assistant-close{min-width:44px;height:44px;border:0;border-radius:12px;background:transparent;color:inherit;font-size:26px;line-height:1}
.assistant-close:hover{background:#ffffff19}
.assistant-nav{flex:none;display:flex;align-items:center;gap:6px;padding:4px 12px;border-bottom:1px solid var(--rule)}
.assistant-nav button,.assistant-text-button,.assistant-chip{border:1px solid transparent;background:transparent;color:var(--ink);border-radius:10px;min-height:40px;padding:0 10px}
.assistant-nav button{font-weight:700;white-space:nowrap;min-height:44px}
.assistant-nav button[aria-pressed=true]{background:var(--paper);border-color:var(--rule)}
.assistant-nav span{margin-left:5px;font-size:11px;padding:2px 5px;border-radius:9px;background:var(--forest);color:#fff}
.assistant-chat{min-width:0;flex:1;min-height:0;display:flex;flex-direction:column}
.assistant-chat-tools{flex:none;display:flex;justify-content:space-between;padding:0 10px;border-bottom:1px solid var(--rule)}
.assistant-text-button{font-weight:700;text-decoration:underline;text-underline-offset:3px}
.assistant-chat-library{flex:none;max-height:35%;overflow:auto;padding:0 14px}
.assistant-chat-scroll,.assistant-side,#assistant-movement{min-height:0;min-width:0;flex:1;overflow:auto;overscroll-behavior:contain;padding:14px}
.assistant-bubble{width:fit-content;max-width:94%;min-width:0;padding:10px 13px;margin:0 0 10px;
  border-radius:15px;overflow-wrap:anywhere}
.assistant-bubble p{margin:5px 0}
.assistant-bubble-qwen{border:1px solid var(--rule);background:var(--paper);border-bottom-left-radius:4px}
.assistant-bubble-user{margin-left:auto;background:#244541;color:#fff;border-bottom-right-radius:4px}
.assistant-speaker{font-size:11px;font-weight:800;letter-spacing:.025em}
.assistant-chat-welcome .assistant-chip{min-height:36px;border-color:var(--rule);border-radius:24px;font-size:12px;font-weight:700}
.assistant-chip:hover,.assistant-text-button:hover{background:var(--paper)}
.assistant-bubble a{max-width:100%;white-space:normal;text-align:left}
.assistant-compose{flex:none;padding:8px 12px 10px;border-top:1px solid var(--rule)}
.assistant-compose-row{display:flex;gap:8px;align-items:center}
.assistant-compose input:not([type=checkbox]){width:100%;min-width:0;min-height:44px;padding:0 12px;
  border:1px solid var(--rule);border-radius:13px;background:var(--paper);color:var(--ink);font-size:16px}
.assistant-compose button{min-height:44px;white-space:nowrap}
.assistant-compose p{font-size:12px;margin:0 0 5px;overflow-wrap:anywhere}
.assistant-compose p:empty,.assistant-side p:empty,#assistant-movement-status:empty{display:none}
.assistant-chat-options{margin-top:7px;font-size:12px}
.assistant-chat-options summary,.assistant-side summary{cursor:pointer;padding:6px 0}
.assistant-side details{border-bottom:1px solid var(--rule);padding:5px 0}
.assistant-side summary{min-height:44px;padding-top:11px;font-weight:700}
.assistant-typing{display:flex;gap:5px;margin-top:3px;padding:13px}
.assistant-typing i{height:6px;width:6px;border-radius:50%;background:currentColor}
.assistant-typing i:nth-child(2){opacity:.65}.assistant-typing i:nth-child(3){opacity:.35}
.assistant-fields,#assistant-items{display:grid;gap:10px;margin:13px 0}
.assistant-fields label:not(.ai-document-consent){display:grid;gap:6px}
.assistant-fields[hidden],.assistant-dialog [hidden],.assistant-launch[hidden],#hapi-deposits[hidden],#hapi-credit[hidden],#hapi-manual[hidden],#hapi-reports[hidden],#hapi-activity[hidden]{display:none}
#hapi-position-fields fieldset{min-width:0;display:grid;gap:10px;border:1px solid var(--rule);border-radius:12px}
.assistant-fields input:not([type=checkbox]),.assistant-fields select{font-size:16px;width:100%;min-height:42px}
@media(max-width:800px){
  .assistant-dialog[open]{inset:auto 8px max(8px,env(safe-area-inset-bottom)) 8px;width:calc(100% - 16px);
    height:min(660px,calc(100dvh - max(8px,env(safe-area-inset-top)) - max(8px,env(safe-area-inset-bottom))))}
  .fos-keyboard-visible .assistant-dialog[open]{top:calc(var(--fos-visible-top,0px) + 4px);bottom:auto;
    height:calc(var(--fos-visible-height,100dvh) - 8px);animation:none}
  .fos-keyboard-visible .assistant-chat-tools{display:none}
  .fos-keyboard-visible .assistant-heading{padding-block:4px}
  .fos-keyboard-visible .assistant-chat-scroll{padding-block:8px}
}
`;

export const ASSISTANT_JS = String.raw`
(()=>{
  "use strict";
  const byId=id=>document.getElementById("assistant-"+id);
  const dialog=byId("dialog"),status=byId("status"),list=byId("items"),panel=byId("movement");
  const launcher=byId("open");
  if(!dialog||launcher.dataset.assistantEnabled!=="true")return;
  launcher.hidden=false;
  const noticeSettings=document.getElementById("qwen-notice-settings");
  if(noticeSettings)noticeSettings.hidden=false;
  const chatSection=byId("chat"),pendingView=byId("pending"),settingsView=byId("settings");
  const chatEnabled=chatSection.dataset.assistantChat==="true",nav=[...dialog.querySelectorAll("[data-assistant-view]")];
  const startingView=chatEnabled?"chat":"pending";
  let view=startingView,creditAccount=null;
  nav[0].hidden=!chatEnabled;
  const category=byId("category"),subcategory=byId("subcategory"),answer=byId("answer");
  const ai=byId("ai"),notices=byId("notices"),remember=byId("remember"),save=byId("save");
  const noticeForm=byId("notice-form"),noticeStatus=byId("notice-status"),quiet=byId("quiet");
  const digestHour=byId("digest-hour"),quietStart=byId("quiet-start"),quietEnd=byId("quiet-end");
  for(const select of [digestHour,quietStart,quietEnd]){
    for(let hour=0;hour<24;hour++)select.add(new Option(String(hour).padStart(2,"0")+":00",hour));
  }
  quiet.addEventListener("change",()=>{byId("quiet-hours").hidden=!quiet.checked;});
  let current=null,draft=null,taxonomy={},busy=false;
  const base="/api/quick/v41/agent/";
  function message(value){
    const output=!panel.hidden?byId("movement-status"):view==="settings"?byId("settings-status"):status;
    output.textContent=value;
  }
  function showView(next){
    view=next;
    chatSection.hidden=next!=="chat";
    pendingView.hidden=next!=="pending";
    settingsView.hidden=next!=="settings";
    panel.hidden=true;
    if(next==="chat")byId("chat-scroll").scrollTop=byId("chat-scroll").scrollHeight;
    for(const button of nav)button.setAttribute("aria-pressed",String(button.dataset.assistantView===next));
  }
  function el(tag,text,className){
    const node=document.createElement(tag);
    if(text)node.textContent=text;
    if(className)node.className=className;
    return node;
  }
  async function request(path,data){
    const options=data?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}:{};
    const response=await fetch(base+path,{...options,cache:"no-store",credentials:"same-origin"});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(body.error||"No se pudo completar la solicitud.");
    return body;
  }
  function options(control,values,selected){
    control.replaceChildren(new Option("Elige una opción",""),...values.map(value=>new Option(value,value)));
    control.value=selected||"";
  }
  function propose(value){
    draft=value;
    options(category,Object.keys(taxonomy),draft?.category);
    options(subcategory,taxonomy[category.value]||[],draft?.subcategory);
    byId("confirmation").hidden=!draft?.subcategory;
    remember.checked=false;
    byId("remember-option").hidden=!current?.canRemember;
    byId("proposal").textContent=draft?.subcategory?"Propuesta: "+draft.category+" → "+draft.subcategory:"";
  }
  function openMovement(item){
    if(busy)return;
    current=item;
    pendingView.hidden=true;
    panel.hidden=false;
    answer.value="";
    ai.checked=false;
    byId("concept").textContent=item.concept;
    byId("question").textContent=item.question;
    propose(item.draft);
    message(item.draft?"Puedes continuar con la aclaración que guardaste.":"");
    answer.focus();
  }
  function renderAlerts(alerts){
    const box=byId("alerts");
    box.replaceChildren();
    for(const item of alerts){
      const card=el("article","","ai-document-table");
      const title=el("strong",item.title+(item.severity==="important"?" · Atención":""));
      let link;
      if(item.target==="review"){
        link=el("button",item.rule==="possible_duplicate"?"Revisar coincidencias":"Retomar revisión","soft-button");
        link.type="button";
        link.addEventListener("click",()=>{
          dialog.close();
          document.dispatchEvent(new CustomEvent("finanzasoss:v41-open-saved-review",
            {detail:{id:item.targetId,duplicate:item.rule==="possible_duplicate"}}));
        });
      }else{
        link=el("a",item.target==="portfolio"?"Abrir Hapi":item.target==="transfer"?"Ver transferencia":"Abrir Saldos","soft-button");
        link.href=item.target==="portfolio"?"/dashboard#portfolio":item.target==="transfer"?"/dashboard?transfer="+item.targetId+"#imports":"/dashboard#connections";
        link.addEventListener("click",()=>dialog.close());
      }
      const button=el("button","Posponer 24 horas","soft-button");
      button.type="button";
      button.addEventListener("click",async()=>{
        button.disabled=true;
        try{await request("snooze",{key:item.key});await inbox();}
        catch(error){button.disabled=false;message(error.message);}
      });
      const acknowledge=el("button","Marcar aviso como visto","soft-button");
      acknowledge.type="button";
      acknowledge.addEventListener("click",async()=>{
        acknowledge.disabled=true;
        try{await request("acknowledge",{key:item.key,fingerprint:item.fingerprint});await inbox();}
        catch(error){acknowledge.disabled=false;message(error.message);}
      });
      card.append(title,el("p",item.detail),link,button,acknowledge);
      box.append(card);
    }
  }
  function renderCredit(credit){
    const select=byId("credit-account"),list=byId("credit-list"),section=byId("credit");
    const requestedAccount=creditAccount;
    const selected=credit.accounts.find(item=>item.id===(requestedAccount||select.value));
    creditAccount=null;
    select.replaceChildren(new Option("Elige una tarjeta",""),...credit.accounts.map(item=>new Option(item.bank_label,item.id)));
    select.value=selected?.id||"";
    section.hidden=!requestedAccount&&!credit.accounts.length;
    byId("credit-form").hidden=!credit.accounts.length;
    byId("credit-empty").hidden=Boolean(credit.accounts.length);
    if(requestedAccount&&dialog.open&&view==="settings"){
      section.open=true;
      if(selected)byId("credit-date").focus();
      else section.querySelector("summary").focus();
    }
    list.replaceChildren();
    for(const item of credit.dues){
      const row=el("article","","ai-document-table");
      const button=el("button","Marcar como pagado","soft-button");
      button.type="button";
      button.addEventListener("click",async()=>{
        button.disabled=true;
        try{await request("credit-due",{account:item.account_id,dueOn:item.due_on,paid:true,confirmed:true});await inbox();}
        catch(error){button.disabled=false;message(error.message);}
      });
      row.append(el("p",item.bank_label+" · "+item.due_on),button);
      list.append(row);
    }
  }
  function renderNotices(data){
    notices.checked=data.notifications;
    digestHour.value=data.noticeHours.digestHour;
    quiet.checked=data.noticeHours.quietStart!==null;
    quietStart.value=data.noticeHours.quietStart??22;
    quietEnd.value=data.noticeHours.quietEnd??7;
    byId("quiet-hours").hidden=!quiet.checked;
    byId("notice-hint").textContent=data.pushConfigured?
      (data.notifications?"Entrega prevista a las "+data.noticeSchedule+" (Bogotá). ":
        "Los avisos están desactivados. ")+"Activa las notificaciones en el dispositivo para recibirlos.":
      "Los avisos de este entorno todavía no están habilitados.";
    const list=byId("rule-list");
    list.replaceChildren();
    for(const [key,name] of Object.entries(data.ruleLabels)){
      const label=el("label","","ai-document-consent"),input=el("input");
      input.type="checkbox";input.name=key;input.checked=data.rules[key];
      label.append(input,el("span",name));
      list.append(label);
    }
    noticeForm.hidden=false;
  }
  noticeForm.addEventListener("submit",async event=>{
    event.preventDefault();
    const button=noticeForm.querySelector("button");
    const start=quiet.checked?Number(quietStart.value):null,end=quiet.checked?Number(quietEnd.value):null;
    if(start!==null&&start===end){noticeStatus.textContent="Elige dos horas distintas para el silencio.";return;}
    const rules=Object.fromEntries([...byId("rule-list").querySelectorAll("input")].map(input=>[input.name,input.checked]));
    button.disabled=true;
    try{
      await request("preferences",{enabled:notices.checked,confirmed:true,rules,
        hours:{digestHour:Number(digestHour.value),quietStart:start,quietEnd:end}});
      await inbox();
      noticeStatus.textContent="Avisos guardados.";
    }catch(error){noticeStatus.textContent=error.message;}
    finally{button.disabled=false;}
  });
  const merchantSection=byId("merchants"),merchantList=byId("merchants-list"),merchantStatus=byId("merchants-status");
  const moreMerchants=byId("merchants-more");
  let merchantCursor=null,loadingMerchants=false;
  async function loadMerchants(reset){
    if(loadingMerchants)return;
    loadingMerchants=true;
    moreMerchants.disabled=true;
    merchantStatus.textContent="Cargando comercios…";
    try{
      const path=!reset&&merchantCursor?"merchants?"+new URLSearchParams({after:merchantCursor}):"merchants";
      const data=await request(path);
      if(reset)merchantList.replaceChildren();
      for(const item of data.items){
        const row=el("article","","assistant-chat-turn");
        const button=el("button","Olvidar comercio","soft-button");
        button.type="button";
        button.setAttribute("aria-label","Olvidar "+item.merchant);
        button.addEventListener("click",async()=>{
          if(!window.confirm("¿Quitar la regla de "+item.merchant+" para futuras compras?"))return;
          button.disabled=true;
          try{await request("merchants/forget",{merchant:item.merchant,updatedAt:item.updatedAt,confirmed:true});}
          catch(error){merchantStatus.textContent=error.message;button.disabled=false;return;}
          row.remove();
          if(!merchantList.children.length&&merchantCursor)await loadMerchants(false);
          merchantStatus.textContent="Regla quitada para futuras compras.";
        });
        row.append(el("strong",item.merchant),el("p",item.category+" · "+item.subcategory),button);
        merchantList.append(row);
      }
      merchantCursor=data.next;
      moreMerchants.hidden=!merchantCursor;
      merchantStatus.textContent=merchantList.children.length?"":"Todavía no hay comercios recordados.";
    }catch(error){merchantStatus.textContent=error.message;}
    finally{loadingMerchants=false;moreMerchants.disabled=false;}
  }
  merchantSection.addEventListener("toggle",()=>{if(merchantSection.open)loadMerchants(true);});
  moreMerchants.addEventListener("click",()=>loadMerchants(false));
  async function inbox(){
    current=null;
    panel.hidden=true;
    pendingView.hidden=view!=="pending";
    list.replaceChildren();
    noticeForm.hidden=true;
    status.textContent="Cargando pendientes…";
    try{
      const data=await request("inbox");
      taxonomy=data.taxonomy;
      renderAlerts(data.alerts);
      renderCredit(data.credit);
      renderNotices(data);
      if(merchantSection.open)loadMerchants(true);
      ai.closest("label").hidden=!data.aiAvailable;
      byId("chat-ai-label").hidden=!data.aiAvailable;
      for(const item of data.items){
        const button=document.createElement("button");
        button.className="soft-button";
        button.type="button";
        button.textContent=item.concept+(item.draft?" · Aclaración en curso":"");
        button.addEventListener("click",()=>openMovement(item));
        list.append(button);
      }
      const count=data.items.length+data.alerts.length;
      const badge=byId("count");
      badge.textContent=String(count);
      badge.hidden=!count;
      const launcherBadge=byId("launch-count");
      launcherBadge.textContent=count>99?"99+":String(count);
      launcherBadge.hidden=!count;
      const pending=count===1?"1 pendiente":count+" pendientes";
      launcher.setAttribute("aria-label","Abrir asistente financiero con IA"+(count?", "+pending:""));
      status.textContent=count?count+" pendientes para revisar.":"No tienes pendientes para revisar.";
    }catch(error){message(error.message);}
  }
  function setupChat(section){
    const history=byId("chat-history"),turns=byId("chat-turns"),output=byId("chat-status");
    const input=byId("chat-question"),form=byId("chat-form"),remove=byId("chat-delete"),fresh=byId("chat-new");
    const send=form.querySelector("[type=submit]"),consent=byId("chat-ai");
    const scroll=byId("chat-scroll"),pending=byId("chat-pending"),welcome=byId("chat-welcome");
    const threads=byId("chat-threads"),library=byId("chat-library"),consentPanel=byId("chat-ai-label");
    let id="",working=false,retry=null,saved=false;
    const format=(amount,currency)=>new Intl.NumberFormat("es-CO",{style:"currency",currency}).format(Number(amount)/100);
    function bottom(){scroll.scrollTop=scroll.scrollHeight;}
    function bubble(who,message){
      const card=el("div","","assistant-bubble assistant-bubble-"+(who==="Qwen"?"qwen":"user"));
      card.append(el("span",who,"assistant-speaker"),el("p",message));
      return card;
    }
    function render(turn,includeQuestion=true){
      const answer=turn.answer,card=bubble("Qwen",answer.text);
      if(includeQuestion)turns.append(bubble("Tú",turn.question));
      if(answer.totalMinor!==undefined&&answer.currency)card.append(el("strong",format(answer.totalMinor,answer.currency)));
      if(answer.points?.length&&answer.currency){
        const figure=el("figure","","assistant-chat-chart");
        const titles={spending:"Gastos por categoría",hapi_deposits:"Acreditaciones por banco",
          hapi_purchases:"Compras y reinversiones por activo",hapi_portfolio:"Valor por fecha de corte"};
        figure.append(el("figcaption",titles[answer.topic]||"Importes registrados"));
        const max=Math.max(...answer.points.map(point=>Math.abs(Number(point.minor))),1);
        for(const point of answer.points){
          const description=point.label+" · "+format(point.minor,answer.currency);
          const meter=el("meter");
          meter.min=0;meter.max=max;meter.value=Math.abs(Number(point.minor));
          meter.setAttribute("aria-label",description);
          figure.append(el("p",description),meter);
        }
        card.append(figure);
      }
      if(answer.target){
        const link=el("a",answer.source,"soft-button");
        link.href=answer.target;link.addEventListener("click",()=>dialog.close());card.append(link);
      }
      turns.append(card);
    }
    function closeHistory(){
      library.hidden=true;
      threads.setAttribute("aria-expanded","false");
    }
    function freshThread(){
      id="";retry=null;saved=false;turns.replaceChildren();history.value="";welcome.hidden=false;
      remove.hidden=true;input.value="";consent.checked=false;output.textContent="";
      consentPanel.open=false;closeHistory();scroll.scrollTop=0;
    }
    async function loadHistory(){
      const data=await request("chat");
      history.replaceChildren(new Option(data.items.length?"Elige una conversación":"Aún no hay conversaciones",""),
        ...data.items.map(item=>new Option(item.title,item.id)));
      history.value=data.items.some(item=>item.id===id)?id:"";
      remove.hidden=!saved;
    }
    function setBusy(value){
      working=value;history.disabled=value;send.disabled=value;remove.disabled=value;fresh.disabled=value;threads.disabled=value;
    }
    window.visualViewport?.addEventListener("resize",()=>{if(document.activeElement===input)requestAnimationFrame(bottom);});
    threads.addEventListener("click",async()=>{
      if(!library.hidden){closeHistory();return;}
      library.hidden=false;threads.setAttribute("aria-expanded","true");
      setBusy(true);
      try{output.textContent="Cargando historial…";await loadHistory();output.textContent="";}
      catch(error){output.textContent=error.message;}
      finally{setBusy(false);}
    });
    fresh.addEventListener("click",()=>{if(!working){freshThread();input.focus({preventScroll:true});}});
    for(const button of section.querySelectorAll("[data-question]"))
      button.addEventListener("click",()=>{if(!working){input.value=button.dataset.question;input.focus({preventScroll:true});}});
    history.addEventListener("change",async()=>{
      if(working)return;
      if(!history.value){freshThread();return;}
      setBusy(true);output.textContent="Cargando conversación…";
      try{
        const data=await request("chat?id="+encodeURIComponent(history.value));
        id=data.thread.id;retry=null;saved=true;input.value="";consent.checked=false;consentPanel.open=false;turns.replaceChildren();
        for(const turn of data.turns)render(turn);
        welcome.hidden=Boolean(data.turns.length);remove.hidden=false;output.textContent="";
        closeHistory();threads.focus({preventScroll:true});bottom();
      }catch(error){output.textContent=error.message;history.value=id; }
      finally{setBusy(false);}
    });
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const question=input.value.trim();
      if(working||!question)return;
      if(!id)id=crypto.randomUUID();
      if(!retry||retry.question!==question)retry={id,question,turnId:crypto.randomUUID()};
      const optimistic=bubble("Tú",question),allowAI=consent.checked;
      input.value="";consent.checked=false;consentPanel.open=false;
      welcome.hidden=true;turns.append(optimistic);pending.hidden=false;
      setBusy(true);output.textContent="Qwen está consultando tus registros…";bottom();
      try{
        const data=await request("chat",{...retry,allowAI});
        render(data.turn,false);retry=null;saved=true;remove.hidden=false;output.textContent="";
      }catch(error){
        optimistic.remove();welcome.hidden=Boolean(turns.children.length);
        if(!input.value)input.value=question;
        output.textContent=error.message;
      }
      finally{pending.hidden=true;setBusy(false);bottom();}
    });
    remove.addEventListener("click",async()=>{
      if(working||!id||!window.confirm("¿Borrar esta conversación?"))return;
      setBusy(true);
      try{await request("chat/delete",{id,confirmed:true});freshThread();output.textContent="Conversación borrada.";}
      catch(error){output.textContent=error.message;}
      finally{setBusy(false);}
    });
  }
  if(chatEnabled)setupChat(chatSection);
  for(const button of nav)button.addEventListener("click",()=>{if(!busy)showView(button.dataset.assistantView);});
  function open(next){
    if(dialog.open){if(!busy)showView(next);return;}
    showView(next);dialog.showModal();inbox();
  }
  launcher.addEventListener("click",()=>open(startingView));
  document.addEventListener("finanzas:credit-due",event=>{
    creditAccount=event.detail;
    open("settings");
  });
  function openFromHash(){
    if(location.hash==="#qwen")open(startingView);
    if(location.hash==="#qwen-pending")open("pending");
    if(location.hash==="#qwen-settings"){
      byId("notice-form").closest("details").open=true;
      open("settings");
    }
  }
  openFromHash();
  window.addEventListener("hashchange",openFromHash);
  dialog.addEventListener("close",()=>{
    creditAccount=null;
    const section=location.hash==="#qwen-settings"?"#settings":
      ["#qwen","#qwen-pending"].includes(location.hash)?"#plan":null;
    if(section)history.replaceState(null,"",location.pathname+location.search+section);
  });
  byId("back").addEventListener("click",()=>{if(!busy)inbox();});
  byId("dismiss-category").addEventListener("click",async()=>{
    if(busy||!current||!window.confirm("¿Quitar esta pregunta de Pendientes? Puedes clasificar la compra desde Movimientos."))return;
    const button=byId("dismiss-category");
    busy=true;button.disabled=true;
    try{
      await request("category/dismiss",{source:current.source,id:current.id,confirmed:true});
      await inbox();message("Pregunta quitada de Pendientes.");
    }catch(error){message(error.message);}
    finally{busy=false;button.disabled=false;}
  });
  byId("credit-form").addEventListener("submit",async event=>{
    event.preventDefault();
    const button=event.currentTarget.querySelector("button");
    button.disabled=true;
    try{
      await request("credit-due",{account:byId("credit-account").value,dueOn:byId("credit-date").value,paid:false,confirmed:true});
      byId("credit-date").value="";
      await inbox();
    }catch(error){message(error.message);}
    finally{button.disabled=false;}
  });
  category.addEventListener("change",()=>{
    options(subcategory,taxonomy[category.value]||[]);
    byId("confirmation").hidden=true;
  });
  subcategory.addEventListener("change",()=>{byId("confirmation").hidden=true;});
  async function prepare(data){
    if(!current||busy)return;
    busy=true;
    byId("confirmation").hidden=true;
    try{
      const proposal=await request("answer",{id:current.id,source:current.source,...data});
      propose(proposal);
      message(proposal.subcategory?"Revisa y confirma la categoría.":"Elige una subcategoría para "+proposal.category+".");
    }catch(error){message(error.message);}
    finally{busy=false;}
  }
  byId("answer-form").addEventListener("submit",event=>{
    event.preventDefault();
    prepare({answer:answer.value,allowAI:ai.checked});
  });
  byId("category-form").addEventListener("submit",event=>{
    event.preventDefault();
    prepare({category:category.value,subcategory:subcategory.value});
  });
  save.addEventListener("click",async()=>{
    if(!current||!draft?.subcategory||busy||byId("confirmation").hidden)return;
    busy=true;
    save.disabled=true;
    try{
      const result=await request("confirm",{id:current.id,source:current.source,token:draft.token,
        confirmed:true,rememberMerchant:remember.checked});
      document.getElementById("reload")?.click();
      await inbox();
      message(result.learningBlocked?"Categoría guardada. Este descriptor requiere revisión individual.":"Categoría guardada.");
    }catch(error){message(error.message);}
    finally{busy=false;save.disabled=false;}
  });
})();`;
