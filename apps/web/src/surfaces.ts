export type FinancialSurface = "canvas" | "solid" | "glass" | "floating";

export interface SurfacePolicy {
  role: FinancialSurface;
  allowsSensitiveNumbers: boolean;
  allowsBackdropBlur: boolean;
}

export const surfacePolicies: Record<FinancialSurface, SurfacePolicy> = {
  canvas: { role: "canvas", allowsSensitiveNumbers: false, allowsBackdropBlur: false },
  solid: { role: "solid", allowsSensitiveNumbers: true, allowsBackdropBlur: false },
  glass: { role: "glass", allowsSensitiveNumbers: false, allowsBackdropBlur: true },
  floating: { role: "floating", allowsSensitiveNumbers: false, allowsBackdropBlur: true },
};

export function assertSurfaceForSensitiveMoney(surface: FinancialSurface): void {
  if (!surfacePolicies[surface].allowsSensitiveNumbers) {
    throw new Error(`Sensitive financial values require a solid surface, received: ${surface}`);
  }
}
