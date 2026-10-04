# Phase 8.3 integration gate

Format and institution detection remain separate fail-closed modules. The regression test must import the institution detector from its dedicated module before integration. Ambiguous institution markers resolve to no institution. Phase 8.4 must not begin until the Phase 8.3 regression is green and integrated.

- Integration gate: the branch must enter main only through a green CI-validated PR; direct main integration is prohibited.
