# Finance Core — Investment transfer matching

## Objetivo

Conciliar aportes y retiros entre una cuenta de efectivo y un broker/exchange/wallet sin tratarlos como gasto o ingreso económico.

## Casos

### Contribution

`Banco debit` → `Broker/Exchange/Wallet credit`

Resultado:
- `kind = investment_transfer`
- categoría `investments.contribution`
- mismo `transferGroupId`

### Withdrawal

`Broker/Exchange/Wallet debit` → `Banco credit`

Resultado:
- `kind = investment_transfer`
- categoría `investments.withdrawal`

## Dominios

El matcher exige exactamente:
- una cuenta `cash`; y
- una cuenta `investment` o `crypto`.

Transferencias entre dos brokers o dos wallets quedan fuera de este bloque.

## Matching de dinero

Se admite:

1. mismo monto y moneda; o
2. coincidencia mediante `originalMoney`.

Ejemplo:

- banco: COP 200.000;
- Hapi: USD 50;
- Hapi.originalMoney: COP 200.000.

Eso permite conciliar FX sin inventar conversiones.

FinanzasOSS no deduce equivalencia cross-currency únicamente desde un `exchangeRate` si falta un monto original verificable.

## Ventana temporal

Por defecto: hasta 3 días.

La cercanía de fechas aporta puntuación, pero no basta para auto-link.

## Señales

Se consideran:
- `kind = investment_transfer`;
- categoría `investments`;
- counterparty institution;
- account domains;
- dirección contribution/withdrawal;
- monto/originalMoney.

## Seguridad del auto-link

Solo se auto-enlaza cuando:
- la confianza es alta; y
- existe al menos una señal explícita `investment_transfer`.

Un simple débito bancario y crédito en broker por el mismo monto no se auto-clasifican silenciosamente.

## Efecto patrimonial

Un aporte:
- reduce liquidez;
- aumenta capital aportado;
- no es consumo;
- no reduce patrimonio por sí mismo.

Un retiro:
- aumenta liquidez;
- reduce capital ubicado en inversiones;
- no es ingreso económico por sí mismo.
