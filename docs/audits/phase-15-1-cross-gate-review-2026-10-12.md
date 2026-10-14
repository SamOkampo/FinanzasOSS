# Phase 15.1 — cross-gate review and integration evidence (revalidated 2026-10-14)

This document records **repository evidence only**. It is not legal approval, bank authorization, an external pentest, or permission to activate a financial connector.

## Verified source of truth

- `main`: `1987e5e2d8294994f85f6e9c20e9e83b7a64fbac`.
- PR #151 (`fix/phase15-1-cross-gate-date-guards`): HEAD `bb870a87405d998b6137f4c470b46380eaac234e`; targets `main`, draft, mergeable, **zero submitted reviews** at inspection.
- CI run `38493160158` completed successfully on that exact HEAD. The `quality` job concluded `success` (lint, typecheck, secret scan, dependency audit and npm test).
- PR #151 changes **seven files** (five security sources and two test files). The connector go-live regression adds **60 invalid-timestamp**, **54 malformed-runtime**, and **42 required-field omission** cases; pentest regressions cover null and undefined evidence.
- PR #152 (legal nullish guard): HEAD `daed55024a2e76160dd90606bca56a748457b4ba`, 2 commits ahead / 6 behind current #151; only legal assessor and its test differ from its original stacked base.
- PR #153 (this documentation): HEAD before this documentation update `bb56ac9f741c7d4fd4fe33b86f8580b5b6487b7d`, 2 commits ahead / 6 behind current #151. This file previously referred to obsolete #151 SHA `326dd5a`, CI #334 and six files; those are **historical**, not current merge gates.
- PR #154 (infrastructure nullish guard): HEAD `b35d7327f7172c70f3b64ef379e3865bff9e4cf6`, 2 commits ahead / 5 behind current #151; infrastructure assessor and test differ from its original stacked base.
- All three dependent PRs still target the #151 branch. The new 42-case matrix uses synthetic fixtures and does not establish that any external evidence exists. Their old green CI does not establish compatibility with its latest HEAD.

## Required review and integration sequence

1. Obtain an independent review of #151 (author cannot self-approve), including canonical UTC timestamp validation, fail-closed malformed evidence, no automatic activation and no financial writes.
2. Move #151 out of draft only when the review process can proceed. Reconfirm CI success for its final SHA, then merge only when review and repository protections are satisfied.
3. Re-read `main` after merge. Rebase or rebuild #152 on current `main`, verify a two-file minimal diff, run new CI, obtain review and merge.
4. Rebase or rebuild #154 on updated `main`, verify its two-file diff, run new CI, obtain review and merge.
5. Reconcile this documentation-only #153 against actual merged SHAs and CI; avoid merging historical statements as current truth. Update `docs/CHECKPOINT.md` and `docs/ROADMAP.md` only with verified integration and external gate status.
6. Keep Phase 15 external gates 15.1–15.5 open until their real evidence exists. Phase 16 and Post-MVP 17+ are not authorized to begin by this documentation.

## Safety invariants

Official Open Finance APIs and verified consent precede any connector. Never store bank passwords, seed phrases or private keys; never invent endpoints, scopes or certificates. Portfolios remain read-only, bank-to-investment transfers are `investment_transfer`, and no trading, withdrawals, production connections, real financial data or costs are authorized. Green CI is a code-quality signal, **not** permission for production.
