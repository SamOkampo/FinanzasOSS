# Development checkpoint

## Estado actual

- **Fase 7 — Cobertura bancaria Colombia: CERRADA e integrada.**
- **Fase 8 — Universal Import Engine: CERRADA e integrada.**
- **Fase 9 — Portafolios, brokers, exchanges y wallets: CERRADA e integrada.**
- 8.1 CSV/XLSX/OFX: PR #52, CI #119 verde, merge `f380080`.
- 8.2 PDF en parser aislado: PR #53, CI #121 verde, merge `2b4616b`.
- 8.3 detección de institución/formato: PR #54, CI #124 verde, merge `7aae95d`.
- 8.4 mapeo + preview antes de persistir: PR #55, CI #126 verde, merge `3abd811`.
- 8.5 imports incrementales e idempotentes: PR #57, CI #130 verde, merge `a6c5dd4`.
- 8.6 reconciliación API/extractos/Gmail auxiliar sin duplicados: PR #58, CI #132 verde, merge `dd7e9c1`.
- El roadmap no define un subpunto 8.7; **Fase 8 termina en 8.6**.
- 9.1 UX Portafolios + modelos de agregación patrimonial: PR #61, CI #137 verde, merge `c46fddf`.
- 9.2 Binance read-only boundary: PR #63, CI #143 verde, merge `afe797c`.
- 9.3 Interactive Brokers read-only boundary: PR #65, CI #147 verde, merge `45d6b83`.
- 9.4 Hapi statement adapter boundary: PR #67, CI #151 verde, merge `8d6d22b`.
- 9.5 Wallets on-chain por dirección pública: PR #69, CI #155 verde, merge `01808c3`.
- 9.6 Otros brokers/exchanges mediante adapters oficiales/autorizados: PR #71, CI #159 verde, merge `32576ec`.
- 9.7 Contribution matcher mensual banco ↔ inversión: PR #73, CI #164 verde, merge `1e9aa9a`.
- 9.8 Portfolio snapshots e historial: PR #75, CI #169 verde, merge `11d86ff`.
- 9.9 Cost basis/P&L/dividendos/fees/impuestos: PR #77, CI #173 verde, merge `70baa59`.
- 9.10 TWR/XIRR y separación estricta de rendimiento vs aportes: PR #79, CI #177 verde, merge `42824fd`.
- Próximo bloque exacto permitido: **Fase 10.1 — Merchant normalization y categorización**.

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

## Cierre Fase 9

La capa de inversiones quedó cerrada para el MVP con portafolios read-only, fronteras seguras para brokers/exchanges/wallets, aportes bancarios tratados como `investment_transfer`, snapshots históricos, contabilidad de portafolio conservadora y retornos que separan explícitamente aportes de rendimiento.

Reglas vigentes:
- brokers, exchanges y wallets permanecen read-only; no trading, retiros ni transferencias;
- wallets observan únicamente identificadores públicos y jamás requieren seed phrase/private key;
- adapters adicionales exigen fuente oficial o agregador autorizado y una referencia de verificación;
- aportes banco ↔ inversión se concilian de forma determinista y nunca se clasifican como gasto;
- snapshots se validan por tenant, portfolio, timestamp y moneda;
- cost basis/P&L/dividendos/fees/impuestos ausentes se reportan como no disponibles, no como cero inventado;
- TWR elimina flujos externos por intervalo y XIRR usa aportes/retiros como cash flows separados;
- no se habilitaron datos reales, secretos, producción financiera ni movimiento de dinero.

## Gate siguiente

**10.1 — Merchant normalization y categorización: CERRADA e integrada.** PR #81, CI #182 verde, merge `08c29fe`.

**10.2 — Personal vs negocio: CERRADA e integrada.** PR #83, CI #186 verde, merge `2914235`.

**10.3 — Subscription detector: CERRADA e integrada.** PR #85, CI #192 verde, merge `8e4ee0a`.

**10.4 — Spending anomalies y cash-flow forecast: CERRADA e integrada.** PR #87, CI #196 verde, merge `3ea73c0`.

**10.5 — Safe-to-spend con reservas/obligaciones: CERRADA e integrada.** PR #89, CI #200 verde, merge `c76207c`.

El siguiente bloque permitido es únicamente **10.6 — Contribution Planner**. Fase 9 permanece cerrada; no reabrirla salvo regresión verificable.

No habilitar producción bancaria, datos financieros reales, pagos/transferencias, trading, retiros, secretos, private keys ni costes sin autorización explícita.

## Fase 9.1 integrada

La vista Portafolios dispone de agregación patrimonial read-only y un view-model con privacidad. El agregado no inventa conversiones entre monedas: valores incompatibles quedan fuera del total y se señalan para revisión. Este bloque forma parte de la Fase 9 ya cerrada.

## Fase 10.1 integrada

Merchant normalization y categorización quedó integrada con reglas deterministas y conservadoras. `investment_transfer`, `internal_transfer` y `transfer` están protegidos frente a reclasificación como gasto. Las categorías inferidas sin merchant explícito permanecen revisables y no se aceptan silenciosamente.

## Fase 10.2 integrada

La clasificación personal/negocio quedó integrada con precedencia explícita del usuario, contexto de cuenta y reglas conservadoras. Transferencias e inversiones permanecen fuera de la clasificación de gasto; señales inferidas de negocio requieren revisión y los casos ambiguos quedan como `unknown`.


## Fase 10.3 integrada

El detector de suscripciones quedó integrado con recurrencia conservadora por merchant/currency, umbral mínimo de observaciones, bandas de cadencia y confianza revisable. Transferencias e inversiones están excluidas; `nextExpectedAt` es solo una estimación y nunca una garantía.


## Fase 10.4 integrada

Las anomalías de gasto y el forecast mensual quedaron integrados de forma conservadora: solo usan movimientos económicos aplicables, excluyen transferencias/inversiones, fallan cerrado en multi-moneda y presentan estimaciones revisables, nunca garantías.


## Fase 10.5 integrada

Safe-to-spend quedó integrado como estimación conservadora basada en efectivo disponible menos reservas, obligaciones, buffer y forecast negativo. No usa activos de inversión, límites de crédito ni ganancias no realizadas como efectivo; el resultado nunca es una garantía de liquidez.
