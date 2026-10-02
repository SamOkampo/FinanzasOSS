# Colombia connector coverage matrix — Fase 7.1

> Verified/reconciled: 2026-10-02. This matrix is a security gate, not a claim that a provider is production-ready.

## Classification rules

- `verified`: an official Account Information route applicable to FinanzasOSS (accounts/balances/transactions) is evidenced.
- `enterprise_only`: an official API exists, but the verified route is private/business/treasury rather than consumer account aggregation.
- `not_verified`: no applicable official Account Information route has been verified. This is not evidence that none exists.
- Aggregators are `verified` only when institution-level coverage and an authorized consent path are evidenced. Marketing or country-level availability is insufficient.
- Imports use only statements/files the institution itself makes available. No credential capture and no screen scraping.
- Unknown or unverified capabilities fail closed.

| Institution | Products / scope | official_account_info_route | Official evidence / decision | aggregator_route | import_route | Recommended access_mode | Gate / limitation |
|---|---|---|---|---|---|---|---|
| Bancolombia | Consumer deposit accounts | not_verified | Existing Fase 4 discovery keeps real account-info endpoints fail-closed until official parameters are verified. | not_verified | not evaluated in 7.1 | official API only after verification; otherwise fail_closed | Never infer endpoints/scopes from Open Banking branding. |
| Davivienda | Consumer accounts | not_verified | Existing Fase 5 discovery confirms official Open Banking/sandbox discovery, but detailed account-info parameters remain gated until verified in the authenticated catalog. | not_verified | not evaluated in 7.1 | official API only after authenticated verification; otherwise fail_closed | Do not invent catalog parameters. |
| Nequi | Wallet/deposit product | not_verified | Fase 6 found no verified third-party Account Information route applicable to this adapter. | not_verified | not evaluated in 7.1 | fail_closed | Existing adapter remains synthetic/read-only until official evidence exists. |
| DaviPlata | Wallet/deposit product | not_verified | Fase 6 found no verified third-party Account Information route applicable to this adapter. | not_verified | not evaluated in 7.1 | fail_closed | Existing adapter remains synthetic/read-only until official evidence exists. |
| Lulo Bank | Lulo Cuenta / consumer deposits | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | PDF statement available from official app/help flow | import | Implement only statement import until an official/authorized route is evidenced. |
| Pibank / Banco Pichincha | Pibank deposit products | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | Monthly statement via official email/portal flow | import | Parser must treat statement as untrusted input and preserve source provenance. |
| RappiPay | RappiCuenta | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | Monthly statement via official app/email flow | import | RappiCard scope must be evaluated separately when 7.4 is implemented. |
| Nu Colombia | Cuenta Nu | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | PDF statement via official app/email flow | import | Do not treat app access as API authorization. |
| BBVA Colombia | Consumer accounts; separate business/treasury APIs | enterprise_only | BBVA API Market exposes Colombia Business Accounts/Reconciliation capabilities, but the verified routes are private/business/treasury; no personal Account Info & Transactions route is verified for Colombia. | not_verified | Statements/certificates via official BBVA app/BBVA Net | import for consumer; enterprise API only under a separately verified business contract | Never promote enterprise/private API evidence to consumer aggregation. |
| Banco de Bogotá / Grupo Aval | Consumer deposit products | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | Statements available through official digital channels | import | Grupo-level branding does not prove per-institution API coverage. |
| Scotiabank Colpatria | Consumer accounts | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | Statement consultation/download through official app | import | Reverify source format before building parser. |
| Itaú Colombia | Consumer and business banking | not_verified | Verified export evidence is business-facing; it does not establish a consumer Account Information API. | not_verified | Business movements/statements in TXT/Excel/PDF | import_enterprise_only | Do not claim personal import coverage from business documentation. |
| Banco Caja Social | Consumer accounts | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | Statements through official web channel | import | Reverify exact formats during institution adapter work. |
| Banco Falabella Colombia | Consumer banking/card products | not_verified | No applicable consumer Account Information API is verified in the current research checkpoint. | not_verified | Online/PDF statements through official channels | import | Product-specific parsing/capabilities remain gated for 7.8. |

## Evidence policy

The Colombian Open Finance regulatory framework and SFC standards establish the ecosystem but do **not** prove that a specific institution exposes a usable third-party Account Information API. Institution rows therefore remain conservative until product-level evidence exists.

Provider/aggregator support is intentionally `not_verified` in this matrix unless institution-level coverage, authorization/consent behavior, and applicable data capabilities are verified. A future aggregator may be added without changing the connector contract, but must not bypass consent, read-only constraints, or provenance.

## Sources to revalidate before implementation

- Superintendencia Financiera de Colombia — Open Finance / standards and applicable regulatory materials.
- Official institution help centers and developer/API portals only for institution-specific claims.
- BBVA API Market — Colombia catalog; distinguish business/private APIs from consumer account aggregation.

URLs and exact provider parameters should be revalidated at the institution subphase (7.2–7.8) before code enables any route. No endpoint, scope, certificate, credential, or production access is encoded by this document.
