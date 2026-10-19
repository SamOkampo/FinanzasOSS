# FinanzasOSS Studio — edición y borrado discreto de movimientos

## Alcance
- Cada fila de Movimientos tiene `Editar` (para compras en COP) y una papelera gráfica pequeña, accesible mediante área táctil de al menos 40–44 px.
- Editor para monto, concepto, método de pago y nombre del banco solo si corresponde; revisa cambios antes de confirmarlos.
- Borrado individual con confirmación nativa explícita. Se conserva el registro internamente (`deleted_at`) para auditoría básica e idempotencia de Atajos, pero queda oculto del historial activo y de totales/presupuestos.
- Registros manuales con cuenta histórica conservan su `account_id` intacto. No se requiere asociar una cuenta nueva. Transferencias e inversiones no se pueden editar en este formulario simplificado, aunque pueden ocultarse con confirmación.

## API y compatibilidad
- Migración aditiva 0008: `revision` inicial 0, `edited_at`, `deleted_at` en tablas manual y accountless.
- POST `/api/quick/studio/movement/change` con operación `edit` o `delete`, `source`, UUID, revisión esperada y confirmación; identidad obtenida exclusivamente de Access. Sin autenticación de dispositivo vía Atajos para editar/borrar.
- Revisión optimista incrementada atómicamente, 409 para conflicto/reintento, y 404 para registros ajenos. Nunca se envían IDs de owner o cuenta para mutar.
- Totales de inicio, períodos, historial, API `/entries`, estadísticas y límites excluyen soft deletes; cambios de importe actualizan agregados naturalmente.
- No se modifica SW, secretos VAPID, banco real, cron ni producción. No se borran filas en esta implementación.

## QA
1. Ejecutar todos los tests incluida prueba D1 owner A/B, revisiones, borrado, sumas, JSON no confiable, CSRF y JS parseable.
2. Validar bookmark previo y aplicar migración 0008 solo en `finanzasoss-staging`, con respaldo recuperable.
3. Verificar bundle revisado, conservar bindings Access/D1/VAPID con `ALLOW_PUSH_SEND=false`, desplegar con referencia de rollback.
4. Prueba física iPhone: Movimientos > Editar (guardar cambio) > validar cifras y límites; pulsar papelera pequeña > cancelar > confirmar en un gasto ficticio; constatar que desaparece sin afectar otros.
5. Antes de permitir movimiento de información real, definir flujo de rectificación/auditoría más completo, soporte exportación, y reglas de retención.
