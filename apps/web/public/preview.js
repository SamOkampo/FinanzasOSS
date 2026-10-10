const allowedViews = new Set(["overview", "import", "connections"]);
const navButtons = [...document.querySelectorAll("[data-view]")];
const viewPanels = [...document.querySelectorAll("[data-panel]")];
const announcement = document.getElementById("announcement");

const viewNames = Object.freeze({
  overview: "Resumen",
  import: "Importar datos",
  connections: "Conexiones",
});

function showView(view) {
  if (!allowedViews.has(view)) return;
  for (const button of navButtons) {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  for (const panel of viewPanels) {
    panel.hidden = panel.dataset.panel !== view;
  }
  if (announcement) announcement.textContent = "Sección: " + viewNames[view];
}

for (const button of navButtons) {
  button.addEventListener("click", () => showView(button.dataset.view));
}
for (const button of document.querySelectorAll("[data-view-target]")) {
  button.addEventListener("click", () => {
    const target = button.dataset.viewTarget;
    showView(target);
    document.getElementById("contenido")?.focus({ preventScroll: true });
  });
}
