# Development checkpoint

## Estado actual

- Último bloque integrado en `main`: **Fase 6.3 — DaviPlata adapter** (`d5551c1`), con reconciliación documental posterior en `99da8c4`.
- Bloque completado en esta rama: **Fase 6.4 — Reconciliación PSE/transferencias internas**.
- Próximo bloque exacto tras CI verde e integración: **Fase 6.5 — Tests**.

## 6.4 completado

- El matcher existente de transferencias entre cuentas propias se extendió sin crear un reconciliador paralelo.
- Las referencias PSE se reciben como evidencia explícita por transaction ID; no se infieren desde descripciones libres ni se inventan referencias.
- Una referencia PSE coincidente aporta evidencia adicional y queda expuesta en el resultado para auditoría.
- PSE por sí solo no autoriza auto-link: se requiere además al menos otra señal explícita de transferencia propia y confianza alta.
- Si ambos lados traen referencias PSE válidas pero diferentes, el candidato se rechaza de forma fail-closed.
- Una referencia presente solo en un lado no incrementa confianza ni habilita auto-link.
- `investment_transfer` sigue delegado al reconciliador de inversión y nunca se reclasifica como gasto.
- La regresión `tests/pse-transfer-reconciliation.mjs` usa únicamente fixtures sintéticos y está incluida en `npm test`/CI.

## Gate siguiente

No iniciar **6.5 — Tests** hasta que esta rama pase CI y 6.4 se integre en `main`. No habilitar producción bancaria, pagos reales, transferencias reales, trading, retiros, secretos ni datos financieros reales.
