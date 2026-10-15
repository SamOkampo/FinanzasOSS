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
- [x] 2.4 Transfer matching entre cuentas propias
- [x] 2.5 Investment transfer matching: banco ↔ broker/exchange/wallet
- [x] 2.6 Portfolio domain: Portfolio, Asset, Position, InvestmentActivity, PortfolioSnapshot
- [x] 2.7 Métricas: aportes netos vs rendimiento, realized/unrealized P&L, income/fees/tax

## Fase 3 — Connector SDK
- [x] 3.1 Contrato de conectores + access modes
- [x] 3.2 Token vault abstraction
- [x] 3.3 Capability matrix: accounts/balances/transactions/positions/activities/snapshots
- [x] 3.4 Sync engine incremental e idempotente
- [x] 3.5 Health states y reconexión
- [x] 3.6 Read-only enforcement para brokers/exchanges

## Fase 4 — Bancolombia sandbox
- [x] 4.1 Discovery/productos Open Banking aplicables
- [x] 4.2 OAuth/consent sandbox
- [x] 4.3 Cuentas/saldos — contrato/gate fail-closed listo; endpoints reales siguen bloqueados hasta verificación oficial
- [x] 4.4 Transacciones — contrato/gate read-only fail-closed; endpoints reales siguen bloqueados hasta verificación oficial
- [x] 4.5 Normalización/revocación/errores
- [x] 4.6 Tests y fixtures

## Fase 5 — Davivienda sandbox
- [x] 5.1 Registro y auth sandbox — discovery oficial documentado; parámetros/endpoints detallados permanecen fail-closed hasta verificación en catálogo autenticado
- [x] 5.2 Consentimiento — gate fail-closed integrado; parámetros reales permanecen bloqueados hasta verificación oficial
- [x] 5.3 Cuentas/saldos/transacciones — gate read-only fail-closed integrado; endpoints reales permanecen bloqueados hasta verificación oficial
- [x] 5.4 Normalización/reconexión — errores provider-neutral y recuperación segura integrados
- [x] 5.5 Tests y fixtures

## Fase 6 — Nequi + Daviplata
- [x] 6.1 Discovery Open Finance y acceso como tercero
- [x] 6.2 Nequi adapter
- [x] 6.3 Daviplata adapter
- [x] 6.4 Reconciliación PSE/transferencias internas
- [x] 6.5 Tests

## Fase 7 — Cobertura bancaria Colombia
- [x] 7.1 Matriz API oficial/agregador/import por institución
- [x] 7.2 Lulo Bank
- [x] 7.3 Pibank
- [x] 7.4 RappiPay/RappiCard según acceso disponible
- [x] 7.5 Nu Colombia
- [x] 7.6 BBVA Colombia
- [x] 7.7 Banco de Bogotá / Grupo Aval
- [x] 7.8 Scotiabank Colpatria / Itaú / Caja Social / Falabella y cobertura extendida

## Fase 8 — Universal Import Engine
- [x] 8.1 CSV/XLSX/OFX
- [x] 8.2 PDF en parser aislado
- [x] 8.3 Detección de institución/formato
- [x] 8.4 Mapeo y preview antes de persistir
- [x] 8.5 Imports incrementales e idempotentes
- [x] 8.6 Reconciliación con API/Gmail sin duplicados

## Fase 9 — Portafolios, brokers, exchanges y wallets
- [x] 9.1 UX Portafolios + modelos de agregación patrimonial
- [x] 9.2 Binance read-only: balances/trades/depósitos-retiros según API oficial
- [x] 9.3 Interactive Brokers Web API read-only: accounts/positions/activity
- [x] 9.4 Hapi statement adapter: PDFs oficiales + confirmaciones/reportes
- [x] 9.5 Wallets on-chain por dirección pública; jamás seed/private key
- [x] 9.6 Otros brokers/exchanges mediante adapters (solo fuentes oficiales/autorizadas)
- [x] 9.7 Contribution matcher mensual banco ↔ inversión
- [x] 9.8 Portfolio snapshots e historial
- [x] 9.9 Cost basis/P&L/dividendos/fees/impuestos cuando la fuente lo permita
- [x] 9.10 TWR/XIRR y separación estricta de rendimiento vs aportes

## Fase 10 — Inteligencia financiera y asistente
- [x] 10.1 Merchant normalization y categorización
- [x] 10.2 Personal vs negocio
- [x] 10.3 Subscription detector
- [x] 10.4 Spending anomalies y cash-flow forecast
- [x] 10.5 Safe-to-spend con reservas/obligaciones
- [x] 10.6 Contribution Planner: monto disponible para aportar sin tratarlo como garantía
- [x] 10.7 Alertas de aporte mensual faltante, duplicado o no conciliado
- [x] 10.8 Alertas de conexión/sync/import incompleto
- [x] 10.9 Concentración y drift vs asignación objetivo definida por el usuario
- [x] 10.10 Resumen mensual patrimonio + consumo + inversión

## Fase 11 — Dashboard patrimonial
- [x] 11.1 Patrimonio total: efectivo + crédito + inversiones
- [x] 11.2 Cash flow y presupuesto
- [x] 11.3 Portafolios separados por proveedor y consolidados
- [x] 11.4 Calendario financiero/aportes recurrentes
- [x] 11.5 Metas y progreso
- [x] 11.6 Historial de patrimonio y fuentes de cambio

## Fase 12 — Experiencia premium
- [x] 12.1 Auditoría design system anti-plantilla IA
- [x] 12.2 Motion/morphing/microinteracciones
- [x] 12.3 Glass/material system con privacidad de saldos
- [x] 12.4 Mobile gestures y PWA
- [x] 12.5 Dark/light/system + reduced motion
- [x] 12.6 Loading/empty/error states propios
- [x] 12.7 Rendimiento y accesibilidad

## Fase 13 — Hardening seguridad fintech
- [x] 13.1 Encryption/token vault/secret rotation
- [x] 13.2 OAuth/state/PKCE/mTLS según proveedor
- [x] 13.3 Rate limits/CSRF/XSS/SSRF
- [x] 13.4 Audit log/consent ledger
- [x] 13.5 Data export/delete
- [x] 13.6 Pentest checklist y dependency scanning
- [x] 13.7 Enforcement: ninguna credencial con permiso de trading/retiro en adapters read-only

## Fase 14 — Multiusuario
- [x] 14.1 Onboarding y aislamiento por tenant
- [x] 14.2 Multiple connections/portfolios
- [x] 14.3 Consent management
- [x] 14.4 Billing/planes preparado, sin activación automática
- [x] 14.5 Administración/soporte seguro

## Extensión del MVP — Quick + Subscriptions (desarrollo interno autorizado)

> Esta línea de producto complementa el MVP personal basado en importaciones. No sustituye ni declara aprobados los gates externos 15.1–15.5; Fase 16 continúa sin iniciar.

- [x] Q1 Modelo de borrador manual: monto exacto, método, fecha, tenant, idempotency key y clasificación gasto vs transferencias — PR #158, merge `029e2c3`.
- [x] Q2 Corregir deriva de fechas de suscripciones mensuales y anuales — PR #159, merge `ef30ba7`.
- [x] Q3 Plan de conciliación manual ↔ importaciones: coincidencias a revisión, no autopersistencia ni duplicación, fail-closed cross-tenant — PR #160, merge `572d42c`.
- [ ] Q4 Persistencia real autenticada con cuenta manual explícita, RLS/aislamiento, idempotencia transaccional y recuperación.
  - [x] Q4.A Contrato de confirmación + migración PostgreSQL/Supabase revisable, RLS/aislamiento, idempotencia y regresiones SQL efímeras (ver `docs/quick/PHASE_Q4_PERSISTENCE_FOUNDATION.md`); no equivale a despliegue.
  - [ ] Q4.B Seleccionar infraestructura de staging dedicada (ahora se prefiere Cloudflare D1 + Workers; el contrato Supabase se conserva como alternativa), sin costes ni datos financieros reales.
  - [ ] Q4.D1-A Esquema SQLite, Worker protegido por Access y pruebas reales de SQLite/HTTP con usuarios ficticios — en PR; comprobar CI antes de marcar completo.
  - [ ] Q4.D1-B Cuenta Cloudflare autorizada, D1 nueva, Access configurado con AUD correcto, migración y despliegue staging verificables (pendiente por bloqueo de acceso al inventario Cloudflare).
  - [ ] Q4.D1-C Pruebas de sesiones auténticas en staging, aislamiento, idempotencia, backups/restauración y respuesta a errores.
  - [ ] Q4.C Endpoint o adaptador autenticado + persistencia real, pruebas completas POST/SELECT/reintentos y seguridad con dos usuarios, exportación/borrado.
- [ ] Q5 UI móvil accesible de registro rápido y shortcut/PWA funcional, pruebas físicas; no confundir con widget nativo de iOS.
- [ ] Q6 Recibos seleccionados → candidatos de suscripción; comprobación humana, calendario/alertas opt-in, sin afirmar cargos bancarios.
- [ ] Q7 Gmail OAuth opcional sujeto a permisos de Google, verificación/seguridad de scopes, privacidad, revocación y borrado.

## Fase 15 — Producción fintech (requiere autorización explícita)
- [ ] 15.1 Accesos productivos/acuerdos/certificados — readiness interno integrado; evidencia externa pendiente (UX import-first y vista previa visual segura implementadas sin habilitar API ni sincronización)
- [ ] 15.2 Revisión jurídica y tratamiento de datos — readiness interno integrado; aprobación humana pendiente
- [ ] 15.3 Infra productiva y observabilidad — hardening/readiness integrado; infraestructura real pendiente
- [ ] 15.4 Pentest externo y readiness — gate integrado; pentest independiente real pendiente
- [ ] 15.5 Go-live gradual por connector — gate integrado; canary/go-live real pendiente

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

Las Fases 17+ permanecen definidas como Post-MVP en el historial del roadmap y fuera del alcance de ejecución automática.
