# Phase 10.10 — Monthly net-worth, spending and investment summary

## Scope

Build a read-only monthly summary that keeps consumption, patrimonial investment flows and investment performance explicitly separated.

## Semantics

- Uses one validated currency at a time; no implicit FX conversion is introduced.
- Net-worth change is closing net worth minus opening net worth.
- Consumer expense is reported separately from investment contributions/withdrawals.
- Bank-to-broker/exchange/wallet contributions remain patrimonial `investment_transfer` flows and are never added to consumer spending.
- Net investment flow is contributions minus withdrawals.
- Investment performance is separate from external flows and may be unavailable.
- Missing investment performance is reported as partial completeness, never invented as zero.
- The summary is read-only and cannot execute transfers, payments, orders, deposits or withdrawals.
- No guarantee, investment recommendation or future-return claim is produced.

## Gate

10.10 closes after regression coverage, global CI green, PR integration, ROADMAP/CHECKPOINT reconciliation and a Phase 10 audit.
