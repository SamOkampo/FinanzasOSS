# FinanzasOSS · cierre técnico de 5 prioridades · 2026-11-04

> Entorno **staging privado**, NO certificación financiera productiva. No fusionar a main ni afirmar bancos conectados sin autorización de las entidades.

## 1. IA, categorías y flujo económico
- La fuente de entrada es el concepto escrito por la persona (Qwen + reglas conservadoras).
- Un préstamo devuelto queda separado de consumo y una transferencia sin finalidad comprobada requiere confirmación; no cambian importes del ledger.
- El perfil revisado pasó de 24 registros sin clasificación a 0 sin clasificación tras un backfill de reglas en D1. Las reglas provisionales NO reemplazan la confirmación del usuario.
- Restan 21 sugerencias a revisar (recuento de 2026-11-04). Qwen se limita a 5 lotes por día y perfil. Nunca saltarse la cuota para completar una tarea.
- No registrar 'categoría confirmada' si solo es una sugerencia automática.

## 2. Atajo y notificaciones iPhone
- El endpoint de Atajos reconoce datos anteriores y el nuevo `movementType` opcional.
- Un dispositivo autorizado existe, y una suscripción Push existe para el perfil principal en D1.
- El flag `ALLOW_PUSH_SEND` permanece desactivado; no afirmar entrega de push ni activarlo sin prueba física. El receptor debe probar permiso, notificación con la PWA cerrada y entrega fallida/duplicada.
- GitHub CI puede probar Swift-like payloads y reglas; **no simula físicamente iOS con permisos del usuario**.

## 3. Cuatro entidades y conciliación
- Se incluye Plata Pay entre los nombres sugeridos junto a Davivienda, Daviplata, Bancolombia y Lulo.
- Se añade un informe privado de gastos etiquetados por entidad (consumo únicamente; excluye deuda/transferencias sin confirmar; no crea saldos).
- No se infieren cuentas propias desde transferencias sin prueba explícita.
- NO existen conectores productivos automáticos a las cuatro entidades; usar importaciones revisadas y confirmar movimientos duplicados antes de incorporar.

## 4. Rendimientos y cashback
- Simulador local, con tasa E.A. ingresada por el usuario, saldo, días y gasto realmente elegible.
- Fórmula de rendimiento `saldo*((1+tasa/100)^(dias/365)-1)`, antes de retenciones.
- Cashback estimado = `compras elegibles*tasa/100`; no se afirma que el comercio cumpla su MCC ni que exista cashback acreditado.
- Este simulador no persiste saldos; no es un registro de intereses/cashback realmente cobrados. Conciliación automática de recompensas sigue pendiente.

## 5. Seguridad y recuperación
- Access, segregación por propietario, VAPID/AI/D1 y cuotas existentes permanecen intactos.
- Consultado un bookmark de Time Travel de D1 antes de cambios. Un bookmark es recuperación de ventana limitada, no respaldo indefinido.
- Prueba SQLite de creación/lectura/restauración con usuarios sintéticos y verificación de integridad; **no ejecuta restore destructivo en D1 real**.
- Mantener versión previa para rollback. Ninguna versión de producción o de `main` se altera en este flujo.
- Pentest independiente, backup externo cifrado y QA físico iPhone son gates pendientes. No inferirlos de CI verde.

## Salida verificable
- Ejecutar lint, typecheck, secretos, dependencias, pruebas SQLite de clasificación, QA del Atajo, Web Push y nuevo informe por banco; aprobar CI antes de desplegar staging.
- Probar URL privada con Access desde dispositivo autorizado; sin token de usuario no se puede realizar la prueba de navegador real.
