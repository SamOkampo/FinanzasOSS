# Finance Core — Dedupe y fingerprints

## Objetivo

Evitar que un mismo movimiento se duplique cuando llega por múltiples fuentes: Open Finance, API del proveedor, extracto, importación o correo auxiliar.

## Regla de seguridad

Un fingerprint **no es una clave única**. Dos movimientos legítimos pueden compartir monto, comercio, fecha y descripción.

Por eso FinanzasOSS separa:

- **exact**: identidad externa confirmada; puede auto-mergearse.
- **likely**: evidencia fuerte, pero no suficiente para auto-merge.
- **possible**: candidato a reconciliación.
- **none**: no hay evidencia suficiente.

Solo `exact` habilita `autoMerge=true`.

## Identidad exacta

Se considera exacta si:

1. misma conexión + mismo `externalId`; o
2. mismo proveedor + mismo `sourceRecordId`.

Esto permite reintentos idempotentes sin duplicar datos.

## Fingerprint

`buildTransactionFingerprint()` genera un fingerprint versionado `fp1_` usando:

- tenant;
- scope de cuenta/cuenta canónica;
- dirección;
- moneda;
- monto;
- día de contabilización;
- descripción normalizada.

El fingerprint se usa para indexar/buscar candidatos, no como restricción única global.

## Texto normalizado

Se:
- eliminan diacríticos;
- pasa a minúsculas;
- elimina puntuación;
- colapsan espacios.

Ejemplo:

`UBER *TRIP Bogotá` → `uber trip bogota`.

## Dedupe scope

Por defecto el scope es `accountId`.

Cuando dos fuentes representan la misma cuenta física pero tienen IDs internos distintos, una capa posterior puede proporcionar el mismo scope canónico a ambos movimientos.

Sin un scope compartido, FinanzasOSS no intenta fusionarlos.

## Evaluación heurística

Para candidatos sin identidad exacta se exige:

- mismo tenant;
- mismo scope;
- mismo monto;
- misma moneda;
- misma dirección;
- fecha dentro de tolerancia.

Luego se puntúan:
- mismo día;
- descripción normalizada igual/compatible;
- counterparty normalizado.

Las coincidencias heurísticas nunca se auto-mergean.

## Persistencia

`TransactionRepository` expone:

- `findByExternalId()`
- `findCandidatesByFingerprint()`

No existe una restricción de unicidad basada únicamente en fingerprint.
