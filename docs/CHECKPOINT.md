# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 3.5 — health states y reconexión**.
- Rama: `feat/phase-3-5-health-recovery`.
- Próximo bloque exacto: **Fase 3.6 — read-only enforcement para brokers/exchanges**.

## 3.5 completado

- ConnectorHealthReport estructurado.
- Validación de checkedAt/retryAfter.
- Recovery plan derivado por estado.
- Mapping de ConnectorError a health.
- Reintentos automáticos vs acciones humanas diferenciados.
- Elegibilidad de sync por estado.
- Tests de auth, consent, rate-limit y upstream outage.

## Gate

No avanzar a 3.6 hasta que el PR de 3.5 pase CI.
