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

## Safari, iconografía y restablecimiento por período (17 de octubre de 2026)

## Safari + PWA
- El Service Worker de la PWA **no intercepta solicitudes**. Eliminado `fetch/respondWith` para no transformar fallos de red/Access en errores internos de iOS. El nuevo Worker activa `skipWaiting` y usa solo red nativa para los datos. Puede ser necesario cerrar y abrir la PWA después de actualizarse.
- Los errores de consulta se muestran en lenguaje comprensible. Las API financieras siguen protegidas con Cloudflare Access y no se almacenan datos en caché.
- Los enlaces de navegación `↗` fueron reemplazados por flechas trazadas en CSS para evitar su renderización como emoji azules de iOS. El botón de recarga también utiliza un icono CSS.

## Ajustes → «Restablecer movimientos y saldos»
- Botón con opciones **Este mes** y **Todos los meses**. «Este mes» usa el mes calendario vigente en `America/Bogota` y filtra `occurred_at` de las dos tablas del ledger. «Todos los meses» elimina todos los movimientos de ese propietario. Los acumulados visibles del panel se calculan de nuevo a partir de los movimientos restantes.
- En el sistema Quick **no hay saldo bancario real persistido**. La operación no modifica saldos en Bancolombia, Nequi, Hapi, Binance ni otras instituciones. Tampoco borra cuentas manuales, autorización del Atajo, token del iPhone ni cuenta de Cloudflare Access.
- Borrar solo la última parte del historial **no reconstruye saldos externos** ni balances contables previos. No presentar balances reales inventados. La acción actual solo modifica movimientos de staging.
- El botón nunca borra por sí mismo: primero se elige alcance, después se solicitan conteos mediante `POST /api/quick/studio/reset/prepare`, y finalmente se exige casilla de consentimiento, frase exacta `BORRAR ESTE MES` o `BORRAR TODOS LOS MESES` y confirmación final nativa.
- Los desafíos duran 5 minutos, pertenecen a la identidad humana de Cloudflare Access y solo sirven una vez. `prepare/confirm` requieren `Origin` del propio Worker, activación separada `ALLOW_RESET_WRITES=true` y host de staging exactamente autorizado. El núcleo que recibe el token del Atajo **no** puede llamar estas rutas.
- La migración `0005_scoped_reset_confirmation.sql` agrega campos a la tabla `quick_reset_challenges` ya creada en `0004`. No borra registros financieros.
- La confirmación usa `D1.batch()` atómico con prueba única de confirmación y recuento vuelto a comprobar dentro de la transacción; no existe un borrado por lote parcial. En conflicto/caducidad, el usuario debe volver a revisar los conteos.
- El borrado solo afecta a `quick_manual_entries` y `quick_shortcut_expenses` del propietario autenticado y del alcance escogido; ninguna sentencia SQL modifica bancos, cuentas ni dispositivos.
- La prueba automatizada de SQLite cubre ambos ámbitos, conservaciones, aislamiento multiusuario, intento de reuso de desafíos, CSRF, error de datos cambiados y uso de token del Atajo antes/después del restablecimiento. **No ejecutar el borrado de los registros reales de staging hasta que el usuario pulse y confirme por su cuenta.**

## Riesgos y pasos antes de producción
- Es función de staging y permanece bloqueada en otros Workers. Antes del despliegue se confirma bookmark de D1, migración y conservar 100 % del tráfico dentro de staging.
- Las pruebas de navegador sintéticas y CI no garantizan todas las variantes de Safari físico; obtener validación de usuario en iPhone.
- Para un producto financiero completo, la limpieza de saldos necesitará diseñarse con cuentas, conciliación, transferencias e importaciones cuando existan fuentes oficiales verificadas.
