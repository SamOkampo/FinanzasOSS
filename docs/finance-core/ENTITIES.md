# Finance Core — Entidades base

## Objetivo

Definir una fuente de verdad neutral respecto a bancos/proveedores antes de implementar conectores. Ninguna entidad del Finance Core depende de un API concreto.

## Jerarquía

```
Tenant
 ├─ FinancialConnection
 │   ├─ FinancialConsent
 │   └─ FinancialAccount
 │       ├─ FinancialBalance
 │       └─ FinancialTransaction
 └─ Portfolios (Fase 2.6)
```

## Tenant

Representa el espacio de datos propietario. Hoy normalmente corresponde a un usuario; más adelante podrá representar espacios personales/compartidos sin cambiar las reglas de aislamiento.

Toda entidad sensible persistida debe estar scopeada por `tenantId`.

## FinancialInstitution

Catálogo no secreto de instituciones/proveedores: banco, billetera digital, broker, exchange o proveedor de wallet.

No contiene credenciales ni configuración específica del usuario.

## FinancialConnection

Representa la relación entre un tenant y una institución.

Puede guardar una **referencia opaca** a un secreto (`secretReference`), pero nunca access tokens, refresh tokens, passwords, API secrets, seed phrases ni private keys en el Finance Core.

Estados principales:
- `pending`
- `connected`
- `degraded`
- `reauth_required`
- `consent_expired`
- `revoked`
- `disconnected`

## FinancialConsent

Registra el estado y capacidades autorizadas. Permite diferenciar una conexión técnica existente de un consentimiento vigente.

Un consentimiento activo deja de ser usable cuando:
- su estado cambia;
- expira;
- es revocado.

## FinancialAccount

Cuenta normalizada perteneciente a una sola conexión e institución. Lleva `tenantId` explícito para impedir cruces de datos incluso si se conoce un ID interno.

## FinancialBalance

Snapshot de saldo de una cuenta en un momento dado. Puede tener:
- saldo actual;
- saldo disponible;
- límite de crédito.

No se modela como movimiento.

## FinancialTransaction

Movimiento normalizado. Referencia tenant + connection + account y no replica institución: la institución se obtiene desde la conexión para reducir inconsistencias.

La semántica completa de categorías/tipos se profundiza en Fase 2.2.

## Invariantes implementadas

- Una cuenta debe compartir tenant, connection e institution con su `FinancialConnection`.
- Un balance debe compartir tenant, connection y account con su cuenta.
- Un movimiento debe compartir tenant, connection y account con su cuenta.
- Repositories reciben `TenantContext` obligatorio.
- Los checkpoints de sync incluyen `tenantId`.

Estas validaciones de dominio complementan, pero no sustituyen, RLS/controles de persistencia de producción.
