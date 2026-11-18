# FinanzasOSS v41 — Adenda aprobada: Qwen agente financiero diario + Hapi como inversión (no banco)

**Estado:** especificación original aprobada. La [nota de cierre de la v41](./V41_IMPLEMENTATION_PROGRESS.md) indica qué se implementó, las diferencias frente al diseño y la verificación pendiente en el dispositivo.

**Principios innegociables:** no crear gastos/ingresos ficticios, no duplicar transferencias, no suponer que Hapi está conectado, no ejecutar trading/retirar/depositar automáticamente, y no enviar datos bancarios personales a Qwen sin consentimiento explícito. D1 aísla todo por `owner_id`.

> **Desarrollo del caso de aprendizaje `food`:** consultar [V41_QWEN_FOOD_CLARIFICATION_LEARNING.md](./V41_QWEN_FOOD_CLARIFICATION_LEARNING.md). Especifica alias, subcategorías, doble confirmación, alcance de preferencias, bloqueo de agregadores y pruebas. La nota de cierre documenta su implementación.

## A. Qwen: robotsito de finanzas + revisión proactiva

### A1. Chat de categoría dentro del overlay
- El chat flotante abre tareas pendientes de la cola existente `quick_auto_categories`, además de futuras filas dudosas de la conciliación.
- Pregunta usando nombre/contexto pertinente y presenta botones + respuesta libre; ejemplo: «No entendí Wompi SAS ($7.400). ¿Fue una compra, comisión, suscripción o transferencia? ¿Para qué lo utilizaste?».
- Qwen **propone** categoría y subcategoría de la taxonomía validada; el usuario confirma o corrige. No se actualizan monto, banco, fecha ni naturaleza económica por una inferencia.
- Las correcciones manuales tienen prioridad; opción de «recordar este comercio» persiste preferencia **solo dentro del perfil propietario**, con opción de revocación.
- El chat recupera hilos y ofrece visuales estructurados (texto, tarjeta, gráfica SVG desde cifras calculadas por SQL, diagrama validado). No aceptar HTML, SQL ni SVG arbitrario producido por el modelo. No prometer generación de imágenes artísticas solo por usar Qwen.
- Reusar lógica existente `category-automation.ts`/`categorization.ts` y `push.ts`; evitar duplicar decisiones/conflictos.
- Desacoplar presupuesto de llamadas para clasificar y para conversar. El sistema actual tiene cuota de hasta cinco inferencias por propietario y día; el plan nuevo debe mostrar límites y permitir desactivar análisis.

### A2. Agente contable diario (asistente, NO contador público)
**Detección en dos modalidades:**
1. En cada nuevo movimiento, importación, cambio de saldo o reconciliación, ejecutar detectores deterministas ligeros.
2. Un cron programado revisa diariamente únicamente perfiles con consentimiento y eventos pendientes.

**Reglas verificables** (no hace falta Qwen para detectar lo que puede decidir SQL):
- `unclassified_movement`: categoría desconocida o ambigua.
- `possible_duplicate`: transacciones con evidencia de duplicidad, sin confundir compras repetidas legítimas.
- `unreconciled_balance`: diferencia entre snapshots confirmados y movimientos (jamás asumir que es pérdida/fraude).
- `unmatched_internal_transfer`: transferencia entre cuentas propias sin contraparte identificada.
- `hapi_deposit_pending`: banco origen marcado, depósito de Hapi aún sin confirmar.
- `credit_payment_due`: vencimiento introducido/verificado, no inferido desde una compra.
- `import_unreviewed`: archivo importado con filas no aprobadas.

**Alertas/push:**
- Consentimiento separado para avisos, horario y tipos de alertas. Por defecto, push con texto neutro sin montos, beneficiarios o bancos; abrir `/dashboard#qwen` / cola de revisión tras autenticación.
- Una notificación por evento mientras no cambie su estado; deduplicación, agrupación, throttling, silencio nocturno y digest diario configurable.
- Severidad de eventos: informativo / requiere revisión / importante. «Posible operación inusual» nunca equivale a fraude confirmado.
- No enviar recordatorios constantes cuando no existan cambios ni eventos.
- «Diario» = revisar información **existente** y la recibida de fuentes con conexión autorizada. No monitoreo bancario en vivo sin integración.
- Estado `new`, `notified`, `acknowledged`, `resolved`, `snoozed`, con motivo y fecha; marcar una alerta resuelta cuando se resuelva la causa, no cada vez que se abre el chat.

**Persistencia planeada:** `quick_ai_review_items` (owner, source, source_id, rule, evidence, status, timestamps), `quick_ai_alert_preferences` (owner, consent, quiet_hours, digest_local_time, enabled_rules), `quick_ai_alert_dispatch` (owner, review_item, channel, event_fingerprint, sent_at, delivery_status), e hilos de Qwen existentes en plan v41. Restricciones e índices por propietario; claves idempotentes y retención.

**Interfaz:** botón flotante sobre la PWA por encima del contenido (sin tapar navegación iPhone), burbuja de pendientes, bottom sheet con listas interactivas, entrada natural, historiales privados, respuestas enriquecidas y opción «no preguntar esto otra vez».

**API propuesta:** `GET /api/quick/v41/agent/inbox`; `POST /api/quick/v41/agent/clarifications/:id/answer`; `GET/POST /api/quick/v41/agent/preferences`; `POST /api/quick/v41/agent/items/:id/snooze`; `POST /api/quick/v41/qwen/chat`. Los POST exigen sesión Access, comprobación de Origin y validación de propietario; el Worker no acepta owner desde cuerpo JSON.

**Pruebas:** taxonomía, precedencia manual, no duplicación Push, aislamiento entre perfiles, respuestas naturales, no mutar movimiento al recomendar, sin mensajes si no hay problemas; iPhone PWA y Service Worker.

## B. Hapi: cuenta de inversión y portafolio USD

### B1. Clasificación financiera
Hapi **no es banco**, es bróker. La entidad visible será `Inversiones → Hapi` con:
- `broker_cash_usd`: efectivo no invertido (poder de compra **no equivale a efectivo** en cuentas margen si incluye línea de margen).
- `securities`: acciones/ETF enteros y fraccionados, unidades decimales y precio/costo en USD.
- `crypto`: solo cuando realmente existan criptoactivos, separados de valores y con su custodia específica.
- `broker_fees`, dividendos, intereses, ventas y rendimientos realizados/no realizados, sin sumar dos veces efectivo y posiciones.
- Vista consolidada con USD como moneda de origen y COP **informativo** usando tasa FX de fuente y hora declaradas.

**Las fracciones de acciones/ETF no son automáticamente tokens cripto.** Los valores de Hapi son títulos intermediados en un corredor de bolsa; la cripto existe como categoría separada (Hapi Crypto/Bakkt). El valor de mercado del portafolio cambia continuamente y no es un saldo bancario líquido.

### B2. Ruta del dinero — transferencia banco → Hapi → compra
Un aporte se modela como *traslado de patrimonio*, no gasto o salario:
1. **Origen COP:** salida de un banco propio `bank_transfer_out`, con entidad, monto, fecha, comprobante y referencia cuando exista.
2. **Tránsito:** `investment_deposit_pending`. Puede haber días de diferencia entre salida y acreditación.
3. **Destino USD:** depósito Hapi acreditado al `broker_cash_usd` según documento real, enlazado al origen por conciliación y confirmación humana. Guardar **monto COP de salida, USD acreditados, comisiones explícitas y tipo de cambio efectivo**. Nunca asumir que el banco conoce cuántos USD llegaron.
4. **Compra de VT u otro valor:** `broker_cash_usd` disminuye y aumentan unidades del activo y costo base. **Comprar una acción no crea otro gasto de consumo**.
5. **Valuación:** valor mercado = cantidad de títulos * precio observado; ganancia/pérdida no realizada se muestra separada de depósitos y flujos. Sin transacción no se contabiliza un ingreso realizado.
6. **Venta:** baja posición, sube efectivo disponible según liquidación, computa ganancia/pérdida realizada y comisiones. Retiros enlazan salida USD y abono COP del banco sin crear sueldo.
7. **Dividendos/intereses:** ingresos de inversión cuando estén acreditados y documentados; dividendos reinvertidos = ingreso + compra vinculada, no dos ingresos.

**Ejemplo ficticio:** COP $420.000 salen de un banco y Hapi acredita USD 100 después de tarifas y conversión. Si se compran USD 98 de un ETF, efectivo no invertido = USD 2 y la cartera contiene fracciones del ETF con valor de mercado variable. El patrimonio no cae COP $420.000 por una compra y no se duplica como «gasto».

### B3. Conexión real: capacidad y límites actuales
- El actual FinanzasOSS Studio **NO tiene una conexión Hapi activa**. Hay un normalizador *sintético* de estados Hapi en `packages/connector-sdk/src/hapi-statement.ts`; eso no autoriza ni implementa sincronización.
- Hapi ofrece estados de cuenta oficiales a través de `Menú → Reportes` o `Portafolio → Reporte`; primer paso soportado: **importación manual** de estados/confirmaciones, con revisión.
- Hapi anunció `https://mcp.hapi.trade/mcp` para acceso de lectura a cuentas habilitadas, **en beta cerrada y solo para ChatGPT, Claude y Cursor oficiales**. No asumir acceso a través de FinanzasOSS ni del Qwen embebido ni autorizar una app haciéndose pasar por esos clientes.
- Para que FinanzasOSS sincronice Hapi en segundo plano se necesita API / OAuth formalmente permitido para nuestra aplicación, consentimiento explícito y credenciales seguras; si no existe, indicar «manual / no conectado». La vinculación con un movimiento bancario puede ser una **sugerencia de conciliación** que el usuario confirma tras importar el reporte de Hapi; no se puede detectar el depósito externo instantáneamente sin fuente autorizada.
- El acceso de lectura Hapi puede mostrar operaciones, saldos, dividendos y posiciones, pero no contrapartes ni datos bancarios completos; conciliación debe tolerar faltantes sin fabricar relación bancaria.
- Nunca pedir contraseñas, OTP, cookies de Hapi, hacer scraping o ejecutar órdenes. Si en el futuro hay conexión autorizada, solo lectura.
- Un ChatGPT conectado con Hapi no implica autorización para la app FinanzasOSS.

### B4. Persistencia y API propuesta
Agregar migración posterior y tablas:
- `quick_investment_accounts` (owner, provider='hapi', base_currency='USD', connection_status).
- `quick_broker_cash_snapshots` (owner, investment_account_id, cash_usd_minor, as_of, source).
- `quick_broker_positions` (owner, account, symbol, instrument_type, quantity_decimal, currency, as_of, average_cost, source; no floats binarios para cantidad).
- `quick_broker_transactions` (owner, source_tx_id, event_type, amount_usd, quantity, price, fee, occurred_at, status).
- `quick_cross_account_transfer_links` (owner, source_bank_movement, destination_broker_transaction, amount_cop, credited_usd, fx_rate, fee, state, matched_by).
- `quick_fx_observations` (currency_pair, rate, source, observed_at, usage); importes monetarios en enteros mínimos o decimal exacto, sin `Number` flotante para dinero.
- `quick_broker_valuation_snapshots` (owner, account, positions_market_value_usd, cash_usd, total_usd, as_of, source).

API de solo lectura y carga confirmada:
`GET /api/quick/v41/investments/accounts`,
`POST /api/quick/v41/investments/hapi/statement/preview`,
`POST /api/quick/v41/investments/hapi/statement/commit`,
`POST /api/quick/v41/transfers/link-broker`,
`GET /api/quick/v41/investments/hapi/positions`,
`GET /api/quick/v41/investments/hapi/valuation`.
No endpoint de compra/venta de valores.

### B5. Presentación en la app
`Portafolio → Hapi`:
- Patrimonio de inversión total USD (fecha/fuente).
- Efectivo para comprar, excluyendo cualquier margen crediticio.
- Posiciones (activo, cantidad fraccionada, costo de adquisición, valor mercado y variación).
- Histórico de depósitos COP↔USD, comisiones y cotización efectiva.
- Badge «Última verificación» o «No conectado»; sin alegar tiempo real.
- Gráficas de capital aportado vs valor de mercado y distribución por tipo de activo.
- Preguntas Qwen: «¿Ya llegó el depósito de Plata Pay a Hapi?», «¿A qué activo destinaste los USD?», con enlaces a comprobante y revisión.

## C. Cómo actualizar roadmap v41

- **41.1:** importador/conciliación desde CSV y XLSX con ID y dirección COP/USD; enfoque preventivo y sin borrados.
- **41.2:** transferencias internas, pagos de tarjeta y conciliación entre cuentas.
- **41.3:** chat Qwen flotante con preguntas de categorías, texto libre y confirmación.
- **41.4:** agente diario, cola priorizada, push opt-in, deduplicación y quiet hours; gráficos y diagramas verificados.
- **41.5:** Hapi como bróker y USD, importación de estados, conciliación COP→USD→posición, sin conexión bancaria inventada.
- **41.6:** PDF y formatos más complejos con validación, auditoría y QA móvil.
- **41.7:** eventual conexión Hapi automática **solo si Hapi habilita una integración legítima para FinanzasOSS**.

## D. QA mínimo adicional

1. Movimiento Wompi desconocido genera una sola pregunta Qwen; respuesta «suscripción» deriva categoría validada, sin cambiar monto.
2. Si se elige recordar comercio, futuras categorizaciones respetan corrección; otras identidades no aprenden ese comercio.
3. Agente ejecutado 4 veces no duplica Push; horario silencioso, digest, revocación y desconexión funcionan.
4. Sin nuevos extractos bancarios, agente jamás afirma que detectó operaciones ocurridas fuera de FinanzasOSS.
5. Depósito COP→Hapi USD con spread/comisión, registro pendiente y fecha acreditación; ninguna compra ETF se suma a gasto de consumo.
6. Acciones fraccionadas muestran cantidades exactas; su valor de mercado varía sin «convertirse en tokens».
7. Broker cash + securities + (crypto cuando aplique) suman una vez al patrimonio; margen no se trata como efectivo propio.
8. Qwen no interpreta transferencias entre cuentas propias como renta nueva; dividendos reinvertidos se vinculan.
9. Importación/reconciliación idempotente, sin duplicados; se conservan gastos históricos y balances confirmados.
10. Dispositivo iPhone sin consentimiento Push no recibe notificaciones; chats no muestran información de otro propietario.

### Fuentes oficiales verificadas (2026-11-14)
- Hapi: [fracciones](https://help.hapi.trade/es/articles/8972378-que-son-las-acciones-fraccionadas), [titularidad de acciones](https://help.hapi.trade/es/articles/8970605-las-acciones-me-pertenecen), [estadísticas](https://help.hapi.trade/es/articles/13244218-como-entender-la-seccion-estadisticas-en-mis-inversiones), [estados de cuenta](https://help.hapi.trade/es/articles/13764720-como-leer-tu-estado-de-cuenta-en-hapi).
- Hapi: [depósitos Colombia](https://help.hapi.trade/es/articles/10244515-depositar-a-hapi-desde-colombia), [MCP/IA conectada](https://help.hapi.trade/es/articles/17590476-como-conecto-mi-cuenta-de-hapi-a-claude-chatgpt-o-cursor), [alcances de IA](https://help.hapi.trade/es/articles/17590479-que-puede-ver-la-ia-conectada-y-que-no-puede-hacer).

**Esta adenda define alcance y criterios de aceptación; no despliega funciones ni mueve dinero.**
