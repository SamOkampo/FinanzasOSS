# FinanzasOSS — PWA móvil y Web Push (staging)

## Implementado en código
- La captura manual de gastos del Studio sigue usando el ledger sin cuentas de la rama #175: confirmación explícita, idempotencia, lectura autenticada.
- PWA con manifest y acceso directo, instalación asistida en Ajustes, navegación móvil y ajustes táctiles del formulario. No es una app publicada en tiendas.
- Service Worker con `push` y `notificationclick`, sin listeners de `fetch` ni almacenamiento offline de finanzas. Notificación genérica: «¿Registraste tus gastos de hoy?», sin importar ni transmitir montos, bancos, conceptos o credenciales.
- API autenticada Cloudflare Access y same-origin: GET `/api/quick/push/config`, POST `/api/quick/push/subscribe`, POST `/api/quick/push/unsubscribe`. Solo el usuario autenticado puede registrar o revocar sus dispositivos. Máximo cinco por propietario.
- Tabla D1 independiente `quick_push_subscriptions` con claves compuestas por propietario y hash del endpoint; sin identificación bancaria.
- Envíos mediante VAPID ES256 con JWT de vida breve y `scheduled` para `30 1 * * *` UTC (20:30 del día anterior en Bogotá). Se envía *push sin payload*, y la PWA genera el texto localmente. Reintentos del día usan `last_sent_day`.
- Destinos remotos limitados a proveedores Web Push conocidos, y revocación por usuario. Códigos 404/410 eliminan endpoints vencidos.
- Todas las opciones Push empiezan desactivadas y requieren consentimiento explícito y autorización del navegador.

## Requisitos para activar en staging (NO realizar a ciegas)
1. Mantener PR #174, #175 y este PR en secuencia; obtener CI verde y revisión del diff.
2. Aplicar la migración `0006_push_subscriptions.sql` a **finanzasoss-staging** solo después de confirmar identidad D1 y bookmark de respaldo. No tocar producción ni saldos existentes.
3. Generar VAPID EC P-256 en un entorno confiable: publicar `VAPID_PUBLIC_KEY` (base64url, formato uncompressed) y conservar `VAPID_PRIVATE_JWK` únicamente en secretos del Worker. Configurar `VAPID_SUBJECT=mailto:<dirección-real-verificada>`.
4. Revisar y activar `ALLOW_PUSH_SUBSCRIPTIONS=true`, dejando `ALLOW_PUSH_SEND=false` hasta hacer la prueba en el iPhone instalado.
5. Crear el trigger cron `30 1 * * *` en el Worker de staging; una vez confirmados Access, VAPID, D1 y consentimiento, habilitar `ALLOW_PUSH_SEND=true`.
6. Prueba física en iPhone: Safari → Compartir → Añadir a pantalla de inicio → abrir desde el icono → Ajustes → Activar avisos → permitir. En Android usar Instalar aplicación. Verificar entrega, desactivación y registro sin duplicados.
7. Retención y borrado de endpoints Push deben integrarse en la política legal antes de producción. Los Push endpoints son capability URLs sensibles; nunca compartirlos en logs o capturas.

## Seguridad y límites
- Push está diseñado para **recordatorios**, no para reconocer pagos bancarios. Los gastos siguen siendo manuales o enviados por Atajos con consentimiento.
- La PWA en iPhone necesita estar agregada a la pantalla de inicio para solicitar Push (iOS 16.4 o posterior).
- Los avisos no llegan automáticamente hasta desplegar el código revisado, configurar las claves y trigger, aceptar permisos y habilitar envíos.
- Los proveedores externos pueden fallar o retrasar avisos; cron tampoco garantiza minuto exacto.
- Se requieren pruebas reales Safari/iOS y Android; CI no demuestra recepción real.
- No poner gastos personales, extractos o credenciales bancarias en staging antes de controles de privacidad, restauración y seguridad aprobados.
