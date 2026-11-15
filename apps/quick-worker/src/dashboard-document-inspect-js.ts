// Document inspection is an opt-in, read-only companion to existing CSV importer.
// Never sends the financial file to another origin or persists it in browser storage.
export const DOCUMENT_INSPECT_JS = String.raw`
(()=>{
  "use strict";
  const byId=id=>document.getElementById(id);
  const file=byId("ai-document-file"),consent=byId("ai-document-consent"),
    button=byId("ai-document-inspect"),feedback=byId("ai-document-feedback"),
    results=byId("ai-document-results"),summary=byId("ai-document-summary"),
    tables=byId("ai-document-tables"),bank=byId("ai-document-bank"),
    method=byId("ai-document-method"),recon=byId("ai-document-reconcile"),
    reconSummary=byId("ai-document-reconcile-summary"),reconRows=byId("ai-document-reconcile-rows");
  const passwordForm=byId("ai-document-password-form"),password=byId("ai-document-password"),
    fileStatus=byId("ai-document-file-status"),unlockButton=passwordForm?.querySelector("button");
  if(!file||!consent||!button||!feedback||!results||!summary||!tables||!bank||!method||
    !recon||!reconSummary||!reconRows||!passwordForm||!password||!fileStatus||!unlockButton)return;
  const labels={bank_statement:"Extracto bancario",card_statement:"Extracto de tarjeta de crédito",
    investment_statement:"Estado de inversiones",non_financial:"No parece un documento financiero",
    unknown:"Documento no identificado"};
  const roles={transactions:"Movimientos",balances:"Saldos",fees:"Comisiones",
    summary:"Resumen",other:"Otra tabla"};
  const mappings={postedAt:"Fecha",description:"Descripción",amount:"Importe",
    direction:"Tipo",debit:"Cargo",credit:"Abono",balance:"Saldo",
    currency:"Moneda",externalId:"Referencia"};
  const statuses={possible_match:"Posible coincidencia",needs_purpose:"Abono sin finalidad confirmada",
    needs_type:"Cargo por clasificar",possible_transfer:"Posible transferencia propia",
    repeated_in_file:"Se parece a otra fila del documento",needs_correction:"Fila para corregir"};
  const maxBytes=4000000;
  let readyFile=null,pdfTask=null,analysisTask=null,selection=0;
  function updateButton(){
    button.disabled=Boolean(analysisTask)||!consent.checked||!readyFile;
  }
  const elt=(tag,cls,txt)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(txt!==undefined)el.textContent=txt;
    return el;
  };
  function reset(){
    document.dispatchEvent(new Event("finanzasoss:v41-invalidated"));
    results.hidden=true;tables.replaceChildren();summary.textContent="";
    recon.hidden=true;reconRows.replaceChildren();reconSummary.textContent="";
    analysisTask?.abort();
    analysisTask=null;
    feedback.textContent=readyFile?"Revisa y autoriza el análisis del documento.":"Ningún archivo ha sido enviado.";
    updateButton();
  }
  consent.addEventListener("change",reset);
  function stopPdfTask(){
    if(!pdfTask)return;
    clearTimeout(pdfTask.timer);
    pdfTask.worker.terminate();
    pdfTask=null;
  }
  function preparePdf(item,pass){
    const current=selection;
    unlockButton.disabled=true;
    fileStatus.textContent=pass?"Desbloqueando el PDF en este dispositivo…":"Verificando el PDF…";
    const done=(result)=>{
      if(current!==selection)return;
      stopPdfTask();
      unlockButton.disabled=false;
      switch(result.status){
        case "plain":
        case "unlocked":
          readyFile=result.status==="plain"?item:new File([result.bytes],"extracto.pdf",{type:"application/pdf"});
          passwordForm.hidden=true;
          fileStatus.textContent=result.status==="unlocked"?"PDF desbloqueado. La contraseña se usó solo en este dispositivo.":"PDF listo para analizar.";
          reset();
          return;
        case "password_required":
        case "incorrect_password":
          passwordForm.hidden=false;
          fileStatus.textContent=result.status==="password_required"?
            "El PDF está protegido. Escribe la contraseña con la que lo abres.":
            "Contraseña incorrecta. Intenta de nuevo.";
          return;
        case "too_large":
          fileStatus.textContent="El PDF supera el límite de 4 MB tras abrirse.";
          break;
        default:
          fileStatus.textContent="No pudimos abrir este PDF. Verifica que puedes abrirlo en Archivos e inténtalo de nuevo.";
      }
      passwordForm.hidden=true;
    };
    try{
      const worker=new Worker("/statement-pdf-worker.js");
      const timer=setTimeout(()=>done({status:"unreadable"}),20000);
      pdfTask={worker,timer};
      worker.onmessage=event=>done(event.data);
      worker.onerror=()=>done({status:"unreadable"});
      worker.postMessage({file:item,password:pass});
    }catch{done({status:"unreadable"});}
  }
  file.addEventListener("change",()=>{
    selection++;
    stopPdfTask();
    readyFile=null;
    consent.checked=false;
    password.value="";
    passwordForm.hidden=true;
    unlockButton.disabled=false;
    fileStatus.textContent="";
    reset();
    const item=file.files?.[0];
    if(!item)return;
    if(item.size<1||item.size>maxBytes){fileStatus.textContent="Selecciona un archivo de máximo 4 MB.";return;}
    if(/\.pdf$/i.test(item.name)){preparePdf(item,"");return;}
    if(!/\.(xlsx|csv)$/i.test(item.name)){fileStatus.textContent="Selecciona PDF, Excel XLSX o CSV.";return;}
    readyFile=item;
    reset();
  });
  passwordForm.addEventListener("submit",event=>{
    event.preventDefault();
    const item=file.files?.[0];
    if(!item||pdfTask||passwordForm.hidden||!password.value)return;
    const pass=password.value;
    password.value="";
    preparePdf(item,pass);
  });
  bank.addEventListener("input",()=>{document.dispatchEvent(new Event("finanzasoss:v41-invalidated"));if(!analysisTask&&results.hidden===false){
    recon.hidden=true;reconRows.replaceChildren();reconSummary.textContent="";
    feedback.textContent="Cambiaste el banco: vuelve a analizar para evitar coincidencias con otra entidad.";
  }});
  method.addEventListener("change",()=>document.dispatchEvent(new Event("finanzasoss:v41-invalidated")));
  button.addEventListener("click",async()=>{
    if(analysisTask||!consent.checked||!readyFile)return;
    const item=readyFile;
    reset();
    const task=new AbortController();
    analysisTask=task;
    updateButton();
    feedback.textContent="Convirtiendo el archivo y consultando a Qwen 3.8…";
    try{
      const body=new FormData();body.append("file",item);body.append("consent","true");
      body.append("bankLabel",bank.value.trim());body.append("paymentMethod",method.value);
      const r=await fetch("/api/quick/v41/ai/document/inspect",{
        method:"POST",credentials:"same-origin",cache:"no-store",body,signal:task.signal,
      });
      const payload=await r.json().catch(()=>({}));
      if(task.signal.aborted)return;
      if(!r.ok)throw new Error(payload.error||"No fue posible inspeccionar este documento.");
      tables.replaceChildren();
      summary.textContent=(labels[payload.documentType]||labels.unknown)+
        " · "+payload.tables.length+" tabla(s) detectada(s). "+payload.explanation;
      for(const table of payload.tables){
        const analysis=table.analysis||{},section=elt("article","ai-document-table");
        const head=elt("div","ai-document-table-head");
        head.append(elt("strong","",("Tabla "+(table.index+1))+
          (table.heading?" · "+table.heading:"")));
        head.append(elt("span","state-pill",roles[analysis.role]||roles.other));
        section.append(head);
        section.append(elt("p","budget-note",(table.rowCount||0)+" fila(s) extraídas · "+
          "Confianza sugerida "+Math.round((analysis.confidence||0)*100)+"%"));
        const heads=elt("p","ai-document-columns");
        heads.textContent="Columnas: "+(table.headers||[]).join(" · ");
        section.append(heads);
        const used=Object.entries(analysis.mapping||{}).filter(([k,v])=>
          typeof v==="string"&&v&&Object.prototype.hasOwnProperty.call(mappings,k));
        if(used.length){
          const list=elt("dl","ai-document-mapping");
          for(const [key,value] of used){
            list.append(elt("dt","",mappings[key]),elt("dd","",value));
          }
          section.append(list);
        }else section.append(elt("p","budget-note","No se identificaron columnas con confianza suficiente."));
        if(analysis.note)section.append(elt("p","budget-note",analysis.note));
        tables.append(section);
      }
      const match=payload.reconciliation;
      recon.hidden=false;
      reconRows.replaceChildren();
      if(!match?.available){
        reconSummary.textContent=match?.reason||"Completa el banco para conciliar este documento.";
      }else{
        const preview=match.preview||{};
        const count=preview.counts||{};
        reconSummary.textContent=(preview.count||0)+" movimientos examinados · "+
          (count.possibleMatch||0)+" coincidencias posibles · "+
          (count.needsPurpose||0)+" abonos por aclarar · "+
          (count.possibleTransfer||0)+" posibles transferencias · "+
          (count.needsCorrection||0)+" filas con datos inválidos. "+
          "Origen: tabla "+(match.tableIndex+1)+". Nada guardado.";
        for(const row of (preview.rows||[])){
          const item=elt("article","ai-document-table");
          item.append(elt("strong","",(row.index+1)+". "+(statuses[row.status]||"Revisión")));
          item.append(elt("p","",String(row.date||"Fecha inválida")+" · "+
            String(row.description||"Concepto no identificado")+" · "+
            String(row.amountCOP||"Importe inválido")+" COP · "+
            (row.direction==="credit"?"Abono":row.direction==="debit"?"Cargo":"Sentido por revisar")));
          if(row.existing?.length){
            item.append(elt("p","budget-note","Posible coincidencia: "+
              row.existing.map(x=>x.description+" ("+x.source+")").join(", ")));
          }
          if(row.repeatOfIndex!==null&&row.repeatOfIndex!==undefined)
            item.append(elt("p","budget-note","Similar a la fila "+(row.repeatOfIndex+1)+
              "; podría ser otra compra legítima."));
          if(row.issues?.length)
            item.append(elt("p","budget-note","Revisar: "+row.issues.join(" · ")));
          reconRows.append(item);
        }
      }
      if(match?.available&&match.prepared&&match.preview)
        document.dispatchEvent(new CustomEvent("finanzasoss:v41-preview",{
          detail:{input:match.prepared,result:match.preview,origin:"document"}}));
      results.hidden=false;
      feedback.textContent="Análisis y conciliación previa terminados. Ningún movimiento fue importado ni modificado.";
      results.scrollIntoView?.({behavior:"smooth",block:"nearest"});
    }catch(e){
      if(!task.signal.aborted)feedback.textContent=e instanceof Error?e.message:"No se pudo revisar el documento.";
    }finally{
      if(analysisTask===task){analysisTask=null;updateButton();}
    }
  });
})();
`;
