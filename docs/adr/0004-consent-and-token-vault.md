# ADR 0004 — Consentimiento y Token Vault

## Estado
Aceptado

## Decisión
FinanzasOS separará la conexión lógica de una institución de las credenciales/tokens que habilitan acceso.

### Connection
Guarda metadatos no secretos: institución, usuario, estado, capacidades, timestamps y referencia opaca al secreto.

### Consent
Registra propósito, scopes/capacidades, fechas de creación/expiración/revocación y evidencia mínima exigida por el proveedor.

### Token Vault
Interfaz backend-only que permite `put`, `get`, `rotate` y `revoke` usando referencias opacas. Ningún token OAuth/Open Finance se devuelve al frontend ni se persiste en texto plano.

## Reglas
- PKCE/state/nonce cuando el flujo lo requiera.
- Refresh tokens con cifrado envelope/KMS en producción.
- Revocación inmediata al desconectar o retirar consentimiento.
- Nunca loggear Authorization headers, client secrets o payloads con tokens.
- El MVP es read-only: no scopes de iniciación de pagos.
