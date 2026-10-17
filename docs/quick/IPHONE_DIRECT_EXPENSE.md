# FinanzasOSS Quick — Atajo directo de gastos sin cuentas

**Alcance:** staging privado protegido con Cloudflare Access. PR #174 abierto como borrador, sin fusionar a `main`. No ingresar movimientos reales hasta completar validaciones físicas y política de datos.

## Estado real verificado — 17 oct 2026 (Bogotá)

- [x] **Diseño corregido:** el usuario pidió **no exigir cuentas**. Los gastos del iPhone se guardan en `quick_shortcut_expenses` sin campo `account_id`, sin buscar/crear cuentas ficticias, sin bloquear tarjetas y billeteras por falta de cuentas.
- [x] **D1 staging** `finanzasoss-staging`: migración aditiva `0003_accountless_shortcut_expenses.sql` aplicada, índice comprobado, ninguna tabla antigua reconstruida. Bookmark de respaldo anterior: `00000016-00000000-00005107-a3bc59144f27601928c2a614ee3941eb`.
- [x] **Compilación y pruebas:** `npm run lint && npm run typecheck && npm test` aprobados en CI del PR y en workflow de construcción; contempla los seis métodos, aislamiento entre propietarios, deduplicación, reintentos históricos y un usuario con **cero cuentas**.
- [x] **Worker Cloudflare staging:** versión `a355b94c-db35-43a7-9e29-8f082e9e9d0a` (número 10), 100 % del tráfico del staging privado; compilación en GitHub rama PR #174, commit `79566cc971679d54243d511b75b11085849abe95`. Versión anterior para rollback: `58611aae-ee89-4ac1-8f14-dc42ef37a52f`.
- [x] **Protección intacta:** `ACCESS_AUD`, D1, `ALLOW_WRITES=true`, `ALLOW_SHORTCUT_WRITES=true`, Access owner policy y Service Auth restringida al único token del iPhone. Sigue habiendo credencial revocable del dispositivo; el endpoint rechaza peticiones sin token.
- [x] **Registros existentes conservados:** tras el despliegue, 1 cuenta manual, 3 movimientos históricos (incluido el gasto de $100 COP probado), 0 nuevos gastos sin cuenta y 1 dispositivo autorizado.
- [ ] **Prueba física de versión 10 en iPhone:** repetir una sola vez `Registrar Gasto Directo` con datos sintéticos, comprobar `entryId` y `replayed:false`, y consultar D1 para verificar cuenta no requerida. No pulsar ejecutar otra vez si falla sin comprobar el historial.

## Contrato de la API

`POST /api/quick/shortcut/expense` con cabeceras `CF-Access-Client-Id`, `CF-Access-Client-Secret`, `Authorization: Bearer fosq_...`; `Content-Type: application/json`.

Cuerpo JSON único:
```json
{
  "clientEntryId": "ios-20261017000000-123456",
  "amount": "100",
  "concept": "Prueba sin cuenta",
  "paymentMethod": "debit_card",
  "bankLabel": "Nequi de prueba"
}
```

**El Atajo no debe incluir `accountId` ni solicitar `Cuenta`.** Para `cash`, `digital_wallet` y `other`, `bankLabel` puede ser texto vacío `""` (normalizado a null en el backend). Para `debit_card`, `credit_card` y `bank_transfer`, el banco es obligatorio; es una etiqueta manual y no una conexión bancaria.

**Siempre se crea `purchase` / gasto.** Para transferencias entre cuentas propias hace falta un Atajo diferente, que no forma parte de esta API. Los movimientos no tienen saldo asignado a cuentas. El servidor determina el propietario por token y Access, no por parámetros enviados desde el teléfono.

Las nuevas entradas se insertan de forma atómica en la tabla `quick_shortcut_expenses` con índice único `(owner_id, client_entry_id)`. La API consulta claves antiguas en `quick_manual_entries` para reconocer reintentos anteriores sin duplicar. El historial usa UNION ALL, respeta el propietario y muestra los gastos del Atajo sin nombre de cuenta.

## Errores y seguridad

- Token Access faltante o inválido: Access bloquea antes de llegar al Worker.
- Token de dispositivo inválido, caducado o revocado: 401.
- `ALLOW_SHORTCUT_WRITES=false`: 503.
- Campos extra como `ownerId`, `classification` o `accountId`: 422.
- Tarjeta/transferencia sin banco, efectivo con banco o importe inválido: 422.
- Misma clave con datos distintos: 409.
- Misma clave y contenido válido: respuesta de idempotencia sin duplicar.
- Para evitar gastos duplicados, no reiniciar el Atajo ante un resultado de red incierto sin comprobar la base/historial. Mantener los secretos en el iPhone y nunca publicarlos en capturas ni repositorios.

## Rollback

Para detener envíos inmediatamente, aplicar `ALLOW_SHORTCUT_WRITES=false` en staging o revocar la credencial personal `fosq_...`. Para reversión de código, redeplegar `58611aae-ee89-4ac1-8f14-dc42ef37a52f`; esa versión solo conoce la tabla original, pero **no eliminar** `quick_shortcut_expenses` ni modificar los registros existentes. La versión de 2026-10-17 ya conserva un bookmark D1 anterior a la migración.

**Pendiente antes del uso real:** pruebas físicas completas en iPhone, confirmación del manejo de errores de Atajos, política de privacidad/retención/exportación y validación de seguridad. No afecta el Atajo original de Safari ni producción.
