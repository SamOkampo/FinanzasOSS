# Davivienda sandbox — registration and auth discovery

Status: Phase 5.1 discovery, sandbox only. No production access or real financial data.

## Officially verified public facts

From Davivienda's official Developer Portal (verified 2026-09-24):

- A developer account can access the private area and Sandbox; being a Davivienda customer is not required.
- Before invoking an API, the developer registers an application. Davivienda assigns a Client ID and Client Secret after the applicable validations.
- The application must subscribe to an API plan. Some plans are free/no-approval; others may require approval and/or subscription.
- Sandbox and production use different Client IDs.
- Davivienda provides a test certificate for API invocation in the test environment; it is not valid for production.
- Production requires separate onboarding/commercial approval and a production certificate managed by the ally.
- The public catalog exposes an `Autenticación Web` product described as integration with Davivienda's Open Banking authentication widget.
- Davivienda's public glossary describes OAuth concepts including redirect URI, response type, scope, state and token, but the detailed API content is gated behind portal login/registration.

Official references:

- https://developers.davivienda.com/es/guia-inicio
- https://developers.davivienda.com/es/faq
- https://developerslab.davivienda.com/api/471

## FinanzasOSS policy for Phase 5.1

This discovery is intentionally fail-closed. The repository MUST NOT guess or hard-code any Davivienda authorization URL, token URL, scope, response type, widget parameter, certificate path, account-information endpoint, Client ID or Client Secret until that exact value is verified from the authenticated official sandbox documentation for the subscribed product.

Registration credentials and certificates are deployment secrets, not source data. They MUST NOT be committed, logged, placed in fixtures, or requested from end users as bank-login credentials. FinanzasOSS never stores Davivienda online-banking username/password credentials.

No production certificate, production API, payment capability, transfer capability or money movement is part of this phase.

## Gate to Phase 5.2

Phase 5.2 may build the consent flow only from official sandbox parameters obtained for the applicable Account Information/Open Finance product. If the authenticated catalog does not expose an appropriate read-only account-information product, the connector remains unavailable/fail-closed and must fall back later to an explicitly supported import path rather than screen scraping.
