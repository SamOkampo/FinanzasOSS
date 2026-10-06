import {
  financialMaterialPolicies,
  type FinancialMaterialRole,
} from "../../../packages/ui/src/materials.js";

export type FinancialSurface = "canvas" | "solid" | "glass" | "floating" | "privacy";

export interface SurfacePolicy {
  role: FinancialSurface;
  materialRole: FinancialMaterialRole;
  allowsSensitiveNumbers: boolean;
  allowsBackdropBlur: boolean;
  requiresPrivacyMask: boolean;
}

export const surfacePolicies: Record<FinancialSurface, SurfacePolicy> = {
  canvas: {
    role: "canvas",
    materialRole: "canvas",
    allowsSensitiveNumbers: false,
    allowsBackdropBlur: false,
    requiresPrivacyMask: false,
  },
  solid: {
    role: "solid",
    materialRole: "financial_solid",
    allowsSensitiveNumbers: true,
    allowsBackdropBlur: false,
    requiresPrivacyMask: false,
  },
  glass: {
    role: "glass",
    materialRole: "navigation_glass",
    allowsSensitiveNumbers: false,
    allowsBackdropBlur: true,
    requiresPrivacyMask: false,
  },
  floating: {
    role: "floating",
    materialRole: "floating_glass",
    allowsSensitiveNumbers: false,
    allowsBackdropBlur: true,
    requiresPrivacyMask: false,
  },
  privacy: {
    role: "privacy",
    materialRole: "privacy_overlay",
    allowsSensitiveNumbers: false,
    allowsBackdropBlur: true,
    requiresPrivacyMask: true,
  },
};

export function assertSurfaceForSensitiveMoney(surface: FinancialSurface): void {
  if (!surfacePolicies[surface].allowsSensitiveNumbers) {
    throw new Error(`Sensitive financial values require a solid surface, received: ${surface}`);
  }
}

export function assertPrivacyMaterial(surface: FinancialSurface, masked: boolean): void {
  const policy = surfacePolicies[surface];
  const material = financialMaterialPolicies[policy.materialRole];
  if (material.requiresPrivacyMask && !masked) {
    throw new Error("Privacy overlay requires masked sensitive values");
  }
}
