# FinanzasOS — Design Language v0.1

## Intención
FinanzasOS debe sentirse como una herramienta financiera personal de alta confianza: calmada, táctil, precisa y viva. La referencia no es una landing SaaS sino software de producto: cada transición debe ayudar a entender dónde está el dinero, qué cambió y qué acción es segura.

## Lo que evitamos
- Dashboard genérico con sidebar fijo + cuadrícula de cards intercambiables.
- Gradiente morado/azul decorativo sin significado.
- Glassmorphism en todas partes.
- CTA enormes estilo marketing dentro de la aplicación.
- Animaciones largas que bloqueen lectura o navegación.
- Iconografía/ornamentos "AI".

## Espacios principales
La navegación primaria usa cinco espacios:

1. **Hoy** — posición financiera actual, safe-to-spend, alertas y próximos compromisos.
2. **Movimientos** — timeline transaccional, búsqueda, filtros y reconciliación.
3. **Portafolios** — brokers, exchanges, wallets, posiciones, aportes y rendimiento.
4. **Plan** — presupuesto, metas, fondo de emergencia y capital invertible.
5. **Mapa financiero** — cuentas e inversiones como nodos patrimoniales y flujo entre ellas.

Perfil, conexiones y ajustes viven en navegación secundaria desde avatar/menú contextual para evitar saturación en móvil.

## Materiales
### Canvas
Fondo sobrio con profundidad muy ligera. Nunca compite con cifras.

### Floating surface
Panel que flota sobre el canvas. Blur moderado, borde translúcido y contraste suficiente. Se usa solo para elementos temporales o de navegación.

### Solid financial surface
Cuentas, cifras y datos sensibles priorizan legibilidad sobre translucidez.

### Capsule controls
Acciones primarias/secundarias con geometría cápsula, profundidad táctil y estados de presión. La forma comunica "control manipulable", no decoración.

## Jerarquía tipográfica
1. **Money** — cifras principales con tabular numerals.
2. **Decision** — safe-to-spend, alertas, próximos pagos/aportes.
3. **Context** — categorías, institución, broker, fecha.
4. **Metadata** — detalles técnicos, sync, consentimiento.

## Profundidad
Solo cuatro niveles semánticos:
- `canvas`
- `surface`
- `floating`
- `modal`

No usar z-index arbitrarios.

## Motion principles
1. **Continuidad:** un objeto se transforma o desplaza; evita desaparecer y reaparecer sin relación.
2. **Causalidad:** la animación responde a una acción clara del usuario.
3. **Velocidad:** la mayoría de feedback ocurre en 120–320 ms.
4. **Dinero estable:** cifras no rebotan ni saltan. Los cambios numéricos son suaves y legibles.
5. **Reduced motion:** elimina escalado/parallax y usa crossfade corto cuando el sistema lo solicite.

## Microinteracciones clave
- Conectar institución: pasa de `disconnected` a `connecting` y se integra al mapa financiero.
- Actualizar saldo/portafolio: shimmer mínimo localizado.
- Transferencia detectada: dos movimientos se unen visualmente, explicando por qué no cuentan como gasto.
- Aporte a inversión detectado: el dinero se desplaza visualmente de liquidez a Portafolios sin simular una pérdida patrimonial.
- Privacidad: pulsar el saldo lo oculta mediante morph/fade.
- Capsule button: presión sutil (escala 0.98 máx.) + elevación reducida.

## Accesibilidad
- Contraste AA mínimo en información financiera.
- Nunca depender solo de color para positivo/negativo.
- Targets táctiles >= 44px.
- Focus visible y coherente.
- `prefers-reduced-motion` respetado por defecto.
- Saldos ocultables desde cualquier pantalla principal.
