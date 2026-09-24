export type AccountInformationCapability = "accounts" | "balances" | "transactions";
export type AccountInformationConsentState = "active" | "revoked";
export type AccountInformationFailure = "auth" | "consent" | "rate_limit" | "upstream" | "invalid_response" | "configuration";

export interface AccountInformationConfig {
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities: readonly AccountInformationCapability[];
  consentState?: AccountInformationConsentState;
}

export interface ReadOnlyAccount {
  externalId: string;
  currency: string;
  displayName?: string;
  maskedIdentifier?: string;
}

export interface ReadOnlyBalance {
  accountExternalId: string;
  currency: string;
  amount: string;
  kind: "available" | "current" | "other";
  asOf?: string;
}

export interface ReadOnlyTransaction {
  externalId: string;
  accountExternalId: string;
  amount: string;
  currency: string;
  bookedAt: string;
  description?: string;
  status?: "pending" | "booked";
}

export class AccountInformationUnavailableError extends Error {
  constructor(capability: AccountInformationCapability) {
    super(`Account information capability is unavailable: ${capability}`);
    this.name = "AccountInformationUnavailableError";
  }
}

export class AccountInformationRevokedError extends Error {
  constructor() {
    super("Account information consent has been revoked");
    this.name = "AccountInformationRevokedError";
  }
}

export interface NormalizedAccountInformationError {
  failure: AccountInformationFailure;
  retryable: boolean;
  providerCode?: string;
  retryAfterMs?: number;
}

export function normalizeAccountInformationError(input: {
  status?: number;
  providerCode?: string;
  retryAfterMs?: number;
}): NormalizedAccountInformationError {
  const status = input.status;
  const common = {
    ...(input.providerCode !== undefined ? { providerCode: input.providerCode } : {}),
    ...(input.retryAfterMs !== undefined ? { retryAfterMs: input.retryAfterMs } : {}),
  };
  if (status === 401) return { failure: "auth", retryable: false, ...common };
  if (status === 403) return { failure: "consent", retryable: false, ...common };
  if (status === 429) return { failure: "rate_limit", retryable: true, ...common };
  if (status !== undefined && status >= 500) return { failure: "upstream", retryable: true, ...common };
  if (status !== undefined && status >= 400) return { failure: "invalid_response", retryable: false, ...common };
  return { failure: "configuration", retryable: false, ...common };
}

function verifiedHttpsEndpoint(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  const endpoint = new URL(value);
  if (endpoint.protocol !== "https:") {
    throw new Error("Account information endpoints must use HTTPS");
  }
  return endpoint;
}

/** Provider-neutral, read-only Account Information gate. */
export class AccountInformationGate {
  readonly accountsEndpoint: URL | undefined;
  readonly balancesEndpoint: URL | undefined;
  readonly transactionsEndpoint: URL | undefined;
  private readonly granted: ReadonlySet<AccountInformationCapability>;
  private consentState: AccountInformationConsentState;

  constructor(config: AccountInformationConfig) {
    this.accountsEndpoint = verifiedHttpsEndpoint(config.accountsEndpoint);
    this.balancesEndpoint = verifiedHttpsEndpoint(config.balancesEndpoint);
    this.transactionsEndpoint = verifiedHttpsEndpoint(config.transactionsEndpoint);
    this.granted = new Set(config.grantedCapabilities);
    this.consentState = config.consentState ?? "active";
  }

  revokeConsent(): void {
    this.consentState = "revoked";
  }

  isConsentActive(): boolean {
    return this.consentState === "active";
  }

  endpointFor(capability: AccountInformationCapability): URL {
    if (!this.isConsentActive()) throw new AccountInformationRevokedError();
    const endpoint = capability === "accounts"
      ? this.accountsEndpoint
      : capability === "balances"
        ? this.balancesEndpoint
        : this.transactionsEndpoint;
    if (!this.granted.has(capability) || !endpoint) {
      throw new AccountInformationUnavailableError(capability);
    }
    return endpoint;
  }

  canRead(capability: AccountInformationCapability): boolean {
    try {
      this.endpointFor(capability);
      return true;
    } catch (error) {
      if (error instanceof AccountInformationUnavailableError || error instanceof AccountInformationRevokedError) return false;
      throw error;
    }
  }
}
