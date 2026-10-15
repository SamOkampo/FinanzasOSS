# FinanzasOSS Quick — Cloudflare Workers + D1 (staging)

**Estado:** implementación de código en GitHub. **No significa que exista un Worker o D1 desplegado en Cloudflare.** El intento de leer el inventario Cloudflare mediante conector estuvo bloqueado por controles de acceso; no repetir ni eludir ese bloqueo, no inventar IDs, no tocar otros proyectos.

## Arquitectura adoptada

```
Navegador con sesión de Cloudflare Access
  → mismo origen Worker protegido por Access
  → ctx.access.getIdentity() (id estable, AUD validada)
  → validación de monto/classificación/confirmación
  → D1 solo desde binding privado del Worker
```

- `apps/quick-worker/src/index.ts`: HTTP JSON `GET /healthz`; `GET/POST /api/quick/accounts`; `GET/POST /api/quick/entries`.
- `apps/quick-worker/migrations/0001_quick_d1.sql`: tablas SQLite propias con relación compuesta `(account_id, owner_id, currency)`, validaciones CHECK, claves idempotentes e índices por propietario.
- `apps/quick-worker/wrangler.toml.example`: configuración deliberadamente incompleta y **ALLOW_WRITES=false**. No incluye cuenta ni D1 reales.
- `tests/quick-cloudflare-d1-e2e.mjs`: base SQLite real en memoria + Worker; usuarios sintéticos, Access omitido/incorrecto, same-origin, modificaciones repetidas, traspaso a inversiones, consulta aislada e intento de cuenta cruzada.

**Cloudflare D1 no implementa RLS como Supabase/PostgreSQL.** Por eso **cada** consulta SQL filtra con `owner_id` derivado exclusivamente del identificador estable de Cloudflare Access. Nunca se toma identidad desde la petición JSON, headers de identidad aportados por el navegador o parámetros de consulta. La cuenta D1 se vincula al Worker y no se expone mediante tokens al cliente.

La app protege `/api/quick/*` verificando `ctx.access`, su `aud` y `getIdentity().id`; las escrituras exigen `ALLOW_WRITES=true`, `Origin` exacto, JSON, límite de cuerpo y confirmación explícita. Un usuario autenticado no obtiene datos ajenos con identificadores conocidos. Una misma clave de registro con el mismo contenido no duplica gastos; con contenido cambiado responde conflicto. El dinero se maneja como minor units enteros seguros. No se transfieren fondos.

**El endpoint `/healthz` es un diagnóstico sin datos sensibles.** Las rutas financieras no pueden funcionar si falla Access, incluso si el Worker se desplegara sin la protección externa accidentalmente. No usar servicio durante pruebas con datos reales hasta revisión completa del despliegue.

## Checklist para el despliegue en una cuenta confirmada

1. Identificar la cuenta Cloudflare autorizada y confirmar que haya cuota suficiente. No reutilizar bases D1 o scripts ajenos.
2. Crear D1 **nueva**, nombre `finanzasoss-staging`. Verificar ID exacto. Esto requiere un conector de Cloudflare con permisos habilitados o una operación explícita del propietario en dashboard; **no se ha ejecutado**.
3. Copiar `wrangler.toml.example` a `wrangler.toml` (archivo local, no publicar IDs/credenciales sensibles); completar el `database_id` real, sin activar escrituras.
4. Aplicar migración con Wrangler, comprobando nombre/ID y que sea staging nuevo: `wrangler d1 migrations apply finanzasoss-staging --remote`. Revisar backup/restore. No ejecutar comando sobre base equivocada.
5. Crear Worker `finanzasoss-quick-staging` y activar Cloudflare Access para **todas** las rutas, restringido a personas de prueba. Obtener `ACCESS_AUD` real de esa aplicación y configurarlo; proteger también `workers.dev` y previews.
6. Desplegar Worker con escrituras deshabilitadas y comprobar `/healthz`, rutas privadas 401 sin Access y usuario falso/rechazado. Validar la identidad estable `id` retornada por `ctx.access.getIdentity()` y el AUD real.
7. Solo tras confirmar el gate anterior, habilitar escrituras de staging y probar `POST accounts`, `POST entries`, `GET entries`, reintentos, mismo ID con contenido cambiado, moneda incorrecta y dos usuarios separados sin datos reales.
8. Hacer copia de seguridad, exportación y borrado individual de datos, revisar privacidad, retención, disponibilidad y logs; después pasar a frontend Quick Q5.
9. Revisión de seguridad antes de un lanzamiento público: la simulación local no sustituye seguridad de Cloudflare Access, autenticación pública multiusuario, pruebas físicas, restauración, protección contra abuso ni revisión legal.

## Gasto y recursos

Cloudflare ofrece D1 en Workers Free con límites de capacidad y filas compartidos por cuenta. **No se activa ningún servicio pago**, ni se cambia el plan, ni se crean recursos nuevos desde GitHub. La documentación oficial de referencia es https://developers.cloudflare.com/d1/platform/pricing/.

## Estado de Q4

- **Q4.A** Supabase/PostgreSQL: contrato y SQL alternativos; no aplicados a servicio.
- **Q4.D1-A** Cloudflare: esquema, Worker, configuración segura y regresiones de SQLite/HTTP preparados; CI determina integración.
- **Q4.D1-B** Cuenta real, D1 creada y migrada, Access real y Worker desplegado: **pendiente**.
- **Q4.C** Historias de usuario extremo a extremo contra staging con login, guardar y recuperar datos: **pendiente**.
- **Q5** UI/widget: **pendiente**, nunca confundir PWA con widget nativo iOS.

El roadmap de producción fintech (Fase 15) sigue abierto; Fase 16 no se autodeclara completa.
