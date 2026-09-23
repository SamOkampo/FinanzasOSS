# ADR 0001 — Arquitectura connector-first

## Estado
Aceptado

## Decisión
FinanzasOS usará un `FinancialConnector` común y adaptadores por institución/proveedor. El Finance Core nunca dependerá de nombres o esquemas propios de un banco.

## Prioridad de conexión
1. API oficial/Open Finance con consentimiento.
2. Proveedor agregador autorizado.
3. Importación de extractos/CSV como fallback explícito.
4. Gmail solo como fuente auxiliar, nunca como fuente única de verdad.

## Prohibiciones
- No guardar usuario/contraseña bancaria.
- No screen scraping de banca web.
- No acciones de movimiento de dinero en el MVP.
