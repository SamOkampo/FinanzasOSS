# FinanzasOSS Studio — QA de diseño y publicación v13

**Alcance:** únicamente Worker protegido `finanzasoss-quick-staging`, PWA `/dashboard`, PR #175 draft (basado en PR #174). No producción.

## Resultados de CI
- Commit de código revisado: `750fa33de56bfbb6b501e0fbcab83c69c1185a91`.
- CI quality + integración D1: [ejecución verde 39045215491](https://github.com/SamOkampo/FinanzasOSS/actions/runs/39045215491).
- Validación adicional del test de regresión tema/carga: [ejecución verde 39045278061](https://github.com/SamOkampo/FinanzasOSS/actions/runs/39045278061).
- Bundle esbuild revisado: SHA de blob `d844cd3b5fe14edd07e935da8054230eb8336b31`; `148405` bytes.
- Revisadas rutas privadas de ocho secciones, JWT/Access y same-origin POST, D1 owner isolation, deduplicación, protección de transacciones y rechazo de campos `accountId` del Atajo/PWA.

## QA de navegador local con datos **totalmente sintéticos**
Se probó la misma compilación con Chromium y respuestas interceptadas localmente, **sin acceder a datos financieros reales**:
- Viewports: 320 × 780, 390 × 844, 768 × 1024, 1440 × 900.
- Resultado: cero errores JS; cero desbordamientos horizontales; resumen y Plan consistente después de la carga; historial, navegación y diálogo accesibles; modo privacidad activable.
- Corregido: carrera entre `dashboard.js` y `studio.js` (antes Plan/Mapa y mensaje de estado podían quedarse cargando). Solución: handoff de datos de sesión en memoria + evento para futuras actualizaciones, sin caché ni localStorage.
- Corregido: modo oscuro originalmente dejaba el lienzo claro y los textos oscuros sobre tarjetas oscuras. Ahora se aplican variables de fondo y color a documento, aplicación y diálogos.
- Tamaño de botones superiores: 44 × 44 px.
- Movimiento: entrada de vista, hover y paneles discretos; desactivación por `prefers-reduced-motion` o ajuste del usuario; sin conteos monetarios animados.
- Validación visual real en iOS/Safari y con Cloudflare Access **pendiente** de prueba física por el propietario. QA sintético no sustituye este requisito.

## Despliegue Cloudflare
- Versión **13** subida y publicada al 100 % en el Worker privado de staging: `2823e5c7-9b8d-45fd-a265-6063dbda9457`.
- Versión anterior **12** de rollback: `94a2e4d6-9602-4bc2-b095-8f1ba63f5a90`.
- D1 conectada: `bc626bb4-a31e-438c-bfa9-d4ee7c4315ed`.
- Antes/después: **3 movimientos manuales**, **2 gastos account-free**, **1 cuenta ficticia**, **1 dispositivo Atajos activo**. Sin borrados ni mutaciones de DB en esta publicación.
- `ALLOW_WRITES` y `ALLOW_SHORTCUT_WRITES` permanecen habilitados solo en staging protegido, únicamente para datos ficticios.

## Límites explícitos
No se ha cerrado la fase 15 externa; no hay APIs bancarias reales, saldos verificados, posiciones de Hapi/Binance/IBKR ni importación de extractos en vivo al PWA. Las secciones correspondientes deben mostrar estado pendiente y no inventar montos. La interfaz es una unificación visual y funcional del ledger Quick + modelos originales, **no** la activación de todos los conectores.

## Próximo gate de producto
Prueba física autenticada en Safari iOS PWA (carga, navegación, modo oscuro, privacidad, revisión y confirmación de un gasto ficticio, comparación D1), y posteriormente un único modelo de conciliación de movimientos importados + Quick antes de aceptar datos reales.
