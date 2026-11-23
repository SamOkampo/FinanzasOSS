# Cierre de QA física: FinanzasOSS en iPhone real

## Por qué existe
La validación de Chromium y WebKit en Linux no reproduce necesariamente el teclado de iOS, el indicador Home, el notch, la barra de estado ni el comportamiento de una PWA añadida a la pantalla de inicio. La comprobación final tiene que ejecutarse en el dispositivo físico del usuario.

## Procedimiento, sin Mac

1. En el iPhone, abre FinanzasOSS instalado desde la pantalla de inicio y con tu sesión de Cloudflare Access normal. No compartas códigos de acceso ni tokens.
2. Abre **Más → Ajustes → Diagnóstico de la app en tu iPhone**.
3. Pulsa **Revisar las 8 pantallas**. Mide localmente las ocho secciones durante un instante, restaura la pantalla de Ajustes y muestra si aparecen desbordamientos horizontales. No modifica movimientos, presupuestos ni categorías; tampoco usa Qwen ni envía datos a un servidor.
4. Toca el campo **Prueba del teclado de iPhone** y escribe solo `prueba`. Verifica que el teclado no tape el formulario ni deje controles inaccesibles. El monitor escucha el cambio de altura de `visualViewport`; si lo observa, sólo informa píxeles, no contenido.
5. Cierra el teclado, pulsa **Revisar las 8 pantallas** otra vez y **Copiar reporte sin datos financieros**. Envía el texto junto a una captura de cualquier sección desbordada, previamente ocultando los importes, destinatarios o saldos.
6. En paralelo, prueba físicamente Registrar gasto y Editar gasto, abrir/cerrar el menú Más y navegar con la flecha Atrás; cerrar formularios sin guardar. Prueba modo oscuro, reducción de movimiento y orientación horizontal si está habilitada en el dispositivo.
7. Repite con el segundo perfil desde su propio dispositivo. No compartir capturas con información privada ni contraseñas.

**El reporte se genera y guarda solamente en memoria de esa página:** contiene medidas de viewport, áreas seguras, anchura y hasta doce nombres genéricos de componentes por pantalla; no recoge conceptos, montos, bancos, cuentas, cookies, URL, correo, identificadores ni imágenes. Copiar el reporte requiere tocar un botón y no lo transmite automáticamente.

## Con un Mac (depuración iOS nativa)
Apple permite inspeccionar incluso PWAs instaladas en la pantalla de inicio desde Safari en macOS:

1. iPhone → **Ajustes → Apps → Safari → Avanzado → Inspector web**, activar.
2. Conectar el iPhone al Mac mediante un cable y confirmar la confianza en el equipo cuando iOS lo solicite.
3. Mac → Safari → **Ajustes → Avanzado → Mostrar funciones para desarrolladores web**, activar.
4. Desde el menú **Desarrollo**, seleccionar el iPhone y buscar FinanzasOSS en **Home Screen Web Apps**; abrir el inspector para revisar el DOM/CSS, errores y cambios de viewport al aparecer el teclado.

Fuente oficial Apple: https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios

## Qué comprueba el código y qué no

- Comprueba: ocho secciones, ancho del documento, desbordamiento lateral de componentes seleccionados, barra inferior, entorno genérico iOS/Android, tamaño de viewport y safe areas, movimiento reducido y teclado si la altura visible cambia.
- No comprueba por sí solo: legibilidad subjetiva, contraste de todos los colores, VoiceOver real, funcionamiento de todos los botones bajo red lenta, permiso Push del sistema, resolución final de notificaciones, o el comportamiento de teclado en todos los modelos de iPhone.
- Los tests automatizados de GitHub siguen siendo la segunda barrera, usando registros completamente sintéticos y navegadores Chromium/WebKit.
- No se añaden endpoints de diagnóstico, persistencia, migraciones ni llamadas a Qwen.
- Entorno seguro: staging solamente, PR #186 derivado de PR #185. Mantener rollback Worker v28 `88042568-5047-4765-923a-6f1790fe177c` si se publica.

## Criterio de aceptación final
No afirmar `QA iPhone real validada` hasta recibir una ejecución del diagnóstico y revisión visible del teclado/modales en el dispositivo. Si hay problemas, corregir CSS/JS, publicar una revisión en staging y repetir la comprobación de hardware.
