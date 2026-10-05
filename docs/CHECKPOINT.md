# Development checkpoint

## Estado actual

- **Fase 7 — Cobertura bancaria Colombia: CERRADA e integrada.**
- **Fase 8 — Universal Import Engine: CERRADA e integrada.**
- 8.1 CSV/XLSX/OFX: PR #52, CI #119 verde, merge `f380080`.
- 8.2 PDF en parser aislado: PR #53, CI #121 verde, merge `2b4616b`.
- 8.3 detección de institución/formato: PR #54, CI #124 verde, merge `7aae95d`.
- 8.4 mapeo + preview antes de persistir: PR #55, CI #126 verde, merge `3abd811`.
- 8.5 imports incrementales e idempotentes: PR #57, CI #130 verde, merge `a6c5dd4`.
- 8.6 reconciliación API/extractos/Gmail auxiliar sin duplicados: PR #58, CI #132 verde, merge `dd7e9c1`.
- El roadmap no define un subpunto 8.7; **Fase 8 termina en 8.6**.
- 9.1 UX Portafolios + modelos de agregación patrimonial: PR #61, CI #137 verde, merge `c46fddf`.
- 9.2 Binance read-only boundary: PR #63, CI #143 verde, merge `afe797c`.
- Próximo bloque exacto permitido: **Fase 9.3 — Interactive Brokers Web API read-only**.

## Cierre Fase 8

El Universal Import Engine quedó cerrado con una frontera segura para CSV/XLSX/OFX, PDF aislado, detección conservadora de formato/institución, preview previo a persistencia, planificación incremental idempotente y reconciliación entre fuentes sin doble conteo automático.

Reglas vigentes:
- todos los archivos importados se tratan como input no confiable;
- PDF se procesa bajo contrato aislado sin red, active content ni persistencia de contraseña;
- PDF/XLSX/OFX fallan cerrados cuando la firma contradice la extensión;
- la detección institucional es conservadora y documentos ambiguos no se adjudican a una entidad;
- el preview mantiene `persistenceAllowed=false` hasta confirmación posterior;
- imports incrementales usan `idempotencyKey`, fingerprints y checkpoints before/after;
- retries no deben duplicar transacciones;
- reconciliación cross-source prioriza `open_finance_api` > `provider_api` > `aggregator_api` > `statement_import` > `email_auxiliary`;
- duplicados exactos se suprimen o reemplazan por una fuente de mayor autoridad;
- coincidencias likely/possible quedan en revisión y no se insertan automáticamente.

## Gate siguiente

El siguiente bloque permitido es únicamente **9.3 — Interactive Brokers Web API read-only: accounts/positions/activity**. No adelantar 9.4 antes de integrar 9.3 con CI verde.

No habilitar producción bancaria, datos financieros reales, pagos/transferencias, trading, retiros, secretos, private keys ni costes sin autorización explícita.


## Fase 9.1 integrada

La vista Portafolios ya dispone de agregación patrimonial read-only y un view-model con privacidad. El agregado no inventa conversiones entre monedas: valores incompatibles quedan fuera del total y se señalan para revisión. El siguiente bloque es 9.2 según ROADMAP.md.
