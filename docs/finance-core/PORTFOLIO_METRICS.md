# Finance Core — Métricas de Portafolio

## Principio

FinanzasOSS separa **dinero aportado** de **rendimiento**.

Un depósito hacia un broker puede aumentar el valor del portafolio, pero no es una ganancia. Un retiro puede reducir el valor alojado en el broker, pero no es una pérdida de mercado.

## Componentes

### marketValue
Valor de mercado de activos no-cash en la moneda base del portafolio.

Si existe un `PortfolioSnapshot`, su valor es la fuente consolidada. Si no existe, se suma `Position.marketValue`.

### cashValue
Efectivo dentro del portafolio/broker. Se mantiene separado de marketValue.

### totalValue
`marketValue + cashValue`.

### netContributions
Aportes menos retiros.

Prioridad:
1. `PortfolioSnapshot.netContributions` si está disponible en moneda base.
2. En su ausencia, `deposit - withdrawal` de InvestmentActivity.

No forma parte de `netPerformance`.

### realizedPnl
P&L realizado provisto/normalizado en `InvestmentActivity.realizedPnl`.

Puede ser positivo o negativo.

Para evitar doble conteo, los adapters deben normalizar realizedPnl **antes de fees/impuestos** cuando el proveedor permita distinguir esos componentes. Si el proveedor solo entrega P&L neto, el adapter debe registrar esa limitación y no inventar una separación.

### unrealizedPnl
Suma de `Position.unrealizedPnl` en moneda base.

Puede ser positivo o negativo.

### income
Dividendos + intereses.

### fees
- actividades `kind = fee` mediante `cashAmount`;
- o `activity.fee` adjunto a otras actividades.

Los adapters deben evitar representar la misma comisión de ambas maneras.

### taxes
Actividades `kind = tax`.

### netPerformance
Componente explicable:

`realizedPnl + unrealizedPnl + income - fees - taxes`

No incluye aportes ni retiros.

## Multi-moneda

No se suman monedas distintas silenciosamente.

`derivePortfolioMetrics()` solo incorpora importes cuya moneda coincide con `portfolio.baseCurrency`. Las demás monedas se listan en:

`completeness.excludedCurrencies`

Un futuro motor FX podrá convertirlas únicamente cuando exista una tasa verificable y fechada.

## Completitud

Toda métrica incluye:

- `isComplete`
- `excludedCurrencies`
- `positionsWithoutMarketValue`
- `positionsWithoutUnrealizedPnl`
- `sellActivitiesWithoutRealizedPnl`
- `cashValueMissing`

La UI debe mostrar una señal de datos incompletos cuando `isComplete = false`; no debe presentar el resultado como una cifra consolidada exacta.

## Semántica de signos

- market/cash/contributions normalmente se expresan según su valor real y pueden ser signed cuando corresponda;
- realized/unrealized P&L son signed;
- income/fees/taxes usan montos absolutos no negativos;
- `netPerformance` aplica los signos de manera explícita.

## Restricción MVP

FinanzasOSS no calcula realized P&L desde lotes fiscales o métodos FIFO/LIFO por su cuenta en esta fase. Consume realizedPnl normalizado cuando la fuente lo ofrece. Cálculos fiscales avanzados requieren una fase posterior y reglas jurisdiccionales explícitas.
