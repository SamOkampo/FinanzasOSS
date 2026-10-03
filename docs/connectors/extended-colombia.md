# Cobertura bancaria extendida Colombia — Fase 7.8

Revalidated: 2026-10-02.

This phase adds conservative discovery/import profiles only. It does not implement Phase 8 parsers and does not infer Account Information APIs, OAuth parameters, scopes, certificates or aggregator support.

## Banco Caja Social
Official consumer help documents web/App generation and download/request of account extracts, including up to the last 12 months. Statement access is therefore verified as a consumer fallback; exact universal file parsing remains Phase 8.

## Banco Falabella Colombia
Official consumer FAQ documents downloadable PDF extracts in Banca en Línea, and official self-service material also points consumers to extracts in the App. The separate Portal Empresarial exposes business movements/extracts; that enterprise evidence is kept separate and is not proof of a consumer third-party API.

## Itaú Colombia
Current official evidence reviewed documents Corporate portal balances, movements, extracts and CSV/Excel exports. This is enterprise/corporate evidence only. It is not promoted to consumer Account Information. Consumer statement access remains not_verified in this phase rather than guessing from corporate functionality.

## Scotiabank Colpatria
No sufficiently current official source was verified in this pass to establish a third-party consumer Account Information route or a precise statement format/channel suitable for the connector contract. The profile remains explicitly not_verified/fail-closed rather than relying on stale or third-party evidence.

## Shared security boundary
All four profiles keep third-party Account Information and aggregator routes not_verified. No screen scraping, credential persistence or production banking is introduced. Any user-provided statement is untrusted input. Parsing, format detection, preview and idempotent persistence remain Phase 8.
