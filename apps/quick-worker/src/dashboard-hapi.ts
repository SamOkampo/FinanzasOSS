export const HAPI_HTML = `
<article class="module" id="hapi-deposits" data-hapi-enabled="false" hidden>
  <h3>Hapi · Portafolio en USD</h3>
  <p id="hapi-valuation"></p>
  <p id="hapi-cop-value" hidden></p>
  <ul id="hapi-positions"></ul>
  <details id="hapi-allocation" hidden>
    <summary>Distribución por tipo de activo</summary>
    <div id="hapi-allocation-bars" class="assistant-chat-chart"></div>
  </details>
  <details id="hapi-comparison" hidden>
    <summary>Aportes y valor del portafolio</summary>
    <p>El valor del corte incluye efectivo y posiciones. Los aportes incluyen solo los abonos que registraste hasta esa fecha. La diferencia por sí sola no mide rentabilidad.</p>
    <div id="hapi-comparison-bars" class="assistant-chat-chart"></div>
  </details>
  <details id="hapi-reports" hidden><summary>Cortes anteriores</summary><ul id="hapi-reports-list"></ul></details>
  <details>
    <summary id="hapi-report-label">Añadir reporte de Hapi</summary>
    <form id="hapi-pdf" class="assistant-fields" autocomplete="off">
      <label>Reporte mensual en PDF <input id="hapi-pdf-file" type="file" accept="application/pdf,.pdf" required></label>
      <p>El PDF se lee en este dispositivo. Revisa el corte antes de guardarlo.</p>
      <button class="soft-button" type="submit">Leer corte del PDF</button>
      <p id="hapi-pdf-status" aria-live="polite"></p>
    </form>
    <form id="hapi-snapshot" class="assistant-fields" autocomplete="off">
      <label>Fecha del reporte <input id="hapi-asof" type="date" required></label>
      <label>Efectivo neto en USD <input id="hapi-cash" inputmode="decimal" required></label>
      <label>Total del reporte en USD (verificación independiente) <input id="hapi-printed-total" inputmode="decimal" required></label>
      <p id="hapi-total-check" class="budget-note" aria-live="polite"></p>
      <div id="hapi-position-fields" class="assistant-fields"></div>
      <button id="hapi-add-position" class="soft-button" type="button">Añadir posición</button>
      <details>
        <summary>Mostrar también el equivalente en COP</summary>
        <p>Opcional. Usa una cotización de la fecha del corte.</p>
        <div class="assistant-fields">
          <label>COP por USD <input id="hapi-fx-rate" inputmode="decimal" maxlength="16"></label>
          <label>Fuente <input id="hapi-fx-source" maxlength="80"></label>
          <label>Hora de la cotización en Bogotá <input id="hapi-fx-time" type="time"></label>
        </div>
      </details>
      <label class="ai-document-consent"><input id="hapi-snapshot-confirm" type="checkbox" required> Verifiqué el efectivo y el valor de las posiciones en el reporte de Hapi.</label>
      <button class="solid-button" type="submit">Guardar corte</button>
    </form>
  </details>
  <p id="hapi-status" role="status" aria-live="polite"></p>
  <details>
    <summary>Más opciones de Hapi</summary>
    <details id="hapi-activity" data-hapi-activity="false" hidden>
      <summary>Actividad de Hapi en USD</summary>
      <form id="hapi-activity-read" class="assistant-fields">
        <label>Reporte digital en PDF <input id="hapi-activity-pdf" type="file" accept="application/pdf,.pdf" required></label>
        <button class="soft-button" type="submit">Preparar actividad</button>
      </form>
      <p>El PDF se lee en este dispositivo. Guarda solo las filas que puedas verificar en tu reporte.</p>
      <p id="hapi-activity-status" role="status" aria-live="polite"></p>
      <form id="hapi-activity-review" class="assistant-fields" hidden>
        <label>Bloque de revisión <select id="hapi-activity-page"></select></label>
        <div id="hapi-activity-rows" class="assistant-fields"></div>
        <label class="ai-document-consent"><input id="hapi-activity-ack" type="checkbox" required>
          <span>Comparé las filas seleccionadas con mi reporte de Hapi.</span></label>
        <button id="hapi-activity-save" class="solid-button" type="submit">Guardar filas seleccionadas</button>
      </form>
      <details>
        <summary>Historial de actividad</summary>
        <div id="hapi-activity-history" class="assistant-fields"></div>
      </details>
    </details>
    <h4>Aportes</h4>
    <p>Registro manual. Usa el movimiento de tu banco y el comprobante de acreditación de Hapi.</p>
    <button type="button" class="soft-button" id="hapi-refresh">Actualizar aportes</button>
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
  const status=node("status"),origin=node("origin"),history=node("history"),out=node("out"),credit=node("credit");
  let requestKey=crypto.randomUUID(),selected=null,busy=false,loading=false,verifiedPdfTotal=null;
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
  const positionFields=node("position-fields");
  function usdMinor(raw){
    const v=amount(raw);if(!/^-?(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/.test(v))return null;
    const sign=v.startsWith("-")?-1n:1n;const [whole,dec=""]=v.replace(/^-/,"").split(".");return sign*(BigInt(whole)*100n+BigInt(dec.padEnd(2,"0")));
  }
  function checkTotal(){
    const cash=usdMinor(node("cash").value),printed=usdMinor(node("printed-total").value);
    const values=[...positionFields.querySelectorAll('input[name="marketValueUsd"]')].map(x=>usdMinor(x.value));
    if(cash===null||printed===null||values.some(x=>x===null||x<0n)){node("total-check").textContent="Completa el efectivo, posiciones y total impreso para verificar el corte.";return false;}
    const calculated=values.reduce((a,b)=>a+b,cash);
    const valid=calculated===printed&&(verifiedPdfTotal===null||printed===verifiedPdfTotal);
    node("total-check").textContent="Total calculado: "+money(calculated,"USD")+" · Diferencia: "+money(calculated-printed,"USD")+(valid?" · Cuadre exacto.":" · Revisa los valores contra el PDF.")+(verifiedPdfTotal!==null&&printed!==verifiedPdfTotal?" · El total impreso no coincide con el PDF leído.":"");return valid;
  }
  node("snapshot").addEventListener("input",()=>{node("snapshot-confirm").checked=false;checkTotal();});
  function addPosition(position){
    if(positionFields.children.length>=60)return;
    const field=document.createElement("fieldset");
    const heading=document.createElement("legend");
    heading.textContent="Posición";
    field.append(heading);
    for(const [name,label,mode,limit,required] of [
      ["symbol","Símbolo","text",16,true],
      ["quantity","Cantidad","decimal",28,true],
      ["marketValueUsd","Valor de mercado en USD","decimal",18,true],
      ["costBasisUsd","Costo de adquisición total en USD (opcional)","decimal",18,false],
    ]){
      const group=document.createElement("label"),input=document.createElement("input");
      input.name=name;input.inputMode=mode;input.maxLength=limit;input.required=Boolean(required);input.value=position?.[name]||"";
      group.append(label,input);field.append(group);
    }
    const typeLabel=document.createElement("label"),type=document.createElement("select");
    typeLabel.textContent="Tipo de activo";type.name="assetType";
    type.append(new Option("Sin especificar",""),new Option("Acción, ETF u otro valor","security"),new Option("Criptoactivo","crypto"));
    type.value=position?.assetType||"";
    typeLabel.append(type);field.append(typeLabel);
    const remove=document.createElement("button");
    remove.className="soft-button";remove.type="button";remove.textContent="Quitar posición";
    remove.addEventListener("click",()=>{field.remove();node("snapshot-confirm").checked=false;checkTotal();});
    field.append(remove);positionFields.append(field);
    if(!position)field.querySelector("input").focus();
  }
  function renderBars(box,values){
    box.replaceChildren();
    const max=Math.max(...values.map(([,minor])=>Math.abs(Number(minor))),1);
    for(const [name,minor] of values){
      const text=document.createElement("p"),meter=document.createElement("meter");
      text.textContent=name+" · "+money(minor,"USD");
      meter.min=0;meter.max=max;meter.value=Math.abs(Number(minor));
      meter.setAttribute("aria-label",text.textContent);
      box.append(text,meter);
    }
  }
  function renderPortfolio(portfolio){
    const snapshot=portfolio.latest;
    node("report-label").textContent=snapshot?"Añadir otro reporte":"Añadir mi primer reporte";
    const reports=node("reports-list");
    reports.replaceChildren();
    node("reports").hidden=portfolio.history.length<2;
    for(const report of portfolio.history.slice(1)){
      const item=document.createElement("li");
      item.textContent=report.asOf+" · "+money(report.totalMinor,"USD");
      reports.append(item);
    }
    const items=node("positions");
    items.replaceChildren();
    node("valuation").textContent=snapshot?
      "Corte del "+snapshot.asOf+" · Total "+money(snapshot.totalMinor,"USD")+" · Efectivo neto "+money(snapshot.cashMinor,"USD")+
      " · Posiciones "+money(snapshot.marketValueMinor,"USD"):
      "Aún no hay un corte del portafolio.";
    for(const position of snapshot?.positions||[]){
      const item=document.createElement("li");
      item.textContent=position.symbol+" · "+position.quantity+" unidades · "+money(position.marketValueMinor,"USD");
      if(position.costBasisMinor!==undefined)item.textContent+=" · Costo "+money(position.costBasisMinor,"USD")+
        " · Resultado no realizado "+money(position.unrealizedMinor,"USD");
      items.append(item);
    }
    const allocation=snapshot?.allocation;
    const mix=allocation?[["Valores",allocation.security],["Criptoactivos",allocation.crypto],
      ["Posiciones sin tipo",allocation.unclassified]].filter(([,minor])=>Number(minor)>0):[];
    node("allocation").hidden=!mix.length;
    renderBars(node("allocation-bars"),mix);
    const fx=snapshot?.fx;
    const cop=node("cop-value");
    cop.hidden=!fx;
    const formatTime=new Intl.DateTimeFormat("es-CO",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Bogota"});
    cop.textContent=fx?money(fx.totalCopMinor,"COP")+" equivalentes · "+fx.copPerUsd+
      " COP por USD · "+fx.source+" · "+formatTime.format(new Date(fx.observedAt))+" (Bogotá)":"";
    const credited=portfolio.creditedAtLatestCutMinor;
    node("comparison").hidden=!snapshot||credited==null;
    renderBars(node("comparison-bars"),snapshot&&credited!=null?[["Aportes acreditados",credited],["Valor del corte",snapshot.totalMinor]]:[]);
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
      const [data,portfolio]=await Promise.all([request("deposits"),request("portfolio")]);
      render(data);
      renderPortfolio(portfolio);
      status.textContent="";
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
  function readPdf(file,kind){
    return new Promise(resolve=>{
      const worker=new Worker("/statement-pdf-worker.js?v=hapi-3");
      const timeout=setTimeout(()=>done(null),20000);
      function done(result){clearTimeout(timeout);worker.terminate();resolve(result);}
      worker.onmessage=event=>done(event.data);
      worker.onerror=()=>done(null);
      worker.postMessage({file,kind});
    });
  }
  const activityPanel=node("activity");
  if(activityPanel?.dataset.hapiActivity==="true")setupActivity();
  function setupActivity(){
    activityPanel.hidden=false;
    const notice=node("activity-status"),review=node("activity-review"),page=node("activity-page");
    const ack=node("activity-ack"),save=node("activity-save"),list=node("activity-rows");
    const types={deposit:"Depósito",withdrawal:"Retiro",buy:"Compra",sell:"Venta",
      dividend:"Dividendo",fee:"Comisión",interest:"Interés",tax:"Retención",reinvestment:"Reinversión"};
    let report=null,preview=null,working=false;
    const label=(tag,text)=>{const item=document.createElement(tag);item.textContent=text;return item;};
    const usd=value=>money(Number(value)*100,"USD");
    const checked=()=>[...list.querySelectorAll("input:checked")].map(input=>Number(input.value));
    const sync=()=>{save.disabled=working||!ack.checked||!checked().length;};
    function title(row){return row.date+" · "+types[row.kind]+" · "+usd(row.amountUsd);}
    function detail(row){
      return [row.description,row.symbol,row.quantity?row.quantity+" unidades":"",row.reference?"Ref. "+row.reference:""]
        .filter(Boolean).join(" · ");
    }
    function addActivityDetail(card,row,fieldText,input,key){
      const form=document.createElement("form"),field=label("label",fieldText);
      form.className="assistant-fields";input.required=true;field.append(input);
      const button=label("button","Guardar detalle confirmado");button.className="soft-button";
      form.append(field,button);card.append(form);
      form.addEventListener("submit",async event=>{
        event.preventDefault();
        if(working||!input.value||!window.confirm("¿Verificaste este dato en tus comprobantes?"))return;
        working=true;button.disabled=true;
        try{
          const value=key==="costUsd"?amount(input.value):input.value;
          const decimal=key==="costUsd"&&/^\d+(?:\.\d{1,2})?$/.test(value)?(value+".").split(".").slice(0,2):null;
          await request("activity/details",{activityId:row.id,
            [key]:decimal?decimal[0]+"."+decimal[1].padEnd(2,"0"):value,confirmed:true});
          await loadActivity();
          notice.textContent="Detalle registrado.";
        }catch(error){notice.textContent=error.message;}
        finally{working=false;button.disabled=false;}
      });
    }
    async function loadActivity(){
      const data=await request("activity"),history=node("activity-history");
      history.replaceChildren();
      if(!data.items.length)history.append(label("p","Todavía no hay actividad registrada."));
      for(const row of data.items){
        const card=document.createElement("article");
        card.className="ai-document-table";
        card.append(label("strong",title(row)),label("p",detail(row)));
        if(row.kind==="deposit"&&row.linkedDeposit)card.append(label("p","Vinculado a un aporte"));
        if(row.kind==="deposit"&&!row.linkedDeposit){
          const candidates=data.pending.filter(d=>d.debited_on<=row.date);
          if(candidates.length){
            const form=document.createElement("form"),field=document.createElement("label"),select=document.createElement("select");
            form.className="assistant-fields";select.required=true;field.textContent="Salida de tu banco en COP";
            select.append(new Option("Elige el aporte pendiente",""),...candidates.map(d=>new Option(
              d.debited_on+" · "+d.bank_label+" · "+money(d.cop_minor,"COP"),d.id)));
            field.append(select);
            const button=label("button","Vincular depósito");button.className="soft-button";
            form.append(field,button);card.append(form);
            form.addEventListener("submit",async event=>{
              event.preventDefault();
              if(working||!select.value||!window.confirm("¿La salida en COP y este depósito en USD corresponden al mismo aporte?"))return;
              working=true;button.disabled=true;
              try{
                await request("activity/link",{activityId:row.id,depositId:select.value,confirmed:true});
                await Promise.all([loadActivity(),load()]);
                notice.textContent="Depósito vinculado con la salida de tu banco.";
              }catch(error){notice.textContent=error.message;}
              finally{working=false;button.disabled=false;}
            });
          }
        }
        if(row.kind==="sell"){
          if(row.costMinor!==undefined)card.append(label("p","Costo confirmado "+money(row.costMinor,"USD")+
            " · Resultado realizado "+money(row.realizedMinor,"USD")));
          else{
            const cost=document.createElement("input");cost.inputMode="decimal";cost.maxLength=18;
            addActivityDetail(card,row,"Costo de adquisición de lo vendido, según tu reporte (USD)",cost,"costUsd");
          }
        }
        if(row.kind==="reinvestment"){
          if(row.dividendId)card.append(label("p","Vinculada al dividendo que la financió."));
          else if(row.symbol){
            const candidates=data.items.filter(x=>x.kind==="dividend"&&x.symbol===row.symbol&&x.date<=row.date&&
              Number(x.amountUsd)>=Number(row.amountUsd)&&!data.items.some(y=>y.dividendId===x.id));
            if(candidates.length){
              const select=document.createElement("select");
              select.append(new Option("Selecciona el dividendo",""),...candidates.map(x=>new Option(title(x),x.id)));
              addActivityDetail(card,row,"Dividendo reinvertido",select,"dividendId");
            }
          }
        }
        if(row.kind==="withdrawal"){
          if(row.bankCreditId)card.append(label("p","Vinculado al abono de tu banco en COP."));
          else {
            const candidates=(data.bankCredits||[]).filter(x=>x.occurred_on>=row.date);
            if(candidates.length){
              const select=document.createElement("select");
              select.append(new Option("Selecciona el abono",""),...candidates.map(x=>
                new Option(x.occurred_on+" · "+x.bank_label+" · "+money(x.amount_minor,"COP"),x.id)));
              addActivityDetail(card,row,"Abono en tu banco",select,"bankCreditId");
            }
          }
        }
        history.append(card);
      }
    }
    function preparePage(){
      ack.checked=false;list.replaceChildren();sync();
      const offset=Number(page.value)*60;
      for(const item of preview.items.slice(offset,offset+60)){
        const field=document.createElement("label"),check=document.createElement("input");
        field.className="ai-document-consent";check.type="checkbox";check.value=item.index;
        check.disabled=item.status!=="new";
        const suffix=item.status==="exists"?" · Ya guardada":item.status==="conflict"?" · Referencia en conflicto":"";
        field.append(check,label("span",title(item.row)+" · "+detail(item.row)+suffix));
        check.addEventListener("change",sync);
        list.append(field);
      }
      review.hidden=false;
      notice.textContent=report.total+" movimientos leídos"+(report.unread?" · "+report.unread+" filas requieren revisión en el PDF.":".");
    }
    node("activity-read").addEventListener("submit",async event=>{
      event.preventDefault();
      if(working)return;
      const button=event.currentTarget.querySelector("button"),file=node("activity-pdf").files[0];
      if(!file)return;
      working=true;button.disabled=true;page.disabled=true;review.hidden=true;
      notice.textContent="Leyendo la actividad en tu dispositivo…";
      try{
        const parsed=(await readPdf(file,"hapi-activity"))?.activity;
        if(!parsed?.rows.length)throw Error("Este PDF no devolvió movimientos verificables. Usa el reporte digital sin clave.");
        if(parsed.total>200)throw Error("Este reporte supera 200 movimientos. Usa un reporte de un período más corto.");
        report=parsed;
        preview=await request("activity/preview",{rows:report.rows});
        page.replaceChildren(...Array.from({length:Math.ceil(report.total/60)},(_,i)=>
          new Option("Filas "+(i*60+1)+" a "+Math.min((i+1)*60,report.total),i)));
        preparePage();
      }catch(error){notice.textContent=error.message;}
      finally{working=false;button.disabled=false;page.disabled=false;sync();}
    });
    page.addEventListener("change",()=>{if(!working&&preview)preparePage();});
    ack.addEventListener("change",sync);
    review.addEventListener("submit",async event=>{
      event.preventDefault();
      if(working||!preview||!ack.checked||!checked().length)return;
      working=true;page.disabled=true;sync();
      try{
        const result=await request("activity/commit",{rows:report.rows,selected:checked(),digest:preview.digest,confirmed:true});
        const [,updated]=await Promise.all([loadActivity(),request("activity/preview",{rows:report.rows})]);
        preview=updated;preparePage();
        notice.textContent=result.created+" filas nuevas · "+result.alreadySaved+" ya guardadas.";
      }catch(error){notice.textContent=error.message;}
      finally{working=false;page.disabled=false;sync();}
    });
    activityPanel.addEventListener("toggle",()=>{
      if(activityPanel.open)loadActivity().catch(error=>{notice.textContent=error.message;});
    });
  }
  node("add-position").addEventListener("click",()=>{addPosition();node("snapshot-confirm").checked=false;checkTotal();});
  node("pdf-file").addEventListener("change",()=>{node("snapshot-confirm").checked=false;});
  node("pdf").addEventListener("submit",async event=>{
    event.preventDefault();
    if(busy)return;
    const form=event.currentTarget,button=form.querySelector("button"),notice=node("pdf-status");
    const file=node("pdf-file").files[0];
    if(!file)return;
    busy=true;button.disabled=true;
    notice.textContent="Leyendo el reporte…";
    try{
      const snapshot=(await readPdf(file,"hapi"))?.snapshot;
      if(!snapshot)throw Error("No se pudo cuadrar automáticamente el extracto. Revisa si está protegido, escaneado o tiene un formato distinto; puedes completar la revisión manual usando el total impreso.");
      node("asof").value=snapshot.asOf;node("cash").value=snapshot.cashUsd;
      node("printed-total").value=snapshot.totalUsd;verifiedPdfTotal=usdMinor(snapshot.totalUsd);
      positionFields.replaceChildren();snapshot.positions.forEach(addPosition);
      node("snapshot-confirm").checked=false;
      form.reset();
      checkTotal();notice.textContent="Corte preparado · "+snapshot.positions.length+" posiciones. Revisa el total impreso, el efectivo y las posiciones antes de guardar.";
    }catch(error){notice.textContent=error.message;}
    finally{busy=false;button.disabled=false;}
  });
  node("snapshot").addEventListener("submit",async event=>{
    event.preventDefault();
    if(busy||!node("snapshot-confirm").checked)return;
    if(!checkTotal()){node("snapshot-confirm").checked=false;status.textContent="No se guardó: el corte no cuadra con el total impreso.";return;}
    busy=true;
    const form=event.currentTarget,button=form.querySelector("button[type=submit]");
    button.disabled=true;
    try{
      const positions=[...positionFields.children].map(field=>Object.fromEntries([...field.querySelectorAll("input,select")]
        .filter(input=>input.value.trim()).map(input=>[input.name,["symbol","assetType"].includes(input.name)?input.value:amount(input.value)])));
      const asOf=node("asof").value,rate=amount(node("fx-rate").value),source=node("fx-source").value.trim(),time=node("fx-time").value;
      if((rate||source||time)&&!(rate&&source&&time))throw Error("Completa la tasa, la fuente y la hora para mostrar el equivalente en COP.");
      const fx=rate?{copPerUsd:rate,source,observedAt:new Date(asOf+"T"+time+":00-05:00").toISOString()}:undefined;
      const data=await request("portfolio",{asOf,cashUsd:amount(node("cash").value),positions,fx,confirmed:true});
      form.reset();positionFields.replaceChildren();verifiedPdfTotal=null;checkTotal();
      renderPortfolio(await request("portfolio"));
      status.textContent="Corte del "+data.asOf+" guardado.";
    }catch(error){status.textContent=error.message;}
    finally{busy=false;button.disabled=false;}
  });
  const space=document.getElementById("space-portfolio");
  new MutationObserver(()=>{if(!space.hidden)load();}).observe(space,{attributes:true,attributeFilter:["hidden"]});
  if(!space.hidden)load();
})();`;
