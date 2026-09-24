export type AccountInformationCapability = "accounts" | "balances" | "transactions";

export interface AccountInformationConfig {
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
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
  readonly accountsEndpoint: URL | undefined;
  readonly balancesEndpoint: URL | undefined;
  readonly transactionsEndpoint: URL | undefined;
  private readonly granted: ReadonlySet<AccountInformationCapability>;

  constructor(config: AccountInformationConfig) {
    this.accountsEndpoint = verifiedHttpsEndpoint(config.accountsEndpoint);
    this.balancesEndpoint = verifiedHttpsEndpoint(config.balancesEndpoint);
    this.transactionsEndpoint = verifiedHttpsEndpoint(config.transactionsEndpoint);
    this.granted = new Set(config.grantedCapabilities);
  }

  endpointFor(capability: AccountInformationCapability): URL {
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
      if (error instanceof AccountInformationUnavailableError) return false;
      throw error;
    }
  }
}
