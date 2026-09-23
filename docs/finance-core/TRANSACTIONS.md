# Finance Core — Universal Transaction Schema

## Objetivo

Normalizar movimientos de bancos, billeteras, brokers, exchanges, imports y fuentes auxiliares sin perder su procedencia ni confundir categorías de consumo con transferencias patrimoniales.

## Regla central

La **categoría** y el **efecto económico** son conceptos distintos.

Ejemplos:

- Uber → categoría `transport`, tipo `purchase`, efecto económico `expense`.
- Davivienda → Hapi → categoría `investments`, tipo `investment_transfer`, efecto económico `investment_flow`.
- Retiro en cajero → categoría `cash`, tipo `cash_withdrawal`, efecto económico `cash_movement`.
- Fee bancario → categoría `taxes_fees`, tipo `fee`, efecto económico `expense`.

El efecto económico se deriva de `TransactionKind` mediante `economicClassForKind()`; no se persiste una segunda clasificación duplicada.

## TransactionKind

- `purchase`
- `income`
- `refund`
- `fee`
- `tax`
- `transfer`
- `investment_transfer`
- `investment_activity`
- `debt_payment`
- `cash_withdrawal`
- `cash_deposit`
- `adjustment`
- `unknown`

## Economic classes derivadas

- `expense`
- `income`
- `refund`
- `internal_transfer`
- `investment_flow`
- `investment_activity`
- `debt_flow`
- `cash_movement`
- `neutral`
- `unknown`

## Categorías

La taxonomía superior usa grupos estables y códigos extensibles:

- housing
- food
- transport
- education
- health
- subscriptions
- entertainment
- shopping
- personal_care
- travel
- family
- utilities
- business
- income
- investments
- transfers
- debt
- taxes_fees
- cash
- other

Un código puede ser más específico, por ejemplo `transport.rideshare` o `food.restaurant`.

Cada asignación registra su origen:

- provider
- rule
- model
- user
- system

y puede incluir una confianza 0–1.

## Provenance

Toda transacción normalizada debe registrar cómo llegó:

- `open_finance_api`
- `provider_api`
- `aggregator_api`
- `statement_import`
- `manual`
- `email_auxiliary`

La procedencia contiene metadata mínima, no payloads crudos ni secretos.

## Divisas

`money` siempre representa el monto normalizado en minor units absolutos; `direction` define entrada/salida.

Cuando aplique:
- `originalMoney`: monto de origen.
- `exchangeRate`: tasa positiva usada para convertir.

## Dos métricas distintas

`netAccountMovementMinor` suma todos los movimientos reales de una cuenta.

`netEconomicCashFlowMinor` excluye movimientos puramente patrimoniales/neutralizados para evitar que mover dinero entre cuentas o hacia inversiones parezca consumo.

## Validaciones

`assertTransactionSchema` exige:
- monto absoluto no negativo;
- moneda;
- descripción cruda;
- fecha de contabilización válida;
- fecha de observación/procedencia válida;
- confianza de categoría entre 0 y 1;
- tipo de cambio positivo.
