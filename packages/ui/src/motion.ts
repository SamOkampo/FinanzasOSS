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
