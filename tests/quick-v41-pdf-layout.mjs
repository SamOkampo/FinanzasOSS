import assert from "node:assert/strict";
import {PDF} from "@libpdf/core";
import {readStatementPdf} from "../dist/apps/quick-worker/src/statement-pdf-layout.js";

function line(page,y,...cells){
  for(const [x,text] of cells)page.drawText(text,{x,y,fontSize:9});
}
const rappi=PDF.create();
const a=rappi.addPage({size:"letter"});
line(a,730,[48,"Extracto de tu RappiCuenta"]);
line(a,710,[48,"Abonos +$25,000.00"]);
line(a,695,[48,"Retiros -$12,500.00"]);
line(a,660,[48,"Fecha"],[148,"Descripción"],[515,"Valor"]);
line(a,638,[48,"01 Sep 2026"],[148,"Abono ficticio | prueba"],[513,"+$25,000.00"]);
const b=rappi.addPage({size:"letter"});
line(b,710,[513,"-$12,500.00"]);
line(b,706,[48,"02 Sep 2026"],[148,"Compra ficticia"]);
line(b,675,[48,"03 Sep 2026"],[148,"Fila sin importe"]);
const rappiResult=(await readStatementPdf(await rappi.save())).preview;
assert.equal(rappiResult.title,"Movimientos de RappiCuenta");
assert.equal(rappiResult.issues,1);
assert.equal(rappiResult.totalsDiffer,false);
assert.deepEqual(rappiResult.groups[0].rows.map(r=>[r.date,r.amount,r.direction,r.page]),[
  ["2026-09-01","$ 25,000.00","credit",1],
  ["2026-09-02","$ 12,500.00","debit",2],
]);

const card=PDF.create();
const c=card.addPage({size:"letter"});
line(c,730,[40,"Tarjeta de crédito"]);
line(c,690,[40,"Fecha"],[135,"Descripción"],[330,"Débito"],[420,"Crédito"],[510,"Saldo"]);
line(c,660,[40,"04/10/2026"],[135,"Compra ficticia"],[330,"$12,000.00"],[510,"$50,000.00"]);
line(c,630,[40,"05/10/2026"],[135,"Abono ficticio"],[420,"$5,000.00"],[510,"$55,000.00"]);
const cardResult=(await readStatementPdf(await card.save())).preview;
assert.equal(cardResult.title,"Movimientos de tarjeta");
assert.deepEqual(cardResult.groups[0].rows.map(r=>[r.amount,r.direction]),[
  ["$ 12,000.00","debit"],["$ 5,000.00","credit"],
]);

const unsigned=PDF.create();
const u=unsigned.addPage({size:"letter"});
line(u,690,[40,"Fecha"],[135,"Concepto"],[515,"Valor"]);
line(u,660,[40,"2026-10-04"],[135,"Compra de prueba"],[515,"$35.00"]);
const unsignedResult=(await readStatementPdf(await unsigned.save())).preview;
assert.equal(unsignedResult.groups[0].rows[0].direction,null);
assert.equal(unsignedResult.issues,1);

const blank=PDF.create();
blank.addPage({size:"letter"});
assert.deepEqual(await readStatementPdf(await blank.save()),{preview:null,issue:"no_text"});
console.log("PDF layout: statements across pages, displaced amounts, credit cards, balances excluded and unsigned rows marked PASSED");
