import { primaryNavigation, secondaryNavigation } from "../../web/src/navigation.js";
import { buildSourceOnboarding } from "../../web/src/source-onboarding.js";
import { financialPwaPolicy } from "../../web/src/mobile-experience.js";
import { motionDurations, premiumMotionPolicy } from "../../../packages/ui/src/motion.js";

// The original app's policy/model layer now drives the private Quick/Studio
// shell. This describes real capabilities, not pretend bank connections.
const importReadiness = buildSourceOnboarding({
  providerName: "Entidades financieras",
  providerAccessStage: "not_verified",
  manualImportPreviewAvailable: false, // Import engine not wired to live D1.
});
export function studioCapabilities(): Response {
  return new Response(JSON.stringify({
    product: "FinanzasOSS", environment: "staging", currency: "COP",
    timezone: "America/Bogota",
    navigation: {
      primary: primaryNavigation.map(({ id, label }) => ({ id, label })),
      secondary: secondaryNavigation,
    },
    quick: { read: true, capture: true, accountRequired: false },
    banks: { connected: 0, automaticSync: false, status: "pending_official_authorization" },
    investments: { connected: 0, actualHoldings: false, status: "awaiting_authorized_sources" },
    imports: {
      formats: importReadiness.importCard.acceptedFormats,
      liveUpload: importReadiness.importCard.action.enabled,
      previewAndConfirmationRequired: importReadiness.importCard.action.requiresUserConfirmation,
    },
    pwa: { standalone: financialPwaPolicy.installable,
      cacheFinancialData: financialPwaPolicy.cacheFinancialApiResponses },
    experience: { motionMs: motionDurations, reducedMotionSupported: premiumMotionPolicy.reducedMotionUsesTransform === false },
  }), { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  } });
}
