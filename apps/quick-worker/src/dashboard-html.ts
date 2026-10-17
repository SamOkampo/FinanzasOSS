// FinanzasOSS Studio: read-only PWA shell. No analytics or third-party resources.
export const DASH_HTML = `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1016">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FinanzasOSS">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="description" content="Tu espacio financiero privado. Revisa tus gastos diarios, semanales y mensuales.">
<link rel="manifest" href="/dashboard.webmanifest">
<link rel="icon" type="image/svg+xml" href="/dashboard-icon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/dashboard-icon-180.png">
<link rel="stylesheet" href="/dashboard.css">
<title>Panel financiero · FinanzasOSS</title>
<script src="/dashboard.js" defer></script>
</head>
<body>
<div class="app">
  <aside class="sidebar" aria-label="Navegación principal">
    <a href="/dashboard" class="logo" aria-label="FinanzasOSS, inicio">
      <span class="logo-mark" aria-hidden="true">F<span>↗</span></span>
      <span class="logo-type">FINANZAS<span>OSS</span><small>PRIVATE STUDIO</small></span>
    </a>
    <div class="side-caption">ESPACIO PERSONAL</div>
    <nav class="side-nav" aria-label="Secciones">
      <a href="#resumen" class="nav-item selected" aria-current="page"><span aria-hidden="true">◫</span> Resumen <i>01</i></a>
      <a href="#movimientos" class="nav-item"><span aria-hidden="true">⇄</span> Movimientos</a>
      <a href="#metodos" class="nav-item"><span aria-hidden="true">◉</span> Métodos de pago</a>
      <a href="/" class="nav-item"><span aria-hidden="true">＋</span> Captura web</a>
    </nav>
    <div class="side-bottom">
      <div class="safe-badge"><span class="live-dot"></span> ACCESO PRIVADO</div>
      <p>Los registros se consultan en vivo. No guardamos tu historial financiero en este dispositivo.</p>
      <div class="build-tag">FINANZASOSS · BETA</div>
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar">
      <div class="topbar-left"><span class="mobile-symbol" aria-hidden="true">F<span>↗</span></span><span>Mi espacio financiero</span><span class="top-slash">/</span><span class="top-muted">Panel</span></div>
      <div class="top-actions">
        <span id="today" class="date-pill">Bogotá</span>
        <button id="reload" class="round-action" type="button" aria-label="Actualizar datos" title="Actualizar">↻</button>
        <span class="profile" aria-label="Cuenta privada">SO</span>
      </div>
    </header>
    <main id="resumen" class="main">
      <div class="hero-header">
        <div><div class="eyebrow"><span class="small-spark">✦</span> TU PERSPECTIVA FINANCIERA</div><h1>Todo bajo <em>control.</em></h1><p>Una mirada clara a cada peso que sale.</p></div>
        <a href="/" class="capture-link"><span aria-hidden="true">＋</span> Nuevo movimiento</a>
      </div>
      <div class="period-strip" aria-label="Seleccionar período">
        <div class="period-controls" role="group" aria-label="Período de análisis">
          <button type="button" data-period="day" class="period-btn">Hoy</button>
          <button type="button" data-period="week" class="period-btn">Semana</button>
          <button type="button" data-period="month" class="period-btn active" aria-pressed="true">Mes</button>
          <button type="button" data-period="year" class="period-btn">Año</button>
          <button type="button" data-period="all" class="period-btn">Todo</button>
        </div>
        <span class="period-caption" id="period-label">Cargando período...</span>
      </div>
      <div id="error" class="alert" role="alert" hidden></div>
      <div id="testing" class="testing"><span class="live-dot"></span> ENTORNO STAGING · Movimientos de prueba, no saldos bancarios reales</div>
      <section class="kpis" aria-label="Indicadores financieros">
        <article class="kpi kpi-main">
          <div class="kpi-label">GASTOS DEL PERÍODO <span class="kpi-icon">↗</span></div>
          <div class="kpi-number" id="kpi-total" aria-live="polite">—</div>
          <div class="kpi-footer"><span id="kpi-compare" class="delta muted">Calculando...</span><span class="kpi-note">vs. período anterior</span></div>
          <div class="kpi-decoration" aria-hidden="true">◌</div>
        </article>
        <article class="kpi"><div class="kpi-label">MOVIMIENTOS <span class="kpi-icon">⇄</span></div><div class="kpi-number" id="kpi-count">—</div><div class="kpi-footer"><span class="kpi-note">Gastos registrados en el período</span></div></article>
        <article class="kpi"><div class="kpi-label">PROMEDIO POR GASTO <span class="kpi-icon">◈</span></div><div class="kpi-number" id="kpi-average">—</div><div class="kpi-footer"><span class="kpi-note">Monto medio de tus registros</span></div></article>
        <article class="kpi"><div class="kpi-label">TOTAL HISTÓRICO <span class="kpi-icon">▤</span></div><div class="kpi-number" id="kpi-all">—</div><div class="kpi-footer"><span class="kpi-note" id="all-count">Todos tus gastos en COP</span></div></article>
      </section>
      <section class="analytics">
        <article class="panel trend-panel">
          <div class="panel-heading"><div><div class="panel-eyebrow">01 / TENDENCIAS</div><h2>El ritmo de tus gastos</h2><p id="trend-subtitle">Evolución durante el período</p></div><div class="chart-tag"><span></span> Gasto COP</div></div>
          <div class="chart-wrap"><svg id="trend" role="img" aria-label="Gráfico de evolución de gastos" viewBox="0 0 800 255" preserveAspectRatio="none">
              <defs><linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#73dfc0" stop-opacity=".28"/><stop offset="100%" stop-color="#73dfc0" stop-opacity="0"/></linearGradient></defs>
              <g id="gridlines"></g><path id="trend-area" fill="url(#trendGradient)"></path><path id="trend-line" fill="none" stroke="#80ebcb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path><g id="trend-dots"></g>
          </svg><div class="chart-ends"><span id="chart-first">—</span><span id="chart-last">—</span></div></div>
          <div class="chart-foot"><span><i class="mint-indicator"></i> Gastos registrados</span><span id="trend-total">—</span></div>
        </article>
        <article id="metodos" class="panel method-panel">
          <div class="panel-heading"><div><div class="panel-eyebrow">02 / DISTRIBUCIÓN</div><h2>Así estás pagando</h2><p>Métodos utilizados</p></div></div>
          <div class="donut-area"><div id="donut" class="donut" role="img" aria-label="Distribución del gasto por método de pago"><div class="donut-hole"><span>DISTRIBUIDO</span><strong id="donut-total">—</strong><small>Gastos COP</small></div></div></div>
          <div id="methods" class="methods" aria-live="polite"><p class="empty-small">Cargando...</p></div>
        </article>
      </section>
      <section class="secondary-analytics">
        <article class="panel bars-panel"><div class="panel-heading"><div><div class="panel-eyebrow">03 / ACTIVIDAD</div><h2>Movimiento por día</h2><p>Últimos 7 días · horario de Colombia</p></div></div><div id="week-bars" class="week-bars"></div></article>
        <article class="panel insight-panel"><div class="panel-heading"><div><div class="panel-eyebrow">04 / PERSPECTIVA</div><h2>En cifras</h2><p>Lo que registraste hasta ahora</p></div></div><div class="insight-row"><span>Día con más gastos</span><strong id="peak-day">—</strong></div><div class="insight-row"><span>Método predominante</span><strong id="top-method">—</strong></div><div class="insight-row"><span>Movimientos en el historial</span><strong id="all-movements">—</strong></div><div class="insight-note">Solo se consideran gastos para los totales; las transferencias propias no se suman como gasto.</div></article>
      </section>
      <section id="movimientos" class="panel history">
        <div class="history-heading"><div><div class="panel-eyebrow">05 / TU HISTORIAL</div><h2>Todos tus movimientos</h2><p>Sin cuentas inventadas. Cada registro, tal como ocurrió.</p></div><div class="history-actions"><span id="history-count" class="history-count">— movimientos</span><button id="refresh-history" type="button" class="text-button">Actualizar ↻</button></div></div>
        <div class="table-wrap"><table aria-label="Historial de movimientos financieros"><thead><tr><th>CONCEPTO</th><th>FECHA</th><th>MÉTODO</th><th class="align-right">MONTO</th></tr></thead><tbody id="history-body"><tr><td colspan="4" class="empty-row">Cargando historial...</td></tr></tbody></table></div>
        <div class="history-bottom"><p id="history-status">Mostrando movimientos recientes</p><button type="button" id="load-more" class="more-btn" hidden>Cargar más movimientos <span>↓</span></button></div>
      </section>
      <footer class="footer"><span>FINANZASOSS <i>●</i> CONTROLA TU DINERO CON CLARIDAD</span><span>Datos privados · America/Bogota · COP</span></footer>
    </main>
  </div>
  <nav class="mobile-bottom" aria-label="Navegación móvil"><a href="#resumen" class="selected">⌂<small>Resumen</small></a><a href="#movimientos">⇄<small>Actividad</small></a><a href="/" class="mobile-add">＋<small>Registrar</small></a><a href="#metodos">◉<small>Métodos</small></a></nav>
</div>
</body></html>`;
