// RFC 8291 / RFC 8188, one aes128gcm record with a fresh sender key and salt.
const encode = new TextEncoder();

function fromBase64Url(value: string): Uint8Array {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}

async function hkdf(key: CryptoKey, salt: Uint8Array, info: Uint8Array, bits: number) {
  return crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bits);
}

export async function encryptPushReceipt(p256dh: string, auth: string, receipt: "expense" | "income" | "test"): Promise<ArrayBuffer> {
  const recipient = fromBase64Url(p256dh);
  const recipientKey = await crypto.subtle.importKey("raw", recipient, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sender = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const senderPublic = new Uint8Array(await crypto.subtle.exportKey("raw", sender.publicKey));
  const secret = await crypto.subtle.deriveBits({ name: "ECDH", public: recipientKey }, sender.privateKey, 256);
  const sharedKey = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveBits"]);
  const label = encode.encode("WebPush: info\0");
  const info = new Uint8Array(label.length + recipient.length + senderPublic.length);
  info.set(label);
  info.set(recipient, label.length);
  info.set(senderPublic, label.length + recipient.length);
  const ikm = await hkdf(sharedKey, fromBase64Url(auth), info, 256);
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const [cek, nonce] = await Promise.all([
    hkdf(key, salt, encode.encode("Content-Encoding: aes128gcm\0"), 128),
    hkdf(key, salt, encode.encode("Content-Encoding: nonce\0"), 96),
  ]);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes,
    encode.encode(receipt + "\x02")));
  const body = new Uint8Array(21 + senderPublic.length + ciphertext.length);
  body.set(salt);
  new DataView(body.buffer).setUint32(16, 4096);
  body[20] = senderPublic.length;
  body.set(senderPublic, 21);
  body.set(ciphertext, 21 + senderPublic.length);
  return body.buffer;
}
