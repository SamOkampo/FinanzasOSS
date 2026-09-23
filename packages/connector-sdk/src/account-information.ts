export type AccountInformationCapability = "accounts" | "balances";

export interface AccountInformationConfig {
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  grantedCapabilities: readonly AccountInformationCapability[];
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

export class AccountInformationUnavailableError extends Error {
  constructor(capability: AccountInformationCapability) {
    super(`Account information capability is unavailable: ${capability}`);
    this.name = "AccountInformationUnavailableError";
  }
}

function verifiedHttpsEndpoint(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  const endpoint = new URL(value);
  if (endpoint.protocol !== "https:") {
    throw new Error("Account information endpoints must use HTTPS");
  }
  return endpoint;
}

/**
 * Provider-neutral, read-only Account Information gate.
 *
 * A provider adapter must supply an explicitly verified endpoint and an
 * explicitly granted capability. Missing documentation/configuration therefore
 * fails closed instead of guessing provider URLs or OAuth scopes.
 */
export class AccountInformationGate {
  readonly accountsEndpoint?: URL;
  readonly balancesEndpoint?: URL;
  private readonly granted: ReadonlySet<AccountInformationCapability>;

  constructor(config: AccountInformationConfig) {
    this.accountsEndpoint = verifiedHttpsEndpoint(config.accountsEndpoint);
    this.balancesEndpoint = verifiedHttpsEndpoint(config.balancesEndpoint);
    this.granted = new Set(config.grantedCapabilities);
  }

  endpointFor(capability: AccountInformationCapability): URL {
    const endpoint = capability === "accounts" ? this.accountsEndpoint : this.balancesEndpoint;
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
      if (error instanceof AccountInformationUnavailableError) return false;
      throw error;
    }
  }
}
