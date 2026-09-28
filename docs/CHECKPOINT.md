# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.1 — Discovery Open Finance y acceso como tercero para Nequi + DaviPlata** (`640c961`).
- Fase 6.1 integrada correctamente mediante PR #29 con CI verde.
- Próximo bloque exacto: **Fase 6.2 — Nequi adapter**.

## 6.1 integrado

- Discovery oficial documentado para Nequi y DaviPlata.
- Las superficies públicas verificadas permanecen orientadas principalmente a pagos/negocios y no se tratan como acceso de account-information del consumidor.
- La arquitectura permanece fail-closed: no se inventan endpoints, scopes, certificados ni parámetros de Open Finance.
- No se usa screen scraping ni se reutilizan APIs de pagos como sustituto de agregación autorizada.
- 6.2 y 6.3 deben permanecer `unavailable` por defecto hasta verificar una ruta oficial aplicable de account-information.

## Gate siguiente

Fase 6.1 está cerrada. El siguiente bloque permitido es únicamente **6.2 — Nequi adapter**. Mantener producción, pagos, transferencias, trading, retiros, credenciales bancarias y datos financieros reales fuera de alcance.
