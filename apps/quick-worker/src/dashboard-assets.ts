// Account-private PWA shell assets. No financial data is cached.
export const DASH_MANIFEST = JSON.stringify({
  id: "/dashboard", name: "FinanzasOSS · Mi panel", short_name: "FinanzasOSS",
  description: "Consulta tus movimientos y gastos desde tu iPhone de forma privada.",
  start_url: "/dashboard", scope: "/", display: "standalone", orientation: "portrait-primary",
  background_color: "#f5f3ee", theme_color: "#172c2c",
  lang: "es-CO", categories: ["finance", "productivity"],
  icons: [
    { src: "/dashboard-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
    { src: "/dashboard-icon-180.png", sizes: "180x180", type: "image/png", purpose: "any" },
  ],
});
export const DASH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="FinanzasOSS"><rect width="180" height="180" rx="41" fill="#091c1d"/><rect x="11" y="11" width="158" height="158" rx="34" fill="none" stroke="#23584d" stroke-width="2"/><g fill="#7cedc5"><rect x="41" y="36" width="18" height="107" rx="6"/><rect x="41" y="36" width="83" height="18" rx="6"/><rect x="41" y="86" width="68" height="18" rx="6"/></g><path d="M103 124 137 90m0 0-20 2m20-2-1 17" stroke="#b6d2f4" stroke-width="8" fill="none" stroke-linejoin="round"/></svg>`;
export const DASH_ICON_180_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAEjUlEQVR42u3dvVHcQBiAYbEoudjZjV0AkSmACkhJ3Ad1uA8Sp66AAiByB7RAxODAvhl+dD+Sdle7q+eNmGEYhPTcx3fi5jjbfNm+dqW0Oe9UYc8vxRxKD7CiX8cFgfcAqyXgPcjKdv0zwO5BVkuwe5DVEuweZLUEO8Cs4p5ELg4aZhViqAdZLa0gAWa1NK370jFvry5d4MJ6un/Ig3rCpD4b/VqOxJgBBvxdI1GPA50I8yHEWaaByr5eI1CfDjoy5n0nBeB2gEe9lieiPg10YswQt4s7N+qsoEEGe3nQCTCDvE7YOVAfBh0BM8iK7uAA6gCzcvT2+s++NXvAZqjiESmoT2x45Zg5nXcHC7KSGhlYPUKRB6rVTOvYkzrEnM4wKyvqAavRJrTXYKgEPyHm7mw6K7uXD2ZDzEcXzFp6nw5zpzPMWhz1G7vBqVRLzQJtOqu01SPMxSylaKqvMGd/Np2VakpP3aPt0LJD251V6i5tQquxCe0NY9RKm/PubPP126j35Shh3bh9vHPxRvTz+48qj3uKtepWDpids2ZAw+zcNQMaZucwOuil9meY13kup9y+c9tOVg4JaAloCWgBLQEtAS0BLQEtoNV8tb6UFGitDjPQMAMtmEuud3FlQktAS0BLQAtoCWgJaAloCWgBLQEtAS0BLQEtoCWgJaAloCWgBbQEtAS0BLQEtICWgJaAloCWgBbQUvmt7u10bx/vqjxubwNsQnsgAi2o//Xr95/Bj60cio461vpxDGpNkIFuGHWNEK0c2tvN9QXQgrqF9QNoqJtCDTTUTa0yQK8E9VyMtezlQJvWnhQKaqBVRFOe2NX0IAAaZhNaMAOtaI19Lcea/hQONMxAqz3MMe5VA61iMA99XGM9GOt+AjgE+Ob6otpVxYSGefTngFZVmGtGDTTMTaEGGuamAhpmoAUz0IIZaMEMNMwrxQw0zEALZqAFM9CCGWiYgRbMQAtmoAUz0CvrVKQwA90MapiBbgY1zEA3gxpmoJtBDTPQq3uiKKAFtAS0BLQEtICWgJaAloCWgBbQEtA5ivVvJNbw7yiAHtHT/UPXdV23vbqsDjXM9bVztnPX3MoxFSXMJnQzqGFeV1X+WzdItX9CP7+M+oIl92jZnw/2/OK2nezQUlugrR0qbt14B3rkHi0V13/DIdajSYo5nbPv0FN+HUipfYUY39SU1tK782fQ9mhVvj9H2aFNaZUynT+DnjilodZimD+YDakOTlrCSzgmPvWzUinWdI4+oa0eWmJvPg56xh0PqJUF8x6jZ5sv29fBz2zOo+1G1hFFd7EHdBj7BVN2ItNaOTAf36GhVkWYD68cEdcPKwjIUa77CQM2G+ihKQ32OiBHu9bRQEdEDTbIqTCPA50YNdztIF4K83jQkVGf8oQR8HoAJ7leI29MjAedCPUpJ0tllmzoTLjLNg10YtSArxTwTMzzQGdErZU14+8ffZRvDLYWhrwrlHIggjlGobQDEsxz6pMcmBVECw3BPumBgq3Mv837LAcOtjKtpX3WHwRskJsAve8HAxzgqkEDDnDi/gLvSxzb9b7BbwAAAABJRU5ErkJggg==";
// A service worker is installable but intentionally NEVER intercepts requests.
// Prior fetch/respondWith interception could surface Safari's "Load failed"
// when Cloudflare Access redirected or the network briefly disconnected.
export const DASH_SW = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// Intentionally NO fetch event handler; every request uses the native browser network stack.
self.addEventListener("push", (event) => {
  // Empty payload only. Do not reveal any amount, bank or account on locked screens.
  event.waitUntil(self.registration.showNotification("FinanzasOSS", {
    body:"¿Qué fue esta compra? Revisa tus categorías pendientes.",
    icon:"/dashboard-icon-180.png",
    badge:"/dashboard-icon-180.png",
    tag:"finanzasoss-finance-review",
    data:{url:"/dashboard#plan"},
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target=new URL("/dashboard#plan",self.location.origin).href;
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const window of windows) {
      if(new URL(window.url).origin===self.location.origin){
        await window.focus();
        if("navigate" in window) await window.navigate(target);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
`;
