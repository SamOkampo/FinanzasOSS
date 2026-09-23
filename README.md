# FinanzasOSS

Sistema financiero personal colombiano orientado a Open Finance: agrega bancos, billeteras y portafolios en un ledger patrimonial único, con conectores modulares, normalización de movimientos y experiencia premium.

## Principios
- APIs oficiales y consentimiento primero.
- Nunca almacenar credenciales bancarias, seed phrases o private keys.
- Brokers/exchanges en modo read-only: FinanzasOSS no ejecuta trading ni retiros en el MVP.
- Conectores modulares por institución/proveedor.
- Normalización, deduplicación y detección de transferencias propias en el Finance Core.
- Los aportes a inversiones son `investment_transfer`, no gasto de consumo.
- Portafolios es una sección separada, pero concilia con Movimientos y Patrimonio.
- UI original, móvil-first, accesible y no genérica.
- No usar datos reales ni pasar a producción bancaria sin autorización explícita.

## Workspace
- `apps/web`: frontend y espacios Hoy/Movimientos/Portafolios/Plan/Mapa
- `apps/api`: API/backend
- `packages/finance-core`: ledger, cuentas, transacciones, portafolios y reglas
- `packages/connector-sdk`: contrato común para bancos/brokers/exchanges/wallets
- `packages/database`: esquemas/persistencia
- `packages/security`: cifrado, tokens, consentimientos
- `packages/ui`: design system
- `docs`: roadmap, arquitectura, portafolios, ADRs y threat model

## Estrategia de integración
1. Open Finance/OAuth oficial.
2. API key oficial estrictamente read-only.
3. Agregador autorizado.
4. Dirección pública para wallets on-chain.
5. Estados de cuenta/imports seguros cuando no haya API.

Ver `docs/ROADMAP.md` y `docs/PORTFOLIOS.md`.
