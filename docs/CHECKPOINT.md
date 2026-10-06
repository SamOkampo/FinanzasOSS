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

**10.6 — Contribution Planner: CERRADA e integrada.** PR #91, CI #204 verde, merge `4b758f6`.

**10.7 — Alertas de aporte mensual: CERRADA e integrada.** PR #93, CI #208 verde, merge `b0dd2bc`.

**10.8 — Alertas de conexión/sync/import incompleto: CERRADA e integrada.** PR #95, CI #212 verde, merge `5f97c02`.

**10.9 — Concentración y drift: CERRADA e integrada.** PR #97, CI #216 verde, merge `363ce96`.

**10.10 — Resumen mensual patrimonio + consumo + inversión: CERRADA e integrada.** PR #99, CI #220 verde, merge `79396d7`.

**Fase 10 — Inteligencia financiera y asistente: CERRADA Y AUDITADA.**

**11.1 — Patrimonio total: efectivo + crédito + inversiones: CERRADA e integrada.** PR #101, CI #224 verde, merge `1a85870`.

**11.2 — Cash flow y presupuesto: CERRADA e integrada.** PR #103, CI #228 verde, merge `3b7f067`.

**11.3 — Portafolios separados por proveedor y consolidados: CERRADA e integrada.** PR #105, CI #232 verde, merge `e9466c3`.

**11.4 — Calendario financiero/aportes recurrentes: CERRADA e integrada.** PR #107, CI #236 verde, merge `37216ac`.

**11.5 — Metas y progreso: CERRADA e integrada.** PR #109, CI #240 verde, merge `84fcd6b`.

**11.6 — Historial de patrimonio y fuentes de cambio: CERRADA e integrada.** PR #111, CI #244 verde, merge `3dfe45c`.

**Fase 11 — Dashboard patrimonial: CERRADA Y AUDITADA.**

**12.1 — Auditoría design system anti-plantilla IA: CERRADA e integrada.** PR #113, CI #248 verde, merge `4274aa5`.

**12.2 — Motion/morphing/microinteracciones: CERRADA e integrada.** PR #114, CI #250 verde, merge `0fd0f1c`.

**12.3 — Glass/material system con privacidad de saldos: CERRADA e integrada.** PR #115, CI #252 verde, merge `2c9790d`.

**12.4 — Mobile gestures y PWA: CERRADA e integrada.** PR #116, CI #254 verde, merge `3ac24df`.

**12.5 — Dark/light/system + reduced motion: CERRADA e integrada.** PR #117, CI #256 verde, merge `6ae505d`.

**12.6 — Loading/empty/error states propios: CERRADA e integrada.** PR #118, CI #258 verde, merge `b9b9368`.

**12.7 — Rendimiento y accesibilidad: CERRADA e integrada.** PR #119, CI #260 verde, merge `acc4a1d`.

**Fase 12 — Experiencia premium: CERRADA Y AUDITADA.**

**13.1 — Encryption/token vault/secret rotation: CERRADA e integrada.** PR #121, CI #264 verde, merge `ffbf3b7`.

**13.2 — OAuth/state/PKCE/mTLS según proveedor: CERRADA e integrada.** PR #122, CI #267 verde, merge `e6bebdb`.

**13.3 — Rate limits/CSRF/XSS/SSRF: CERRADA e integrada.** PR #123, CI #269 verde, merge `c4e8db0`.

**13.4 — Audit log/consent ledger: CERRADA e integrada.** PR #125, CI #273 verde, merge `3eccd5d`.

**13.5 — Data export/delete: CERRADA e integrada.** PR #126, CI #275 verde, merge `a10ef11`.

**13.6 — Pentest checklist y dependency scanning: CERRADA e integrada.** PR #127, CI #277 verde, merge `d006138`.

**13.7 — Read-only credential permission enforcement: CERRADA e integrada.** PR #128, CI #279 verde, merge `d2acf68`.

**Fase 13 — Hardening seguridad fintech: CERRADA Y AUDITADA.**

**14.1 — Onboarding y aislamiento por tenant: CERRADA e integrada.** PR #130, CI #283 verde, merge `c68b86b`.

El siguiente bloque exacto es **14.2 — Multiple connections/portfolios**.

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


## Fase 10.6 integrada

Contribution Planner quedó integrado como estimación acotada por safe-to-spend, objetivo restante y cap opcional del usuario. No ejecuta movimiento de dinero y cualquier futura ejecución autorizada banco→inversión debe conservar `investment_transfer`.


## Fase 10.7 integrada

Las alertas mensuales de aportes distinguen faltantes, duplicados por identidad de transferencia y movimientos no conciliados. Los duplicados se cuentan una sola vez frente al objetivo y los no conciliados no satisfacen silenciosamente la meta.


## Fase 10.8 integrada

Las alertas de salud de datos cubren estados de conexión, sync fallido/parcial/obsoleto e imports incompletos de forma provider-neutral. Son señales read-only y no modifican consentimiento, credenciales ni ejecutan reconexiones automáticas.


## Fase 10.9 integrada

El reporte de concentración/drift quedó integrado como analítica read-only frente a una asignación objetivo definida por el usuario. No inventa límites universales de concentración, falla cerrado en multi-moneda y no recomienda ni ejecuta rebalanceos.


## Fase 10.10 integrada

El resumen mensual patrimonial quedó integrado separando explícitamente consumo, aportes/retiros de inversión y rendimiento. Los `investment_transfer` no se cuentan como gasto y el rendimiento ausente se reporta como no disponible, nunca como cero inventado.

## Cierre Fase 10

Fase 10 quedó auditada de 10.1 a 10.10 con regresiones incluidas en la suite global y CI #220 verde. Se preservan las reglas de seguridad: inteligencia read-only/estimativa; sin producción bancaria, secretos, trading, retiros, movimiento de dinero ni clasificación de aportes como consumo. Próximo bloque: 11.1.


## Fase 11.1 integrada

El dashboard patrimonial agrega efectivo, pasivos de crédito explícitos e inversiones read-only en una moneda de reporte. Los límites de crédito no se cuentan como activos, los desajustes de moneda quedan excluidos y el resultado propaga completitud del portafolio.


## Fase 11.2 integrada

El dashboard de cash flow/presupuesto quedó integrado con flujo económico = ingresos - gasto de consumo, presupuestos por categoría y aportes de inversión separados explícitamente del gasto. Las categorías sin presupuesto se muestran como `unbudgeted` y la vista es read-only.


## Fase 11.3 integrada

El dashboard de portafolios separa inversiones por proveedor únicamente mediante asignaciones explícitas y conserva el consolidado validado existente. No inventa relaciones proveedor↔portafolio ni conversiones FX; portafolios incluidos sin proveedor quedan como `unassignedPortfolioIds`, y la vista permanece read-only.


## Fase 11.4 integrada

El calendario financiero mensual integra ingresos, obligaciones, suscripciones y aportes recurrentes definidos explícitamente. Los aportes se separan del gasto y preservan semántica `investment_transfer`; fechas inexistentes se ajustan a fin de mes de forma visible y la vista no ejecuta pagos ni movimientos.


## Fase 11.5 integrada

Las metas financieras usan baseline, valor actual y objetivo definidos explícitamente por el usuario. El progreso admite objetivos crecientes y decrecientes, muestra movimiento en dirección contraria sin porcentajes engañosos y no emite pronósticos on-track/off-track ni recomendaciones automáticas.


## Fase 11.6 integrada

El historial patrimonial deriva net worth de efectivo + inversiones - pasivos y reconcilia cada cambio contra fuentes explícitas. Las diferencias no explicadas permanecen visibles; `investment_transfer` exige impacto patrimonial cero y ningún origen de cambio se inventa.

## Cierre Fase 11

Fase 11 quedó cerrada de 11.1 a 11.6 con dashboard de patrimonio total, cash flow/presupuesto, portafolios por proveedor y consolidados, calendario financiero, metas/progreso e historial patrimonial. Todas las superficies son read-only, no inventan FX ni relaciones proveedor↔portafolio y preservan aportes banco↔inversión como `investment_transfer`, nunca como gasto.


## Fase 12.1 integrada

La auditoría anti-plantilla IA consolidó jerarquía financiera, materiales con propósito, números como primera clase, motion causal, mobile estructural y accesibilidad como restricciones del diseño premium.

## Fase 12.2 integrada

El motion premium usa intenciones semánticas ligadas a estados financieros reales. Reduced motion elimina transforms y conserva significado con transiciones cortas de opacidad; no hay loops decorativos, count-up de saldos ni affordances exclusivas de hover.


## Fase 12.3 integrada

Los materiales premium quedaron separados por función: lectura financiera sólida, glass de navegación, glass flotante y overlay de privacidad. Las cifras sensibles solo se permiten en superficies sólidas; los overlays de privacidad exigen valores enmascarados y el glass no se usa como decoración genérica.


## Fase 12.4 integrada

La experiencia móvil restringe swipes a navegación primaria deliberada y nunca dispara acciones financieras o destructivas. La PWA queda preparada para modo standalone con safe areas, pero prohíbe cachear API financiera, datos sensibles, secretos o credenciales y no permite acciones monetarias offline.


## Fase 12.5 integrada

La preferencia visual separa light/dark/system del estado financiero y mantiene reduced motion como restricción de accesibilidad. Si el sistema solicita reducción de movimiento, la app no puede forzar full motion; las preferencias no almacenan datos financieros ni credenciales.


## Fase 12.6 integrada

Los estados loading/empty/error/ready quedaron normalizados para superficies financieras. Loading no muestra cifras ficticias ni sensibles, empty no inventa actividad y error nunca renderiza mensajes crudos del proveedor o secretos; autorización, sync y soporte se comunican con acciones seguras específicas.


## Fase 12.7 integrada

La experiencia premium incorpora presupuestos verificables de rendimiento, targets táctiles mínimos, nombres accesibles, navegación por teclado, focus visible, anuncios asíncronos sin montos sensibles y deferred rendering limitado a secciones secundarias; el resumen patrimonial primario nunca se difiere.


## Cierre Fase 12

Fase 12 quedó cerrada de 12.1 a 12.7 con design system anti-plantilla IA, motion semántico, materiales con privacidad, mobile/PWA segura, temas y reduced-motion, estados loading/empty/error propios y gates de rendimiento/accesibilidad. La experiencia premium preserva todas las fronteras fintech: no inventa datos, no habilita acciones monetarias, no expone secretos y mantiene inversiones read-only.


## Fase 13.1 integrada

El TokenVault endurecido persiste únicamente envelopes AEAD, liga tenant/conexión/referencia como AAD, exige versionado para rotación/revocación atómica y falla cerrado ante conflictos o registros revocados. Los secretos reales siguen prohibidos hasta aprobar un KMS/secret manager productivo e IAM correspondiente.


## Fase 13.2 integrada

OAuth queda endurecido con state obligatorio, intents single-use/expirables, PKCE S256 cuando el perfil verificado lo requiere, redirect/provider binding, nonce condicional y mTLS fail-closed mediante referencias opacas a certificado y key handles de KMS/HSM. No se inventan endpoints, scopes, certificados ni requisitos de proveedor.


## Fase 13.3 integrada

El borde API incorpora rate-limit determinista, CSRF ligado a sesión+Origin, escaping de texto no confiable/CSP y un gate SSRF por HTTPS + allowlist exacta + bloqueo local/privado. Los redirects deben revalidarse y producción seguirá requiriendo DNS/egress enforcement y rate limiting distribuido.


## Fase 13.4 integrada

El audit log quedó definido como append-only, tenant-bound y hash-chained, con timestamps monotónicos y rechazo de metadata con claves secret-like. El consent ledger conserva grants y transiciones revocation/expiry como historial inmutable; un consentimiento terminal no se reactiva silenciosamente.

## Fase 13.5 integrada

El flujo de exportación es tenant-scoped, falla cerrado ante registros cross-tenant y excluye campos secret-like. La eliminación se representa como un plan dependency-aware con ejecución productiva destructiva deshabilitada; cualquier excepción de retención exige una referencia de política aprobada y el código no inventa obligaciones legales.

## Fase 13.6 integrada

CI incorpora un gate de auditoría de dependencias de severidad alta/crítica con lifecycle scripts deshabilitados durante la preparación del lock efímero. Dependabot quedó configurado semanalmente y existe checklist de pentest que separa controles internos ya probados de gates productivos pendientes. No se afirma haber realizado pentest externo.

## Fase 13.7 integrada

Las credenciales de brokers/exchanges solo pueden vincularse a adapters read-only tras una attestation provider-bound de permisos efectivos. Trading, withdrawal o transfer=true fallan cerrado; la capa común no inventa nombres de scopes/permisos del proveedor y exige referencia de verificación oficial/proveedor.

## Cierre Fase 13

Fase 13 quedó cerrada de 13.1 a 13.7 con vault cifrado y rotación, OAuth/PKCE/mTLS provider-neutral, hardening request-side, audit/consent append-only, data lifecycle tenant-scoped, dependency scanning + pentest checklist y enforcement explícito de credenciales read-only. Permanecen fuera de este cierre los gates productivos: KMS/IAM reales, aislamiento multiusuario completo, secret scanning dedicado, webhook verification donde aplique, ejecución destructiva con datos reales, pentest externo y cualquier acceso financiero productivo.


## Fase 14.1 integrada

El onboarding multiusuario crea únicamente metadata de tenancy de aplicación, exige actor=owner para la creación inicial y entrega un TenantContext explícito. Los guards de ownership aceptan recursos del mismo tenant y rechazan cross-tenant antes de persistencia o disclosure. No existe tenant implícito/fallback y onboarding no concede acceso a datos financieros ni crea credenciales, secretos o consentimiento de proveedor.
