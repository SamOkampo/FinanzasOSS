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
## Static visual preview (follow-up)

The self-contained `apps/web/public/index.html` is an accessible **static preview**, with local `preview.css` and `preview.js` (no third-party libraries). It demonstrates a mobile-responsive, import-first onboarding flow with three working navigation sections: overview, file-import guidance, and provider requirements.

Security boundaries for this preview:

- Strict Content Security Policy: `connect-src 'none'`, `form-action 'none'`; no API calls, external assets or data transmission.
- No financial amounts, accounts, secret fields, file-picker or processing of real statements.
- Clear disclaimer that this preview is not wired to the existing import parser or any live provider.
- Accessible navigation buttons, status announcement, keyboard focus, mobile layout and reduced-motion handling.
- Regression `tests/onboarding-preview-15-1.mjs` validates navigation, CSP, and explicit data-collection prohibition.

No hosted deployment is claimed. A real app/runtime must wire this view to the existing, reviewed import engine and validate its end-to-end behavior before inviting real files; this demo alone is not a ready financial product.
