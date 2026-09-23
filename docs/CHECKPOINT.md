# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 3.4 — Sync engine incremental e idempotente**.
- Rama: `feat/phase-3-4-sync-engine`.
- Próximo bloque exacto: **Fase 3.5 — Health states y reconexión**.

## 3.4 completado

- Sync secuencial por recurso.
- Checkpoints tenant+connection.
- Paginación incremental con nextCursor/checkpointCursor.
- Idempotency keys deterministas y order-independent.
- Checkpoint solo después de persistencia exitosa.
- Límite de 1–100 páginas por recurso.
- Detección de cursor repetido.
- Reanudación tras truncamiento/fallo.
- Tests de retry, checkpoint, idempotencia y loops acotados.

## Gate

No avanzar a 3.5 hasta que el PR de 3.4 pase CI.
