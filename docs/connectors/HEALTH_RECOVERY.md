# Connector health y recuperación

## Objetivo

Distinguir claramente problemas de autenticación, consentimiento, proveedor y sincronización para que FinanzasOSS muestre una acción correcta al usuario.

## Estados

- `connected`: conexión utilizable.
- `degraded`: conexión parcialmente utilizable o temporalmente limitada.
- `auth_required`: autenticación/credencial debe renovarse.
- `consent_expired`: consentimiento debe renovarse.
- `api_down`: proveedor/API no disponible.
- `syncing`: sincronización activa.

## Health report

Un conector devuelve:

- state;
- checkedAt;
- detail opcional;
- retryAfterMs opcional.

`checkedAt` debe ser una fecha válida y retryAfterMs no puede ser negativo.

## Recovery plan derivado

FinanzasOSS deriva la acción:

| Estado | Acción | Automática | Usuario |
|---|---|---:|---:|
| connected | none | no | no |
| syncing | wait | sí | no |
| degraded | retry | sí | no |
| api_down | retry | sí | no |
| auth_required | reauthorize | no | sí |
| consent_expired | renew_consent | no | sí |

La acción no se persiste dentro del estado para evitar combinaciones contradictorias.

## ConnectorError → health

- AUTH → auth_required
- CONSENT → consent_expired
- RATE_LIMIT → degraded
- UPSTREAM → api_down
- INVALID_RESPONSE → degraded
- CONFIGURATION / UNSUPPORTED → degraded

## Sync eligibility

`connectorCanSync()` permite sync en:

- connected
- degraded

No inicia sync normal en:
- auth_required
- consent_expired
- api_down
- syncing

El scheduler deberá usar este modelo antes de lanzar jobs automáticos cuando exista health actualizado.

## UX

Ejemplos:

**auth_required**
> Tu conexión con Bancolombia necesita que vuelvas a autorizar el acceso.

**consent_expired**
> El permiso para consultar movimientos venció. Renueva el consentimiento.

**api_down**
> Davivienda no está respondiendo en este momento. Tus datos anteriores siguen disponibles.

No mostrar “error de conexión” genérico cuando el estado sea conocido.
