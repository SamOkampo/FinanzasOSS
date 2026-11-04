# FinanzasOSS Quick · préstamos y Atajo del iPhone

## Qué cambia
El registro económico distingue **consumo** de **devolución de un préstamo**. La salida de dinero se conserva en el historial y no debe sumarse al presupuesto de compras. La tabla append-only antigua se mantiene y las respuestas se siguen aislando por perfil.

## Atajo instalado
Los Atajos existentes **siguen funcionando sin cambios**, porque el servidor interpreta la ausencia de `movementType` como `expense`. Si registras una devolución con el Atajo anterior, escribe un concepto explícito como **«Pago de préstamo de una amiga»**. No uses «Transferencia» sin contexto.

Para activar el selector en tu Atajo de Apple:
1. Abre el Atajo en el iPhone y, antes de enviar el JSON, agrega un menú **«Tipo de movimiento»** con dos opciones: **Compra/gasto** y **Devolución de préstamo**.
2. Guarda respectivamente los valores exactos `expense` y `debt_repayment` en la variable `movementType`.
3. Añade al diccionario JSON que ya se envía a `/api/quick/shortcut/expense` la clave `movementType`, vinculada a esa variable.
4. Conserva sin cambios el token del Atajo, las cabeceras Cloudflare Access Service Auth, la clave `clientEntryId`, el monto, el método de pago y el banco. **No compartas capturas con secretos.**
5. Prueba primero con un dato ficticio y confirma que aparece en revisión como **Deudas y obligaciones** y no como gasto de consumo.

El servidor añadirá al concepto la indicación **«Pago de préstamo:»** solo cuando el usuario seleccione explícitamente `debt_repayment`, sin inventar destinatario ni cambiar el importe. La capa económica lo separa de gastos. Las categorías específicas están listas para el panel de staging actualizado.

## Captura desde la PWA
En el formulario de agregar movimiento se habilita el selector **Tipo de salida de dinero**. Elige «Devolución de préstamo (no es consumo)» cuando corresponda. En la confirmación se identifica como devolución y no se muestra un aviso de límite de compras.

## Verificación
- Ejecutar `npm run ci` sobre la rama; tests de clasificación, multitenancy, QA móvil y compatibilidad.
- Publicar **solo en staging** mediante bundle revisado, preservando Access, D1, Push y las versiones de rollback.
- Verificar en iPhone físico y con datos ficticios; **no se modifica un Atajo instalado desde GitHub**.
- Ningún movimiento anterior se reescribe automáticamente.
