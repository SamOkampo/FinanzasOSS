export const IMPORTS_HTML = `
<section class="space" id="space-imports" data-space="imports" aria-labelledby="heading-imports" hidden>
  <div class="page-intro import-intro">
    <h1 id="heading-imports">Importar <em>extractos</em></h1>
  </div>
  <div class="import-hub">
    <section class="module import-studio ai-document-studio" aria-labelledby="document-ai-heading">
      <div class="import-document-head">
        <h2 id="document-ai-heading">Subir extracto</h2>
        <p>PDF, Excel o CSV · Hasta 4 MB</p>
      </div>
      <div class="import-file-picker">
        <button id="ai-document-pick" type="button" class="solid-button" aria-describedby="ai-document-filename" disabled>Elegir archivo</button>
        <input id="ai-document-file" type="file" accept=".pdf,.xlsx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
        <span id="ai-document-filename"></span>
      </div>
      <button id="ai-document-password-open" class="soft-button import-password-open" type="button" aria-controls="ai-document-password-form" aria-expanded="false" hidden>Ingresar contraseña del PDF</button>
      <form id="ai-document-password-form" class="import-password-form" autocomplete="off" hidden>
        <label for="ai-document-password">Contraseña del PDF
          <input id="ai-document-password" type="password" required autocomplete="off" aria-describedby="ai-document-file-status">
        </label>
        <button type="submit" class="solid-button">Desbloquear PDF</button>
      </form>
      <p id="ai-document-file-status" class="import-file-status" role="status" aria-live="polite"></p>
      <div id="ai-document-analysis-controls" data-analysis-available="false" hidden>
        <div class="import-options">
          <label for="ai-document-bank">Banco del extracto
            <input id="ai-document-bank" type="text" maxlength="80" placeholder="Ej. Davivienda" autocomplete="off">
          </label>
          <label for="ai-document-method">Medio de pago
            <select id="ai-document-method">
              <option value="bank_transfer">Cuenta bancaria</option>
              <option value="debit_card">Tarjeta débito vinculada</option>
            </select>
          </label>
        </div>
        <label class="ai-document-consent" for="ai-document-consent">
          <input id="ai-document-consent" type="checkbox">
          <span>Autorizo a Cloudflare a procesar este archivo con Qwen para preparar la vista previa.</span>
        </label>
        <button type="button" class="solid-button" id="ai-document-inspect" disabled>Analizar extracto</button>
      </div>
      <p id="ai-document-feedback" class="import-file-status" role="status" aria-live="polite"></p>
      <section id="ai-document-results" class="ai-document-results" aria-labelledby="ai-document-results-title" hidden>
        <h3 id="ai-document-results-title">Vista previa</h3>
        <p id="ai-document-summary" role="status" aria-live="polite"></p>
        <div id="ai-document-reconcile" class="ai-document-reconcile" hidden>
          <p id="ai-document-reconcile-summary" role="status" aria-live="polite"></p>
          <div id="ai-document-reconcile-rows" class="import-review-list"></div>
          <button id="ai-document-confirm-open" type="button" class="solid-button" hidden>Revisar y confirmar movimientos</button>
        </div>
        <details class="import-disclosure import-help">
          <summary>Tablas y columnas detectadas</summary>
          <div id="ai-document-tables" class="ai-document-tables"></div>
        </details>
      </section>
      <details class="import-disclosure import-help">
        <summary>Cómo funciona y privacidad</summary>
        <p>La clave se usa en tu dispositivo. Si autorizas el análisis, Cloudflare recibe el archivo desbloqueado para extraer contenido y Qwen recibe un resumen de su estructura.</p>
        <p>Revisa las sugerencias antes de guardar. FinanzasOSS compara extractos bancarios en COP con tus movimientos registrados cuando indicas el banco.</p>
      </details>
    </section>
    <details class="import-disclosure import-secondary">
      <summary>Importar CSV manualmente</summary>
      <section class="import-studio import-secondary-body" aria-label="Importación manual de CSV">
        <details class="import-disclosure import-help">
          <summary>Formato del CSV</summary>
          <p>CSV UTF-8, hasta 50 filas y 64 KB. Usa fechas AAAA-MM-DD, montos positivos y una columna de tipo con <code>debit</code> o <code>credit</code>.</p>
        </details>
        <label for="import-file">Archivo CSV</label><input id="import-file" type="file" accept=".csv,text/csv" aria-describedby="import-status"/>
        <div class="import-options">
          <label for="import-bank">Nombre del banco del extracto<input id="import-bank" type="text" maxlength="80" placeholder="Ej. Bancolombia" autocomplete="off"/></label>
          <label for="import-payment-method">Medio de pago<select id="import-payment-method"><option value="debit_card">Tarjeta débito</option><option value="credit_card">Tarjeta crédito</option><option value="bank_transfer">Transferencia bancaria</option></select></label>
        </div>
        <div id="import-mapping" hidden><h3>Asignar columnas</h3>
          <div class="import-options">
            <label>Fecha<select id="import-col-date"></select></label>
            <label>Concepto<select id="import-col-description"></select></label>
            <label>Importe<select id="import-col-amount"></select></label>
            <label>Tipo (debit/credit)<select id="import-col-direction"></select></label>
            <label>Moneda, opcional<select id="import-col-currency"></select></label>
            <label>ID de transacción, opcional<select id="import-col-external"></select></label>
          </div>
        </div>
        <div class="import-file-actions">
          <button class="solid-button" id="import-v41-preview" type="button" disabled>Revisar movimientos</button>
          <button class="soft-button" id="import-preview" type="button" disabled>Revisar solo débitos</button>
        </div>
        <section id="import-v41-review" class="v41-import-review" aria-labelledby="import-v41-title" hidden>
          <h3 id="import-v41-title">Vista previa de movimientos</h3>
          <p id="import-v41-summary" role="status" aria-live="polite"></p>
          <div id="import-v41-rows" class="import-review-list"></div>
          <button id="import-v41-confirm-open" type="button" class="solid-button" hidden>Decidir qué importar</button>
        </section>
        <p id="import-status" role="status" aria-live="polite"></p>
        <div id="import-review" hidden><h3>Vista previa de débitos</h3>
          <p id="import-summary" aria-live="polite"></p>
          <div class="import-review-list" id="import-rows"></div>
          <div class="import-confirm-actions"><button id="import-confirm" type="button" class="solid-button" disabled>Confirmar importación seleccionada</button><button id="import-cancel" type="button" class="soft-button">Cancelar revisión</button></div>
          <p class="budget-note">La importación añade gastos sin asignar una cuenta bancaria. Excluye posibles duplicados por fecha, monto y concepto. Si una compra ya está registrada, comprueba Movimientos antes de importar.</p>
        </div>
      </section>
    </details>
    <details class="import-disclosure import-secondary">
      <summary>Exportar Excel</summary>
      <div class="import-secondary-body">
        <p>Descarga los movimientos y categorías de tu perfil. Para abrirlos en Google Sheets, importa el Excel desde Drive.</p>
        <a href="/api/quick/export.xlsx" class="solid-button export-button" id="export-excel">Descargar Excel</a>
      </div>
    </details>
    <button id="v41-history-open" class="soft-button import-history-link" type="button">Historial de importación</button>
  </div>
</section>
`;
