# Phase 6.1 — Nequi + DaviPlata discovery

Discovery result: keep account aggregation fail-closed. Official public developer surfaces found for both providers are currently payment/business oriented; they must not be treated as consumer account-information access.

Official references:
- SFC Open Finance: https://www.superfinanciera.gov.co/publicaciones/10116081/finanzas-abiertas-obligatorias-impulsaran-el-desarrollo-del-sistema-y-la-inclusion-financiera-en-el-pais/
- Nequi Open Finance: https://www.nequi.com.co/personas/ayuda/finanzas-abiertas
- Nequi business APIs: https://www.nequi.com.co/negocios/apis
- DaviPlata Developer Portal: https://conectesunegocio.daviplata.com/es/
- DaviPlata API catalogue example: https://conectesunegocio.daviplata.com/es/api/37

MVP decision: do not guess provider-specific account-information parameters. Do not substitute payment APIs or screen scraping for authorized data sharing. Phase 6.2 and 6.3 must default to unavailable until the applicable official account-information route is verified.
