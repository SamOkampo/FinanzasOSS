# FinanzasOSS Studio — límites personales de gastos (staging)

## Comportamiento
- Cuatro presupuestos independientes y configurables en Plan: diario, semanal, mensual y anual. Moneda COP, importes enteros de $1 a $1.000.000.000 por período.
- No hay cifras predeterminadas: comienzan en «Sin límite».
- Períodos según America/Bogota: día 00:00–23:59, semana lunes–domingo, mes natural, año natural. Sin arrastres ni multiplicación automática.
- Totales calculados en servidor sobre quick_manual_entries y quick_shortcut_expenses (Atajos incluidos), únicamente gastos tipo purchase, moneda COP. Excluye transferencias, inversiones, USD y bancos no conectados.
- Semáforo: menos de 80% normal, desde 80% precaución, 100% agotado y sobre 100% superado.
- Avisos suaves. Nunca se bloquea un gasto por exceder el presupuesto; se mantiene idempotencia y revisión antes de registrar.
- Inicio resume los límites; en Plan se editan. La privacidad oculta los montos; no se almacenan finanzas en caché local.
- Push de presupuesto no activado; el Push genérico anterior permanece con envíos desactivados.

## Seguridad
- Nueva tabla owner-scoped quick_spending_limits, PRIMARY KEY(owner_id,period); migración aditiva 0007_spending_limits.sql.
- GET /api/quick/budgets: límites y gastado por período, Cache-Control no-store/private.
- POST /api/quick/budgets: period (day/week/month/year) y amountCOP como entero en texto; null quita exclusivamente ese límite.
- Cloudflare Access, protección de origen, JSON estricto y limitaciones de escritura. Ningún owner_id es aceptado del navegador.
- No cambia movimientos, cuentas, dispositivos Push, autenticaciones ni bancos.

## Publicación y QA
1. Mantener secuencia PR #174 → #175 → #176 → PR de presupuestos.
2. Guardar bookmark D1 antes de aplicar la migración 0007; verificar cuentas y movimientos intactos.
3. CI y bundle revisado del commit exacto, staging único, conservar bindings y ALLOW_PUSH_SEND=false.
4. Probar en PWA iPhone: Plan → configurar los cuatro importes → guardar → registrar gasto ficticio → comprobar progresos → quitar una meta.
5. Revisar cambios al comenzar una semana/mes/año, exclusión de movimientos no-gasto y privacidad.
