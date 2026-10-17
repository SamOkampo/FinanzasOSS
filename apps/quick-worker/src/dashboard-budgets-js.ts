// Staging-only financial budgets: four independent owner-scoped COP caps.
// No localStorage, no financial caching, no fabricated bank balances.
// Server remains authoritative for totals across browser and iOS Shortcuts.
export const BUDGET_JS = `(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const names={day:"diario",week:"semanal",month:"mensual",year:"anual"};
  const labels={day:"hoy",week:"esta semana",month:"este mes",year:"este año"};
  const periods=Object.keys(names);
  const fmt=new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
  const cop=minor=>fmt.format(Number(minor||0)/100);
  let current=null,loading=false,mutation=false;
  function statusText(p){
    if(p.status==="unconfigured")return "Sin límite";
    if(p.status==="over")return "Límite superado";
    if(p.status==="exhausted")return "Límite alcanzado";
    if(p.status==="near")return "Cerca del límite";
    return "Dentro del límite";
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
        p.usedPercent+" por ciento usado":"Sin límite configurado");
      if(resetInput)input.value=configured?String(Number(p.limitMinor)/100):"";
      if(configured && ["near","exhausted","over"].includes(p.status))
        warnings.push(names[period]+": "+statusText(p).toLowerCase());
    }
    const status=$("budget-home-status"),home=$("budget-home");
    const configured=periods.filter(period=>data.periods[period].limitMinor!==null).length;
    if(warnings.length){
      status.textContent="Atención: "+warnings.join(" · ")+".";
      home.dataset.budgetStatus="near";
    }else{
      status.textContent=configured?
        configured+" límite(s) configurado(s). Todos los períodos están bajo control.":
        "Todavía no has definido límites. Configúralos en Plan.";
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
        throw new Error("El servidor devolvió presupuestos incompletos.");
      render(data,resetInput);
      $("budget-message").textContent="Límites sincronizados con tus gastos registrados.";
    }catch(error){
      $("budget-message").textContent=error.message+" Comprueba tu conexión.";
    }finally{loading=false;}
  }
  async function update(period,remove){
    if(mutation||loading)return;
    const input=$("budget-input-"+period),status=$("budget-message");
    const amount=input.value.trim();
    if(!remove&&(!/^[1-9][0-9]{0,9}$/.test(amount)||Number(amount)>1000000000)){
      status.textContent="Escribe un límite entero de 1 a 1.000.000.000 COP.";input.focus();return;
    }
    if(remove && (!current || current.periods[period].limitMinor===null)){
      status.textContent="No hay límite "+names[period]+" que quitar.";return;
    }
    if(remove&&!confirm("¿Quitar tu límite "+names[period]+"? No eliminará ningún gasto."))return;
    mutation=true;
    document.querySelectorAll("[data-budget-save],[data-budget-remove]").forEach(el=>el.disabled=true);
    try{
      const res=await fetch("/api/quick/budgets",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({period,amountCOP:remove?null:amount}),
      });
      if(!res.ok)throw new Error("No se pudo guardar el límite (HTTP "+res.status+").");
      status.textContent=remove?"Límite "+names[period]+" quitado.":"Límite "+names[period]+" guardado.";
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
      if(newSpend>=limit)notices.push("Límite "+names[period]+" alcanzado o superado");
      else if(newSpend*100>=limit*80)notices.push("Alcanzarías el 80 % del límite "+names[period]);
    }
    return notices.length?"\\nAviso de presupuesto: "+notices.join("; ")+". Puedes registrar el gasto igualmente.":"";
  };
  document.addEventListener("finanzasoss:data",()=>{void reload();});
  window.addEventListener("pageshow",()=>{void reload();});
  void reload(true);
})();`;
