export type ProviderAccessStage =
  | "not_verified"
  | "portal_registered"
  | "sandbox_api_approved"
  | "production_access_review";

export interface SourceOnboardingInput {
  providerName: string;
  providerAccessStage: ProviderAccessStage;
  manualImportPreviewAvailable: boolean;
}

export interface SourceOnboardingAction {
  id: "review_local_import" | "view_provider_requirements";
  label: string;
  enabled: boolean;
  requiresUserConfirmation: boolean;
}

export interface SourceOnboardingModel {
  title: "Empieza con tus datos";
  guidance: string;
  importCard: {
    title: "Importar un archivo";
    description: string;
    acceptedFormats: readonly ["CSV", "XLSX", "OFX", "PDF"];
    storesDataWithoutPreview: false;
    action: SourceOnboardingAction;
  };
  providerCard: {
    title: string;
    status: ProviderAccessStage;
    description: string;
    bankConnected: false;
    automaticSyncAvailable: false;
    productionAccessImplied: false;
    action: SourceOnboardingAction;
  };
}

const providerStatusCopy: Readonly<Record<ProviderAccessStage, string>> = Object.freeze({
  not_verified:
    "Aun no se ha verificado acceso oficial para esta entidad. No puedes conectar cuentas.",
  portal_registered:
    "La inscripcion en un portal de desarrolladores no habilita la consulta de cuentas ni saldos.",
  sandbox_api_approved:
    "El acceso de pruebas no autoriza consultar datos reales ni activar sincronizacion bancaria.",
  production_access_review:
    "La habilitacion productiva requiere acuerdo verificado, consentimiento y aprobacion humana antes de conectarse.",
});

/**
 * Pure UI model. No network calls, credentials, provider endpoints or implicit activation.
 * File import remains a preview requiring explicit confirmation before persistence.
 */
export function buildSourceOnboarding(input: SourceOnboardingInput): SourceOnboardingModel {
  const providerName = input.providerName.trim() || "Entidad financiera";
  return Object.freeze({
    title: "Empieza con tus datos" as const,
    guidance:
      "Puedes revisar tus archivos de forma local mientras se verifica el acceso oficial a las APIs financieras.",
    importCard: Object.freeze({
      title: "Importar un archivo" as const,
      description:
        "Revisa el mapeo, las transacciones y los posibles duplicados antes de confirmar cualquier importacion.",
      acceptedFormats: Object.freeze(["CSV", "XLSX", "OFX", "PDF"] as const),
      storesDataWithoutPreview: false as const,
      action: Object.freeze({
        id: "review_local_import" as const,
        label: "Revisar importacion",
        enabled: input.manualImportPreviewAvailable,
        requiresUserConfirmation: true,
      }),
    }),
    providerCard: Object.freeze({
      title: providerName,
      status: input.providerAccessStage,
      description: providerStatusCopy[input.providerAccessStage],
      bankConnected: false as const,
      automaticSyncAvailable: false as const,
      productionAccessImplied: false as const,
      action: Object.freeze({
        id: "view_provider_requirements" as const,
        label: "Ver requisitos de conexion",
        enabled: true,
        requiresUserConfirmation: false,
      }),
    }),
  });
}
