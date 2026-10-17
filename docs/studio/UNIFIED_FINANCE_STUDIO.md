# FinanzasOSS Studio — unificación editorial (staging, PR dependiente de #174)

## Principio del producto
FinanzasOSS Quick (D1 + Cloudflare Access + Atajos) es **captura de gastos** y no un producto separado. El Studio privado usa el mismo Worker autenticado y el mismo historial. La navegación, política de movimiento, incorporación de fuentes y PWA se derivan de los módulos existentes de `apps/web` y `packages/ui`. No se sustituye el dominio financiero original ni se declara que sus conectores se hayan activado.

## Funcionalidad disponible en esta fase
- Un solo home autenticado `/dashboard` con espacios Hoy, Movimientos, Portafolios, Plan, Mapa financiero, Importaciones, Conexiones y Ajustes.
- Resumen por día, semana, mes, año e histórico de **gastos registrados** (COP), basado en las tablas D1 existentes, con columnas de datos agregados y paginación de historial.
- Plan: análisis descriptivo del gasto registrado, sin presupuesto o patrimonio ficticio ni forecast automático.
- Mapa financiero: distribución del gasto por método de pago; **no es** un mapa de bancos/saldos.
- Nuevo registro manual desde PWA, bajo Cloudflare Access humano + same-origin POST + consentimiento explícito, mismo núcleo account-free/idempotente que Atajos. Nunca solicita cuenta bancaria de origen.
- Preferencias visuales de sesión: privacidad, transición reducida, tema editorial claro/oscuro. Nada en localStorage, sessionStorage o caché financiera. Service worker sigue network-only.
- Navegación móvil táctil y gestos de desplazamiento horizontal deliberados; mantiene el Atajo intacto.
- Código y tests E2E con datos sintéticos; sin producción ni información financiera real autorizada.

## Lo que no debe presentarse como ya integrado
- `apps/web` mantiene modelos/contratos avanzados (patrimonio, presupuestos, inversiones, imports, sync). **Aún no existe almacenamiento real ni API de producción conectada** al Studio para portafolios, ingresos, saldos y presupuestos. Se muestran estados vacíos honestos.
- Importación CSV/XLSX/OFX/PDF requiere terminar cableado seguro import-preview-confirmación-D1, con deduplicación. La PWA no recibe archivos.
- Ningún banco está conectado de forma real. No hay OAuth bancario, secretos, trading, retiros, facturación o sincronización automática.
- Los importes de D1 para staging son sintéticos; antes de datos reales se requieren evidencias de backups/restauración, export/delete, consentimiento/privacidad y controles de fase 15. No reiniciar, borrar ni revocar credenciales implícitamente.
- El PR debe basarse en la rama del #174 y no fusionarse a main ni desplegarse a producción sin los gates externos.

## Reglas de integridad
- La API `/api/quick/dashboard/overview` solo agrega `kind='purchase'` y COP. No trata transferencias propias o aportes como gasto.
- `/api/quick/dashboard/movements?page=N` lista todas las clases y monedas con 40 registros por página y filtros por owner de Access.
- Los gastos account-free del iPhone y PWA utilizan la misma tabla `quick_shortcut_expenses` sin cuenta inventada y con idempotency key. Identidad owner solo del principal Access o token vinculado.
- CSP scripts locales, nunca HTML crudo, caché desactivada, fechas America/Bogota.
- Preferencias de “privacidad” solo ocultan visualmente la pantalla: no sustituyen la autenticación.
- UI sigue utilizando el aviso de staging antes de introducir datos reales.

## Próximos hitos
1. CI verde y validación visual móvil/tableta/escritorio con usuario autenticado.
2. Captura desde PWA verificada en D1 sin duplicados y regresión de Atajos en dispositivo físico.
3. Diseñar un único ledger persistente y conciliador para importador + Quick + conectores.
4. Cableado seguro de importación con preview y confirmación; luego métricas patrimoniales con fuentes verificadas.
5. Restablecimiento de datos de prueba **solo con confirmación específica del propietario**, nunca asumir autorización por un rediseño.

## Corrección Safari / restablecimiento total (17 oct 2026)

- iOS/Safari: se quitó el listener `fetch` del Service Worker: ninguna solicitud financiera es interceptada por la PWA. El SW antiguo puede conservar el control de la pestaña hasta recargar o volver a abrir Safari; el nuevo activa `skipWaiting` y no usa `respondWith`. Los errores de red se muestran con texto claro y no con excepciones internas.
- Diseño: reemplazar todos los `↗` del HTML por iconos dibujados con CSS, evitando que iOS los convierta en cuadrados de emoji azules. Control de recarga también dibujado con CSS; modo sin hover evita pestañas iluminadas tras tocar en iPhone.
- `Ajustes > Restablecer todo`: la acción de apertura **no borra nada**. `POST /api/quick/studio/reset/prepare` requiere Access humano autenticado, Origin del Worker y `ALLOW_RESET_WRITES=true` (solo staging). Entrega conteos y desafío ligado al propietario que expira en 5 minutos. `POST /api/quick/studio/reset/confirm` exige frase exacta `RESTABLECER TODO`, `confirmed:true`, desafío de un solo uso y totales sin cambios desde la revisión.
- El borrado ejecuta un lote transaccional D1 `batch()` con owner derivado exclusivamente de Cloudflare Access; elimina: `quick_manual_entries`, `quick_shortcut_expenses`, `quick_manual_accounts` y `quick_shortcut_devices` de **ese usuario**. Conserva los datos de otras personas y las políticas externas de Cloudflare Access. Revocar las autorizaciones del iPhone hace necesario reenrolar el Atajo.
- Antes de habilitar el backend en staging se verificó el bookmark D1 y los conteos; publicar la funcionalidad **no ejecuta ningún borrado**.
- Las regresiones prueban en SQLite real, con D1-shaped `batch` transaccional, aislamiento por owner, caducidad lógica, desafío repetido, diferencias entre snapshot y estado actual, confirmación explícita, conservación de otros usuarios, revocación de token iPhone y posibilidad de volver a activar el acceso humano.
- **Límite de QA:** prueba local/CI de lógica y endpoints más integridad de D1 en remoto; el acto destructivo real de D1 **no se ejecuta sin intervención del usuario**. Revisar la experiencia visual en Safari físico antes de dar por cerrada la UX.
