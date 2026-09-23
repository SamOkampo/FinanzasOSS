export interface RuntimeConfig {
  environment: "development" | "test" | "production";
  publicBaseUrl: string;
}

export function parseRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const environment = env.NODE_ENV === "production" ? "production" : env.NODE_ENV === "test" ? "test" : "development";
  const publicBaseUrl = env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  return { environment, publicBaseUrl };
}
