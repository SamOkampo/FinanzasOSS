import assert from "node:assert/strict";
import {PDF} from "@libpdf/core";
import {readDaviviendaPdf} from "../dist/apps/quick-worker/src/davivienda-pdf.js";

const header = "Fecha Valor Doc. Clase de Movimiento Oficina";
const pdf = PDF.create();
function page(lines){
  const target = pdf.addPage({size:"letter"});
  for(const [text,y,x=52] of lines)target.drawText(text,{x,y,fontSize:9});
}
page([
  ["Banco Davivienda S.A.",710], ["INFORME DEL MES: OCTUBRE /2026",690],
  ["Más Créditos",640,232], ["$90.00",639,350],
  ["Menos Débitos",615,232], ["$1,206.00",614,350],
  ["EXTRACTO CUENTA DE AHORROS",550], [header,529],
  ["03 10 $1,200.00 - 0000 Pago ficticio",510],
]);
page([[header,700],["04 10 $90.00+ 0000 Abono ficticio",678]]);
page([
  ["EXTRACTO BOLSILLO Prueba",730], [header,700],
  ["04 10 $9.00 - 0000 Salida ficticia",678], ["05 10 $3.00 + 0000 Rendimiento ficticio",658],
  ["31 09 $9.00 - 0000 Fecha inconsistente",638],
]);

const result = await readDaviviendaPdf(await pdf.save());
assert.equal(result.period,"2026-10");
assert.deepEqual(result.savings.map(row=>[row.date,row.amount,row.direction]),[
  ["2026-10-03","1200.00","debit"],["2026-10-04","90.00","credit"],
]);
assert.deepEqual(result.pocket.map(row=>row.description),["Salida ficticia","Rendimiento ficticio"]);
assert.equal(result.issues,1);
assert.equal(result.savingsTotals,"mismatch");
const unknown = PDF.create();
unknown.addPage().drawText("Otro formato",{x:52,y:600});
assert.equal(await readDaviviendaPdf(await unknown.save()),null);
console.log("v41 Davivienda PDF: continuation pages, separate savings/pocket, printed signs, dates, and totals warnings PASSED");
