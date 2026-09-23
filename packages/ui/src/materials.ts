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
