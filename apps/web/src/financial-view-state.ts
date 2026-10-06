export type FinancialViewStateKind = "loading" | "empty" | "error" | "ready";

export type FinancialErrorCode =
  | "network"
  | "authorization_required"
  | "sync_incomplete"
  | "unsupported"
  | "unknown";

export interface FinancialLoadingState {
  kind: "loading";
  ariaBusy: true;
  placeholderFinancialValuesAllowed: false;
  skeletonRows: number;
}

export interface FinancialEmptyState {
  kind: "empty";
  title: string;
  message: string;
  suggestsInventedData: false;
}

export interface FinancialErrorState {
  kind: "error";
  code: FinancialErrorCode;
  title: string;
  message: string;
  retryAllowed: boolean;
  rawErrorIncluded: false;
  exposesSecrets: false;
}

export interface FinancialReadyState<T> {
  kind: "ready";
  data: T;
}

export type FinancialViewState<T> =
  | FinancialLoadingState
  | FinancialEmptyState
  | FinancialErrorState
  | FinancialReadyState<T>;

export function createFinancialLoadingState(skeletonRows = 3): FinancialLoadingState {
  const normalizedRows = Math.max(1, Math.min(12, Math.trunc(skeletonRows)));
  return Object.freeze({
    kind: "loading",
    ariaBusy: true,
    placeholderFinancialValuesAllowed: false,
    skeletonRows: normalizedRows,
  });
}

export function createFinancialEmptyState(input?: {
  title?: string;
  message?: string;
}): FinancialEmptyState {
  return Object.freeze({
    kind: "empty",
    title: input?.title?.trim() || "Aún no hay datos disponibles",
    message:
      input?.message?.trim() ||
      "Conecta una fuente autorizada o importa información para ver esta sección.",
    suggestsInventedData: false,
  });
}

const safeErrors: Readonly<Record<FinancialErrorCode, Omit<FinancialErrorState, "kind" | "code">>> =
  Object.freeze({
    network: {
      title: "No pudimos actualizar esta vista",
      message: "Revisa tu conexión e inténtalo de nuevo.",
      retryAllowed: true,
      rawErrorIncluded: false,
      exposesSecrets: false,
    },
    authorization_required: {
      title: "La conexión requiere atención",
      message: "Revisa el consentimiento o vuelve a autorizar desde Conexiones.",
      retryAllowed: false,
      rawErrorIncluded: false,
      exposesSecrets: false,
    },
    sync_incomplete: {
      title: "La actualización quedó incompleta",
      message: "Algunos datos pueden faltar. Puedes reintentar la sincronización segura.",
      retryAllowed: true,
      rawErrorIncluded: false,
      exposesSecrets: false,
    },
    unsupported: {
      title: "Esta fuente aún no es compatible",
      message: "No se mostrarán datos inventados ni aproximados para esta fuente.",
      retryAllowed: false,
      rawErrorIncluded: false,
      exposesSecrets: false,
    },
    unknown: {
      title: "Ocurrió un problema",
      message: "No pudimos completar la vista. Intenta de nuevo más tarde.",
      retryAllowed: true,
      rawErrorIncluded: false,
      exposesSecrets: false,
    },
  });

export function createFinancialErrorState(code: FinancialErrorCode): FinancialErrorState {
  return Object.freeze({
    kind: "error",
    code,
    ...safeErrors[code],
  });
}

export function createFinancialReadyState<T>(data: T): FinancialReadyState<T> {
  return Object.freeze({ kind: "ready", data });
}

export const financialViewStatePolicy = Object.freeze({
  rawProviderErrorsMayBeRendered: false,
  placeholderMoneyMayBeRendered: false,
  sensitiveValuesVisibleWhileLoading: false,
  emptyStatesMayInventFinancialData: false,
});
