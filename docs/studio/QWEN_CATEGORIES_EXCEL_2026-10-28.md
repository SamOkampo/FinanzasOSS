# FinanzasOSS Studio — categorías, Qwen y exportación de Excel (2026-10-28)

## Entregado en staging v27

- **Perfil por Cloudflare Access**: identidad `user_uuid` autenticada, no email o token escrito por el cliente. Categorías y cuotas identificadas por `owner_id`.
- **Catálogo de categorías**: Alimentación (Onces, Restaurantes, Mercado...), Suscripciones (IA y software, Streaming...), Ocio, Amigos y familia, Transporte, Salud, Educación, Compras, Pagos y transferencias, Vivienda y servicios, Otros.
- **Reglas locales gratuitas**: proponen clasificaciones y señalan incertidumbre. Un gasto no se modifica por una predicción. El usuario guarda o cambia cada categoría con confirmación expresa. Esto NO altera importe, fecha, banco ni método.
- **Qwen3 mediante Workers AI**: `@cf/qwen/qwen3-30b-a3b-fp8`. Disponible solo si `AI` binding + `ALLOW_AI_SUGGESTIONS=true`; en la PWA requiere seleccionar hasta ocho movimientos y aceptar un diálogo de consentimiento. Máximo cinco solicitudes por día y por usuario, registrado en D1. Se suprimen importes, correos, banco, llaves y destinatarios de transferencias; se transmiten nombres de comercio minimizados a Cloudflare para inferencia. Los resultados vuelven como propuestas y NO se guardan hasta que cada persona pulse «Guardar categoría».
- **Excel auténtico**: `GET /api/quick/export.xlsx`, siempre autenticado y sin caché. Dos hojas: Movimientos (fecha, concepto, categoría, subcategoría, importe numérico, método y banco) y Resumen categorías. ZIP OOXML generado sin dependencia externa, sin fórmulas ni macros. Hasta los 2000 movimientos activos más recientes por perfil.
- **Exportación a Google Sheets manual**: descargar XLSX y subirlo desde Drive/Sheets. No hay conectividad automática, ni credenciales de Google almacenadas o solicitadas. Evita fingir una sincronización en una UI que todavía no la tiene.

## Para habilitar sincronización automática con Google Sheets

1. Crear un OAuth Client ID en un proyecto Google Cloud controlado por el titular de FinanzasOSS. Configurar la pantalla de consentimiento y redirección HTTPS exacta de staging; nunca incrustar `client_secret` en frontend.
2. Usar consentimiento separado de cada perfil, idealmente `https://www.googleapis.com/auth/drive.file` para acceder únicamente a hojas creadas/seleccionadas por el usuario; no pedir acceso total a Drive.
3. Implementar OAuth authorization code con state aleatorio, PKCE, tokens cifrados en servidor y callback ligado al `owner_id` de Cloudflare Access, con opción revocar/eliminar.
4. Almacenar en D1 por owner el ID del spreadsheet autorizado, la hoja y la marca de sincronización. Hacer upsert idempotente por clave de movimiento y versión; reflejar correcciones y eliminaciones lógicas, reconciliar diferencias. Nunca copiar datos de un perfil a la hoja del otro.
5. Implementar pruebas de conexión/revocación/expiración, fallos de Google y permisos de escritura. Autorizar sólo el primer envío con vista previa y confirmación específica antes de comenzar la sincronización programada.

No hay Google OAuth conectado; esta función automática no está habilitada.

## Auditoría y seguridad

- Migración D1 `0010_categories_ai.sql` **aditiva**; sin modificación ni reescritura de movimientos previos.
- QA automatizado: owner A/B, CSRF, consentimiento, corrección manual, redacción de destinatarios, presupuesto de IA, XLSX ZIP y ausencia de información del otro perfil.
- Se preservan suscripciones Push, presupuestos y Cloudflare Access (720h).
- Sin tareas cron nuevas ni IA iniciada automáticamente.
- La tarifa y el uso de Workers AI dependen de la facturación de Cloudflare. Consultar https://developers.cloudflare.com/workers-ai/platform/pricing/ y monitorear la cuota antes de elevar límites.
- Prueba física pendiente: iPhone, revisión en Plan, Qwen en uno o dos gastos ficticios, descarga XLSX y apertura en Numbers/Excel/Sheets.

## Reversión

Worker v26 `0ac30a3d-7ce0-4bf2-af5f-47429b20399d`. La reversión del Worker no elimina categorías guardadas ni las tablas nuevas; si se revierte y reactiva AI más adelante, las tablas se mantienen. No borrar registros ni tablas para revertir.
