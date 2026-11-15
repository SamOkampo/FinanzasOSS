export const ASSISTANT_HTML = `
<button id="assistant-open" data-assistant-enabled="false" hidden type="button" class="solid-button assistant-launch" aria-haspopup="dialog">Qwen</button>
<dialog id="assistant-dialog" class="assistant-dialog" aria-labelledby="assistant-title">
  <div class="assistant-heading">
    <h2 id="assistant-title">Asistente Qwen</h2>
    <form method="dialog"><button class="soft-button" aria-label="Cerrar asistente">Cerrar</button></form>
  </div>
  <p id="assistant-status" role="status" aria-live="polite"></p>
  <label class="ai-document-consent">
    <input id="assistant-notices" type="checkbox" disabled>
    <span>Avisarme de pendientes financieros</span>
  </label>
  <p class="budget-note" id="assistant-notice-hint"></p>
  <details id="assistant-notice-rules">
    <summary>Tipos de aviso</summary>
    <div class="assistant-fields" id="assistant-rule-list"></div>
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
.assistant-launch{position:fixed;z-index:7;right:20px;bottom:22px;min-height:44px}
.assistant-dialog{width:min(94%,510px);max-height:85vh;max-height:85dvh;border:1px solid var(--rule);border-radius:18px;
  background:var(--surface);color:var(--ink);padding:20px;overflow:auto}
.assistant-dialog::backdrop{background:rgba(10,26,25,.58)}
.assistant-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}
.assistant-heading h2{margin:0}
.assistant-fields,#assistant-items{display:grid;gap:10px;margin:13px 0}
.assistant-fields label:not(.ai-document-consent){display:grid;gap:6px}
.assistant-fields[hidden],.assistant-dialog [hidden],.assistant-launch[hidden],#hapi-deposits[hidden],#hapi-placeholder[hidden],#portfolio-no-data[hidden],#hapi-credit[hidden],#hapi-manual[hidden],#hapi-reports[hidden]{display:none}
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
  function renderRules(data){
    const list=byId("rule-list");
    list.replaceChildren();
    for(const [key,name] of Object.entries(data.ruleLabels)){
      const label=el("label","","ai-document-consent"),input=el("input");
      input.type="checkbox";input.checked=data.rules[key];
      input.addEventListener("change",async()=>{
        input.disabled=true;
        try{await request("preferences",{enabled:notices.checked,confirmed:true,rules:{[key]:input.checked}});}
        catch(error){input.checked=!input.checked;message(error.message);}
        finally{input.disabled=false;}
      });
      label.append(input,el("span",name));
      list.append(label);
    }
  }
  async function inbox(){
    current=null;
    panel.hidden=true;
    list.hidden=false;
    byId("alerts").hidden=false;
    byId("credit").hidden=false;
    list.replaceChildren();
    notices.disabled=true;
    message("Cargando pendientes…");
    try{
      const data=await request("inbox");
      taxonomy=data.taxonomy;
      notices.checked=data.notifications;
      renderAlerts(data.alerts);
      renderCredit(data.credit);
      renderRules(data);
      ai.closest("label").hidden=!data.aiAvailable;
      byId("notice-hint").textContent=data.pushConfigured?
        "Revisamos tus pendientes a las "+data.noticeSchedule+" (Bogotá). Los avisos llegan a dispositivos con notificaciones activas.":
        "Los avisos de este entorno todavía no están habilitados.";
      notices.disabled=false;
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
  notices.addEventListener("change",async()=>{
    const enabled=notices.checked;
    notices.disabled=true;
    try{await request("preferences",{enabled,confirmed:true});}
    catch(error){notices.checked=!enabled;message(error.message);}
    finally{notices.disabled=false;}
  });
})();`;
