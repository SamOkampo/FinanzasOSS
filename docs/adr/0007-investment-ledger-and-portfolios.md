# ADR 0007 — Ledger patrimonial único y Portafolios como superficie separada

## Estado
Aceptado.

## Decisión
Bancos, wallets, brokers y exchanges comparten el mismo ledger de movimientos patrimoniales, pero Portafolios se presenta como una sección de producto separada.

Las salidas desde una cuenta bancaria hacia una cuenta de inversión se clasifican como `investment_transfer`, no como `expense`. El Finance Core intentará emparejar ambas patas por importe, moneda, ventana temporal, proveedor/cuenta destino y referencias cuando estén disponibles.

Las posiciones y actividades de inversión se modelan de forma separada del ledger de cash para no confundir una compra de activos con consumo personal.

## Consecuencias
- El presupuesto mensual no penaliza aportes a inversión como gasto.
- El patrimonio total sí refleja el cambio de ubicación del dinero.
- El rendimiento del portafolio puede separarse de los aportes/retiros.
- Un proveedor sin API puede entrar por statement import sin cambiar la UI ni las reglas del core.
- Ningún conector de inversión requiere permiso de trading en el MVP.
