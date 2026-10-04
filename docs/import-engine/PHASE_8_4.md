# Universal Import Engine — Fase 8.4

Scope: explicit column mapping and user-visible preview before persistence.

The mapping layer converts raw imported rows into non-persistable transaction candidates. Required canonical fields are posting date, raw description and amount. Direction, currency and external source ID are optional mappings.

Every preview is fail-closed:
- `persistenceAllowed=false`
- `requiresUserConfirmation=true`
- missing required values are surfaced as row issues
- invalid direction values are surfaced instead of guessed
- formula-like active content is flagged and never evaluated
- preview is capped at 100 rows to bound work in this stage

The amount remains a string in 8.4. Currency-specific decimal normalization and durable transaction creation are not performed here. Idempotent persistence belongs to 8.5. Cross-source reconciliation belongs to 8.6.

No bank credentials, production connections, remote resource loading, spreadsheet macro execution or financial side effects are introduced.
