# Development checkpoint

## Estado actual

- Último bloque completado: **Fase 4.1 — Discovery/productos Open Banking aplicables de Bancolombia**.
- Rama: `docs/phase-4-1-bancolombia-discovery`.
- Próximo bloque exacto: **Fase 4.2 — OAuth/consent sandbox**.

## 4.1 completado

- Verificado el marco oficial AISP/PSU de Bancolombia para acceso consentido a información de cuenta.
- Verificado el flujo oficial de acceso a Sandbox y suscripción de productos API.
- Confirmado que la API pública de validación de titularidad identificada no expone saldos, movimientos ni estado de cuenta y no sirve por sí sola como agregador.
- No se inventaron endpoints/scopes de Account Information que no estén públicamente confirmados.
- Cuentas, saldos y transacciones permanecen fail-closed hasta confirmar producto, scopes y endpoints en el catálogo/portal oficial autorizado.
- Iniciación de pagos y screen scraping quedan explícitamente fuera del adapter read-only.

## Gate

No avanzar a 4.2 hasta que este PR pase CI y se integre en main. En 4.2 no conectar contra endpoints inferidos: usar únicamente configuración oficial verificada, sin secretos en el repositorio y sin datos financieros reales.
