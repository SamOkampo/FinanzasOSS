# Phase 9.2 acceptance contract

The exchange integration remains read-only and uses the existing investment connector policy.

Acceptance:
- provider details are added only when verified from official documentation;
- application data does not contain authentication secrets;
- money-moving capabilities remain unavailable;
- imported balances and activity are validated before normalization;
- automated tests use synthetic fixtures;
- production access remains disabled.

Unknown provider behavior must fail closed rather than be guessed.
