export const HAPI_HTML = `
<article class="module" id="hapi-deposits" data-hapi-enabled="false" hidden>
  <h3>Hapi · Aportes en USD</h3>
  <p>Registro manual. Usa el movimiento de tu banco y el comprobante de acreditación de Hapi.</p>
  <button type="button" class="soft-button" id="hapi-refresh">Actualizar aportes</button>
  <p id="hapi-status" role="status" aria-live="polite"></p>
  <details>
    <summary>Registrar salida hacia Hapi</summary>
    <form id="hapi-out" class="assistant-fields" autocomplete="off">
      <label>Movimiento de origen <select id="hapi-origin"></select></label>
      <div id="hapi-manual" class="assistant-fields">
        <label>Banco de origen <input id="hapi-bank" maxlength="80" required></label>
        <label>Fecha de salida <input id="hapi-debited" type="date" required></label>
        <label>Importe total debitado en COP <input id="hapi-cop" inputmode="decimal" required></label>
      </div>
      <label class="ai-document-consent"><input type="checkbox" id="hapi-out-confirm" required> Confirmo que el débito salió hacia mi cuenta de Hapi.</label>
      <button class="solid-button" type="submit">Registrar aporte pendiente</button>
    </form>
  </details>
  <div id="hapi-history"></div>
  <form id="hapi-credit" class="assistant-fields" autocomplete="off" hidden>
    <h4 id="hapi-credit-title">Confirmar acreditación</h4>
    <label>Fecha de acreditación <input id="hapi-credited" type="date" required></label>
    <label>Importe acreditado en USD <input id="hapi-usd" inputmode="decimal" required></label>
    <label>Comisión explícita incluida en el débito, COP <input id="hapi-fee" inputmode="decimal"></label>
    <label>Referencia de la operación en Hapi <input id="hapi-reference" maxlength="80" required></label>
    <label class="ai-document-consent"><input type="checkbox" id="hapi-credit-confirm" required> Verifiqué estos datos en el comprobante de Hapi.</label>
    <button class="solid-button" type="submit">Confirmar acreditación</button>
    <button class="soft-button" id="hapi-credit-cancel" type="button">Cancelar</button>
  </form>
</article>`;

export const HAPI_JS = String.raw`
(()=>{
  "use strict";
  const node=id=>document.getElementById("hapi-"+id);
  const panel=node("deposits");
  if(!panel||panel.dataset.hapiEnabled!=="true")return;
  panel.hidden=false;
  document.getElementById("hapi-placeholder").hidden=true;
  const status=node("status"),origin=node("origin"),history=node("history"),out=node("out"),credit=node("credit");
  let requestKey=crypto.randomUUID(),selected=null,busy=false,loading=false;
  const money=(minor,currency)=>new Intl.NumberFormat("es-CO",{style:"currency",currency}).format(Number(minor)/100);
  const amount=value=>value.trim().replace(",",".");
  async function request(path,body){
    const response=await fetch("/api/quick/v41/hapi/"+path,{
      credentials:"same-origin",cache:"no-store",...(body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||"No se pudo consultar Hapi.");
    return data;
  }
  function manualFields(){
    const manual=!origin.value;
    node("manual").hidden=!manual;
    for(const input of node("manual").querySelectorAll("input"))input.disabled=!manual;
  }
  function render(data){
    origin.replaceChildren(new Option("Registrar débito manual",""),...data.origins.map(item=>
      new Option(item.debited_on+" · "+item.bank_label+" · "+money(item.cop_minor,"COP"),item.source+":"+item.id)));
    manualFields();
    history.replaceChildren();
    for(const item of data.items){
      const card=document.createElement("article");
      card.className="ai-document-table";
      const label=document.createElement("strong");
      label.textContent=item.debitedOn+" · "+item.bank+" · "+money(item.copMinor,"COP");
      const value=document.createElement("p");
      value.textContent=item.status==="credited"?
        item.creditedOn+" · "+money(item.usdMinor,"USD")+" acreditados · "+item.effectiveCopPerUsd+" COP por USD":
        "Pendiente de acreditar en Hapi";
      card.append(label,value);
      if(item.feeCopMinor!==null){
        const fee=document.createElement("p");fee.textContent="Comisión incluida: "+money(item.feeCopMinor,"COP");card.append(fee);
      }
      if(item.status==="pending"){
        const button=document.createElement("button");
        button.className="soft-button";button.type="button";button.textContent="Registrar acreditación en USD";
        button.addEventListener("click",()=>{
          if(busy)return;
          selected=item.id;
          credit.reset();
          node("credit-title").textContent="Acreditación de "+money(item.copMinor,"COP")+" · "+item.bank;
          node("credited").min=item.debitedOn;
          credit.hidden=false;
          node("credited").focus();
        });
        card.append(button);
      }
      history.append(card);
    }
  }
  async function load(){
    if(loading)return;
    loading=true;
    try{
      const data=await request("deposits");
      render(data);
      status.textContent=data.items.length?"":"Todavía no hay aportes registrados.";
    }catch(error){status.textContent=error.message;}
    finally{loading=false;}
  }
  origin.addEventListener("change",manualFields);
  node("refresh").addEventListener("click",load);
  node("credit-cancel").addEventListener("click",()=>{credit.hidden=true;selected=null;});
  out.addEventListener("submit",async event=>{
    event.preventDefault();
    if(busy||!node("out-confirm").checked)return;
    busy=true;
    const button=out.querySelector("button[type=submit]");button.disabled=true;
    try{
      const fields=origin.value?{origin:origin.value}:{bank:node("bank").value,debitedOn:node("debited").value,copAmount:amount(node("cop").value)};
      await request("deposits",{...fields,requestKey,confirmed:true});
      out.reset();requestKey=crypto.randomUUID();await load();
      status.textContent="Salida registrada. Confirma los USD cuando aparezcan en Hapi.";
    }catch(error){status.textContent=error.message;}
    finally{busy=false;button.disabled=false;}
  });
  credit.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!selected||busy||!node("credit-confirm").checked)return;
    busy=true;
    const button=credit.querySelector("button[type=submit]");button.disabled=true;
    try{
      const fee=amount(node("fee").value);
      await request("credit",{id:selected,creditedOn:node("credited").value,usdAmount:amount(node("usd").value),
        reference:node("reference").value,...(fee?{feeCop:fee}:{}),confirmed:true});
      credit.hidden=true;selected=null;await load();
      status.textContent="Acreditación en USD confirmada.";
    }catch(error){status.textContent=error.message;}
    finally{busy=false;button.disabled=false;}
  });
  const space=document.getElementById("space-portfolio");
  new MutationObserver(()=>{if(!space.hidden)load();}).observe(space,{attributes:true,attributeFilter:["hidden"]});
  if(!space.hidden)load();
})();`;
