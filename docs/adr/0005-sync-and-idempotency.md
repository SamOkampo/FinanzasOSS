# ADR 0005 — Sincronización, cursores e idempotencia

## Estado
Aceptado

## Decisión
La ingesta financiera será incremental, repetible y tolerante a duplicados.

## Modelo
Cada `Connection` mantiene un `SyncCursor` por recurso (`accounts`, `balances`, `transactions`). Un `SyncJob` usa una `idempotencyKey` estable y persiste checkpoint solo después de escritura exitosa.

## Reglas
- Webhooks pueden repetirse o llegar desordenados: nunca son "exactly once".
- Upsert primario por `(connectionId, externalId)` cuando exista ID estable.
- Sin ID estable se usa fingerprint normalizado y ventana temporal.
- Un retry no puede duplicar transacciones.
- Fallos parciales no avanzan el cursor de recursos no confirmados.
- Rate limits del banco se modelan como error recuperable con backoff.
