# FinanzasOSS v28 — auditoría integral PWA móvil · 28 de octubre de 2026

## Alcance y criterios de aceptación

Se revisa toda la experiencia de la PWA, sin conexión a datos reales en el navegador de pruebas:

| Espacio | Comprobación móvil |
|---|---|
| Hoy | cabecera, hero, filtros de período, KPI, gráficos, presupuesto y enlaces |
| Movimientos | historial, importes, fechas, entidad, método, banco, acciones Editar/Eliminar y paginación |
| Portafolios | tarjetas de fuentes no conectadas, lectura sin inventar saldos |
| Plan | 4 presupuestos, tarjetas, recuadros, categorías/subcategorías, propuesta Qwen |
| Mapa | flujo de efectivo conceptual, etiquetas, targets y gráficos adaptables |
| Importaciones | formulario CSV, revisión, selectores, botón de exportación XLSX |
| Conexiones | fichas de proveedores, estados visibles y tamaños de sus etiquetas |
| Ajustes | perfil, modo oscuro, privacidad, movimiento reducido, Push, cerrar sesión y restablecimiento |
| Diálogos | captura/edición, menú Más, confirmación de restablecimiento y su barra de botones |

### Cambios de calidad

- Diseño para 320, 375, 393, 430, 768, 1024 y 1440 px. Todos los espacios usan contenedores `min-width:0`, layouts grid seguros, texto numérico adaptable y respeto al notch/Home Indicator.
- Barra de navegación fija accesible, tap targets de 44–52px y desplazamiento sin overflow lateral. El teclado virtual reduce la altura disponible de los bottom sheets y oculta temporalmente la barra de pestañas.
- Navegación tipo aplicación: una sección visible, transición contextual de ~210 ms sin recarga de página, historial de navegación `pushState`/`popstate`, back/forward y gesto de barrido con protecciones para controles y zonas desplazables.
- Menú Más, Registrar Gasto, Editar y Restablecer como hojas adaptables al área visible en móvil; en escritorio conservan diálogos centrados.
- Respeto a `prefers-reduced-motion` y preferencia de movimiento reducido dentro de la PWA. No carga frameworks de animación, fuentes externas, servicios extra ni caché de datos financieros.
- Modo oscuro revisado para inputs, categorías, tablas, botones y hojas.

### Tests

- CI: lint, TypeScript, seguridad, pruebas de D1 y regresión de navegación.
- Navegador de prueba aislado con **datos ficticios**: Chromium y WebKit (WebKit es similar a Safari, pero no reemplaza QA física iOS). Prueba todas las secciones en siete anchos, compara bounding boxes contra viewport, detecta scroll horizontal, valida navegación/modal, back/forward, dark mode y reduced motion.
- Ningún test de navegador lee cookies, datos financieros de staging o credenciales; servidor sintético local.

### Publicación segura

- Sólo staging protegido por Cloudflare Access y dos perfiles aislados.
- Worker con idénticos bindings D1, Access, Push y Qwen. Ningún cambio en SQL ni migraciones, ningún nuevo cron.
- Verificación pre/post: movimientos, presupuestos, dispositivos Push, categorías y cuotas IA sin modificar.
- En caso de problema, volver a Worker v27 `f2539bbe-3bf5-4224-abff-a5cab6f4e048`.
- QA en iPhone real permanece como comprobación final, especialmente con teclado nativo, notificaciones iOS y ventanas de Apple WebKit. Las pruebas de Linux WebKit/Chromium no prueban la visualización exacta del navegador instalado en iOS.

## Recomendaciones después de publicar

1. Cerrar y abrir la PWA instalada; navegar Hoy → Movimientos → Plan → Importaciones → Ajustes y usar el botón nativo atrás.
2. Abrir Registrar gasto, escribir monto/concepto y cambiar método. Cerrar sin guardar para verificar teclado y safe areas.
3. Abrir Más y Restablecimiento, inspeccionar scroll y cerrar sin realizar acción destructiva.
4. Revisar modo oscuro, orientación vertical/horizontal y movimiento reducido.
5. Repetir con Neried, sin copiar datos ni credenciales entre perfiles.

Estas comprobaciones físicas no modifican movimientos si los formularios se cierran sin confirmar.
