# BBVA Colombia — Fase 7.6

Revalidated: 2026-10-02.

## Consumer

Official BBVA Colombia pages document consumer extract access through App BBVA and BBVA Net. Phase 7.6 therefore keeps consumer access as statement_import/local_import with PDF documents. A third-party personal Account Information route was not verified, and aggregator support was not verified. Parsing remains disabled until Phase 8.

Consumer sources:
- BBVA Colombia, Extracto Bancario
- BBVA Colombia, App BBVA
- BBVA Colombia, BBVA Net

## Enterprise boundary

BBVA API Market currently lists Colombia Business Accounts and Business Reconciliation as Private products for business customers and ERP/treasury integration. Their verified capabilities cover business accounts/balances and transaction activity/details.

That enterprise evidence is deliberately separate from the consumer profile. It cannot be used as proof of a personal Account Information route.

Enterprise sources:
- BBVA API Market, Colombia Business Accounts
- BBVA API Market, Colombia Business Reconciliation

## Security

The implementation keeps separate consumer and enterprise profiles. Enterprise is marked enterprise_only, private, and consumerEligible=false. The consumer gate remains fail-closed unless a separately verified consumer route, consent, capabilities and secure endpoints are available.

No production access is enabled. Document parsing, preview, provenance and idempotency remain Phase 8.
