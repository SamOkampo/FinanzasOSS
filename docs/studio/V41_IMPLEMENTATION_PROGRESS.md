# FinanzasOSS v41 · Cierre de implementación

## Funciones de la entrega

| Área | Comportamiento |
| --- | --- |
| Extractos | PDF digital o protegido con lectura en el dispositivo. Si faltan movimientos completos, OCR con autorización por archivo. Excel y CSV admitidos. El OCR procesa hasta cinco páginas según la cuota diaria compartida con otros análisis de documentos y categorías. |
| Conciliación | Vista previa de importes COP, detección de coincidencias, borradores, confirmación por fila, auditoría y enlaces entre transferencias propias. Los extractos pueden mostrar otras monedas para revisión. |
| Qwen | Chat privado, historial, consultas sobre gastos, Hapi y compras por activo. La respuesta `food` abre la selección de subcategoría. Recordar un comercio requiere confirmación y la regla se puede revocar. |
| Avisos | Resumen voluntario por perfil, selección de tipos, hora de Bogotá y horario de silencio. Deducción desde los registros de la app y acceso a Pendientes desde la notificación. |
| Hapi | Registro manual con reportes digitales, efectivo y posiciones USD, compras y demás actividad del bróker, enlace confirmado de aportes COP a USD y comparación de aportes acreditados con el último corte. |
| PWA | Estados de carga al abrir la app, progreso por página de OCR y estimación tras dos lecturas. Chat diseñado para conservar el campo de envío visible cuando se reduce el área de pantalla. |

## Verificación

- Suite del repositorio, compilación del Worker y pruebas con perfiles y movimientos ficticios. Incluye autenticación, consentimiento, aislamiento, duplicados, reintentos, trabajo con PDF protegido y cuota de OCR.
- Chromium móvil simulado para chat y conciliación. Prueba de transcripción con una imagen ficticia usando Qwen.
- El reporte del iPhone instalado verificó las ocho pantallas en vertical a 390 × 797 px sin desbordamiento lateral. Queda comprobar en ese dispositivo el botón Enviar con el teclado abierto y la entrega de una notificación con la app cerrada.

## Diferencias frente al diseño original

- La conciliación bancaria de esta entrega se hace en COP. Hapi se lleva en USD con conversión efectiva por aporte confirmado. El historial de actividad y los cortes se basan en los documentos guardados. No hay cotización en vivo, cálculo de rentabilidad por lotes, conversión consolidada automática a COP ni desglose automático de custodia.
- Los gráficos usan controles HTML con etiquetas de moneda. Las alertas se derivan de los registros actuales y admiten posponer 24 horas. El aviso deja de aparecer cuando se resuelve su causa.
- Una eventual conexión directa requiere que Hapi habilite a FinanzasOSS como integración autorizada. Los ciclos usan la información cargada y confirmada por el usuario.
