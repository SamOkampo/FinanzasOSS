# RappiPay / RappiCard — Fase 7.4

> Verified/reconciled: 2026-10-02. This document records the safe MVP access decision and does not authorize production banking access.

## Product and legal-entity boundary

Rappi-branded financial products are not treated as one interchangeable institution:

- **RappiCuenta** is offered by **RappiPay Compañía de Financiamiento S.A.**
- **RappiCard** is currently a credit-card product issued by **Banco Davivienda S.A.**

Evidence for one product must never be promoted to the other.

## Verified official evidence

### RappiCuenta

RappiPay's official savings-account regulation states that monthly account statements are made available through the RappiPay application, email or other official channels and include account movements.

Official sources revalidated for this phase:

- https://www.rappipay.co/reglamento-cuenta-de-ahorros-rappicuenta/
- https://www.rappipay.co/reglamento-deposito-de-bajo-monto-rappicuenta/

### RappiCard

RappiCard's official current website identifies the product as issued by Banco Davivienda S.A. and states that customers can review transactions in the Rappi app and download a monthly account statement. Current RappiCard contract materials also require a monthly statement containing card transactions and balances due.

Official sources revalidated for this phase:

- https://www.rappicard.co/
- https://www.rappicard.co/documentos/

These statement flows do **not** establish a consumable third-party Account Information API or verified aggregator coverage.

## Access decisions

| Product | Legal institution | Official Account Information | Aggregator | Official statement fallback | Exact file format | Recommended mode |
|---|---|---|---|---|---|---|
| RappiCuenta | RappiPay Compañía de Financiamiento S.A. | `not_verified` | `not_verified` | monthly statement via app/email/official channels | `not_verified` | `statement_import / local_import` |
| RappiCard | Banco Davivienda S.A. | `not_verified` | `not_verified` | monthly downloadable account statement via Rappi app/official channels | `not_verified` | `statement_import / local_import` |

No endpoint, scope, OAuth parameter, certificate, client secret, banking password, app session or production token is encoded.

## Security and Phase 8 boundary

Both profiles set `parserAvailable = false`. The exact file format must be revalidated before the Universal Import Engine enables parsing.

Future parsers must treat statements as untrusted input, preserve product/legal-entity provenance, preview before persistence, remain idempotent and never retain document passwords or app credentials.

PDF/CSV/XLSX/OFX parsing and format detection belong to **Fase 8 — Universal Import Engine**.

## Runtime gate

`packages/connector-sdk/src/rappipay.ts` exports separate profiles for RappiCuenta and RappiCard plus a product-aware Account Information gate. The gate requires explicit route verification, verified consent, granted capabilities and HTTPS endpoints before it can open.

All regression-test endpoints use synthetic `*.example.invalid` hosts.
