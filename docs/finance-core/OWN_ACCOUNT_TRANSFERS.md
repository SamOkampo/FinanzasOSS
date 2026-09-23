# Finance Core — Transfer matching entre cuentas propias

## Objetivo

Reconocer movimientos internos entre cuentas del mismo tenant sin contarlos como consumo ni ingreso económico.

Ejemplo:

`Davivienda -$200.000` + `Nequi +$200.000` → una sola transferencia patrimonial.

## Condiciones mínimas

Para evaluar dos movimientos como candidatos deben:

- pertenecer al mismo tenant;
- estar ligados a cuentas distintas;
- tener direcciones opuestas (debit/credit);
- tener el mismo monto;
- usar la misma moneda;
- estar dentro de la ventana temporal configurada.

Las transferencias de inversión se excluyen de este matcher y se delegan a Fase 2.5.

## Señales

Se puntúan señales explícitas como:

- `kind = transfer`;
- categoría `transfers`;
- counterparty marcado como `self`;
- cercanía de fechas.

## Auto-link

El matcher devuelve:

- `high`
- `medium`
- `low`
- `none`

Solo se permite `autoLink=true` cuando:

1. la confianza es alta; y
2. existen al menos dos señales explícitas de transferencia.

Una coincidencia de monto y fecha por sí sola **no** se auto-enlaza.

## Transfer group

Cuando se confirma el match, ambos movimientos reciben el mismo `transferGroupId` versionado `xfer1_`.

Los movimientos pasan a:

- `kind = transfer`;
- categoría del sistema `transfers.internal`, salvo que exista una categoría explícita del usuario.

## Efecto financiero

La transferencia:

- sí cambia saldos por cuenta;
- no cambia patrimonio consolidado;
- no cuenta como gasto;
- no cuenta como ingreso;
- sí aparece en Movimientos como transferencia entre cuentas propias.
