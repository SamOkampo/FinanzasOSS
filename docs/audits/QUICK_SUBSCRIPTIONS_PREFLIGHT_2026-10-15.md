# FinanzasOSS — preflight de Quick + Subscriptions (2026-10-15)

> Auditoría de código y diseño del nuevo flujo, **NO** auditoría final de las fases 0–16 ni certificación de producción. Basada en `main` `f054d8d080858d1971cd46f0c74ffdd53c2f4d90` y árbol de archivos consultado en GitHub. Revalidar HEAD y CI antes de integrar.

## Evidencia observada y brechas

| Prioridad | Estado real y evidencia | Impacto | Gate de cierre |
| --- | --- | --- | --- |
| P0 | `apps/web/public/index.html` es una vista previa sin subida funcional ni API; CSP `connect-src 'none'`. `apps/web/public/preview.js` solo alterna paneles. | El usuario no puede guardar gastos desde la UI. | Implementar experiencia real autenticada, probar clic→guardar→consultar con aislamiento por tenant. |
| P0 | `apps/api/src/index.ts` solo expone health + utilidades; `packages/database/src/index.ts` define interfaces, no persistencia real implementada en este árbol. | No existe ruta operacional de ledger durable. | Repositorio persistente con migración/RLS, auth, operaciones atómicas, pruebas de permisos y restauración en staging. Sin usar datos bancarios reales. |
| P0 parcialmente mitigado (#160) | El reconciliador admite registros **manuales existentes** como anclas de comparación, pero no ingresa candidatos manuales desde importaciones. | Las coincidencias exactas o ambiguas se retienen para revisión; sin persistencia/confirmación real aún no está resuelto extremo a extremo. | Implementar conciliación persistida con decisión humana, idempotencia y pruebas E2E sin doble conteo. |
| P1 | `packages/finance-core/src/subscription-detector.ts` necesita >=3 débitos contabilizados de un mismo comercio/moneda; no procesa correos. | Una suscripción nueva y un recibo aislado no se detectan oportunamente. | Modelo separado de **candidatos** de suscripción desde recibos seleccionados, confirmación humana, etiquetas de confianza y fecha estimada. |
| P1 | `packages/import-engine/src/cross-source-reconciliation.ts` acepta `email_auxiliary` pero solo movimientos ya normalizados. | Es erróneo anunciar Gmail conectado o un cobro realizado a partir de un correo. | Ingesta autorizada y mínima; separar evento de facturación, candidato, cargo confirmado e importación contable. |
| P1 | `apps/web/public/manifest.webmanifest` declara PWA sin comprobar en este árbol un service worker ni shortcut directo a captura. | Un icono PWA no equivale a un widget nativo iOS. | Shortcut PWA/URL segura o Atajos de iOS con sesión y CSRF; widget nativo iOS requiere implementación separada. |
| P1 | No hay en el árbol un servidor OAuth Gmail, token handling para scope Gmail, ni flujo de desconexión/borrado. | Riesgo de permisos excesivos y privacidad. | Empezar con selección/reenvío explícito de recibos; después OAuth de mínimo privilegio, seguridad y verificación de Google según scopes. |
| P2 corregido (#159) | Se cambió el cálculo de próxima fecha a meses/años de calendario con ancla mediana y límites de fin de mes. | Corrige la deriva demostrada para cargo mensual en día 5 y renovación anual tras año bisiesto; sigue siendo una **estimación**. | Mantener pruebas de husos, vencimientos y variación de fechas en el futuro flujo de alertas. |

## Implementación mínima de este PR

`packages/finance-core/src/quick-entry.ts` introduce **solo un preparador de borradores de revisión**, no persistencia ni API:
- Montos como texto decimal canónico sin agrupadores, aritmética `bigint` en unidades menores, COP/USD explícitos, límite positivo.
- Referencias obligatorias de tenant, actor y clave de idempotencia generada por el cliente; fecha UTC canónica.
- Método de pago obligatorio, banco/comercio opcionales como **etiquetas no verificadas**.
- Clasificación elegida explícitamente: `expense → purchase`, `own_transfer → transfer`, `investment_transfer → investment_transfer`. No convertir aportes a brokers en gastos.
- Respuesta inmutable, `requiresUserConfirmation=true`, `persistenceEnabled=false` y cuenta real pendiente de selección para publicar el movimiento.
- Pruebas negativas de entrada manipulada, centavos, montos inválidos, aislamiento declarativo y clasificación protegida.

**No incluye** widget operativo, datos reales, OAuth Gmail, conexión de cuenta, backend de escritura o confirmaciones de cargos.

## Plan de ejecución sin inventar capacidades

1. **Quick / base:** integrado en PR #158 (merge `029e2c3`, CI #355 verde).
2. **Quick / persistencia:** diseñar cuentas manuales explícitas, migraciones y políticas de acceso; implementar POST autenticado, claves de idempotencia, commits transaccionales y comprobación de propiedad. No asumir que elegir el nombre de un banco verifica una cuenta.
3. **Quick / interfaz:** formulario móvil de pocos pasos, categoría opcional, confirmación, accesibilidad, estado offline seguro sin guardar datos financieros sensibles sin protección; atajo web/PWA y prueba iPhone.
4. **Quick / deduplicación:** núcleo review-only integrado en PR #160 (merge `572d42c`, CI verde); falta integrar con ledger persistente y aprobación humana del match.
5. **Subscriptions / candidatos:** analizar recibos que el usuario aporte expresamente, sin interpretar mensajes como cargos definitivos. Reglas de calendario, próximos cobros estimados, alertas opt-in.
6. **Gmail / OAuth (posterior):** evaluar clasificación de scopes, verificación de Google y eventual auditoría de seguridad; permisos minimizados, revocación, borrado y retención mínima; no guardar correos completos por defecto.

## Revalidación posterior a la auditoría inicial

- PR #158 merge `029e2c3`, CI #355 SUCCESS — Quick draft validado, sin almacenamiento.
- PR #159 merge `ef30ba7`, CI #357 SUCCESS — predicción calendario mensual/anual corregida.
- PR #160 merge `572d42c`, CI #38778889455 SUCCESS — coincidencias manual↔extracto a revisión y aislamiento entre tenants.
- El bloqueo principal ahora es **Q4 persistencia autenticada real**; Q5 interfaz móvil, Q6 evidencia de recibos y Q7 OAuth siguen pendientes.
- `docs/ROADMAP.md` conserva Fase 15 abierta y Fase 16 sin iniciar, sin declarar producción autorizada.

## Límites y gates

- Las Fases 0–14 constan como cerradas **a nivel de contratos, pruebas y documentación**; ello no prueba que la app sea operacional como producto completo.
- La Fase 15 **sigue abierta** por aprobaciones externas de Open Finance, legal/privacidad, infraestructura productiva, pentest y canary.
- Fase 16 **no** se marca ejecutada por este documento y Fases 17+ no se tocan.
- No se conectan bancos, Gmail, broker ni tarjetas; no pagos, retiros, trading, costes ni datos financieros reales. Gmail no es fuente contable autorizada por sí misma.
