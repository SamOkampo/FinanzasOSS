import createQpdf, { type QpdfInstance } from "@neslinesli93/qpdf-wasm";
import {readDaviviendaPdf} from "./davivienda-pdf.js";

type PdfReply =
  | { status: "plain" | "password_required" | "incorrect_password" | "unreadable" | "too_large" }
  | { status: "unlocked"; bytes: Uint8Array<ArrayBuffer> };

const MAX_BYTES = 4_000_000;
const INPUT = "/input.pdf";
const OUTPUT = "/output.pdf";

export async function openStatementPdf(file: File, password: string, wasmUrl: string): Promise<PdfReply> {
  if (file.size > MAX_BYTES) return { status: "too_large" };
  if (file.size < 6 || password.includes("\0")) return { status: "unreadable" };

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") {
      return { status: "unreadable" };
    }

    // QPDF reports the reason for code 2 on stderr. Capture just the fixed
    // message for our virtual input path and discard every other diagnostic.
    let invalidPassword = false;
    const originalError = console.error;
    const originalLog = console.log;
    console.log = () => {};
    console.error = (message: unknown) => {
      if (typeof message === "string" && message.endsWith(": " + INPUT + ": invalid password")) {
        invalidPassword = true;
      }
    };
    let engine: Promise<QpdfInstance>;
    try {
      engine = createQpdf({ locateFile: () => wasmUrl });
    } finally {
      console.error = originalError;
      console.log = originalLog;
    }

    const qpdf = await engine;
    const fs = qpdf.FS as unknown as QpdfInstance["FS"] & {
      writeFile(path: string, data: Uint8Array): void;
    };
    fs.writeFile(INPUT, bytes);
    const status = qpdf.callMain(["--password=" + password, "--requires-password", INPUT]);
    if (status === 0 || invalidPassword) {
      return { status: password ? "incorrect_password" : "password_required" };
    }
    if (status === 2) {
      return { status: qpdf.callMain(["--warning-exit-0", "--check", INPUT]) === 0 ? "plain" : "unreadable" };
    }
    if (status !== 3) return { status: "unreadable" };
    const decrypted = qpdf.callMain(["--password=" + password, "--warning-exit-0", "--decrypt", INPUT, OUTPUT]);
    if (decrypted !== 0) return { status: "unreadable" };
    const unlocked = fs.readFile(OUTPUT);
    return unlocked.byteLength <= MAX_BYTES
      ? { status: "unlocked", bytes: new Uint8Array(unlocked) }
      : { status: "too_large" };
  } catch {
    return { status: "unreadable" };
  }
}

if (typeof self !== "undefined") {
  self.onmessage = async (event: MessageEvent<{ file: File; password: string }>) => {
    const { file, password } = event.data;
    const result = await openStatementPdf(file, password, "/statement-pdf-engine.wasm");
    const bytes = result.status==="unlocked" ? result.bytes :
      result.status==="plain" ? new Uint8Array(await file.arrayBuffer()) : null;
    let statement = null;
    if(bytes){
      try { statement = await readDaviviendaPdf(bytes); } catch { /* Use the existing inspection flow. */ }
    }
    self.postMessage({...result,statement}, {transfer: result.status === "unlocked" ? [result.bytes.buffer] : []});
  };
}
