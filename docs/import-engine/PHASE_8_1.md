# Universal Import Engine — Fase 8.1

Scope: CSV, XLSX and OFX intake boundary.

All imported files are treated as untrusted user input. Phase 8.1 validates the declared format, filename extension and a conservative 25 MiB size ceiling, then produces a non-persistable import envelope.

The envelope deliberately sets `persistenceAllowed=false`. Persistence, user mapping/preview and idempotent incremental imports belong to 8.4/8.5 and cannot be bypassed by this intake layer.

PDF is explicitly excluded and belongs to isolated parser work in 8.2. Institution/format auto-detection belongs to 8.3.

This block does not execute spreadsheet formulas/macros, HTML, external links or embedded code; does not persist document passwords or credentials; and does not connect to production banking. A later XLSX reader must consume workbook data without evaluating formulas or macros.
