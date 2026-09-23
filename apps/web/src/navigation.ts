export type PrimarySpace = "today" | "movement" | "portfolio" | "plan" | "map";
export type SecondarySpace = "profile" | "connections" | "settings";

export interface NavigationItem {
  id: PrimarySpace;
  label: string;
  shortLabel: string;
  priority: number;
}

export const primaryNavigation: readonly NavigationItem[] = Object.freeze([
  { id: "today", label: "Hoy", shortLabel: "Hoy", priority: 1 },
  { id: "movement", label: "Movimientos", shortLabel: "Mov.", priority: 2 },
  { id: "portfolio", label: "Portafolios", shortLabel: "Portaf.", priority: 3 },
  { id: "plan", label: "Plan", shortLabel: "Plan", priority: 4 },
  { id: "map", label: "Mapa financiero", shortLabel: "Mapa", priority: 5 },
]);

export const secondaryNavigation: readonly SecondarySpace[] = Object.freeze(["profile", "connections", "settings"]);

export interface NavigationState {
  activeSpace: PrimarySpace;
  previousSpace?: PrimarySpace;
  privacyMode: boolean;
}

export function navigate(state: NavigationState, next: PrimarySpace): NavigationState {
  if (state.activeSpace === next) return state;
  return { ...state, previousSpace: state.activeSpace, activeSpace: next };
}

export function togglePrivacyMode(state: NavigationState): NavigationState {
  return { ...state, privacyMode: !state.privacyMode };
}
