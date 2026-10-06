import type { MotionPreference } from "./motion.js";

export type ColorSchemePreference = "light" | "dark" | "system";
export type SystemColorScheme = "light" | "dark";
export type MotionPreferenceSetting = "system" | "reduced";

export interface ResolvedExperiencePreferences {
  colorScheme: SystemColorScheme;
  colorSchemeSource: "user" | "system";
  motion: MotionPreference;
  motionSource: "user_reduced" | "system_reduced" | "full";
}

export function resolveExperiencePreferences(input: {
  colorSchemePreference: ColorSchemePreference;
  systemColorScheme: SystemColorScheme;
  motionPreference: MotionPreferenceSetting;
  systemPrefersReducedMotion: boolean;
}): ResolvedExperiencePreferences {
  const colorScheme =
    input.colorSchemePreference === "system"
      ? input.systemColorScheme
      : input.colorSchemePreference;

  const motion: MotionPreference =
    input.motionPreference === "reduced" || input.systemPrefersReducedMotion
      ? "reduced"
      : "full";

  return Object.freeze({
    colorScheme,
    colorSchemeSource: input.colorSchemePreference === "system" ? "system" : "user",
    motion,
    motionSource:
      input.motionPreference === "reduced"
        ? "user_reduced"
        : input.systemPrefersReducedMotion
          ? "system_reduced"
          : "full",
  });
}

export const experiencePreferencePolicy = Object.freeze({
  colorSchemeOptions: ["light", "dark", "system"] as const,
  motionOptions: ["system", "reduced"] as const,
  systemReducedMotionCanBeOverriddenToFull: false,
  storesFinancialData: false,
});
