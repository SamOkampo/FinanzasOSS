# Universal Import Engine — Fase 8.5

Initial slice: deterministic incremental/idempotent import planning.

The planner receives already-confirmed `statement_import` transactions plus the current and next source checkpoints. It reuses Finance Core fingerprints and duplicate evaluation instead of inventing a second dedupe model.

Rules:
- every batch has a stable `idempotencyKey` and `sourceId`;
- only `statement_import` provenance is accepted in this phase;
- exact source identity and normalized fingerprints suppress duplicates;
- duplicates inside the same batch are suppressed too;
- accepted transactions receive their Finance Core fingerprint;
- the plan carries `checkpointBefore` and `checkpointAfter`;
- durable storage must apply inserts and checkpoint advancement atomically; a partial write must not advance the checkpoint.

This slice does not connect to a production database and does not reconcile API/Gmail sources; those cross-source rules remain 8.6.
