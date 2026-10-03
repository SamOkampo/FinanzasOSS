# Nu Colombia — Fase 7.5

> Verified/reconciled: 2026-10-02. This document records the safe MVP access decision for Cuenta Nu and does not authorize production banking access.

## Institution and product scope

- Legal institution: **Nu Colombia Compañía de Financiamiento S.A.**
- Product scoped in this phase: **Cuenta de ahorros Nu / Cuenta Nu**.
- Evidence for Tarjeta de Crédito Nu or other Nu products must not be silently promoted to Cuenta Nu.

## Verified official evidence

Nu's official Colombia content documents that customers can request a Cuenta Nu statement from the App Nu, choose a month and receive the selected statement **in PDF format by email**.

Official sources revalidated for this phase:

- https://blog.nu.com.co/consulta-tus-extractos/
- https://www.nu.com.co/cf/cuenta/
- https://registro.nu.com.co/

Nu also publishes educational material about Open Finance in Colombia. That material explains the model and consent principles, but it does **not** establish that FinanzasOSS has access to a usable third-party Account Information route for Cuenta Nu.

## Access decision

| Route | Phase 7.5 decision |
|---|---|
| Official Account Information API | `not_verified`; fail closed |
| Aggregator | `not_verified`; do not assume institution support |
| Official statement import | verified customer fallback |
| Statement format | `pdf` |
| Delivery | request in App Nu → email |
| Recommended access mode | `statement_import / local_import` |
| Production banking access | forbidden in this phase |

No endpoint, OAuth scope, certificate, client credential, banking password, app session or production token is encoded.

## Security and Phase 8 boundary

The Phase 7.5 profile records the officially documented PDF fallback but keeps `parserAvailable = false`.

Actual PDF parsing, isolated document handling, any future password/decryption handling, preview before persistence, provenance and import idempotency belong to **Fase 8 — Universal Import Engine**. Statements must be treated as untrusted input, and document passwords must never be persisted as banking credentials.

## Runtime gate

`packages/connector-sdk/src/nu-colombia.ts` provides:

- a Cuenta Nu `statement_import / local_import` profile;
- officially verified `statementFormat = pdf`;
- `parserAvailable = false`;
- a provider-specific Account Information gate requiring explicit route verification, verified consent, granted capabilities and HTTPS endpoints;
- fail-closed default behavior.

All regression-test endpoints use synthetic `*.example.invalid` hosts.
