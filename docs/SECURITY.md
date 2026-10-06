# Security baseline

## Datos sensibles
- Passwords bancarios: nunca se reciben ni almacenan.
- Tokens OAuth/Open Finance: solo backend, cifrados en reposo, rotables y revocables.
- Secrets: exclusivamente secret manager/env seguro; nunca repo ni frontend.

## Controles mínimos
- TLS en tránsito.
- Cifrado de secretos/tokens en reposo.
- mTLS cuando el proveedor lo requiera.
- CSRF/XSS/SSRF/rate-limit baselines.
- Idempotencia para webhooks y sincronizaciones.
- Audit log para consentimientos y conexiones.
- Separación estricta por usuario/tenant.

## Reglas de desarrollo
- Sandbox por defecto.
- Sin datos financieros reales hasta autorización explícita.
- Sin cargos/servicios pagos sin autorización explícita.


## Phase 13.3 request hardening
- Rate limits fail closed with server-derived keys.
- State-changing requests require session-bound CSRF + exact allowed Origin.
- Provider content is treated as escaped text; raw provider HTML is prohibited.
- Outbound connector URLs require HTTPS + exact verified-origin allowlist and reject local/private targets.
- Redirects require revalidation; production DNS/egress enforcement remains mandatory.
