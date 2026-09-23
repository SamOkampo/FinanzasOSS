# Arquitectura de FinanzasOS

## Objetivo
Unificar cuentas, movimientos y portafolios mediante consentimiento, APIs oficiales, conectores read-only, agregadores autorizados y formatos de extracto como fallback, sin almacenar credenciales de banca en línea ni llaves capaces de mover activos.

## Flujo de datos
1. El usuario inicia una conexión desde `apps/web`.
2. `apps/api` crea `Connection + ConsentIntent` o el flujo read-only equivalente y obtiene el mecanismo del conector.
3. La institución/proveedor autentica o autoriza fuera del dominio de FinanzasOS cuando aplique.
4. Tokens/API secrets read-only se guardan backend-only mediante `TokenVault`; direcciones públicas no se tratan como secretos.
5. `SyncEngine` solicita cuentas, saldos, transacciones, posiciones y/o actividad según las capacidades del conector.
6. El adapter normaliza respuestas al Finance Core.
7. Persistencia tenant-scoped hace upsert idempotente.
8. Transfer Matcher relaciona movimientos entre cuentas propias, incluidos aportes y retiros de inversión.
9. La UI consulta únicamente modelos sanitizados de FinanzasOS.

## Trust boundaries
- Navegador ↔ API de FinanzasOS.
- API ↔ banco/broker/exchange/indexador.
- API ↔ Token Vault/KMS.
- API/jobs ↔ base de datos.
- Importador de archivos ↔ parser aislado.

## Principios no negociables
- Read-only en MVP.
- Cero passwords bancarios en FinanzasOS.
- Cero seed phrases/private keys.
- Cero tokens/secretos en navegador.
- Cero movimientos de dinero o trading automáticos.
- Aislamiento tenant explícito en cada capa.
- Logs minimizados y redactados.
- Sandboxes antes de producción cuando existan.

## Connector strategy
Cada institución implementa `FinancialConnector`. El SDK expresa capacidades y modo de acceso para que la aplicación no prometa funciones que una entidad no soporta.

Prioridad:
1. API oficial/Open Finance/OAuth.
2. API key oficial configurada read-only.
3. Agregador autorizado.
4. Dirección pública para wallets on-chain, sin llaves privadas.
5. Extractos CSV/XLSX/OFX/PDF como fallback.
6. Gmail solo como señal auxiliar y reconciliación, nunca como ledger principal.

## Investment strategy
Bancos y Portafolios comparten ledger patrimonial. `investment_transfer` evita que un aporte a Hapi/Binance/IBKR se compute como consumo. Posiciones, compras/ventas, dividendos y snapshots viven en el dominio de inversiones y se vinculan con el ledger por `linkedTransactionId`/`transferGroupId`.

## Sync strategy
Sincronización incremental basada en cursores + idempotency keys. Los webhooks disparan trabajo, pero no se consideran una garantía de entrega única. Los providers sin API se actualizan mediante imports versionados y reconciliables.

## UI boundary
`apps/web` jamás conoce secretos, payloads crudos del proveedor ni claves de cifrado. Solo usa DTOs sanitizados de cuentas, balances, movimientos, portafolios e insights.
