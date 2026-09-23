# Portafolios e inversiones

## Objetivo
Dar una vista separada de inversiones sin romper el ledger patrimonial. Bancos y portafolios son superficies distintas de UX, pero comparten un modelo de movimientos para que un aporte hacia un broker/exchange no parezca gasto.

## Regla central
Un movimiento `Banco -> Broker/Exchange/Wallet` es una **transferencia patrimonial** (`investment_transfer`), no un gasto. Cuando ambos lados están conectados, FinanzasOS empareja el débito bancario con el depósito de inversión. Si solo está conectado el banco, queda como transferencia pendiente de reconciliación; cuando llega el extracto/API del broker se completa el match.

## Proveedores iniciales

### Binance
- Conector oficial mediante API de usuario.
- MVP: balances, trades, depósitos/retiros cuando el alcance oficial lo permita.
- Usar claves de **solo lectura**; nunca habilitar trading ni retiros para FinanzasOS.
- Secretos backend-only en Token Vault.

### Interactive Brokers
- Conector oficial mediante Web API.
- MVP: cuentas, posiciones, balances/actividad disponible, y conciliación de depósitos.
- FinanzasOS será read-only aunque el API permita funciones de trading.

### Hapi
- No se asume una API pública de usuario.
- MVP por estado de cuenta mensual oficial (PDF) y confirmaciones/reportes disponibles para el usuario.
- El importador extrae posiciones, compras, ventas, dividendos, depósitos/retiros y saldos para reconciliación.
- Si Hapi publica una API oficial apta para terceros, se implementará un adapter directo sin cambiar Finance Core.

### Wallets on-chain
- Conexión por **dirección pública** cuando sea técnicamente apropiado.
- Nunca solicitar seed phrase ni private key.
- El adapter puede usar RPC/indexadores para balance y actividad; el usuario verifica propiedad de forma separada si fuera necesario.

## Modelo
- `Portfolio`: agrupación lógica de una o varias cuentas de inversión.
- `Asset`: activo normalizado (acción, ETF, cripto, bono, fondo, etc.).
- `Position`: tenencia actual por cuenta/activo.
- `InvestmentActivity`: compra, venta, depósito, retiro, dividendo, interés, fee, impuesto, transferencia.
- `PortfolioSnapshot`: valor total en un instante, separado de aportes/retiros.
- `investment_transfer`: movimiento del ledger de efectivo que cambia la ubicación del patrimonio, no el consumo.

## Métricas
Separar siempre:
1. **Aportes netos**: dinero nuevo aportado menos retiros.
2. **Valor de mercado**: cuánto vale hoy el portafolio.
3. **Ganancia/pérdida no realizada**.
4. **Ganancia/pérdida realizada**.
5. **Dividendos/intereses**.
6. **Fees/impuestos**.
7. **Rendimiento**: no confundir crecimiento por aportes con retorno de inversión.

Cuando exista suficiente historial se soportarán TWR y XIRR/IRR para mostrar rendimiento sin atribuir depósitos al mercado.

## UX: sección Portafolios
Pantalla independiente con:
- valor total de inversiones;
- aportes netos del mes/año;
- variación de mercado separada de aportes;
- distribución por broker/exchange/wallet, activo, clase, moneda y sector cuando haya datos;
- posiciones y costo base;
- actividad reciente;
- dividendos/intereses;
- efectivo sin invertir cuando el proveedor lo exponga;
- salud de conexión y fecha de última sincronización.

## Concordancia con Movimientos
En `Movimientos` una transferencia a inversiones se muestra como:

`Davivienda  →  Hapi  ·  Aporte a portafolio  ·  $200.000`

No descuenta el presupuesto de consumo. Sí reduce el efectivo disponible y aumenta el capital aportado al portafolio cuando el lado destino se confirma.

## Funciones de ayuda
- meta mensual de aporte por portafolio;
- recordatorio de aporte si se acerca la fecha habitual y no hay movimiento conciliado;
- alerta si un depósito bancario quedó sin match en el broker;
- alerta por conexión vencida o sync incompleto;
- resumen mensual de aportes, retiros, rendimiento y fees;
- detección de concentración y deriva respecto a una asignación objetivo configurada por el usuario;
- proyección de metas basada en aportes configurados y escenarios explícitos, nunca como garantía;
- historial de patrimonio total combinando efectivo + inversiones.

## Límites del asistente
FinanzasOS puede explicar, medir y advertir. En el MVP no ejecuta compras, ventas, retiros ni transferencias. Las sugerencias de aportes deben respetar liquidez, obligaciones y fondo protegido definidos por el usuario; no se presenta un activo específico como compra obligatoria.
