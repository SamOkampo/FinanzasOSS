# ADR 0006 — Dominio financiero normalizado

## Estado
Aceptado

## Decisión
El Finance Core trabajará con un esquema independiente de proveedores.

### Principios
- Dinero se representa en minor units enteros + código ISO de moneda.
- `direction` distingue entrada/salida; el signo del importe no será la única fuente de verdad.
- `status` distingue `pending`, `posted`, `reversed`.
- La descripción cruda se conserva separada de merchant/categoría normalizados.
- Transferencias entre cuentas propias se marcan como transferencias y no como gasto/ingreso económico.
- Datos del proveedor se minimizan; un `rawProviderPayload` no será requisito del dominio.

## Consecuencia
La UI y la inteligencia financiera consumen el mismo esquema, independientemente de Bancolombia, Davivienda, Nequi o un importador CSV.
