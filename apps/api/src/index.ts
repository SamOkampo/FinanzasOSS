export interface HealthResponse {
  status: "ok";
  service: "finanzasos-api";
  version: string;
}

export function health(version = "0.0.0"): HealthResponse {
  return { status: "ok", service: "finanzasos-api", version };
}
