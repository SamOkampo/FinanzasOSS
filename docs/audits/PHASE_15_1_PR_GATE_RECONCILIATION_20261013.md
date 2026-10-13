# Phase 15.1 — GitHub integration gate reconciliation (2026-10-13)

> Documentation-only snapshot. This is **not** a release approval, provider access authorization, independent code review, legal approval, external pentest, or permission to handle real financial data.

## Sources checked

- `main`: `1987e5e2d8294994f85f6e9c20e9e83b7a64fbac`.
- `docs/ROADMAP.md`: phases 0–14 marked complete; phases 15.1–15.5 and 16.1–16.7 remain unchecked.
- `docs/CHECKPOINT.md`: phase 15 internal readiness gates previously merged; external evidence remains outstanding. Earlier historical sections still mention phase 10.1 as a “next block” and phase 15 as blocked; these are historical snapshots, not current instructions.
- PR #151: `fix/phase15-1-cross-gate-date-guards`, head `06167317d3e7687f2da3637a854bfbfdf3ac9fba`, target `main`, **draft**, **zero reviews** as checked. CI #340 (run 38354360887) succeeded for this head.
- PR #152: `fix/phase15-1-direct-assessor-nullish-20261011`, head `daed55024a2e76160dd90606bca56a748457b4ba`, base #151 branch at an older SHA; draft.
- PR #153: `fix/phase15-1-infrastructure-null-evidence-20261012`, head `255ddd8a04d270cd3085561135ffa45d0db2b99a`, base #151 branch at an older SHA; draft.
- PR #154: `fix/phase15-1-infra-nullish-stacked-20261012`, head `b35d7327f7172c70f3b64ef379e3865bff9e4cf6`, base #151 branch at an older SHA; draft.

## Verified integration status

1. The #151 branch has date-validation changes, 60 negative timestamp combinations in `tests/connector-go-live-15-5.mjs`, and a nullish evidence guard in `assessExternalPentestReadiness`. The latter currently lacks a dedicated committed nullish regression in `tests/pentest-readiness-15-4.mjs`.
2. CI #340 **does not cover uncommitted/local-only patches**. No merge of #151–#154 is evidenced by the checked PR metadata.
3. The #152–#154 branches must be reconciled after #151 merges. Their old CI runs are not sufficient evidence for rebased or updated SHAs.
4. Local runtime-shape audit found that the current #151 `assessConnectorGoLive` can throw on malformed top-level/section JSON; proposed hardening remains **unmerged**. Reject malformed evidence without exceptions before considering readiness gates satisfied.

## Exact safe order

1. On #151, add dedicated nullish pentest regression and fail-closed malformed runtime-input coverage; verify current head/blob SHAs before writing. Keep changes small and reviewable.
2. Run lint, typecheck, secret scan, dependency audit, and complete test suite on the **final** #151 SHA. Mark ready for independent review only when changes and tests are complete. Obtain independent approval on that SHA, then merge.
3. For each of #152–#154: compare against new `main`, eliminate already-integrated changes, update stale documentation, rerun CI for each resulting head, obtain review, and integrate only after its own gate passes.
4. Reconcile `docs/ROADMAP.md` and `docs/CHECKPOINT.md` after actual merges; never mark external evidence complete because internal code/tests passed.
5. Do **not** start Phase 16 while Phase 15 external gates remain open.

## Non-negotiable boundaries

Only verified official/authorized Open Finance APIs with consent; never bank credentials, private keys, seed phrases, unsafe scraping, invented scopes/endpoints, real production financial data, transfers, trading, withdrawals, or unapproved costs. Portfolios remain read-only; bank-to-investment flows are `investment_transfer`, never expenses. No Phase 17+ work.
