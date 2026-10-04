# Development checkpoint

## Estado actual

- **Fase 7 — Cobertura bancaria Colombia: CERRADA e integrada.**
- **Fase 8 — Universal Import Engine: 8.1–8.4 cerradas e integradas con CI verde.**
- 8.1 CSV/XLSX/OFX: PR #52, CI #119 verde, merge `f380080`.
- 8.2 PDF en parser aislado: PR #53, CI #121 verde, merge `2b4616b`.
- 8.3 detección de institución/formato: PR #54, CI #124 verde, merge `7aae95d`.
- 8.4 mapeo + preview antes de persistir: PR #55, CI #126 verde, merge `3abd811`.
- Próximo bloque exacto permitido: **Fase 8.5 — imports incrementales e idempotentes**.

## Fase 8.1–8.4 integrada

El Universal Import Engine ya dispone de frontera segura para CSV/XLSX/OFX, PDF aislado, detección conservadora de formato/institución y mapeo con preview previo a persistencia.

Reglas vigentes:
- todos los archivos importados se tratan como input no confiable;
- PDF se procesa bajo contrato aislado sin red, active content ni persistencia de contraseña;
- PDF/XLSX/OFX fallan cerrados cuando la firma contradice la extensión;
- la detección institucional es conservadora y documentos ambiguos no se adjudican a una entidad;
- el preview de 8.4 mantiene `persistenceAllowed=false` y `requiresUserConfirmation=true`;
- no se evalúan fórmulas/macros ni contenido activo;
- no se crean todavía transacciones persistentes desde el preview.

## Gate siguiente

El siguiente bloque permitido es únicamente **8.5 — imports incrementales e idempotentes**. La persistencia debe conservar provenance, evitar duplicados y ser idempotente. 8.6 reconciliación con API/Gmail no debe adelantarse antes de cerrar 8.5.

No habilitar producción bancaria, datos financieros reales, pagos/transferencias, trading, retiros, secretos, private keys ni costes sin autorización explícita.
