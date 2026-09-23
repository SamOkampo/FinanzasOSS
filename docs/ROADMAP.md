# Roadmap FinanzasOSS

## Fase 0 — Fundación
- [x] 0.1 Scaffold inicial del monorepo y principios de seguridad
- [x] 0.2 ADRs de arquitectura
- [x] 0.3 Threat model
- [x] 0.4 CI real: lint, typecheck, test, build

## Fase 1 — Identidad visual y UX
- [x] 1.1 Lenguaje visual propio
- [x] 1.2 Motion system
- [x] 1.3 Navegación y superficies translúcidas
- [x] 1.4 Mobile-first y accesibilidad
- [x] 1.5 Portafolios como espacio primario; Perfil/Conexiones/Ajustes pasan a navegación secundaria

## Fase 2 — Finance Core
- [x] 2.1 Entidades financieras base: tenant, institution, connection, consent, account, balance, transaction
- [x] 2.2 Transaction schema universal + categorías/tipos patrimoniales
- [x] 2.3 Dedupe y fingerprints
- [ ] 2.4 Transfer matching entre cuentas propias
- [ ] 2.5 Investment transfer matching: banco ↔ broker/exchange/wallet
- [ ] 2.6 Portfolio domain: Portfolio, Asset, Position, InvestmentActivity, PortfolioSnapshot
- [ ] 2.7 Métricas: aportes netos vs rendimiento, realized/unrealized P&L, income/fees/tax

## Fase 3 — Connector SDK
- [ ] 3.1 Contrato de conectores + access modes
- [ ] 3.2 Token vault abstraction
- [ ] 3.3 Capability matrix: accounts/balances/transactions/positions/activities/snapshots
- [ ] 3.4 Sync engine incremental e idempotente
- [ ] 3.5 Health states y reconexión
- [ ] 3.6 Read-only enforcement para brokers/exchanges

## Fase 4 — Bancolombia sandbox
- [ ] 4.1 Discovery/productos Open Banking aplicables
- [ ] 4.2 OAuth/consent sandbox
- [ ] 4.3 Cuentas/saldos
- [ ] 4.4 Transacciones
- [ ] 4.5 Normalización/revocación/errores
- [ ] 4.6 Tests y fixtures

## Fase 5 — Davivienda sandbox
- [ ] 5.1 Registro y auth sandbox
- [ ] 5.2 Consentimiento
- [ ] 5.3 Cuentas/saldos/transacciones
- [ ] 5.4 Normalización/reconexión
- [ ] 5.5 Tests y fixtures

## Fase 6 — Nequi + Daviplata
- [ ] 6.1 Discovery Open Finance y acceso como tercero
- [ ] 6.2 Nequi adapter
- [ ] 6.3 Daviplata adapter
- [ ] 6.4 Reconciliación PSE/transferencias internas
- [ ] 6.5 Tests

## Fase 7 — Cobertura bancaria Colombia
- [ ] 7.1 Matriz API oficial/agregador/import por institución
- [ ] 7.2 Lulo Bank
- [ ] 7.3 Pibank
- [ ] 7.4 RappiPay/RappiCard según acceso disponible
- [ ] 7.5 Nu Colombia
- [ ] 7.6 BBVA Colombia
- [ ] 7.7 Banco de Bogotá / Grupo Aval
- [ ] 7.8 Scotiabank Colpatria / Itaú / Caja Social / Falabella y cobertura extendida

## Fase 8 — Universal Import Engine
- [ ] 8.1 CSV/XLSX/OFX
- [ ] 8.2 PDF en parser aislado
- [ ] 8.3 Detección de institución/formato
- [ ] 8.4 Mapeo y preview antes de persistir
- [ ] 8.5 Imports incrementales e idempotentes
- [ ] 8.6 Reconciliación con API/Gmail sin duplicados

## Fase 9 — Portafolios, brokers, exchanges y wallets
- [ ] 9.1 UX Portafolios + modelos de agregación patrimonial
- [ ] 9.2 Binance read-only: balances/trades/depósitos-retiros según API oficial
- [ ] 9.3 Interactive Brokers Web API read-only: accounts/positions/activity
- [ ] 9.4 Hapi statement adapter: PDFs oficiales + confirmaciones/reportes
- [ ] 9.5 Wallets on-chain por dirección pública; jamás seed/private key
- [ ] 9.6 Otros brokers/exchanges mediante adapters (solo fuentes oficiales/autorizadas)
- [ ] 9.7 Contribution matcher mensual banco ↔ inversión
- [ ] 9.8 Portfolio snapshots e historial
- [ ] 9.9 Cost basis/P&L/dividendos/fees/impuestos cuando la fuente lo permita
- [ ] 9.10 TWR/XIRR y separación estricta de rendimiento vs aportes

## Fase 10 — Inteligencia financiera y asistente
- [ ] 10.1 Merchant normalization y categorización
- [ ] 10.2 Personal vs negocio
- [ ] 10.3 Subscription detector
- [ ] 10.4 Spending anomalies y cash-flow forecast
- [ ] 10.5 Safe-to-spend con reservas/obligaciones
- [ ] 10.6 Contribution Planner: monto disponible para aportar sin tratarlo como garantía
- [ ] 10.7 Alertas de aporte mensual faltante, duplicado o no conciliado
- [ ] 10.8 Alertas de conexión/sync/import incompleto
- [ ] 10.9 Concentración y drift vs asignación objetivo definida por el usuario
- [ ] 10.10 Resumen mensual patrimonio + consumo + inversión

## Fase 11 — Dashboard patrimonial
- [ ] 11.1 Patrimonio total: efectivo + crédito + inversiones
- [ ] 11.2 Cash flow y presupuesto
- [ ] 11.3 Portafolios separados por proveedor y consolidados
- [ ] 11.4 Calendario financiero/aportes recurrentes
- [ ] 11.5 Metas y progreso
- [ ] 11.6 Historial de patrimonio y fuentes de cambio

## Fase 12 — Experiencia premium
- [ ] 12.1 Auditoría design system anti-plantilla IA
- [ ] 12.2 Motion/morphing/microinteracciones
- [ ] 12.3 Glass/material system con privacidad de saldos
- [ ] 12.4 Mobile gestures y PWA
- [ ] 12.5 Dark/light/system + reduced motion
- [ ] 12.6 Loading/empty/error states propios
- [ ] 12.7 Rendimiento y accesibilidad

## Fase 13 — Hardening seguridad fintech
- [ ] 13.1 Encryption/token vault/secret rotation
- [ ] 13.2 OAuth/state/PKCE/mTLS según proveedor
- [ ] 13.3 Rate limits/CSRF/XSS/SSRF
- [ ] 13.4 Audit log/consent ledger
- [ ] 13.5 Data export/delete
- [ ] 13.6 Pentest checklist y dependency scanning
- [ ] 13.7 Enforcement: ninguna credencial con permiso de trading/retiro en adapters read-only

## Fase 14 — Multiusuario
- [ ] 14.1 Onboarding y aislamiento por tenant
- [ ] 14.2 Multiple connections/portfolios
- [ ] 14.3 Consent management
- [ ] 14.4 Billing/planes preparado, sin activación automática
- [ ] 14.5 Administración/soporte seguro

## Fase 15 — Producción fintech (requiere autorización explícita)
- [ ] 15.1 Accesos productivos/acuerdos/certificados
- [ ] 15.2 Revisión jurídica y tratamiento de datos
- [ ] 15.3 Infra productiva y observabilidad
- [ ] 15.4 Pentest externo y readiness
- [ ] 15.5 Go-live gradual por connector

## Fase 16 — Auditoría final
- [ ] 16.1 Backend/API/DB/security
- [ ] 16.2 Finance Core y reconciliación contable/patrimonial
- [ ] 16.3 Conectores bancarios e inversión
- [ ] 16.4 CI/E2E/chaos/error recovery
- [ ] 16.5 Responsive/accesibilidad/performance
- [ ] 16.6 Defectos visuales: overlap/overflow/z-index/modal/loading
- [ ] 16.7 Revisión final roadmap y criterios de lanzamiento


---

# Post-MVP — expansión después de cerrar Fase 16

> **Gate obligatorio:** estas fases NO forman parte del MVP y no deben ejecutarse automáticamente. La automatización debe detenerse al cerrar y auditar la Fase 16 hasta recibir autorización explícita para iniciar Post-MVP.

## Fase 17 — Motor de reglas y automatización financiera
- [ ] 17.1 Reglas personalizadas: comercio/categoría/cuenta/proyecto
- [ ] 17.2 Reglas recurrentes y excepciones
- [ ] 17.3 Auto-reconciliation explicable con undo
- [ ] 17.4 Smart inbox financiero: movimientos que requieren decisión
- [ ] 17.5 Alertas contextuales configurables
- [ ] 17.6 Detección de cambios de comportamiento y gastos atípicos
- [ ] 17.7 Automatizaciones sugeridas, nunca acciones monetarias silenciosas

## Fase 18 — Forecast financiero y simulador de decisiones
- [ ] 18.1 Forecast de caja 7/30/90 días
- [ ] 18.2 Calendario de obligaciones, ingresos y aportes esperados
- [ ] 18.3 Escenarios “qué pasa si” para compras, ahorro, deuda e inversión
- [ ] 18.4 Stress test personal ante caída de ingresos o gasto extraordinario
- [ ] 18.5 Probabilidad/rango de cumplimiento de metas con supuestos visibles
- [ ] 18.6 Explicación de qué variables cambian el resultado

## Fase 19 — Finanzas compartidas / hogar
- [ ] 19.1 Espacios personales y compartidos
- [ ] 19.2 Pareja/familia con permisos granulares
- [ ] 19.3 Gastos compartidos y split inteligente
- [ ] 19.4 Metas conjuntas
- [ ] 19.5 Presupuesto del hogar sin perder privacidad individual
- [ ] 19.6 Conciliación de cuentas/tarjetas compartidas y titulares distintos

## Fase 20 — Modo negocio / emprendedor
- [ ] 20.1 Separación automática personal vs negocio con revisión humana
- [ ] 20.2 Proyectos/centros de costo
- [ ] 20.3 Flujo de caja por negocio
- [ ] 20.4 Ingresos, gastos, margen y burn rate
- [ ] 20.5 Reglas para reembolsos/gastos mixtos
- [ ] 20.6 Export contable/tributario compatible con flujos externos
- [ ] 20.7 Dashboard consolidado persona + negocios sin mezclar contabilidades

## Fase 21 — Crédito y deuda
- [ ] 21.1 Tarjetas, créditos y obligaciones como entidades de primer nivel
- [ ] 21.2 Intereses, cuotas, fechas y costo efectivo
- [ ] 21.3 Calendario de deuda
- [ ] 21.4 Simulador de pagos anticipados
- [ ] 21.5 Comparación de estrategias de amortización sin decidir por el usuario
- [ ] 21.6 Alertas de utilización, pagos y variaciones de tasa/costo cuando haya datos

## Fase 22 — Inteligencia patrimonial avanzada
- [ ] 22.1 Asset allocation consolidada multi-broker
- [ ] 22.2 Exposición por moneda, país, sector y clase de activo
- [ ] 22.3 Look-through cuando existan datos fiables de fondos/ETFs
- [ ] 22.4 Riesgo de concentración y correlación
- [ ] 22.5 Rebalance simulator contra una asignación objetivo del usuario
- [ ] 22.6 Benchmark configurable y attribution básica
- [ ] 22.7 Escenarios de drawdown sin predicciones de mercado

## Fase 23 — Asistente financiero explicable
- [ ] 23.1 Chat grounded únicamente en el ledger y datos autorizados
- [ ] 23.2 Cada insight debe mostrar “por qué te lo digo”
- [ ] 23.3 Preguntas naturales: “¿en qué se me fue la plata?”
- [ ] 23.4 Memoria financiera controlada por el usuario
- [ ] 23.5 Acciones sugeridas con preview y confirmación
- [ ] 23.6 Sin trading/pagos autónomos en esta fase
- [ ] 23.7 Evaluación anti-alucinación y trazabilidad de cálculos

## Fase 24 — Documentos y bóveda financiera
- [ ] 24.1 Facturas, recibos, extractos y contratos asociados a movimientos
- [ ] 24.2 Búsqueda semántica segura
- [ ] 24.3 Detección de cobros/renovaciones desde documentos
- [ ] 24.4 Historial documental por activo/cuenta/proveedor
- [ ] 24.5 Retención, cifrado y eliminación configurables
- [ ] 24.6 Export completo del usuario

## Fase 25 — Finanzas Abiertas ampliadas
- [ ] 25.1 Adaptarse a estándares obligatorios que publique la SFC
- [ ] 25.2 Seguro: pólizas, primas, coberturas y vencimientos cuando el ecosistema lo permita
- [ ] 25.3 Productos de crédito y portabilidad de información autorizada
- [ ] 25.4 Integración progresiva con nuevos participantes/directorio oficial
- [ ] 25.5 Consent Center unificado para todos los dominios
- [ ] 25.6 Data portability y revocación completa

## Fase 26 — Plataforma / ecosistema
- [ ] 26.1 Connector marketplace con adapters firmados/revisados
- [ ] 26.2 SDK público limitado y seguro
- [ ] 26.3 Webhooks y API para integraciones del usuario
- [ ] 26.4 Plugin architecture aislada
- [ ] 26.5 Developer portal y sandbox propio
- [ ] 26.6 Auditoría de permisos/capabilities por integración

## Fase 27 — Ejecución financiera opcional (solo tras revisión jurídica y de riesgo)
- [ ] 27.1 Diseñar por separado pagos/iniciación con strong customer authentication
- [ ] 27.2 Preview completo antes de cualquier acción
- [ ] 27.3 Límites, allowlists, step-up auth y antifraude
- [ ] 27.4 Nunca habilitar trading/retiros como extensión accidental de conectores read-only
- [ ] 27.5 Auditoría independiente y autorización explícita antes de producción
