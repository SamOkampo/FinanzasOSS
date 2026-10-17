# FinanzasOSS Quick — Registro de gastos directo desde Atajos (PROPUESTA STAGING)

**Estado:** implementación en PR, **NO** desplegada, **NO** habilitada. Requiere Cloudflare Access Service Auth, nueva migración D1, prueba física de iPhone y aceptación explícita antes del despliegue. Exclusivamente datos ficticios. No modifica el Atajo web anterior.

## Comportamiento

- `Registrar Gasto` se clasifica **siempre como `expense`** en el servidor, no acepta `classification` ni `ownerId` del móvil.
- Tres preguntas: monto COP, concepto, método. Se pregunta banco **solo** en débito/crédito/transferencia bancaria.
- **Sin pregunta de cuenta cada vez:** el backend elige una cuenta COP única compatible:
  - Efectivo: exactamente una cuenta `cash`.
  - Tarjeta débito / transferencia bancaria: exactamente una cuenta `bank_manual` o `wallet_manual` cuyo nombre de cuenta o `bank_label` coincida con el banco escrito.
  - Tarjeta crédito: exactamente una cuenta `credit_manual` cuyo nombre / `bank_label` coincida.
  - Billetera digital: una sola cuenta `wallet_manual`; Otro: una sola cuenta compatible entre todas.
  - **Si no hay coincidencia o hay varias: HTTP 409 y nada se guarda.** No asociar Nequi a «Efectivo de prueba».
- La fecha/hora la genera el servidor en UTC. Cada ejecución del Atajo genera un `clientEntryId` (UUID) nuevo. Reintentos con la **misma clave y mismos campos** devuelven el mismo registro sin duplicarlo, aunque el servidor tenga otra hora.
- Solo escribe en D1 mediante el binding privado del Worker y en el tenant vinculado al token, nunca desde parámetros del Atajo. La API de consulta y las cuentas siguen con Cloudflare Access humano.
- Respuesta JSON: `{ "entryId": "...", "replayed": false }` en 201, `replayed: true` en 200, errores 401/409/422/503. No declarar éxito si HTTP falla.

## Preparación obligatoria — operador de staging

1. Confirmar `main`, CI y backup/retención de la base **finanzasoss-staging**, no otra base. Aplicar `apps/quick-worker/migrations/0002_shortcut_devices.sql` *solo a esa D1*, después de 0001; verificar tabla e índice sin mostrar tokens.
2. Desplegar el Worker revisado en entorno privado **manteniendo** `ACCESS_AUD`, `DB`, `ALLOW_WRITES` y la política de un solo correo humano. El código está **apagado por defecto**: `ALLOW_SHORTCUT_WRITES` ausente o `false`.
3. Crear una **credencial Cloudflare Access Service Token dedicada a este Atajo** en Zero Trust → Access → Service credentials → Service Tokens, con caducidad corta. En la **misma aplicación de Access** que protege el Worker, añadir una política **Service Auth**, limitada únicamente a ese token, sin quitar la política de acceso humano existente. **Nunca** una regla Bypass, nunca «Any Access Service Token». Cloudflare Access validará `CF-Access-Client-Id` y `CF-Access-Client-Secret`; el Worker también exige `ctx.access.aud === ACCESS_AUD`.
4. Solamente tras comprobar la política y la migración, establecer `ALLOW_SHORTCUT_WRITES=true` en staging, comprobar que `GET /healthz` devuelve `shortcutsConfigured:true`, y ejecutar las pruebas negativas desde fuera (sin Service Token y sin token del dispositivo). Un `401` sin credenciales y que la web siga privada son obligatorios.
5. En Safari autenticado como el propietario, abrir FinanzasOSS y pulsar **Generar token para mi iPhone**. La acción está protegida por Access humano y `Origin` exacto. El token `fosq_...` aparece **una sola vez**. Solo se almacena su SHA-256 en D1. Caduca a los 90 días; una nueva vinculación revoca la anterior. El botón **Revocar acceso del iPhone** invalida todos los tokens del propietario.
6. No registrar información financiera real sin política de privacidad, exportación/borrado, copia y restauración, pruebas de tenant y seguridad de credenciales.

**Importante:** una política Service Auth en el mismo Access app puede otorgar paso por el perímetro a otras rutas de ese Worker. El handler de gasto **requiere adicionalmente el token revocable `fosq_...`** y el resto de las escrituras sigue limitado por `owner_id` y controles del servidor. Probar físicamente la identidad de Service Auth en `ctx.access`, y verificar que no se habilitan inadvertidamente lecturas de otro propietario. Si Access Service Auth no produce `ctx.access.aud` en esta configuración, **mantener deshabilitada la función** y revisar la arquitectura, nunca permitir bypass global.

## Modificar el Atajo existente del iPhone (solo después del despliegue)

Mantener `Cantidad`, `Concepto`, el menú `MetodoCodigo` y sus preguntas condicionales de banco. Eliminar la pregunta `¿Desde qué cuenta pagaste?`, así como la construcción de la URL y `Abrir URLs`. El método continúa con los códigos `cash`, `debit_card`, `credit_card`, `bank_transfer`, `digital_wallet`, `other`.

El cuerpo JSON necesita el nombre de banco **sin codificar**, no `BancoCodificado`. Conservar el valor original de `Solicitar entrada: ¿Qué banco es?` en una variable `BancoDirecto` dentro de las tres ramas; antes del menú inicializar `BancoDirecto` como Texto vacío. Se pueden conservar las otras variables durante la migración, pero no usarlas.

Añadir acción **Generar UUID** (UUID nuevo para cada gasto), guardarlo como `IdGasto`. Configurar **Obtener contenido de URL**:

- **URL:** `https://finanzasoss-quick-staging.socampoecheverry.workers.dev/api/quick/shortcut/expense`
- **Método:** `POST`
- **Encabezados:** `CF-Access-Client-Id: <ID DE SERVICE TOKEN>`; `CF-Access-Client-Secret: <SECRETO DE SERVICE TOKEN>`; `Authorization: Bearer <TOKEN PERSONAL fosq_...>`; `Content-Type: application/json`.
- **Cuerpo de solicitud:** JSON, con las claves exactas `clientEntryId` = variable `IdGasto`; `amount` = variable `Cantidad` (texto `25000`); `concept` = variable `Concepto`; `paymentMethod` = variable `MetodoCodigo`; `bankLabel` = variable `BancoDirecto` (vacío con efectivo).
- **Notificación de éxito:** únicamente si la API responde HTTP 200/201 con `entryId`. En caso de error, enseñar error y **consultar historial antes de repetir**, para no crear un UUID nuevo y duplicar un registro de resultado incierto.

**Los secretos del Access Service Token y el token revocable quedan visibles en la configuración de Atajos** y pueden sincronizarse vía iCloud. No compartir/exportar el Atajo con esos secretos. Si pierdes el móvil, revocar ambos tipos de credenciales. No son contraseñas bancarias ni credenciales de administrador de Cloudflare.

## Verificación de integración antes de habilitar

- [ ] Tests de CI y build del Worker pasan; migración aplicada exactamente en D1 staging.
- [ ] Sin Access Service Auth: rechazado por Cloudflare, incluida la URL directa.
- [ ] Sin bearer personal, con bearer revocado, con bearer caducado: 401.
- [ ] `ALLOW_SHORTCUT_WRITES` no habilitado: 503, no escrituras.
- [ ] Métodos tarjeta/transferencia exigen banco, efectivo lo prohíbe.
- [ ] «Efectivo de prueba» resuelve a `cash` único; «Nequi de prueba» necesita cuenta propia `wallet_manual` o `bank_manual`.
- [ ] No hay inferencia ambigua de cuenta ni entrada en D1 en esos casos.
- [ ] Misma clave y datos: replay sin duplicar; misma clave con datos cambiados: 409.
- [ ] Siempre `purchase`/gasto, no `transfer`/inversión.
- [ ] Historial de la sesión humana muestra el registro del mismo propietario.
- [ ] iPhone físico con Wi-Fi y datos móviles: muestra éxito solo cuando D1 persiste.
- [ ] Reversión: `ALLOW_SHORTCUT_WRITES=false`, revocar credenciales y mantener flujo web anterior.

## Transferencias propias

Se implementarán en **un Atajo separado**, con selección explícita de dos cuentas y clasificación `own_transfer`, nunca mezcladas con gastos automáticos. No se incluye un endpoint de transferencia en este cambio.
