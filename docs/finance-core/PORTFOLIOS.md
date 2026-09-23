# Finance Core — Portfolio domain

## Objetivo

Representar portafolios provenientes de Hapi, Interactive Brokers, Binance, wallets y futuros proveedores bajo un esquema neutral, tenant-scoped y apto para activos fraccionarios.

## Entidades

### Portfolio
Agrupa una o varias cuentas de inversión/cripto del mismo tenant.

Campos centrales:
- `tenantId`
- `baseCurrency`
- `status`
- `accountIds`

Solo puede contener cuentas con dominio `investment` o `crypto`.

### Asset
Activo normalizado independiente del proveedor.

Puede incluir:
- ticker;
- ISIN;
- CUSIP;
- FIGI;
- contrato cripto;
- identificador específico del proveedor.

Un ticker por sí solo **no** se considera identificador global suficiente; puede llevar namespace/mercado.

### Position
Snapshot de una tenencia:
- activo;
- cuenta;
- cantidad;
- costo por unidad;
- precio;
- valor de mercado;
- cost basis;
- P&L no realizado;
- timestamp.

### InvestmentActivity
Evento del portafolio:
- buy/sell;
- deposit/withdrawal;
- dividend/interest;
- fee/tax;
- transfer;
- corporate action;
- other.

Puede enlazarse a un `FinancialTransaction` mediante `linkedTransactionId`.

### PortfolioSnapshot
Valor consolidado de un portafolio en un instante:
- market value;
- cash value;
- net contributions.

Las métricas derivadas y rendimiento se implementan en Fase 2.7.

## Precisión de cantidades

Las cantidades de acciones, ETFs y cripto se representan como `DecimalString`, no como `number` de JavaScript.

Ejemplos válidos:
- `"1"`
- `"0.125"`
- `"-0.5"`

Ejemplos inválidos:
- `"01.2"`
- `"1e-8"`
- `"0.2.5"`

Motivo: evitar errores binarios de coma flotante y preservar la precisión original del proveedor.

Los cálculos decimales avanzados se implementarán con una estrategia explícita; no se convertirán silenciosamente estas cantidades a `number`.

## Aislamiento e invariantes

- Portfolio, Asset, Position, InvestmentActivity y PortfolioSnapshot son tenant-scoped.
- Una cuenta debe pertenecer al portafolio.
- Una cuenta del portafolio debe ser investment/crypto.
- Una posición debe referenciar exactamente el portfolio, account y asset recibidos.
- Una actividad debe pertenecer a la cuenta/portafolio correctos.
- Los snapshots deben pertenecer al tenant/portfolio y tener fecha válida.

## Persistencia

Contratos separados:
- `PortfolioRepository`
- `AssetRepository`
- `PositionRepository`
- `InvestmentActivityRepository`
- `PortfolioSnapshotRepository`

Las posiciones se tratan como snapshots reemplazables por `portfolio + asOf`, mientras la actividad es un ledger idempotente.
