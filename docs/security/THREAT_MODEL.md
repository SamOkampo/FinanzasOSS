# Threat Model — FinanzasOS

## Activos críticos
- Tokens de acceso/refresh de conexiones financieras.
- Consentimientos y su alcance.
- Identidad del usuario y sesiones.
- Saldos, cuentas y movimientos.
- Historial de auditoría.
- Claves de cifrado y secrets de integraciones.

## Adversarios considerados
- Atacante remoto no autenticado.
- Usuario autenticado intentando acceder a otro tenant.
- Cuenta de usuario comprometida.
- Proveedor externo comprometido o respuesta maliciosa.
- Dependencia vulnerable/supply-chain.
- Error interno de programación o configuración.

## Amenazas prioritarias

### T1 — Robo de tokens financieros
**Impacto:** crítico.

Mitigaciones: vault backend-only, cifrado en reposo, secretos fuera del repo, no logs, rotación/revocación, scopes mínimos y sandbox por defecto.

### T2 — BOLA/IDOR entre usuarios
**Impacto:** crítico.

Mitigaciones: `TenantContext` server-derived obligatorio, repositories tenant-scoped, tests negativos y RLS/segunda barrera en producción.

### T3 — OAuth callback forgery / CSRF
**Impacto:** alto.

Mitigaciones: `state`, PKCE cuando aplique, nonce cuando aplique, redirect URI exacto, expiración corta y single-use intents.

### T4 — Webhook spoofing/replay
**Impacto:** alto.

Mitigaciones: firmas/mTLS según proveedor, timestamp/replay window, idempotency key, dedupe y nunca confiar en webhook como autorización.

### T5 — Duplicación/corrupción de transacciones
**Impacto:** alto.

Mitigaciones: upsert por external ID, fingerprint fallback, cursor transaccional, reconciliación y pruebas de retries.

### T6 — SSRF a través de conectores/importaciones
**Impacto:** alto.

Mitigaciones: hosts allowlisted por connector, sin URLs arbitrarias de usuario, límites de redirect y egress policy en producción.

### T7 — XSS/filtración en descripciones bancarias
**Impacto:** alto.

Mitigaciones: texto tratado como datos, escaping por defecto, CSP, no renderizar HTML de proveedores y sanitización de exports.

### T8 — Archivo de extracto malicioso
**Impacto:** alto.

Mitigaciones: límites de tamaño/tipo, parsing aislado, nunca ejecutar macros, antivirus/sandbox cuando corresponda, eliminación de temporales y validación estricta.

### T9 — Exposición en observabilidad
**Impacto:** alto.

Mitigaciones: logging estructurado con allowlist, redacción de tokens/cuentas, no payloads crudos por defecto y retention limitada.

### T10 — Supply-chain
**Impacto:** alto.

Mitigaciones: lockfile, Dependabot/actualizaciones controladas, mínimo número de dependencias, pinning de Actions y revisión de scripts postinstall.

### T11 — Acción financiera no autorizada
**Impacto:** crítico.

Mitigación principal: el MVP no implementa iniciación de pagos ni trading/retiros. Cualquier futura capacidad de escritura requerirá threat model y autorización de producto independientes.

### T12 — Robo de credenciales de inversión
**Impacto:** crítico.

Mitigaciones: preferir OAuth; API keys solo read-only; nunca seed phrase/private key; secretos en Token Vault; validación explícita de que no exista permiso de trading o withdrawal antes de activar el connector.

## Security gates antes de datos reales
- [ ] OAuth/consent flows con pruebas de state/PKCE.
- [ ] Token Vault productivo con KMS/secret manager.
- [ ] Tenant isolation tests.
- [ ] Webhook verification/replay tests.
- [ ] Secret scanning + dependency scanning.
- [ ] Logs revisados para PII/secrets.
- [ ] Data retention/delete flow.
- [ ] Revisión jurídica y requisitos de tercero receptor.
- [ ] Validación read-only para brokers/exchanges.
- [ ] Pentest antes de producción.
