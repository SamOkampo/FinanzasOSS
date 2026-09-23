# Connector Sync Engine

## Objetivo

Sincronizar recursos de un conector de forma incremental, idempotente y acotada.

## Recursos

- accounts
- balances
- transactions
- positions
- investment_activities
- portfolio_snapshots

Solo pueden solicitarse recursos declarados por el descriptor del conector.

## Flujo

1. Validar contrato y contexto tenant/connection.
2. Cargar checkpoint del recurso.
3. Pedir una página al conector.
4. Generar una idempotency key basada en:
   - tenant;
   - connection;
   - connector;
   - recurso;
   - cursor solicitado;
   - contenido canónico de la página.
5. Persistir mediante SyncSink.
6. **Solo después** guardar checkpoint.
7. Continuar hasta terminal page o límite de páginas.

Si el sink falla, el checkpoint de esa página no avanza.

## Cursors

`nextCursor`:
- pagina dentro de la ejecución actual;
- permite continuar tras una página confirmada.

`checkpointCursor`:
- cursor durable incremental para la próxima sincronización;
- idealmente se emite en la página terminal.

Regla:
- mientras haya `nextCursor`, el checkpoint guarda ese cursor para recuperación;
- en página terminal usa `checkpointCursor` si existe;
- si el proveedor no entrega cursor durable, el checkpoint final queda sin cursor y la próxima corrida comienza desde raíz.

El refetch es seguro porque los sinks deben ser idempotentes.

## Idempotencia

`buildSyncIdempotencyKey()` canonicaliza los items y los ordena para que cambios de orden del proveedor no generen otra clave.

BigInt se canonicaliza explícitamente; no se usa JSON.stringify directo sobre valores financieros.

## Bounded work

`maxPagesPerResource`:
- default 10;
- mínimo 1;
- máximo 100.

Si se alcanza el límite con más páginas disponibles:
- `truncated = true`;
- queda guardado el nextCursor;
- la siguiente ejecución puede continuar.

Esto evita loops largos y protege la automatización horaria.

## Seguridad

- ejecución secuencial por recurso;
- no mueve dinero;
- no cambia scopes;
- no lee secrets directamente;
- el conector ya debe estar compuesto con su infraestructura segura;
- no mezcla tenants.

## Responsabilidad del sink

El sink persiste por upsert/idempotency key. No debe asumir entrega exactly-once.

Webhooks futuros solo dispararán sync; no sustituirán dedupe, checkpoints ni verificación de firma.
