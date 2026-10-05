import { ConnectorError } from "./index.js";

export interface PublicAddressWatch {
  network: string;
  address: string;
}

export function validatePublicAddressWatch(input: PublicAddressWatch): Readonly<PublicAddressWatch> {
  const network = input.network.trim().toLowerCase();
  const address = input.address.trim();
  if (!/^[a-z0-9][a-z0-9_-]{1,31}$/.test(network)) {
    throw new ConnectorError("Network identifier is invalid", "CONFIGURATION", false);
  }
  if (address.length < 8 || address.length > 128 || /\s/.test(address)) {
    throw new ConnectorError("Public address is invalid", "CONFIGURATION", false);
  }
  return Object.freeze({ network, address });
}
