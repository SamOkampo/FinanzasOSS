export const TRANSFER_LINKS_JS=String.raw`
(()=>{
  "use strict";
  const panel=document.getElementById("transfer-link-panel");
  if(!panel||panel.dataset.transferLinks!=="true")return;
  panel.hidden=false;
  const status=document.getElementById("transfer-link-status");
  const output=document.getElementById("transfer-link-results");
  const refresh=document.getElementById("transfer-link-refresh");
  const money=new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP"});
  let busy=false;
  const focusId=new URL(location.href).searchParams.get("transfer");
  function element(tag,content,className){
    const node=document.createElement(tag);
    if(content)node.textContent=content;
    if(className)node.className=className;
    return node;
  }
  async function request(body){
    const result=await fetch("/api/quick/v41/reconcile/links",{
      cache:"no-store",credentials:"same-origin",...(body?{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)}:{})
    });
    const data=await result.json().catch(()=>({}));
    if(!result.ok)throw Error(data.error||"No se pudo consultar el cruce.");
    return data;
  }
  function group(title,count){
    const details=element("details","","import-disclosure import-help");
    details.append(element("summary",title+" ("+count+")"));
    output.append(details);
    return details;
  }
  function render(data){
    output.replaceChildren();
    const suggestions=group("Cruces posibles",data.candidates.length);
    const pending=group("Filas sin vincular",data.pending.length);
    const history=group("Cruces confirmados",data.history.length);
    suggestions.open=Boolean(data.candidates.length);
    for(const [target,rows] of [[suggestions,data.candidates],[history,data.history]]){
      for(const row of rows){
        const card=element("article","","ai-document-table");
        const kind=row.kind==="card_payment"?"Pago de tarjeta":"Transferencia propia";
        card.append(element("strong",kind+" · "+money.format(row.amount_minor/100)),
          element("p",row.from_label+" → "+row.to_label),
          element("p",row.debited_on+" · "+row.debit_description),
          element("p",row.credited_on+" · "+row.credit_description));
        if(target===suggestions){
          const button=element("button","Vincular estas filas","solid-button");
          button.type="button";
          button.addEventListener("click",()=>{
            if(window.confirm("¿Confirmas que estas filas corresponden al mismo "+kind.toLowerCase()+"?"))
              update({debitId:row.debit_id,creditId:row.credit_id,confirmed:true});
          });
          card.append(button);
        }else card.append(element("p","Vinculado el "+new Date(row.confirmed_at).toLocaleString("es-CO")));
        target.append(card);
      }
    }
    let focused;
    for(const row of data.pending){
      const side=row.direction==="debit"?"Salida":"Abono";
      const entry=element("p",side+" · "+row.occurred_on+" · "+row.bank_label+" · "+
        row.counterparty_label+" · "+money.format(row.amount_minor/100));
      pending.append(entry);
      if(row.id===focusId){focused=entry;entry.tabIndex=-1;}

    }
    if(focused){pending.open=true;focused.focus();}
  }
  async function update(body){
    if(busy)return;
    busy=true;refresh.disabled=true;status.textContent="Consultando cruces…";
    try{
      if(body)await request(body);
      const data=await request();
      render(data);
      status.textContent=body?"Vínculo confirmado.":data.candidates.length?
        "Compara las dos filas antes de vincularlas.":"Revisa el historial o confirma el extracto de la otra cuenta.";
    }catch(error){status.textContent=error.message;}
    finally{busy=false;refresh.disabled=false;}
  }
  panel.addEventListener("toggle",()=>{if(panel.open)update();});
  refresh.addEventListener("click",()=>update());
  if(focusId)panel.open=true;
})();
`;
