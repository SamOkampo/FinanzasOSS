# Phase 15.1 — Import-first onboarding while provider access is pending

## Context
A sandbox developer-portal account or registered developer application is **not** evidence of authorization to consume account-information APIs. Financial institutions may require formal third-party eligibility, commercial approval, and verified consent before even sandbox account-information access.

This enhancement is product UX readiness only, **not** a bank connector activation and **not** closure of the 15.1 external gate.

## Model
`apps/web/src/source-onboarding.ts` exposes `buildSourceOnboarding`, a pure model for a source-setup surface:

- Shows a manual-file import path with the existing CSV/XLSX/OFX/PDF formats.
- Explicitly requires preview and user confirmation before persistence.
- Tracks provider access status at the UX level: unverified, developer portal registered, sandbox API approved, or production access under review.
- Keeps `bankConnected=false`, `automaticSyncAvailable=false`, and `productionAccessImplied=false` for **every** status, including those that sound advanced.
- Offers a requirements/explanation action instead of an unapproved `Connect bank` action.
- Uses no credentials, financial user data, invented scopes/endpoints, money movement, or network requests.

The existing import engine's review/deduplication gates still apply. This change only defines a view model; it does not claim that a rendered onboarding screen, file-picker, or deployed PWA has been implemented.

## Verification
`tests/import-first-onboarding-15-1.mjs` covers all stages, the import confirmation gate, the blocked/manual-import-unavailable case, and the prevention of false bank-connected claims. It is part of the repository's `npm test` CI chain.

## Outstanding gate
Provider/business/legal authorization, real API entitlement, verified OAuth scopes/redirects and regulatory suitability remain unverified and must not be inferred from developer portal registration. No production access or Phase 16 work is authorized.
