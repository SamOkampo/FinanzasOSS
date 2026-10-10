export * from "./portfolio-overview.js";
export * from "./navigation.js";
export * from "./surfaces.js";
export * from "./accessibility.js";
export * from "./mobile-experience.js";
export * from "./financial-view-state.js";
export * from "./experience-quality.js";
export * from "./source-onboarding.js";

export interface DashboardShellModel {
  title: string;
  privacyMode: boolean;
  connectedInstitutions: number;
}

export function createDashboardShellModel(): DashboardShellModel {
  return { title: "FinanzasOSS", privacyMode: true, connectedInstitutions: 0 };
}
