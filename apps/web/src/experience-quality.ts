export interface ExperiencePerformanceSample {
  initialScriptBytes: number;
  criticalCssBytes: number;
  interactionLatencyMs: number;
  layoutShift: number;
}

export interface ExperiencePerformanceResult {
  passes: boolean;
  violations: readonly string[];
}

export const experiencePerformanceBudgets = Object.freeze({
  initialScriptBytes: 225 * 1024,
  criticalCssBytes: 64 * 1024,
  interactionLatencyMs: 200,
  layoutShift: 0.1,
});

export function evaluateExperiencePerformance(
  sample: ExperiencePerformanceSample,
): ExperiencePerformanceResult {
  const violations: string[] = [];

  if (sample.initialScriptBytes > experiencePerformanceBudgets.initialScriptBytes) {
    violations.push("initial_script_budget_exceeded");
  }
  if (sample.criticalCssBytes > experiencePerformanceBudgets.criticalCssBytes) {
    violations.push("critical_css_budget_exceeded");
  }
  if (sample.interactionLatencyMs > experiencePerformanceBudgets.interactionLatencyMs) {
    violations.push("interaction_latency_budget_exceeded");
  }
  if (sample.layoutShift > experiencePerformanceBudgets.layoutShift) {
    violations.push("layout_shift_budget_exceeded");
  }

  return Object.freeze({
    passes: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

export interface InteractiveControlAudit {
  widthPx: number;
  heightPx: number;
  hasAccessibleName: boolean;
  keyboardReachable: boolean;
  focusVisible: boolean;
}

export interface AccessibilityAuditResult {
  passes: boolean;
  violations: readonly string[];
}

export function auditInteractiveControl(
  control: InteractiveControlAudit,
): AccessibilityAuditResult {
  const violations: string[] = [];

  if (control.widthPx < 44 || control.heightPx < 44) {
    violations.push("touch_target_below_44px");
  }
  if (!control.hasAccessibleName) violations.push("accessible_name_missing");
  if (!control.keyboardReachable) violations.push("keyboard_access_missing");
  if (!control.focusVisible) violations.push("visible_focus_missing");

  return Object.freeze({
    passes: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

export type FinancialStatusAnnouncement =
  | "loading"
  | "updated"
  | "empty"
  | "error";

export function financialStatusAnnouncement(
  status: FinancialStatusAnnouncement,
): string {
  switch (status) {
    case "loading":
      return "Actualizando información financiera.";
    case "updated":
      return "Información financiera actualizada.";
    case "empty":
      return "No hay información disponible para esta sección.";
    case "error":
      return "No pudimos actualizar esta sección.";
  }
}

export const experienceAccessibilityPolicy = Object.freeze({
  minimumTouchTargetPx: 44,
  keyboardEquivalentRequired: true,
  visibleFocusRequired: true,
  nonColorCueRequired: true,
  reducedMotionRequired: true,
  statusRegionRequiredForAsyncUpdates: true,
  announcementsMayIncludeSensitiveAmounts: false,
  deferredSectionsMayContainPrimaryNetWorthSummary: false,
});
