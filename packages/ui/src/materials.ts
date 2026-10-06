export const radii = Object.freeze({
  control: 999,
  card: 24,
  panel: 30,
  modal: 34,
});

export const blur = Object.freeze({
  navigation: 24,
  floating: 20,
  overlay: 28,
});

export const elevation = Object.freeze({
  canvas: 0,
  surface: 10,
  floating: 30,
  modal: 50,
});

export type SurfaceRole = "canvas" | "surface" | "floating" | "modal";

export function elevationFor(role: SurfaceRole): number {
  return elevation[role];
}

export type FinancialMaterialRole =
  | "canvas"
  | "financial_solid"
  | "navigation_glass"
  | "floating_glass"
  | "privacy_overlay";

export interface FinancialMaterialPolicy {
  role: FinancialMaterialRole;
  blurPx: number;
  elevation: number;
  allowsSensitiveNumbers: boolean;
  requiresPrivacyMask: boolean;
  decorativeOnly: false;
}

export const financialMaterialPolicies: Readonly<Record<FinancialMaterialRole, FinancialMaterialPolicy>> =
  Object.freeze({
    canvas: {
      role: "canvas",
      blurPx: 0,
      elevation: elevation.canvas,
      allowsSensitiveNumbers: false,
      requiresPrivacyMask: false,
      decorativeOnly: false,
    },
    financial_solid: {
      role: "financial_solid",
      blurPx: 0,
      elevation: elevation.surface,
      allowsSensitiveNumbers: true,
      requiresPrivacyMask: false,
      decorativeOnly: false,
    },
    navigation_glass: {
      role: "navigation_glass",
      blurPx: blur.navigation,
      elevation: elevation.floating,
      allowsSensitiveNumbers: false,
      requiresPrivacyMask: false,
      decorativeOnly: false,
    },
    floating_glass: {
      role: "floating_glass",
      blurPx: blur.floating,
      elevation: elevation.floating,
      allowsSensitiveNumbers: false,
      requiresPrivacyMask: false,
      decorativeOnly: false,
    },
    privacy_overlay: {
      role: "privacy_overlay",
      blurPx: blur.overlay,
      elevation: elevation.modal,
      allowsSensitiveNumbers: false,
      requiresPrivacyMask: true,
      decorativeOnly: false,
    },
  });
