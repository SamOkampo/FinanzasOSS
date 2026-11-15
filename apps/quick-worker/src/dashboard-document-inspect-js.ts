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
  const pick=byId("ai-document-pick"),filename=byId("ai-document-filename"),
    openPassword=byId("ai-document-password-open"),controls=byId("ai-document-analysis-controls"),
    localResults=byId("ai-document-local-results"),localStatus=byId("ai-document-local-status"),
    localGroups=byId("ai-document-local-groups"),localTitle=byId("ai-document-local-title");
  if(!file||!consent||!button||!feedback||!results||!summary||!tables||!bank||!method||
    !recon||!reconSummary||!reconRows||!passwordForm||!password||!fileStatus||!unlockButton||
    !pick||!filename||!openPassword||!controls||!localResults||!localStatus||!localGroups||!localTitle)return;
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
  const visionOptions=byId("ai-document-vision-options"),visionStart=byId("ai-document-vision-start"),
    visionAuto=byId("ai-document-vision-auto"),visionCancel=byId("ai-document-vision-cancel"),visionStatus=byId("ai-document-vision-status"),
    visionFirst=byId("ai-document-vision-first"),visionResults=byId("ai-document-vision-results"),
    visionIssues=byId("ai-document-vision-issues"),visionGroups=byId("ai-document-vision-groups"),
    visionCount=byId("ai-document-vision-count"),visionBank=byId("ai-document-vision-bank"),
    visionMethod=byId("ai-document-vision-method"),visionScope=byId("ai-document-vision-scope"),visionCOP=byId("ai-document-vision-cop"),
    visionReview=byId("ai-document-vision-reconcile"),visionReviewStatus=byId("ai-document-vision-reconcile-status");
  if(!visionOptions||!visionStart||!visionAuto||!visionCancel||!visionStatus||!visionFirst||!visionResults||!visionIssues||
    !visionGroups||!visionCount||!visionBank||!visionMethod||!visionScope||!visionCOP||!visionReview||!visionReviewStatus)return;
  const visionAvailable=visionOptions.dataset.visionAvailable==="true";
  let visionFile=null,visionTask=null,visionReviewTask=null,visionReviewActive=false,allowAutomaticVision=false;
  const reviewPanel=byId("ai-document-pdf-review"),localReviewSlot=byId("ai-document-local-review-slot"),
    visionReviewSlot=byId("ai-document-vision-review-slot");
  const chooseLocal=byId("ai-document-review-local"),chooseVision=byId("ai-document-review-vision");
  const progressBox=byId("ai-document-vision-progress-box"),progress=byId("ai-document-vision-progress"),
    eta=byId("ai-document-vision-eta");
  let localStatement=null,reviewSource="vision";
  visionAuto.checked=false;
  visionAuto.closest("label").hidden=!visionAvailable;
  const visionPages=new Map();
  function selectedVisionRows(){
    const scope=visionScope.value;
    const groups=reviewGroups();
    if(scope==="all")return groups.flatMap(group=>group.rows);
    const [key,start]=scope.split(":").map(Number);
    const group=reviewSource==="vision"?visionPages.get(key):groups[key];
    return group?.rows.slice(start,start+50)||[];
  }
  function reviewGroups(){
    return reviewSource==="local"?localStatement?.groups||[]:[...visionPages.values()].sort((a,b)=>a.page-b.page);
  }
  function showPdfReview(source){
    if(reviewSource!==source)resetVisionReview();
    reviewSource=source;
    visionCOP.checked=false;
    visionScope.replaceChildren();
    const groups=reviewGroups();
    const slot=source==="local"?localReviewSlot:visionReviewSlot;
    slot.append(reviewPanel);
    updateVisionScope(groups);
    reviewPanel.hidden=!groups.some(group=>group.rows.length);
    chooseLocal.hidden=source==="local"||!localStatement;
    chooseVision.hidden=source==="vision"||![...visionPages.values()].some(group=>group.rows.length);
    updateVision();
  }
  chooseLocal.addEventListener("click",()=>showPdfReview("local"));
  chooseVision.addEventListener("click",()=>showPdfReview("vision"));
  function updateVision(){
    visionOptions.hidden=!visionAvailable||!visionFile;
    visionStart.disabled=visionOptions.hidden||Boolean(visionTask);
    visionCancel.hidden=!visionTask;
    visionFirst.disabled=Boolean(visionTask);
    visionCount.disabled=Boolean(visionTask);
    const rows=selectedVisionRows();
    const missingCurrency=rows.some(row=>!row.currency);
    visionCOP.closest("label").hidden=!missingCurrency;
    visionReview.disabled=Boolean(visionTask||visionReviewTask)||!rows.length||!visionBank.value.trim()||
      (missingCurrency&&!visionCOP.checked);
  }
  function resetVisionReview(){
    visionReviewTask?.abort();
    visionReviewTask=null;
    if(visionReviewActive){
      document.dispatchEvent(new Event("finanzasoss:v41-invalidated"));
      results.hidden=true;
      recon.hidden=true;
      reconRows.replaceChildren();
      visionReviewActive=false;
    }
    announce(visionReviewStatus,"");
    updateVision();
  }
  function resetVision(){
    visionTask?.abort();
    visionTask=null;
    visionFile=null;
    visionOptions.open=false;
    visionFirst.value="1";
    visionCount.value="1";
    visionCOP.checked=false;
    visionPages.clear();
    visionGroups.replaceChildren();
    visionScope.replaceChildren();
    visionResults.hidden=true;
    reviewPanel.hidden=true;
    chooseLocal.hidden=true;
    chooseVision.hidden=true;
    localStatement=null;
    reviewSource="vision";
    progressBox.hidden=true;
    announce(visionStatus,"");
    resetVisionReview();
  }
  const maxBytes=4000000;
  const analysisAvailable=controls.dataset.analysisAvailable==="true";
  let readyFile=null,pdfTask=null,analysisTask=null,selection=0;
  pick.disabled=false;
  pick.addEventListener("click",()=>file.click());
  function announce(element,message,error=false){
    element.textContent=message;
    element.toggleAttribute("data-error",error);
  }
  function setPasswordOpen(open){
    passwordForm.hidden=!open;
    openPassword.setAttribute("aria-expanded",String(open));
  }
  openPassword.addEventListener("click",()=>{
    setPasswordOpen(passwordForm.hidden);
    if(!passwordForm.hidden)password.focus();
    else password.value="";
  });
  function updateButton(){
    controls.hidden=!analysisAvailable||!readyFile;
    button.disabled=controls.hidden||Boolean(analysisTask)||!consent.checked;
  }
  const elt=(tag,cls,txt)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(txt!==undefined)el.textContent=txt;
    return el;
  };
  function showLocalPreview(statement,target=localGroups,status=localStatus,section=localResults){
    if(section===localResults)localTitle.textContent=statement.title;
    let count=0;
    for(const {title,rows} of statement.groups){
      if(!rows.length)continue;
      count+=rows.length;
      const group=elt("details","import-disclosure import-local-group");
      group.append(elt("summary","",title+" · "+rows.length));
      group.open=statement.groups.length===1&&rows.length<=12;
      const list=elt("ul","import-local-rows");
      for(const row of rows){
        const item=elt("li");
        item.append(elt("strong","",row.description||"Descripción por verificar"));
        const direction=row.direction==="credit"?"Abono":row.direction==="debit"?"Cargo":"Tipo por revisar";
        item.append(elt("span","",(row.date?row.date.split("-").reverse().join("/"):"Fecha por verificar")+" · "+
          direction+" · "+(row.amount?[row.amount,row.currency].filter(Boolean).join(" "):"Importe por verificar")+" · Pág. "+row.page));
        list.append(item);
      }
      group.append(list);
      target.append(group);
    }
    const period=statement.period?" · "+statement.period:"";
    const note=statement.totalsDiffer?" Los totales leídos difieren del resumen del banco.":"";
    const issues=statement.issues?" Hay "+statement.issues+" fila(s) que requieren revisión en el PDF.":"";
    announce(status,section===localResults?count+" movimientos leídos"+period+"."+note+issues:issues.trim(),Boolean(note||issues));
    section.hidden=false;
  }
  function updateVisionScope(groups){
    const prior=visionScope.value;
    visionScope.replaceChildren();
    const option=(value,label)=>{
      const item=elt("option","",label);
      item.value=value;
      visionScope.append(item);
    };
    const total=groups.reduce((sum,group)=>sum+group.rows.length,0);
    if(total>0&&total<=50&&(reviewSource==="vision"||groups.filter(group=>group.rows.length).length===1))
      option("all","Todas las filas ("+total+")");
    for(const [index,group] of groups.entries()){
      for(let start=0;start<group.rows.length;start+=50){
        const end=Math.min(start+50,group.rows.length);
        option((reviewSource==="vision"?group.page:index)+":"+start,group.title+(group.rows.length>50?" · filas "+(start+1)+" a "+end:""));
      }
    }
    if([...visionScope.options].some(item=>item.value===prior))visionScope.value=prior;
  }
  async function runVision({automatic=false}={}){
    if(visionTask||!visionFile||!visionAvailable)return;
    if(!visionFirst.reportValidity()||!visionCount.reportValidity())return;
    const first=visionFirst.valueAsNumber;
    const pages=automatic?5:visionCount.valueAsNumber;
    visionCOP.checked=false;
    resetVisionReview();
    const fileToRender=visionFile;
    const task=new AbortController();
    const timer=setTimeout(()=>{
      announce(visionStatus,"La lectura visual tardó demasiado. Puedes continuar a partir de la página pendiente.",true);
      task.abort("timeout");
    },150000);
    visionTask=task;
    updateVision();
    announce(visionStatus,"Preparando las páginas para Qwen…");
    progressBox.hidden=false;
    progress.removeAttribute("value");
    eta.textContent="";
    const groups=[];
    let loading=null,failed=0,incomplete=0,total=0,last=0,nextPage=first;
    try{
      const engine=await import("/statement-pdf-renderer.mjs?v=41.10");
      if(task.signal.aborted)return;
      engine.GlobalWorkerOptions.workerSrc="/statement-pdf-render-worker.mjs?v=41.10";
      const bytes=new Uint8Array(await fileToRender.arrayBuffer());
      if(task.signal.aborted)return;
      loading=engine.getDocument({data:bytes,
        useWasm:false,useWorkerFetch:false,disableFontFace:true,useSystemFonts:true,enableXfa:false,
        isEvalSupported:false,maxImageSize:20000000,canvasMaxAreaInBytes:24000000,verbosity:0});
      task.signal.addEventListener("abort",()=>{loading.destroy().catch(()=>{});},{once:true});
      const pdf=await loading.promise;
      if(task.signal.aborted)return;
      total=pdf.numPages;
      if(first>total){
        announce(visionStatus,"El PDF tiene "+total+" páginas. Elige una página que exista.",true);
        return;
      }
      last=Math.min(total,first+pages-1,20);
      progress.max=last-first+1;
      progress.value=0;
      const started=Date.now();
      for(let page=first;page<=last;page++){
        if(task.signal.aborted)return;
        nextPage=page;
        announce(visionStatus,"Preparando página "+page+" de "+total+"…");
        const source=await pdf.getPage(page);
        const original=source.getViewport({scale:1});
        const viewport=source.getViewport({scale:1700/Math.max(original.width,original.height)});
        const canvas=document.createElement("canvas");
        canvas.width=Math.ceil(viewport.width);
        canvas.height=Math.ceil(viewport.height);
        let image;
        try{
          await source.render({canvas,viewport,background:"white",
            annotationMode:engine.AnnotationMode.DISABLE}).promise;
          image=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.86));
        }finally{
          canvas.width=0;
          canvas.height=0;
          source.cleanup();
        }
        if(task.signal.aborted)return;
        if(!image||image.size>1500000){failed++;progress.value=page-first+1;nextPage=page+1;continue;}
        const body=new FormData();
        body.append("image",image,"pagina.jpg");
        body.append("page",String(page));
        body.append("consent","true");
        announce(visionStatus,"Qwen está leyendo la página "+page+" de "+total+"…");
        const response=await fetch("/api/quick/v41/ai/document/vision",{
          method:"POST",credentials:"same-origin",cache:"no-store",body,signal:task.signal,
        });
        const result=await response.json().catch(()=>({}));
        if(task.signal.aborted)return;
        if(response.status===429)throw Error(result.error||"Alcanzaste el límite diario de Qwen.");
        if(!response.ok||result.page!==page||!Array.isArray(result.rows))failed++;
        else{
          if(result.partial)incomplete++;
          groups.push({page,title:"Página "+page,rows:result.rows.map(row=>({...row,page}))});
        }
        progress.value=page-first+1;
        nextPage=page+1;
        if(groups.length>=2&&last>page){
          const seconds=Math.max(1,Math.round((Date.now()-started)/1000/progress.value*(last-page)));
          eta.textContent=seconds<60?"Quedan unos "+seconds+" s":"Quedan unos "+Math.ceil(seconds/60)+" min";
        }
      }
      const count=groups.reduce((sum,group)=>sum+group.rows.length,0);
      const pending=last-first+1-groups.length;
      const status=count?
        "Listo para revisar. Qwen propuso "+count+" movimientos. Coteja cada fila con el PDF.":
        "Qwen no encontró movimientos legibles en las páginas procesadas.";
      announce(visionStatus,status+(pending?" Quedaron "+pending+" páginas sin lectura.":"")+
        (incomplete?" "+incomplete+" páginas tienen lectura parcial.":"")+
        (last<Math.min(total,20)?" Puedes continuar desde la página "+(last+1)+".":"")+
        (total>20?" La lectura visual admite las primeras 20 páginas.":""),!count||Boolean(failed||pending||incomplete));
    }catch(error){
      if(task.signal.aborted&&visionTask===task)announce(visionStatus,
        task.signal.reason==="timeout"?"La lectura visual tardó demasiado. Puedes continuar a partir de la página pendiente.":"Lectura visual cancelada.",true);
      else if(!task.signal.aborted)announce(visionStatus,error?.message?.startsWith("Alcanzaste")?
        error.message+" Conservamos las páginas que ya se leyeron. Puedes continuar desde la página "+nextPage+" después de que se renueve la cuota.":
        "No se pudo completar la lectura visual. Revisa las páginas procesadas o vuelve a intentar.",true);
    }finally{
      clearTimeout(timer);
      if(loading&&!task.signal.aborted)await loading.destroy().catch(()=>{});
      if(visionTask===task){
        visionTask=null;
        progressBox.hidden=true;
        const firstUnread=Array.from({length:Math.max(0,last-first+1)},(_,i)=>first+i)
          .find(page=>!groups.some(group=>group.page===page)&&!visionPages.has(page));
        const resume=firstUnread??nextPage;
        if(resume<=Math.min(total,20))visionFirst.value=String(resume);
        for(const group of groups)visionPages.set(group.page,group);
        const accumulated=[...visionPages.values()].sort((a,b)=>a.page-b.page);
        visionGroups.replaceChildren();
        visionResults.hidden=!accumulated.some(group=>group.rows.length);
        if(!visionResults.hidden){
          showLocalPreview({groups:accumulated,
            issues:accumulated.flatMap(group=>group.rows).filter(row=>!row.date||!row.description||
              !row.amount||!row.direction||!row.currency||(row.currency==="COP"&&!row.amountCOP)).length},
            visionGroups,visionIssues,visionResults);
          showPdfReview("vision");
        }
        updateVision();
      }
    }
  }
  visionStart.addEventListener("click",()=>runVision());
  visionCancel.addEventListener("click",()=>{
    visionTask?.abort();
    announce(visionStatus,"Lectura visual cancelada.");
  });
  function reset(){
    resetVisionReview();
    document.dispatchEvent(new Event("finanzasoss:v41-invalidated"));
    results.hidden=true;tables.replaceChildren();summary.textContent="";
    recon.hidden=true;reconRows.replaceChildren();reconSummary.textContent="";
    analysisTask?.abort();
    analysisTask=null;
    announce(feedback,readyFile&&!analysisAvailable?"El análisis con Qwen está desactivado en este entorno.":"");
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
    openPassword.disabled=true;
    readyFile=null;
    resetVision();
    localResults.hidden=true;
    localGroups.replaceChildren();
    reset();
    announce(fileStatus,pass?"Desbloqueando PDF…":"Abriendo PDF…");
    const done=(result)=>{
      if(current!==selection)return;
      stopPdfTask();
      unlockButton.disabled=false;
      openPassword.disabled=false;
      switch(result.status){
        case "plain":
        case "unlocked": {
          const unlocked=result.status==="unlocked";
          const opened=unlocked&&result.bytes?new File([result.bytes],"extracto.pdf",{type:"application/pdf"}):unlocked?null:item;
          const hasMovements=Boolean(result.statement?.groups.some(group=>group.rows.length>0));
          const usable=result.statement?.groups.some(group=>group.rows.some(row=>row.date&&row.description&&row.direction&&
            (row.amountCOP||row.currency&&row.currency!=="COP"&&row.amount)));
          const useVisualFallback=visionAvailable&&opened&&!usable&&result.issue!=="page_limit";
          readyFile=hasMovements?null:opened;
          visionFile=opened;
          updateVision();
          openPassword.hidden=unlocked;
          setPasswordOpen(false);
          announce(fileStatus,hasMovements?"Lectura local lista para revisar.":unlocked?"PDF desbloqueado.":"PDF abierto.");
          reset();
          if(hasMovements){
            localStatement=result.statement;
            showLocalPreview(localStatement);
            showPdfReview("local");
          }
          if(useVisualFallback){
            visionOptions.open=true;
            announce(visionStatus,"La lectura local no encontró movimientos completos. Puedes leer las páginas con Qwen.");
            if(allowAutomaticVision)runVision({automatic:true});
          }else if(visionAvailable&&visionFile&&result.issue==="page_limit"){
            visionOptions.open=true;
            announce(visionStatus,"El PDF supera las 20 páginas de la lectura local. Elige qué páginas leer con Qwen.");
          }else if(visionAvailable&&visionFile&&(result.statement?.issues||result.statement?.totalsDiffer)){
            visionOptions.open=true;
          }else if(!visionAvailable&&!hasMovements&&result.issue!=="page_limit"){
            announce(feedback,"Este PDF parece un escaneo. Prueba el PDF digital del banco o su archivo Excel/CSV.",true);
          }else if(result.issue==="page_limit"){
            announce(feedback,"La lectura local admite hasta 20 páginas. Puedes analizar el archivo o elegir un período más corto.");
          }
          allowAutomaticVision=false;
          if(pass){
            const next=useVisualFallback?
              (visionTask?visionCancel:visionStart):unlocked?(readyFile&&analysisAvailable?consent:pick):openPassword;
            next.focus({preventScroll:true});
          }
          return;
        }
        case "password_required":
        case "incorrect_password": {
          const incorrect=result.status==="incorrect_password";
          openPassword.hidden=true;
          setPasswordOpen(true);
          announce(fileStatus,incorrect?"Contraseña incorrecta. Intenta de nuevo.":"Este PDF está protegido. Escribe su contraseña.",incorrect);
          if(incorrect)password.focus();
          return;
        }
        case "too_large":
          openPassword.hidden=true;
          setPasswordOpen(false);
          announce(fileStatus,"El PDF desbloqueado supera 4 MB.",true);
          return;
        default:
          openPassword.hidden=false;
          setPasswordOpen(Boolean(pass));
          announce(fileStatus,pass?"No pudimos abrir este PDF. Revisa la clave o elige otra copia.":"No pudimos leer este PDF. Si está protegido, ingresa su contraseña.",true);
      }
    };
    try{
      const worker=new Worker("/statement-pdf-worker.js?v=41.22");
      const timer=setTimeout(()=>done({status:"unreadable"}),20000);
      pdfTask={worker,timer};
      worker.onmessage=event=>{
        if(event.data.stage==="reading"){
          if(current===selection)announce(fileStatus,"Leyendo texto del PDF en tu dispositivo…");
          return;
        }
        done(event.data);
      };
      worker.onerror=()=>done({status:"unreadable"});
      worker.postMessage({file:item,password:pass,enableVision:visionAvailable});
    }catch{done({status:"unreadable"});}
  }
  file.addEventListener("change",()=>{
    selection++;
    stopPdfTask();
    resetVision();
    localResults.hidden=true;
    localGroups.replaceChildren();
    readyFile=null;
    consent.checked=false;
    password.value="";
    setPasswordOpen(false);
    openPassword.hidden=true;
    openPassword.disabled=false;
    unlockButton.disabled=false;
    announce(fileStatus,"");
    reset();
    const item=file.files?.[0];
    allowAutomaticVision=visionAvailable&&visionAuto.checked&&Boolean(item&&/\.pdf$/i.test(item.name));
    visionAuto.checked=false;
    filename.textContent=item?.name||"";
    pick.textContent=item?"Cambiar archivo":"Elegir archivo";
    if(!item)return;
    if(item.size<1||item.size>maxBytes){announce(fileStatus,"Selecciona un archivo de máximo 4 MB.",true);return;}
    if(/\.pdf$/i.test(item.name)){openPassword.hidden=false;preparePdf(item,"");return;}
    if(!/\.(xlsx|csv)$/i.test(item.name)){announce(fileStatus,"Selecciona PDF, Excel o CSV.",true);return;}
    readyFile=item;
    reset();
  });
  passwordForm.addEventListener("submit",event=>{
    event.preventDefault();
    const item=file.files?.[0];
    if(!item||!/\.pdf$/i.test(item.name)||pdfTask||passwordForm.hidden||!password.value)return;
    const pass=password.value;
    password.value="";
    preparePdf(item,pass);
  });
  function updateAccount(){
    const hadPreview=Boolean(analysisTask)||!results.hidden;
    reset();
    if(hadPreview)announce(feedback,"Vuelve a analizar con los datos actualizados.");
  }
  bank.addEventListener("input",updateAccount);
  method.addEventListener("change",updateAccount);
  function showReconciliation(preview,input,source){
    recon.hidden=false;
    reconRows.replaceChildren();
    const count=preview.counts||{};
    reconSummary.textContent=(preview.count||0)+" movimientos examinados · "+
      (count.possibleMatch||0)+" coincidencias posibles · "+
      (count.needsPurpose||0)+" abonos por aclarar · "+
      (count.possibleTransfer||0)+" posibles transferencias · "+
      (count.needsCorrection||0)+" filas con datos inválidos. "+
      "Origen: "+source+". Nada guardado.";
    for(const row of (preview.rows||[])){
      const item=elt("article","ai-document-table");
      item.append(elt("strong","",(row.index+1)+". "+(statuses[row.status]||"Revisión")));
      item.append(elt("p","",String(row.date||"Fecha inválida")+" · "+
        String(row.description||"Concepto no identificado")+" · "+
        (row.amountCOP?row.amountCOP+" COP":"Importe por revisar")+" · "+
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
    if(input&&preview.rows?.some(row=>row.status!=="needs_correction"))
      document.dispatchEvent(new CustomEvent("finanzasoss:v41-preview",{
        detail:{input,result:preview,origin:"document"}}));
    results.hidden=false;
    results.scrollIntoView?.({behavior:"smooth",block:"nearest"});
  }
  for(const [element,event] of [[visionBank,"input"],[visionMethod,"change"],[visionCOP,"change"]])
    element.addEventListener(event,resetVisionReview);
  visionScope.addEventListener("change",()=>{
    visionCOP.checked=false;
    resetVisionReview();
  });
  visionReview.addEventListener("click",async()=>{
    if(visionReview.disabled)return;
    const source=visionScope.selectedOptions[0].textContent;
    const selected=selectedVisionRows();
    if(!selected.length)return;
    reset();
    const tableHelp=tables.closest("details");
    if(tableHelp)tableHelp.hidden=true;
    const task=new AbortController();
    visionReviewTask=task;
    updateVision();
    const input={
      rows:selected.map(row=>({
        Fecha:row.date||"",Concepto:row.description||"",
        Importe:row.amountCOP||"",Tipo:row.direction||"",Moneda:row.currency||(visionCOP.checked?"COP":"INVALIDA"),
      })),
      mapping:{postedAt:"Fecha",description:"Concepto",amount:"Importe",direction:"Tipo",currency:"Moneda"},
      bankLabel:visionBank.value.trim(),paymentMethod:visionMethod.value,
    };
    announce(visionReviewStatus,"Comparando con los movimientos registrados…");
    try{
      const response=await fetch("/api/quick/v41/reconcile/preview",{
        method:"POST",credentials:"same-origin",cache:"no-store",signal:task.signal,
        headers:{"Content-Type":"application/json"},body:JSON.stringify(input),
      });
      const preview=await response.json().catch(()=>({}));
      if(task.signal.aborted)return;
      if(!response.ok||!Array.isArray(preview.rows))
        throw Error(preview.error||"No se pudo preparar la conciliación.");
      visionReviewActive=true;
      showReconciliation(preview,input,(reviewSource==="local"?"lectura local · ":"lectura visual · ")+source);
      announce(visionReviewStatus,"Conciliación lista. Revisa los movimientos antes de confirmar.");
    }catch(error){
      if(!task.signal.aborted)announce(visionReviewStatus,error.message||"No se pudo preparar la conciliación.",true);
    }finally{
      if(visionReviewTask===task){visionReviewTask=null;updateVision();}
    }
  });
  button.addEventListener("click",async()=>{
    if(!analysisAvailable||analysisTask||!consent.checked||!readyFile)return;
    const item=readyFile;
    reset();
    const task=new AbortController();
    analysisTask=task;
    updateButton();
    announce(feedback,"Analizando el extracto…");
    try{
      const body=new FormData();body.append("file",item);body.append("consent","true");
      body.append("bankLabel",bank.value.trim());body.append("paymentMethod",method.value);
      const r=await fetch("/api/quick/v41/ai/document/inspect",{
        method:"POST",credentials:"same-origin",cache:"no-store",body,signal:task.signal,
      });
      const payload=await r.json().catch(()=>({}));
      if(task.signal.aborted)return;
      if(!r.ok){
        if(payload.code==="document_unreadable"&&item===file.files?.[0]&&/\.pdf$/i.test(item.name)){
          openPassword.hidden=false;
          setPasswordOpen(true);
          announce(fileStatus,"Si tu PDF pide una clave al abrirlo, escríbela aquí.");
        }
        throw new Error(payload.error||"No fue posible analizar este documento.");
      }
      const tableHelp=tables.closest("details");
      if(tableHelp){tableHelp.hidden=!payload.tables.length;tableHelp.open=false;}
      tables.replaceChildren();
      if(!payload.tables.length){
        announce(feedback,"No se encontraron filas de movimientos. Si el banco ofrece el extracto en Excel o CSV, prueba con ese archivo.",true);
        return;
      }
      summary.textContent=(labels[payload.documentType]||labels.unknown)+
        " · "+payload.tables.length+" tabla(s) detectada(s).";
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
        reconSummary.textContent=payload.tables.length?(match?.reason||"Completa el banco para conciliar."):"";
      }else{
        showReconciliation(match.preview||{},match.prepared,"tabla "+(match.tableIndex+1));
      }
      results.hidden=false;
      announce(feedback,match?.available&&match.preview?.count?
        "Vista previa lista. Revisa los movimientos antes de guardar.":
        "El análisis no preparó movimientos para revisar.",!match?.available);
      results.scrollIntoView?.({behavior:"smooth",block:"nearest"});
    }catch(e){
      if(!task.signal.aborted)announce(feedback,e instanceof Error?e.message:"No se pudo revisar el documento.",true);
    }finally{
      if(analysisTask===task){analysisTask=null;updateButton();}
    }
  });
})();
`;
