# ADR 0002 — Límites del monorepo

## Estado
Aceptado

## Contexto
FinanzasOS debe integrar instituciones con APIs heterogéneas sin permitir que detalles bancarios contaminen la lógica de producto ni la UI.

## Decisión
El monorepo queda dividido por responsabilidad:

- `apps/web`: experiencia de usuario; nunca recibe secretos bancarios ni refresh tokens.
- `apps/api`: borde HTTP, sesiones, consentimiento, coordinación de casos de uso y jobs.
- `packages/finance-core`: dominio financiero normalizado y reglas puras; no conoce bancos concretos.
- `packages/connector-sdk`: contrato común de conectores, capacidades, estados y errores normalizados.
- `packages/security`: abstracciones de cifrado, token vault, redacción y políticas.
- `packages/database`: contratos de persistencia y mapeos; sin lógica de bancos.
- `packages/ui`: primitives visuales y motion tokens; sin acceso directo a datos bancarios.
- `packages/config`: configuración tipada y validación de entorno.

## Regla de dependencias
`web -> api contracts/ui`

`api -> finance-core/connector-sdk/security/database/config`

`connector implementations -> connector-sdk`

`finance-core` no depende de ningún conector, framework web ni proveedor.

## Consecuencia
Agregar un banco nuevo debe requerir un adapter nuevo, no cambios transversales en el dominio.
