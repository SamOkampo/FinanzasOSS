export type ExtendedColombiaInstitutionId =
  | "scotiabank-colpatria"
  | "itau-colombia"
  | "banco-caja-social"
  | "banco-falabella-colombia";

export interface ExtendedColombiaImportProfile {
  institutionId: ExtendedColombiaInstitutionId;
  displayName: string;
  accessMode: "statement_import";
  environment: "local_import";
  officialAccountInformationRoute: "not_verified";
  aggregatorRoute: "not_verified";
  statementAccess: "verified" | "not_verified";
  statementFormat: "pdf" | "document" | "not_verified";
  evidenceScope: "consumer" | "enterprise_only" | "consumer_and_enterprise_separated";
  persistDocumentPassword: false;
  parserAvailable: false;
}

export const EXTENDED_COLOMBIA_IMPORT_PROFILES: readonly ExtendedColombiaImportProfile[] = Object.freeze([
  {
    institutionId: "scotiabank-colpatria",
    displayName: "Scotiabank Colpatria",
    accessMode: "statement_import",
    environment: "local_import",
    officialAccountInformationRoute: "not_verified",
    aggregatorRoute: "not_verified",
    statementAccess: "not_verified",
    statementFormat: "not_verified",
    evidenceScope: "consumer",
    persistDocumentPassword: false,
    parserAvailable: false,
  },
  {
    institutionId: "itau-colombia",
    displayName: "Itaú Colombia",
    accessMode: "statement_import",
    environment: "local_import",
    officialAccountInformationRoute: "not_verified",
    aggregatorRoute: "not_verified",
    statementAccess: "not_verified",
    statementFormat: "not_verified",
    evidenceScope: "enterprise_only",
    persistDocumentPassword: false,
    parserAvailable: false,
  },
  {
    institutionId: "banco-caja-social",
    displayName: "Banco Caja Social",
    accessMode: "statement_import",
    environment: "local_import",
    officialAccountInformationRoute: "not_verified",
    aggregatorRoute: "not_verified",
    statementAccess: "verified",
    statementFormat: "document",
    evidenceScope: "consumer",
    persistDocumentPassword: false,
    parserAvailable: false,
  },
  {
    institutionId: "banco-falabella-colombia",
    displayName: "Banco Falabella Colombia",
    accessMode: "statement_import",
    environment: "local_import",
    officialAccountInformationRoute: "not_verified",
    aggregatorRoute: "not_verified",
    statementAccess: "verified",
    statementFormat: "pdf",
    evidenceScope: "consumer_and_enterprise_separated",
    persistDocumentPassword: false,
    parserAvailable: false,
  },
]);

export function getExtendedColombiaImportProfile(id: ExtendedColombiaInstitutionId): ExtendedColombiaImportProfile {
  const profile = EXTENDED_COLOMBIA_IMPORT_PROFILES.find((candidate) => candidate.institutionId === id);
  if (!profile) throw new Error(`Unsupported extended Colombia institution: ${id}`);
  return profile;
}
