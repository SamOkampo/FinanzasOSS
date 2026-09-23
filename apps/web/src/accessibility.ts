export const accessibilityPolicy = Object.freeze({
  minimumTouchTargetPx: 44,
  minimumBodyContrast: "AA",
  moneyUsesTabularNumerals: true,
  positiveNegativeRequiresNonColorCue: true,
  reducedMotionSupported: true,
  privacyToggleReachableFromPrimarySpaces: true,
});

export function shouldUseReducedMotion(prefersReducedMotion: boolean): boolean {
  return prefersReducedMotion;
}
