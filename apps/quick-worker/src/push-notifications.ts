// Empty-payload Web Push: notification never exposes financial details on lock screen.
// Push service endpoints are validated to avoid arbitrary outbound requests.
export const PUSH_SW = `self.addEventListener("push", event => {
  event.waitUntil(self.registration.showNotification("FinanzasOSS", {
    body: "Tengo una pregunta sobre la categoría de una compra.",
    tag: "finanzasoss-categoria-pendiente",
    data: { path: "/#questions" }
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const client = list.find(c => c.url.startsWith(self.location.origin + "/"));
    if (client) return client.focus().then(() => client.navigate("/#questions"));
    return clients.openWindow("/#questions");
  }));
});`;

function b64url(bytes: Uint8Array): string {
  let str = "";
  for (const value of bytes) str += String.fromCharCode(value);
  return btoa(str).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}
function decode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid VAPID key");
  const bytes = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(bytes, c => c.charCodeAt(0));
}
export function pushEndpoint(value: unknown): string {
  if (typeof value !== "string" || value.length > 2000 || value.length < 30) throw new Error("Invalid push subscription");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Invalid push subscription"); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) throw new Error("Invalid push subscription");
  if (!["web.push.apple.com", "fcm.googleapis.com", "updates.push.services.mozilla.com"].includes(url.hostname)) {
    throw new Error("Unsupported push endpoint");
  }
  return url.href;
}
export interface PushConfig {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}
export function pushEnabled(env: PushConfig): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY &&
    env.VAPID_SUBJECT && /^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT));
}
export async function sendCategoryPush(env: PushConfig, endpoint: string): Promise<boolean> {
  if (!pushEnabled(env)) return false;
  const validEndpoint = pushEndpoint(endpoint);
  const publicBytes = decode(env.VAPID_PUBLIC_KEY!);
  const secretBytes = decode(env.VAPID_PRIVATE_KEY!);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4 || secretBytes.length !== 32) return false;
  const x = b64url(publicBytes.slice(1, 33)), y = b64url(publicBytes.slice(33, 65));
  const key = await crypto.subtle.importKey("jwk", {
    kty: "EC", crv: "P-256", x, y, d: b64url(secretBytes), ext: false,
  }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const aud = new URL(validEndpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64url(new TextEncoder().encode(JSON.stringify({ aud, exp, sub: env.VAPID_SUBJECT })));
  const signingInput = header + "." + body;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput)));
  const token = signingInput + "." + b64url(sig);
  const result = await fetch(validEndpoint, {
    method: "POST",
    headers: { "Authorization": "vapid t=" + token + ", k=" + env.VAPID_PUBLIC_KEY,
      "TTL": "300", "Content-Length": "0" },
  });
  return result.ok || result.status === 201 || result.status === 202;
}
