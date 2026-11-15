export const ASSISTANT_HTML = `
<button id="assistant-open" data-assistant-enabled="false" hidden type="button" class="solid-button assistant-launch" aria-haspopup="dialog">Qwen</button>
<dialog id="assistant-dialog" class="assistant-dialog" aria-labelledby="assistant-title">
  <div class="assistant-heading">
    <h2 id="assistant-title">Asistente Qwen</h2>
    <form method="dialog"><button class="soft-button" aria-label="Cerrar asistente">Cerrar</button></form>
  </div>
  <details id="assistant-chat" data-assistant-chat="false" hidden>
    <summary>Consultas y gráficos</summary>
    <div class="assistant-fields">
      <label>Historial de conversaciones <select id="assistant-chat-history"></select></label>
      <div class="assistant-chat-actions">
        <button type="button" class="soft-button" id="assistant-chat-new">Nueva conversación</button>
        <button type="button" class="soft-button" id="assistant-chat-delete" hidden>Borrar conversación</button>
      </div>
      <p id="assistant-chat-status" role="status" aria-live="polite"></p>
      <div id="assistant-chat-turns" class="assistant-fields"></div>
      <form id="assistant-chat-form" class="assistant-fields" autocomplete="off">
        <label>Pregunta sobre tus registros <input id="assistant-chat-question" maxlength="200" required placeholder="Ej.: ¿En qué gasté este mes?"></label>
        <p class="budget-note">Las preguntas y respuestas quedan en tu historial privado.</p>
        <div class="assistant-chat-actions">
          <button type="button" class="soft-button" data-question="¿Cuánto gasté por categoría este mes?">Gastos del mes</button>
          <button type="button" class="soft-button" data-question="¿Cuáles son mis aportes pendientes en Hapi?">Aportes Hapi</button>
          <button type="button" class="soft-button" data-question="¿Cómo va mi portafolio en Hapi?">Portafolio Hapi</button>
        </div>
        <label class="ai-document-consent" id="assistant-chat-ai-label" hidden><input id="assistant-chat-ai" type="checkbox">
          <span>Autorizo enviarle a Qwen el texto para interpretar la pregunta.</span>
        </label>
        <button type="submit" class="solid-button">Consultar</button>
      </form>
    </div>
  </details>
  <p id="assistant-status" role="status" aria-live="polite"></p>
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
  <section id="assistant-alerts" class="assistant-fields" aria-label="Alertas financieras"></section>
  <details id="assistant-credit">
    <summary>Vencimientos de tarjetas</summary>
    <p id="assistant-credit-empty" hidden>Primero registra la tarjeta en Saldos.</p>
    <form id="assistant-credit-form" class="assistant-fields">
      <label>Tarjeta <select id="assistant-credit-account" required></select></label>
      <label>Fecha de vencimiento <input id="assistant-credit-date" type="date" required></label>
      <button type="submit" class="soft-button">Guardar vencimiento verificado</button>
    </form>
    <div id="assistant-credit-list" class="assistant-fields"></div>
  </details>
  <div id="assistant-items"></div>
  <section id="assistant-movement" hidden>
    <button id="assistant-back" type="button" class="soft-button">Volver a pendientes</button>
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
.assistant-chat-chart{margin:12px 0}
.assistant-chat-chart p{margin:6px 0}
.assistant-chat-chart meter{width:100%;height:12px;display:block}

.assistant-launch{position:fixed;z-index:7;right:20px;bottom:22px;min-height:44px}
.assistant-dialog{width:min(94%,510px);max-height:85vh;max-height:85dvh;border:1px solid var(--rule);border-radius:18px;
  background:var(--surface);color:var(--ink);padding:20px;overflow:auto}
.assistant-dialog::backdrop{background:rgba(10,26,25,.58)}
.assistant-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}
.assistant-heading h2{margin:0}
.assistant-fields,#assistant-items{display:grid;gap:10px;margin:13px 0}
.assistant-fields label:not(.ai-document-consent){display:grid;gap:6px}
.assistant-fields[hidden],.assistant-dialog [hidden],.assistant-launch[hidden],#hapi-deposits[hidden],#hapi-placeholder[hidden],#portfolio-no-data[hidden],#hapi-credit[hidden],#hapi-manual[hidden],#hapi-reports[hidden],#hapi-activity[hidden]{display:none}
#hapi-position-fields fieldset{min-width:0;display:grid;gap:10px;border:1px solid var(--rule);border-radius:12px}
.assistant-fields input:not([type=checkbox]),.assistant-fields select{font-size:16px;width:100%;min-height:42px}
@media(max-width:800px){.assistant-launch{bottom:calc(74px + env(safe-area-inset-bottom));right:12px}
.assistant-dialog{margin:auto auto max(10px,env(safe-area-inset-bottom));max-height:85dvh}}
`;

export const ASSISTANT_JS = String.raw`
(()=>{
  "use strict";
  const byId=id=>document.getElementById("assistant-"+id);
  const dialog=byId("dialog"),status=byId("status"),list=byId("items"),panel=byId("movement");
  const launcher=byId("open");
  if(!dialog||launcher.dataset.assistantEnabled!=="true")return;
  launcher.hidden=false;
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
  function message(value){status.textContent=value;}
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
    list.hidden=true;
    byId("alerts").hidden=true;
    byId("credit").hidden=true;
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
      card.append(title,el("p",item.detail),link,button);
      box.append(card);
    }
  }
  function renderCredit(credit){
    const select=byId("credit-account"),list=byId("credit-list");
    select.replaceChildren(new Option("Elige una tarjeta",""),...credit.accounts.map(item=>new Option(item.bank_label,item.id)));
    byId("credit-form").hidden=!credit.accounts.length;
    byId("credit-empty").hidden=Boolean(credit.accounts.length);
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
    list.hidden=false;
    byId("alerts").hidden=false;
    byId("credit").hidden=false;
    list.replaceChildren();
    noticeForm.hidden=true;
    message("Cargando pendientes…");
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
      launcher.textContent=count?"Qwen · "+count:"Qwen";
      message(count?count+" pendientes para revisar.":"No tienes pendientes para revisar.");
    }catch(error){message(error.message);}
  }
  function setupChat(section){
    const history=byId("chat-history"),turns=byId("chat-turns"),output=byId("chat-status");
    const input=byId("chat-question"),form=byId("chat-form"),remove=byId("chat-delete"),fresh=byId("chat-new");
    const send=form.querySelector("[type=submit]"),consent=byId("chat-ai");
    let id="",loaded=false,working=false,retry=null;
    const format=(amount,currency)=>new Intl.NumberFormat("es-CO",{style:"currency",currency}).format(Number(amount)/100);
    function render(turn){
      const card=el("article","","assistant-chat-turn"),answer=turn.answer;
      card.append(el("strong",turn.question),el("p",answer.text));
      if(answer.totalMinor!==undefined&&answer.currency)card.append(el("strong",format(answer.totalMinor,answer.currency)));
      if(answer.points?.length&&answer.currency){
        const figure=el("figure","","assistant-chat-chart");
        figure.append(el("figcaption",answer.topic==="spending"?"Gastos por categoría":answer.topic==="hapi_deposits"?"Acreditaciones por banco":"Valor por fecha de corte (magnitud de cada corte)"));
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
    function freshThread(){
      id=crypto.randomUUID();retry=null;turns.replaceChildren();history.value="";
      remove.hidden=true;input.value="";consent.checked=false;output.textContent="";
    }
    async function loadHistory(){
      const data=await request("chat");
      history.replaceChildren(new Option("Nueva conversación",""),...data.items.map(item=>new Option(item.title,item.id)));
      history.value=data.items.some(item=>item.id===id)?id:"";
      remove.hidden=!history.value;
      loaded=true;
    }
    function setBusy(value){
      working=value;history.disabled=value;send.disabled=value;remove.disabled=value;fresh.disabled=value;
      input.readOnly=value;
    }
    section.addEventListener("toggle",async()=>{
      if(!section.open||loaded||working)return;
      setBusy(true);
      try{freshThread();await loadHistory();}
      catch(error){output.textContent=error.message;}
      finally{setBusy(false);}
    });
    fresh.addEventListener("click",()=>{if(!working){freshThread();input.focus();}});
    for(const button of section.querySelectorAll("[data-question]"))
      button.addEventListener("click",()=>{if(!working){input.value=button.dataset.question;input.focus();}});
    history.addEventListener("change",async()=>{
      if(working)return;
      if(!history.value){freshThread();return;}
      setBusy(true);output.textContent="Cargando conversación…";
      try{
        const data=await request("chat?id="+encodeURIComponent(history.value));
        id=data.thread.id;retry=null;input.value="";consent.checked=false;turns.replaceChildren();
        data.turns.forEach(render);remove.hidden=false;output.textContent="";
      }catch(error){output.textContent=error.message;history.value=id; }
      finally{setBusy(false);}
    });
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const question=input.value.trim();
      if(working||!question)return;
      if(!id)id=crypto.randomUUID();
      if(!retry||retry.question!==question)retry={id,question,turnId:crypto.randomUUID()};
      setBusy(true);output.textContent="Consultando tus registros…";
      try{
        const data=await request("chat",{...retry,allowAI:consent.checked});
        render(data.turn);retry=null;input.value="";consent.checked=false;
        remove.hidden=false;output.textContent="";
        try{await loadHistory();}catch{loaded=false;output.textContent="Consulta guardada. Vuelve a abrir el asistente para actualizar el historial.";}
      }catch(error){output.textContent=error.message;}
      finally{setBusy(false);}
    });
    remove.addEventListener("click",async()=>{
      if(working||!id||!window.confirm("¿Borrar esta conversación?"))return;
      setBusy(true);
      try{await request("chat/delete",{id,confirmed:true});freshThread();await loadHistory();output.textContent="Conversación borrada.";}
      catch(error){output.textContent=error.message;}
      finally{setBusy(false);}
    });
    section.hidden=false;
  }
  const chatSection=byId("chat");
  if(chatSection?.dataset.assistantChat==="true")setupChat(chatSection);
  function open(){if(!dialog.open){dialog.showModal();inbox();}}
  launcher.addEventListener("click",open);
  if(location.hash==="#qwen")open();
  window.addEventListener("hashchange",()=>{if(location.hash==="#qwen")open();});
  dialog.addEventListener("close",()=>{
    if(location.hash==="#qwen")history.replaceState(null,"",location.pathname+location.search+"#plan");
  });
  byId("back").addEventListener("click",()=>{if(!busy)inbox();});
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
