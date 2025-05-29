import Badge from "@codegouvfr/react-dsfr/Badge";
import { RegistryImportStatus, RegistryImportType } from "@td/codegen-ui";
import { pluralize } from "@td/constants";
import gql from "graphql-tag";
import React from "react";
import routes from "../../Apps/routes";

export const GET_REGISTRY_IMPORTS = gql`
  query GetRegistryImports(
    $siret: String
    $ownImportsOnly: Boolean
    $first: Int
    $skip: Int
  ) {
    registryImports(
      siret: $siret
      ownImportsOnly: $ownImportsOnly
      first: $first
      skip: $skip
    ) {
      totalCount
      edges {
        node {
          id
          createdAt
          status
          type
          s3FileKey
          originalFileName
          numberOfErrors
          numberOfInsertions
          numberOfEdits
          numberOfCancellations
          numberOfSkipped
          createdBy {
            name
          }
          associations {
            reportedFor {
              givenName
              name
              siret
            }
            reportedAs {
              givenName
              siret
              name
            }
          }
        }
      }
    }
  }
`;

export const GET_REGISTRY_LOOKUPS = gql`
  query GetRegistryLookups(
    $siret: String!
    $type: RegistryImportType
    $publicId: String
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) {
    registryLookups(
      siret: $siret
      type: $type
      publicId: $publicId
      first: $first
      last: $last
      after: $after
      before: $before
    ) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          declaredAt
          publicId
          type
          siret
          reportAsSiret
          date
          wasteCode
          reportFor {
            givenName
            name
            siret
            userPermissions
          }
          reportAs {
            givenName
            name
            siret
            userPermissions
          }
        }
        cursor
      }
    }
  }
`;

export const CANCEL_REGISTRY_V2_LINES = gql`
  mutation CancelRegistryV2Lines(
    $publicIds: [String!]!
    $siret: String!
    $delegateSiret: String
    $type: RegistryImportType!
  ) {
    cancelRegistryV2Lines(
      publicIds: $publicIds
      siret: $siret
      delegateSiret: $delegateSiret
      type: $type
    ) {
      publicIds
    }
  }
`;

export const TYPES: { [key in RegistryImportType]: string } = {
  SSD: "SSD",
  INCOMING_WASTE: "D et ND entrants",
  OUTGOING_WASTE: "D et ND sortants",
  INCOMING_TEXS: "TEXS entrants",
  OUTGOING_TEXS: "TEXS sortants",
  TRANSPORTED: "Transportés",
  MANAGED: "Gérés"
};

export const TYPES_ROUTES: { [key in RegistryImportType]: string } = {
  SSD: routes.registry_new.form.ssd,
  INCOMING_WASTE: routes.registry_new.form.incomingWaste,
  INCOMING_TEXS: routes.registry_new.form.incomingTexs,
  OUTGOING_WASTE: routes.registry_new.form.outgoingWaste,
  OUTGOING_TEXS: routes.registry_new.form.outgoingTexs,
  TRANSPORTED: routes.registry_new.form.transported,
  MANAGED: routes.registry_new.form.managed
};

export const badges = {
  PENDING: () => (
    <Badge small severity="info">
      En attente
    </Badge>
  ),
  STARTED: () => (
    <Badge small severity="info">
      En cours
    </Badge>
  ),
  SUCCESSFUL: (context: "import" | "export") => (
    <Badge small severity="success">
      {context === "import" ? "Complet" : "Terminé"}
    </Badge>
  ),
  PARTIALLY_SUCCESSFUL: () => (
    <Badge small severity="warning">
      Partiel
    </Badge>
  ),
  FAILED: (context: "import" | "export") => (
    <Badge small severity="error">
      {context === "import" ? "Refus" : "Echec"}
    </Badge>
  ),
  CANCELED: () => (
    <Badge small severity="error">
      Annulé
    </Badge>
  )
};

export const REGISTRY_DOWNLOAD_SIGNED_URL = gql`
  query RegistryDownloadSignedUrl(
    $importId: String!
    $target: RegistryDownloadTarget!
  ) {
    registryDownloadSignedUrl(importId: $importId, target: $target) {
      fileKey
      signedUrl
    }
  }
`;

export function downloadFromSignedUrl(signedUrl: string | undefined) {
  if (!signedUrl) {
    return;
  }
  const link = document.createElement("a");
  link.href = signedUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const registryV2ExportFragment = gql`
  fragment RegistryV2ExportFragment on RegistryV2Export {
    id
    registryType
    startDate
    endDate
    format
    declarationType
    status
    companies {
      name
      orgId
    }
    createdAt
  }
`;

export const GENERATE_REGISTRY_V2_EXPORT = gql`
  mutation GenerateRegistryV2Export(
    $registryType: RegistryV2ExportType!
    $format: RegistryExportFormat!
    $siret: String
    $delegateSiret: String
    $dateRange: DateFilter!
    $declarationType: DeclarationType
    $wasteTypes: [RegistryV2ExportWasteType!]
    $wasteCodes: [String!]
  ) {
    generateRegistryV2Export(
      dateRange: $dateRange
      format: $format
      registryType: $registryType
      delegateSiret: $delegateSiret
      siret: $siret
      where: {
        declarationType: { _eq: $declarationType }
        wasteType: { _in: $wasteTypes }
        wasteCode: { _in: $wasteCodes }
      }
    ) {
      ...RegistryV2ExportFragment
    }
  }
  ${registryV2ExportFragment}
`;

export const GENERATE_REGISTRY_V2_EXPORT_AS_ADMIN = gql`
  mutation GenerateRegistryV2ExportAsAdmin(
    $registryType: RegistryV2ExportType!
    $format: RegistryExportFormat!
    $siret: String!
    $dateRange: DateFilter!
    $declarationType: DeclarationType
    $wasteTypes: [RegistryV2ExportWasteType!]
    $wasteCodes: [String!]
  ) {
    generateRegistryV2ExportAsAdmin(
      dateRange: $dateRange
      format: $format
      registryType: $registryType
      siret: $siret
      where: {
        declarationType: { _eq: $declarationType }
        wasteType: { _in: $wasteTypes }
        wasteCode: { _in: $wasteCodes }
      }
    ) {
      ...RegistryV2ExportFragment
    }
  }
  ${registryV2ExportFragment}
`;

export const GET_REGISTRY_V2_EXPORTS = gql`
  query RegistryV2Exports($first: Int = 20, $skip: Int = 0) {
    registryV2Exports(first: $first, skip: $skip) {
      edges {
        node {
          ...RegistryV2ExportFragment
        }
      }
      totalCount
    }
  }
  ${registryV2ExportFragment}
`;

export const GET_REGISTRY_V2_EXPORTS_AS_ADMIN = gql`
  query RegistryV2ExportsAsAdmin($first: Int = 20, $skip: Int = 0) {
    registryV2ExportsAsAdmin(first: $first, skip: $skip) {
      edges {
        node {
          ...RegistryV2ExportFragment
        }
      }
      totalCount
    }
  }
  ${registryV2ExportFragment}
`;

export const REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL = gql`
  query RegistryV2ExportDownloadSignedUrl($exportId: String!) {
    registryV2ExportDownloadSignedUrl(exportId: $exportId) {
      fileKey
      signedUrl
    }
  }
`;

const registryExhaustiveExportFragment = gql`
  fragment RegistryExhaustiveExportFragment on RegistryExhaustiveExport {
    id
    startDate
    endDate
    format
    status
    companies {
      name
      orgId
    }
    createdAt
  }
`;

export const GENERATE_REGISTRY_EXHAUSTIVE_EXPORT = gql`
  mutation GenerateRegistryExhaustiveExport(
    $format: RegistryExportFormat!
    $siret: String
    $dateRange: DateFilter!
  ) {
    generateRegistryExhaustiveExport(
      dateRange: $dateRange
      format: $format
      siret: $siret
    ) {
      ...RegistryExhaustiveExportFragment
    }
  }
  ${registryExhaustiveExportFragment}
`;

export const GENERATE_REGISTRY_EXHAUSTIVE_EXPORT_AS_ADMIN = gql`
  mutation GenerateRegistryExhaustiveExportAsAdmin(
    $format: RegistryExportFormat!
    $siret: String!
    $dateRange: DateFilter!
  ) {
    generateRegistryExhaustiveExportAsAdmin(
      dateRange: $dateRange
      format: $format
      siret: $siret
    ) {
      ...RegistryExhaustiveExportFragment
    }
  }
  ${registryExhaustiveExportFragment}
`;

export const GET_REGISTRY_EXHAUSTIVE_EXPORTS = gql`
  query RegistryExhaustiveExports($first: Int = 20, $skip: Int = 0) {
    registryExhaustiveExports(first: $first, skip: $skip) {
      edges {
        node {
          ...RegistryExhaustiveExportFragment
        }
      }
      totalCount
    }
  }
  ${registryExhaustiveExportFragment}
`;

export const GET_REGISTRY_EXHAUSTIVE_EXPORTS_AS_ADMIN = gql`
  query RegistryExhaustiveExportsAsAdmin($first: Int = 20, $skip: Int = 0) {
    registryExhaustiveExportsAsAdmin(first: $first, skip: $skip) {
      edges {
        node {
          ...RegistryExhaustiveExportFragment
        }
      }
      totalCount
    }
  }
  ${registryExhaustiveExportFragment}
`;

export const REGISTRY_EXHAUSTIVE_EXPORT_DOWNLOAD_SIGNED_URL = gql`
  query RegistryExhaustiveExportDownloadSignedUrl($exportId: String!) {
    registryExhaustiveExportDownloadSignedUrl(exportId: $exportId) {
      fileKey
      signedUrl
    }
  }
`;

export const GET_MY_COMPANIES = gql`
  query MyCompaniesForRegistryExport($first: Int, $after: ID, $search: String) {
    myCompanies(first: $first, after: $after, search: $search) {
      edges {
        node {
          id
          givenName
          name
          orgId
          siret
          companyTypes
        }
      }
    }
  }
`;

export const SEARCH_COMPANIES = gql`
  query SearchCompaniesForAdminRegistryExport($clue: String!) {
    searchCompanies(clue: $clue) {
      name
      orgId
      siret
      companyTypes
    }
  }
`;

export const GET_REGISTRY_COMPANIES = gql`
  query RegistryCompanies(
    $firstCompanies: Int
    $firstDelegators: Int
    $search: String
    $userRoles: [UserRole!]
  ) {
    registryCompanies(
      firstCompanies: $firstCompanies
      firstDelegators: $firstDelegators
      search: $search
      userRoles: $userRoles
    ) {
      totalCount
      myCompanies {
        id
        orgId
        siret
        name
        givenName
        companyTypes
        transporterReceipt {
          receiptNumber
        }
      }
      delegators {
        orgId
        siret
        name
        givenName
        companyTypes
        transporterReceipt {
          receiptNumber
        }
      }
    }
  }
`;

export const GET_CHANGE_AGGREGATES = gql`
  query RegistryChangeAggregates(
    $siret: String!
    $window: Int!
    $source: RegistryImportSource!
  ) {
    registryChangeAggregates(siret: $siret, window: $window, source: $source) {
      id
      createdAt
      updatedAt
      type
      source
      createdBy {
        name
      }
      reportAs {
        name
        siret
      }
      numberOfAggregates
      numberOfErrors
      numberOfInsertions
      numberOfEdits
      numberOfCancellations
      numberOfSkipped
    }
  }
`;

export function formatStats({
  numberOfErrors,
  numberOfInsertions,
  numberOfEdits,
  numberOfCancellations,
  numberOfSkipped
}: {
  numberOfErrors: number;
  numberOfInsertions: number;
  numberOfEdits: number;
  numberOfCancellations: number;
  numberOfSkipped: number;
}) {
  return (
    <ul>
      {numberOfErrors > 0 && (
        <li>
          <strong>{numberOfErrors} en erreur</strong>
        </li>
      )}
      {numberOfInsertions > 0 && (
        <li>
          <strong>
            {numberOfInsertions}{" "}
            {pluralize("ajoutée", numberOfInsertions, "ajoutées")}
          </strong>
        </li>
      )}
      {numberOfEdits > 0 && (
        <li>
          {numberOfEdits} {pluralize("modifiée", numberOfEdits, "modifiées")}
        </li>
      )}
      {numberOfCancellations > 0 && (
        <li>
          {numberOfCancellations}{" "}
          {pluralize("annulée", numberOfCancellations, "annulées")}
        </li>
      )}
      {numberOfSkipped > 0 && (
        <li>
          {numberOfSkipped} {pluralize("ignorée", numberOfSkipped, "ignorées")}
        </li>
      )}
    </ul>
  );
}

export function getStatusFromStats({
  numberOfErrors,
  numberOfInsertions,
  numberOfEdits,
  numberOfCancellations,
  numberOfSkipped
}: {
  numberOfErrors: number;
  numberOfInsertions: number;
  numberOfEdits: number;
  numberOfCancellations: number;
  numberOfSkipped: number;
}): RegistryImportStatus {
  if (
    numberOfCancellations +
      numberOfEdits +
      numberOfInsertions +
      numberOfSkipped ===
    0
  ) {
    // No data was processed. Mark the import as failed
    return RegistryImportStatus.Failed;
  }

  if (numberOfErrors) {
    return RegistryImportStatus.PartiallySuccessful;
  }

  return RegistryImportStatus.Successful;
}

export const getRegistryNameFromImportType = (
  importType: RegistryImportType
): string => {
  switch (importType) {
    case RegistryImportType.Ssd:
      return "Registre sortie de statut de déchet";
    case RegistryImportType.IncomingWaste:
      return "Registre déchets dangereux et non dangereux entrants";
    case RegistryImportType.IncomingTexs:
      return "Registre terres excavées et sédiments, dangereux et non dangereux entrants";
    case RegistryImportType.OutgoingWaste:
      return "Registre déchets dangereux et non dangereux sortants";
    case RegistryImportType.OutgoingTexs:
      return "Registre terres excavées et sédiments, dangereux et non dangereux sortants";
    case RegistryImportType.Transported:
      return "Registre de transport";
    case RegistryImportType.Managed:
      return "Registre de gestion";
    default:
      return "";
  }
};
