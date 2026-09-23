# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 2.2 — Transaction schema universal + categorías/tipos patrimoniales**.
- Rama: `feat/phase-2-2-universal-transactions`.
- Próximo bloque exacto: **Fase 2.3 — dedupe y fingerprints**.

## 2.2 completado

- `TransactionKind` granular y estable.
- Efecto económico derivado, sin duplicar clasificaciones persistidas.
- Categorías jerárquicas con fuente y confianza.
- Provenance obligatoria para cada movimiento.
- Counterparty normalizado.
- Soporte de monto original + tipo de cambio.
- Separación entre movimiento real de cuenta y flujo económico.
- Validaciones de esquema y pruebas de inversión/consumo/categorías.

## Gate

No avanzar a 2.3 hasta que el PR de 2.2 pase lint, typecheck, tests y CI.
