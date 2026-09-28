# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 5.5 — Tests y fixtures** (`8ea4356`).
- Bloque completado en esta rama: **Fase 6.1 — Discovery Open Finance y acceso como tercero para Nequi + DaviPlata**.
- Próximo bloque exacto tras CI verde e integración: **Fase 6.2 — Nequi adapter**.

## 6.1 completado

- Discovery oficial documentado para Nequi y DaviPlata.
- Las superficies públicas verificadas permanecen orientadas principalmente a pagos/negocios y no se tratan como acceso de account-information del consumidor.
- La arquitectura permanece fail-closed: no se inventan endpoints, scopes, certificados ni parámetros de Open Finance.
- No se usa screen scraping ni se reutilizan APIs de pagos como sustituto de agregación autorizada.
- 6.2 y 6.3 deben permanecer `unavailable` por defecto hasta verificar una ruta oficial aplicable de account-information.

## Gate siguiente

No iniciar 6.2 hasta que esta rama pase CI y 6.1 se integre en `main`. Mantener producción, pagos, transferencias, trading, retiros, credenciales bancarias y datos financieros reales fuera de alcance.
