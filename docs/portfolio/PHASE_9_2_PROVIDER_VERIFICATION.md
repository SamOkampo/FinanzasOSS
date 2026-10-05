# Phase 9.2 — Provider verification gate

The generic investment-provider boundary and synthetic regression are implemented. Provider-specific transport remains intentionally absent until its behavior can be verified against current official provider documentation.

## Integration gate

- keep production access disabled;
- keep the connector read-only and fail closed;
- accept only portfolio/account, balance and investment-activity data needed by the Finance Core;
- do not add money-movement behavior;
- do not persist authentication material in application data;
- validate provider responses before normalization;
- use synthetic fixtures in repository tests;
- require the repository CI gate before integration.

This document does not define provider endpoints, permissions, certificates or authentication details. Those values must come from current official provider documentation before a transport implementation is introduced.
