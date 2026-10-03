# Universal Import Engine — Fase 8.2 PDF aislado

PDF enters a separate parsing boundary from CSV/XLSX/OFX. Every document is untrusted input and must be processed in a sandboxed job with network access disabled.

The 8.2 contract forbids persistence, active content and password persistence. Encrypted PDFs may be represented as encrypted input, but a supplied password must remain ephemeral and outside the persisted job contract.

OCR is intentionally disabled in this block. Institution/format detection belongs to 8.3; mapping and user preview belong to 8.4; durable/idempotent persistence belongs to 8.5.

The isolated parser boundary does not fetch remote resources, execute embedded JavaScript/actions, follow links, use bank credentials or connect to production banking.
