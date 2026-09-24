# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 5.2 — Consentimiento** (`41f9352`).
- Bloque implementado en PR: **Fase 5.3 — Cuentas/saldos/transacciones**.
- Rama: `feat/phase-5-3-davivienda-account-info`.
- Próximo bloque exacto tras CI verde e integración: **Fase 5.4 — Normalización/reconexión**.

## 5.3 implementado

- Gate provider-specific de Account Information para Davivienda sandbox sobre el contrato provider-neutral existente.
- Fail-closed: exige consentimiento verificado, al menos una capability explícita y endpoint para cada capability concedida.
- Solo soporta lectura de cuentas, saldos y transacciones; no añade operaciones de pago, transferencia, trading o retiro.
- No se inventan endpoints, scopes, mappings ni credenciales Davivienda; los valores reales deben provenir del catálogo/sandbox oficial autenticado.
- Regresiones sintéticas con `example.invalid` cubren ausencia de consentimiento, capability sin endpoint, HTTP inseguro, las tres capabilities y revocación inmediata.
- El test queda incluido en el comando normal de CI.

## Gate

No avanzar a 5.4 hasta que CI de este PR quede verde y 5.3 se integre en `main`. Si los endpoints/capabilities oficiales no pueden verificarse, el adapter permanece no disponible/fail-closed; nunca sustituir por screen scraping. No habilitar producción, pagos, transferencias, credenciales bancarias ni datos financieros reales.
