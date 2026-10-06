import { primaryNavigation, type PrimarySpace } from "./navigation.js";

export interface SwipeGesture {
  deltaX: number;
  deltaY: number;
  pointerCount: number;
  startedOnInteractiveControl: boolean;
}

export interface SwipeNavigationResult {
  kind: "navigate" | "none";
  nextSpace?: PrimarySpace;
  reason: string;
}

export const mobileGesturePolicy = Object.freeze({
  minimumHorizontalDistancePx: 64,
  horizontalDominanceRatio: 1.25,
  singlePointerOnly: true,
  destructiveGesturesAllowed: false,
  financialActionGesturesAllowed: false,
  gestureScope: "primary_navigation_only" as const,
});

export function resolvePrimarySwipe(
  activeSpace: PrimarySpace,
  gesture: SwipeGesture,
): SwipeNavigationResult {
  if (gesture.pointerCount !== 1) {
    return { kind: "none", reason: "requires a single pointer" };
  }
  if (gesture.startedOnInteractiveControl) {
    return { kind: "none", reason: "interactive controls own the gesture" };
  }

  const horizontal = Math.abs(gesture.deltaX);
  const vertical = Math.abs(gesture.deltaY);
  if (horizontal < mobileGesturePolicy.minimumHorizontalDistancePx) {
    return { kind: "none", reason: "horizontal distance below threshold" };
  }
  if (horizontal < vertical * mobileGesturePolicy.horizontalDominanceRatio) {
    return { kind: "none", reason: "gesture is not predominantly horizontal" };
  }

  const ordered = [...primaryNavigation].sort((a, b) => a.priority - b.priority);
  const index = ordered.findIndex((item) => item.id === activeSpace);
  if (index < 0) return { kind: "none", reason: "active space is unknown" };

  const direction = gesture.deltaX < 0 ? 1 : -1;
  const target = ordered[index + direction];
  if (!target) return { kind: "none", reason: "already at navigation boundary" };

  return {
    kind: "navigate",
    nextSpace: target.id,
    reason: direction > 0 ? "swipe left advances primary space" : "swipe right returns primary space",
  };
}

export const financialPwaPolicy = Object.freeze({
  installable: true,
  displayMode: "standalone" as const,
  cacheApplicationShell: true,
  cacheFinancialApiResponses: false,
  cacheSensitiveFinancialData: false,
  cacheSecretsOrCredentials: false,
  offlineMoneyMovementAllowed: false,
  offlineTradingAllowed: false,
  offlineMode: "shell_and_non_sensitive_guidance_only" as const,
});
