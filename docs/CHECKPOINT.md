# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 3.6 — read-only enforcement para brokers/exchanges**.
- Rama: `feat/phase-3-6-read-only-enforcement`.
- Próximo bloque exacto: **Fase 4.1 — Discovery/productos Open Banking aplicables de Bancolombia**.

## 3.6 completado

- Política explícita y fail-closed para adapters de broker, exchange y wallet.
- Trading, retiros y transferencias deshabilitados por contrato durante el MVP.
- Private keys y seed phrases prohibidas para wallets.
- Capacidades de lectura declarativas para posiciones, actividad y snapshots.
- Regresiones que rechazan money-moving capabilities y secretos de wallet.

## Gate

No avanzar a 4.1 hasta que el PR de 3.6 pase CI y se integre en main.
