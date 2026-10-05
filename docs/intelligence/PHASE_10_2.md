# Phase 10.2 — Personal vs negocio

## Scope

Classify transaction usage context conservatively without changing the transaction economic class or silently converting ambiguous spending into personal or business activity.

## Semantics

- Protected transfer/investment transaction types are `not_applicable` to this spending-context classifier.
- Explicit user classification has precedence over inferred evidence for applicable spending.
- A user-defined account context may establish personal/business context; mixed accounts remain reviewable per transaction.
- The existing `business` category is only suggestive and therefore requires review unless stronger explicit evidence exists.
- Description/merchant keyword rules may suggest business usage, but never auto-accept it.
- Ordinary consumer categories such as transport, food or travel do not prove personal use because they may also be valid business expenses.
- Unknown transactions fail conservatively to `unknown` and remain reviewable.
- This layer never changes `TransactionKind`, economic class, transfer matching, portfolio accounting or money movement.

## Gate

10.2 closes after regression coverage, global CI green, PR integration and ROADMAP/CHECKPOINT reconciliation.
