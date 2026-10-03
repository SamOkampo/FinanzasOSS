# Lulo Bank — Fase 7.2

> Verified/reconciled: 2026-10-02. This document records the safe MVP access decision for Lulo Bank; it does not authorize production access.

## Verified official evidence

Lulo Bank's official help center documents that a customer can download Lulo Cuenta statements from the app under **Explora → Ahorro → Cuenta → Ajustes → Extractos y documentos**. The same official help content states that monthly account history can be obtained through those statements.

Official sources revalidated for this phase:

- https://ayuda.lulobank.com/hc/es/articles/4403983373332--C%C3%B3mo-puedo-obtener-los-extractos-y-o-certificaciones-de-mi-Lulo-Cuenta
- https://ayuda.lulobank.com/hc/es/articles/37757070445588--C%C3%B3mo-puedo-consultar-el-historial-de-pagos-de-n%C3%B3mina-en-mi-cuenta-de-Lulo-bank

The published statement flow is sufficient evidence for an official-document import fallback. It is **not** evidence of a third-party Account Information API.

## Access decision

| Route | Phase 7.2 decision |
|---|---|
| Official Account Information API | `not_verified`; fail closed |
| Aggregator | `not_verified`; do not assume institution support |
| Official statement import | `verified` as user-provided PDF fallback |
| Recommended access mode | `statement_import` / `local_import` |
| Production banking access | forbidden in this phase |

No endpoint, OAuth scope, certificate, client credential, banking password, app session or production token is encoded in the connector.

## Security boundary

Official Lulo documentation indicates that downloaded statements may be password-protected. FinanzasOSS must never persist that document password as banking credential material. Phase 7.2 therefore records only that password protection may exist and sets `persistDocumentPassword = false`.

The actual isolated PDF parser, safe decryption handling, preview-before-persist, provenance and import idempotency belong to **Fase 8 — Universal Import Engine**. Phase 7.2 deliberately does not implement a PDF parser or retain document contents.

## Runtime gate

`packages/connector-sdk/src/lulo-bank.ts` provides:

- a read-only import profile with `statement_import` + `local_import`;
- `parserAvailable = false` until the Phase 8 parser exists;
- a provider-specific Account Information gate that requires explicit evidence flags, verified consent, granted capabilities and HTTPS endpoints before it can open;
- default behavior that fails closed because no applicable Account Information route is currently verified.

All endpoints used by regression tests are synthetic `*.example.invalid` values.
