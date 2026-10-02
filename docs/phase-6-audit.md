# Phase 6 audit — Nequi + DaviPlata

## Alcance auditado

- Discovery y política de acceso a Account Information.
- Gates read-only de Nequi y DaviPlata.
- Consentimiento, capabilities y HTTPS.
- Revocación inmediata de acceso.
- Reconciliación conservadora de transferencias internas con evidencia PSE.
- Separación estricta de `investment_transfer` frente a gasto y transferencias internas.

## Gates verificados

| Gate | Nequi | DaviPlata | PSE / Finance Core |
| --- | --- | --- | --- |
| Ruta oficial requerida | Fail-closed | Fail-closed | N/A |
| Consentimiento verificado | Requerido | Requerido | N/A |
| Capabilities explícitas | Requeridas | Requeridas | N/A |
| Endpoint HTTPS por capability | Requerido | Requerido | N/A |
| Revocación corta lecturas | Sí | Sí | N/A |
| Fixtures sin datos reales | Sí | Sí | Sí |
| PSE por sí solo auto-enlaza | N/A | N/A | No |
| Referencias PSE contradictorias | N/A | N/A | Rechazo fail-closed |
| `investment_transfer` contado como gasto | N/A | N/A | No |

## Limitaciones intencionales

Nequi y DaviPlata permanecen sin rutas productivas de Account Information configuradas mientras no exista una ruta oficial aplicable verificada con consentimiento y parámetros oficiales. Esta limitación es deliberada y no debe resolverse mediante screen scraping, credenciales bancarias del usuario ni endpoints inventados.

## Evidencia de pruebas

La suite normal incluye:

- `tests/nequi-account-information.mjs`
- `tests/daviplata-account-information.mjs`
- `tests/pse-transfer-reconciliation.mjs`
- `tests/phase-6-regression.mjs`

El cierre de Fase 6 requiere CI verde en el PR de 6.5 antes de integración.
