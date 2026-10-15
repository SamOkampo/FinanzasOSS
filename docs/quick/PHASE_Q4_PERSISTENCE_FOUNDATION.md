# FinanzasOSS Quick — Q4: persistencia segura (fundamentos, NO despliegue)

**Estado:** rama de implementación para staging con datos sintéticos. No aplicar automáticamente a una base existente, no introducir cuentas bancarias reales ni afirmar que el botón «Guardar» funciona en la web hasta que pase un E2E.

## Objetivo

Preparar un registro manual duradero y solo de gastos/transferencias **declarados por el usuario**, no un conector bancario. La categoría económica y el método de pago son distintos: `investment_transfer` no es gasto. La etiqueta del banco nunca prueba titularidad ni saldo real.

## Artefactos concretos

- `packages/database/migrations/0001_quick_personal.sql`: migración **destinada a Supabase/PostgreSQL** con `quick_manual_accounts` y `quick_manual_entries`, llaves foráneas compuestas por cuenta/tenant/usuario/moneda, constraints, RLS forzada, privilegios mínimos y RPC `quick_confirm_manual_entry`. No sustituye a la futura base completa del ledger.
- `packages/database/src/quick-entry-persistence.ts`: preparación de la llamada RPC desde identidad **obtenida y verificada por el backend**, no de campos aportados por el navegador. Convierte montos con `bigint` en cadena decimal para JSON; la confirmación explícita es obligatoria.
- `tests/quick-entry-persistence-q4.mjs`: pruebas de contrato, entrada manipulada, clasificación, duplicación, formato y controles estáticos. No representa una prueba real de Postgres.
- `tests/sql/quick-q4.sql` + workflow `quick-db-integration`: crea roles de prueba, simula identidades JWT usando valores ficticios y prueba la migración en PostgreSQL desechable, incluyendo inserción, repetición idempotente, payload alterado, prohibición de INSERT directo, RLS entre dos usuarios y acceso anónimo bloqueado. La simulación de JWT no constituye autenticación real de PostgREST.

## Modelo de confianza

1. El usuario inicia sesión mediante proveedor confiable; el backend verifica sesión y **deriva** `userId` y `tenantId` de un contexto de sesión confiable. Nunca usar `tenantId` ni `actorId` enviados en el cuerpo de una petición.
2. El usuario elige una cuenta **manual** creada por él (sin verificación bancaria); no permitir guardar sin `accountId` válido.
3. La app muestra el monto, moneda, método, cuenta, clasificación y fecha, y solicita confirmación explícita. El cliente genera una `clientEntryId` estable para reintentos.
4. Un adaptador de backend o cliente autenticado invoca `public.quick_confirm_manual_entry` usando el token validado del usuario, **nunca** una service-role key en la web. El servidor SQL deriva `auth.uid()`, valida pertenencia y moneda de la cuenta, confirma y escribe todo en una transacción.
5. Ante reintentos exactos devuelve el mismo ID (`replayed=true`), y ante cambio del payload con igual clave devuelve error sin cambiar ni duplicar el movimiento.
6. Consultas `SELECT` solo devuelven movimientos propios; por diseño no hay `UPDATE` ni `DELETE` directos del ledger.
7. Para exportación/borrado de datos personales, reversión contable, retención mínima, backups y restauración se requiere completar el diseño y validarlo antes de producción.

## Seguridad deliberadamente estricta

- La función SQL es `SECURITY DEFINER` con `search_path=''` y verificaciones explícitas de `auth.uid()`. Es un límite privilegiado que exige revisión antes de instalarse. No se otorga `INSERT` directo a `authenticated` para `quick_manual_entries`.
- Ninguna contraseña bancaria, API key de broker, token Gmail, secreto de Supabase ni dato financiero real se aloja en el repositorio.
- La política RLS no sustituye verificar JWT/OAuth en el servidor ni probar políticas con tokens reales de staging.
- Sin creación de transferencias, pagos, trading, o débitos automáticos. El registro es declarativo.

## Criterios de cierre de Q4 (pendientes)

- [ ] Elegir explícitamente un proyecto Supabase de **staging** para FinanzasOSS, sin tocar proyectos de otros negocios ni producción, y confirmar que aplicarlo no supondrá un gasto.
- [ ] Revisar/aplicar la migración en el staging correcto con credenciales de gestión fuera del navegador, comprobar rollback/backup.
- [ ] Implementar y conectar un endpoint/backend o cliente Supabase autenticado con identidad verificada, cuenta manual elegible y CSRF/sesión segura según el despliegue.
- [ ] Test funcional con al menos dos usuarios sintéticos: confirmar→guardar→consultar, reintento y cambio de payload; probar aislamiento ante IDOR, cuenta ajena, divisa incorrecta y sesión caducada.
- [ ] Revisar flujo de exportación/borrado, tratamiento de datos, observabilidad segura y recuperación.
- [ ] Solo después habilitar Q5: interfaz rápida y atajo desde iPhone.

**No se marca Q4 completada por una migración escrita o CI verde solamente.** Fase 15 fintech permanece abierta por sus requisitos externos y Fase 16 no está iniciada.
