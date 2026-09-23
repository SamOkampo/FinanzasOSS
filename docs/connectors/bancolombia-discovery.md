# Bancolombia — Open Banking discovery (Fase 4.1)

Fecha de verificación: 2026-09-23.

## Objetivo

Determinar qué capacidades oficiales de Bancolombia son aptas para el agregador read-only de FinanzasOSS antes de implementar OAuth/consentimiento o cualquier adapter.

## Hallazgos verificados

Fuentes oficiales consultadas:

- Centro de Ayuda APIs Bancolombia — Glosario Open Banking: https://soportedevs.bancolombia.com/hc/es-419/articles/27226064517652-Glosario-Open-Banking
- Acceso a Sandbox: https://soportedevs.bancolombia.com/hc/es-419/articles/12467698138388--C%C3%B3mo-solicito-el-ingreso-a-Sandbox
- Crear aplicación y suscribir productos: https://soportedevs.bancolombia.com/hc/es-419/articles/20282606269204--C%C3%B3mo-crear-tu-aplicaci%C3%B3n-y-suscribirla-a-nuestros-productos-de-APIs
- Limitación de API de validación de titularidad: https://soportedevs.bancolombia.com/hc/es-419/articles/14564107863060--Esta-API-me-permite-consultar-informaci%C3%B3n-de-una-cuenta

Bancolombia define el rol AISP como el tercero autorizado para acceder, con permiso del usuario, a información de cuentas y transacciones. Por tanto, para FinanzasOSS la integración objetivo debe ser de información de cuenta/consentimiento y no de iniciación de pagos.

El portal oficial dispone de Sandbox y exige crear una aplicación y suscribir productos API para obtener credenciales de prueba. El acceso al Sandbox puede requerir aprobación previa.

La API pública de validación de titularidad localizada durante el discovery **no** entrega estado, saldos ni movimientos; únicamente valida que un cliente sea titular de una cuenta. No debe confundirse con una API de Account Information.

## Matriz de decisión

| Capacidad FinanzasOSS | Estado discovery | Decisión |
| --- | --- | --- |
| Consentimiento/AISP | Modelo oficial documentado | `candidate` |
| Descubrimiento de cuentas | Endpoint/producto exacto no confirmado públicamente | `blocked_pending_catalog_access` |
| Saldos | Endpoint/producto exacto no confirmado públicamente | `blocked_pending_catalog_access` |
| Transacciones | Endpoint/producto exacto no confirmado públicamente | `blocked_pending_catalog_access` |
| Validación de titularidad | API oficial identificada | `not_sufficient_for_aggregation` |
| Iniciación de pagos | Fuera del alcance read-only | `forbidden` |
| Screen scraping | No requerido ni permitido por arquitectura | `forbidden` |

## Gate para Fase 4.2

No implementar OAuth/consentimiento contra endpoints inventados o inferidos. Fase 4.2 solo puede conectar código real cuando el producto oficial de Account Information aplicable, sus scopes, endpoints, requisitos de consentimiento y credenciales Sandbox hayan sido confirmados en el catálogo/portal oficial autorizado.

Hasta entonces, cualquier trabajo de 4.2 debe limitarse a contratos/configuración segura sin secretos y fixtures sintéticos; jamás usar credenciales bancarias del usuario, screen scraping ni datos financieros reales.

## Resultado 4.1

Discovery cerrado con una conclusión conservadora: existe el marco AISP y Sandbox oficial, pero el producto/endpoints públicos concretos para cuentas, saldos y transacciones no quedaron verificables desde documentación pública abierta. El adapter Bancolombia permanece fail-closed para esas capacidades hasta confirmar el catálogo autorizado.
