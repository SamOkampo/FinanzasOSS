# Connector SDK

Contrato normalizado para bancos, billeteras, brokers, exchanges y wallets. Cada adapter declara capabilities y un modo de acceso; el Finance Core nunca conoce detalles propios del proveedor.

## MVP read-only

El SDK del MVP solo expone capacidades de lectura:

- accounts
- balances
- transactions
- positions
- investment_activities
- portfolio_snapshots

`payments` y acciones monetarias no forman parte de `ConnectorCapability`.

Todo `ConnectorDescriptor` debe declarar:

- connectorId
- institutionId
- displayName
- version
- environment
- accessMode
- capabilities
- `dataAccess = read_only`

## Access modes

Se reutilizan los modos canónicos del Finance Core:

- open_finance_oauth
- oauth
- read_only_api_key
- public_address
- aggregator
- statement_import

Esto evita que el SDK y el dominio mantengan enums distintos.

## Contrato

Todo conector:
- expone accounts;
- implementa healthCheck;
- implementa únicamente métodos correspondientes a capabilities declaradas;
- puede implementar consentimiento/revocación si el proveedor lo requiere;
- devuelve modelos normalizados, nunca payloads crudos como contrato público.

`validateConnectorContract()` verifica en runtime que descriptor y métodos concuerden.

## Errores

`ConnectorError` normaliza:
- AUTH
- CONSENT
- RATE_LIMIT
- UPSTREAM
- INVALID_RESPONSE
- UNSUPPORTED
- CONFIGURATION

Puede incluir `retryAfterMs` y `providerCode` sin filtrar secretos.

## Entornos

- sandbox
- production
- local_import

Que exista el valor `production` en el tipo no autoriza a FinanzasOSS a usar APIs productivas. El acceso productivo sigue bloqueado por las fases y controles del roadmap.


## Capability matrix

La matriz se deriva de los `ConnectorDescriptor`; no existe una segunda lista manual por banco.

`buildConnectorCapabilityMatrix()` produce una fila por `connectorId + environment` con flags para:

- accounts
- balances
- transactions
- positions
- investment_activities
- portfolio_snapshots

Dos descriptores con el mismo connectorId y environment son inválidos. El mismo connectorId sí puede coexistir en sandbox y production.

`findConnectorsSupporting()` permite buscar conectores que cumplan un conjunto de capacidades, opcionalmente filtrando por entorno.

La UI y el backend deben consultar esta matriz en vez de asumir que todas las instituciones exponen los mismos recursos.
