# Pibank / Banco Pichincha — Fase 7.3

> Verified/reconciled: 2026-10-02. This records the safe MVP access decision for Cuenta Pibank and does not authorize production access.

## Institution boundary

Pibank is Banco Pichincha S.A.'s digital banking brand in Colombia. Phase 7.3 scopes only **Cuenta Pibank**; evidence or channels for other Banco Pichincha products must not be silently promoted to Pibank coverage.

## Verified official evidence

The official Cuenta de Ahorros regulation published by Pibank/Banco Pichincha states that the bank makes an account statement available monthly and that customers may consult or request statements through official channels. Banco Pichincha's current public FAQs also identify Pibank as its digital savings offer.

Official sources revalidated for this phase:

- https://www.pibank.co/uploads/2024/12/Reglamento-de-Cuenta-de-Ahorros.pdf
- https://www.bancopichincha.com.co/web/corporativo/preguntas-frecuentes

The official evidence verifies a statement fallback. It does **not** establish a consumable third-party Account Information API or institution-level aggregator support.

## Access decision

| Route | Phase 7.3 decision |
|---|---|
| Official Account Information API | `not_verified`; fail closed |
| Aggregator | `not_verified`; do not assume support |
| Official statement import | `verified` as user-provided statement fallback |
| Exact statement file format | `not_verified`; do not assume PDF/CSV/XLSX/OFX |
| Recommended access mode | `statement_import` / `local_import` |
| Production banking access | forbidden in this phase |

No endpoint, OAuth scope, certificate, client credential, banking password, app session or production token is encoded.

## Security and Phase 8 boundary

The Phase 7.3 profile records only the existence of an official statement flow and keeps `parserAvailable = false`. The exact statement format must be revalidated before Phase 8 enables parsing.

Any future document parser must treat statements as untrusted input, preserve provenance, preview before persistence, be idempotent and never retain a statement password as banking credential material.

The universal PDF/CSV/XLSX/OFX parser, format detection and persistence flow belong to **Fase 8 — Universal Import Engine**.

## Runtime gate

`packages/connector-sdk/src/pibank.ts` provides:

- a `statement_import` / `local_import` profile for Cuenta Pibank;
- explicit `statementFormat = not_verified`;
- `parserAvailable = false`;
- a provider-specific Account Information gate requiring explicit route verification, verified consent, granted capabilities and HTTPS endpoints;
- fail-closed default behavior.

All endpoints used by regression tests are synthetic `*.example.invalid` values.
