export type MotionPreference = "full" | "reduced";

export const motionDurations = Object.freeze({
  instant: 120,
  quick: 180,
  standard: 280,
  expressive: 420,
});

export const springPresets = Object.freeze({
  control: { stiffness: 320, damping: 28, mass: 0.8 },
  panel: { stiffness: 240, damping: 30, mass: 1 },
});

export function resolveMotionDuration(
  token: keyof typeof motionDurations,
  preference: MotionPreference,
): number {
  if (preference === "reduced") return token === "instant" ? 80 : 120;
  return motionDurations[token];
}

export const interactionMotion = Object.freeze({
  capsulePressScale: 0.98,
  hoverLiftPx: 2,
  privacyMorphMs: motionDurations.quick,
  balanceRefreshMs: motionDurations.standard,
});

export type FinancialMotionIntent =
  | "navigation"
  | "disclosure"
  | "privacy"
  | "data_refresh"
  | "transfer_reconciliation"
  | "investment_contribution"
  | "modal";

export interface FinancialMotionProfile {
  intent: FinancialMotionIntent;
  durationMs: number;
  transform: "none" | "translate" | "scale" | "morph";
  opacityTransition: boolean;
  spatialContinuity: boolean;
  loops: false;
}

const fullMotionProfiles: Readonly<Record<FinancialMotionIntent, Omit<FinancialMotionProfile, "intent">>> =
  Object.freeze({
    navigation: {
      durationMs: motionDurations.standard,
      transform: "translate",
      opacityTransition: true,
      spatialContinuity: true,
      loops: false,
    },
    disclosure: {
      durationMs: motionDurations.quick,
      transform: "scale",
      opacityTransition: true,
      spatialContinuity: true,
      loops: false,
    },
    privacy: {
      durationMs: interactionMotion.privacyMorphMs,
      transform: "morph",
      opacityTransition: true,
      spatialContinuity: true,
      loops: false,
    },
    data_refresh: {
      durationMs: interactionMotion.balanceRefreshMs,
      transform: "none",
      opacityTransition: true,
      spatialContinuity: false,
      loops: false,
    },
    transfer_reconciliation: {
      durationMs: motionDurations.standard,
      transform: "translate",
      opacityTransition: true,
      spatialContinuity: true,
      loops: false,
    },
    investment_contribution: {
      durationMs: motionDurations.standard,
      transform: "translate",
      opacityTransition: true,
      spatialContinuity: true,
      loops: false,
    },
    modal: {
      durationMs: motionDurations.standard,
      transform: "scale",
      opacityTransition: true,
      spatialContinuity: true,
      loops: false,
    },
  });

export function resolveFinancialMotion(
  intent: FinancialMotionIntent,
  preference: MotionPreference,
): FinancialMotionProfile {
  const profile = fullMotionProfiles[intent];
  if (preference === "reduced") {
    return Object.freeze({
      intent,
      durationMs: resolveMotionDuration("standard", "reduced"),
      transform: "none",
      opacityTransition: true,
      spatialContinuity: false,
      loops: false,
    });
  }

  return Object.freeze({ intent, ...profile });
}

export const premiumMotionPolicy = Object.freeze({
  continuousDecorationAllowed: false,
  balanceCountUpAllowed: false,
  hoverOnlyAffordancesAllowed: false,
  maxPressScale: interactionMotion.capsulePressScale,
  reducedMotionUsesTransform: false,
});
