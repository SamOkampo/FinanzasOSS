export * from "./navigation.js";
export * from "./surfaces.js";
export * from "./accessibility.js";

export interface DashboardShellModel {
  title: string;
  privacyMode: boolean;
  connectedInstitutions: number;
}

export function createDashboardShellModel(): DashboardShellModel {
  return { title: "FinanzasOS", privacyMode: true, connectedInstitutions: 0 };
}
