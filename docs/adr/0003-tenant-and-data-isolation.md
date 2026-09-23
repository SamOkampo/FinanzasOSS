# ADR 0003 — Aislamiento por usuario y ownership explícito

## Estado
Aceptado

## Decisión
Toda entidad financiera persistida tendrá un `userId`/`tenantId` explícito. Ninguna consulta de cuentas, conexiones, movimientos, consentimientos, presupuestos o insights será válida sin scope de usuario.

## Reglas
1. El identificador de usuario procede de una sesión autenticada del servidor, nunca de un campo confiado del cliente.
2. Repositories reciben un `TenantContext` obligatorio.
3. IDs externos de bancos nunca se exponen como autorización de acceso.
4. Logs de auditoría registran actor, acción, recurso, resultado y timestamp, pero no tokens ni datos innecesarios.
5. Jobs asíncronos transportan `tenantId + connectionId`; vuelven a validar ownership antes de leer secretos.
6. En producción, RLS o controles equivalentes en DB serán una segunda barrera, no la única.

## Objetivo
Prevenir IDOR/BOLA, cruces entre usuarios y sincronizaciones que escriban datos en el tenant equivocado.
