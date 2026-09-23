# Token Vault — FinanzasOSS

## Objetivo

Separar completamente el dominio financiero de cualquier secreto necesario para leer datos de un proveedor.

Finance Core conserva únicamente una referencia opaca (`secretReference`). Los secretos reales viven detrás de `TokenVault`.

## Scope obligatorio

Toda operación del vault requiere:

- `tenantId`
- `connectionId`

Esto evita resolver un secreto únicamente por conocer una referencia.

## Material soportado

### OAuth

`kind = oauth`

Puede contener:
- accessToken;
- refreshToken;
- tokenType;
- expiresAt;
- scopes.

### API key read-only

`kind = api_key`

Puede contener:
- apiKey;
- apiSecret;
- passphrase.

Una API secret puede ser necesaria para firmar endpoints **de lectura**; esto no significa que se autoricen trading o retiros.

## Material prohibido

El modelo no define y la validación runtime rechaza campos como:

- password;
- seed;
- mnemonic;
- privateKey.

FinanzasOSS nunca debe solicitar seed phrase/private key de una wallet.

Direcciones públicas no se guardan en TokenVault: son configuración pública de una conexión.

## Operaciones

`TokenVault` expone únicamente:

- put
- get
- rotate
- revoke

Todas requieren `VaultScope`.

La implementación productiva con KMS/secret manager corresponde al hardening posterior; esta fase fija el contrato.

## SecretReference

Es una referencia opaca branded. No contiene semántica que deba interpretar Finance Core.

La referencia tampoco se considera adecuada para logs abiertos; el redactor la trata como dato sensible por nombre de campo.

## Logging

`redactForLog()` recorre objetos y arrays recursivamente y oculta claves asociadas a:

- authorization;
- token;
- secret;
- apiKey;
- passphrase;
- passwords;
- seed/mnemonic/private key.

Nunca debe loggearse el objeto de secretos completo fuera de una ruta redactada.

## Regla futura de permisos

La fase 3.6 verificará que las credenciales de brokers/exchanges no tengan permisos de trading/retiro cuando el proveedor permita inspeccionarlos.
