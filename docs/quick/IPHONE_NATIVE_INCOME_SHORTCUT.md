# Atajo nativo de iPhone «Registrar ingreso» · FinanzasOSS v37

Este atajo **no abre un formulario web**. El iPhone muestra todas las preguntas usando acciones de Apple Atajos y luego realiza un POST JSON con la autenticación del Atajo existente **Registrar Gasto**.

## Preparación (desde iPhone)
1. En **Atajos**, mantener presionado **Registrar Gasto**, pulsar **Duplicar** y renombrar la copia **Registrar ingreso**. No enviar ni exportar la copia: contiene credenciales privadas.
2. Conservar las acciones originales que generan el **UUID de entrada**, y los encabezados de autenticación de **Obtener contenido de URL**: `Authorization`, `CF-Access-Client-Id`, `CF-Access-Client-Secret`, además del formato de **cuerpo JSON** y `Content-Type: application/json`.
3. Reutilizar **Pedir entrada** «¿Cuánto recibiste?» (Texto, COP entero sin separadores) → variable `Cantidad`; **Pedir entrada** «¿De quién o por qué recibiste el dinero?» → variable `Concepto`. No es necesario preguntar una «cuenta manual».
4. Inicializar variable `BancoDirecto` a texto vacío. Crear menú «¿Cómo recibiste el dinero?» con estas ramas:
   - **Transferencia bancaria** → Texto `bank_transfer` → `MetodoCodigo`; Pedir entrada «¿A qué banco llegó?» → `BancoDirecto`.
   - **Billetera digital** → Texto `digital_wallet` → `MetodoCodigo`; Pedir entrada «¿A qué billetera llegó?» → `BancoDirecto`.
   - **Efectivo** → Texto `cash` → `MetodoCodigo`; `BancoDirecto` vacío.
   - **Otro** → Texto `other` → `MetodoCodigo`; `BancoDirecto` vacío.
5. Crear segundo menú «¿Qué tipo de ingreso recibiste?» con ramas que asignan la variable `CategoriaCodigo`:
   - **Pago recibido** → `payment`
   - **Salario** → `salary`
   - **Venta** → `sales`
   - **Comisión** → `commission`
   - **Intereses ganados** → `interest`
   - **Devolución** → `refund`
   - **Otros ingresos** → `other`
6. Opcionalmente antes del POST, usar **Mostrar alerta** para revisar monto, concepto y medio (si se cancela, detener el atajo). Generar o conservar un UUID estable por intento. No generar otro UUID si se reintenta una petición de respuesta incierta.
7. En **Obtener contenido de URL**, cambiar **solo** la dirección del endpoint de gastos por:
   `https://finanzasoss-quick-staging.socampoecheverry.workers.dev/api/quick/shortcut/income`
   Método: **POST**; cuerpo: **JSON** con las siguientes claves (usar variables mágicas):

| Clave JSON | Valor en Atajos | Tipo |
| --- | --- | --- |
| `clientEntryId` | UUID generado por el Atajo, por ejecución | Texto |
| `amount` | `Cantidad` | Texto, solo dígitos |
| `concept` | `Concepto` | Texto |
| `paymentMethod` | `MetodoCodigo` | Texto |
| `bankLabel` | `BancoDirecto` | Texto; vacío para efectivo/otro |
| `incomeCategory` | `CategoriaCodigo` | Texto |

No agregar `confirmed`, `owner_id` ni valores bancarios inventados al JSON del Atajo. El endpoint seguro `/api/quick/shortcut/income` valida que el dispositivo esté autorizado, que el monto sea positivo y que el destino exista en casos de transferencia y billetera.

8. Leer el resultado de **Obtener contenido de URL** y verificar la clave `entryId`: solo con `entryId` no vacío mostrar «Ingreso registrado correctamente». Si la petición falla, mostrar error y evitar afirmar que se guardó.

## Seguridad y contabilidad
- Mantener el Atajo de gasto original: **no** editar su URL ni sus credenciales; solo modificar la copia.
- **No** guardar tokens ni encabezados en documentos compartidos, enlaces, QR o capturas públicas.
- Las llamadas directas requieren Cloudflare Access Service Auth + el token revocable `Bearer fosq_...` previamente configurado en el Atajo de gasto. El Atajo no debe llevar esos datos en parámetros URL.
- El backend de FinanzasOSS v37 guarda ingresos en `quick_income_entries`. Son **créditos positivos** y no se restan de los gastos.
- El abono existente de **$10.168 COP** en Plata Pay ya está identificado en la misma fila como ingreso real, `economic_purpose='income'`; no enviarlo otra vez por el Atajo.
- Si aparece un error de autenticación, corregir las credenciales del Atajo original o el permiso de dispositivo en FinanzasOSS; **no** crear políticas Cloudflare Access Bypass.

## Prueba controlada
Usar primero un ingreso de prueba con datos ficticios si se dispone de un entorno aislado de ensayo. En el perfil con movimientos reales, no crear ingresos ficticios. Tras el primer ingreso real, confirmar que aparece en el historial con signo **+** y que la suma de gastos no cambia.

Verificaciones del servidor: `tests/quick-income-shortcut.mjs` y el workflow CI del PR #196.
