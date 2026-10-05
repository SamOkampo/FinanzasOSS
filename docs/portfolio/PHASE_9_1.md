# Fase 9.1 — UX Portafolios + agregación patrimonial

Este bloque define el modelo read-only para la vista Portafolios y la agregación patrimonial entre portafolios ya normalizados.

## Agregación

- Solo los portafolios activos participan en el total.
- Un portafolio sin métricas queda excluido y marcado como incompleto.
- FinanzasOSS **no inventa tasas FX**: si la moneda base del portafolio/métricas no coincide con la moneda de reporte, el portafolio se muestra pero se excluye del total consolidado.
- Métricas incompletas pueden aportar sus valores conocidos, pero el agregado queda marcado como incompleto.
- Portafolios archivados se muestran fuera del total.
- Métricas duplicadas para el mismo portafolio fallan cerrado.

## UX

El view-model de Portafolios expone:
- patrimonio total consolidado;
- aportes netos y rendimiento neto;
- tarjetas por portafolio;
- estados de calidad `complete/attention`;
- privacidad `visible/masked`;
- conteo de portafolios excluidos/incompletos;
- contrato explícito `readOnly=true`.

9.1 no conecta Binance, IBKR, Hapi ni wallets. Tampoco calcula FX sintético, ejecuta trading/retiros ni mueve dinero. Los conectores empiezan en 9.2.
