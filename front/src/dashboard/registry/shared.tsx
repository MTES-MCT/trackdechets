import Badge from "@codegouvfr/react-dsfr/Badge";
import gql from "graphql-tag";
import React from "react";

export const GET_REGISTRY_IMPORTS = gql`
  query GetRegistryImports(
    $siret: String
    $ownImportsOnly: Boolean
    $first: Int
  ) {
    registryImports(
      siret: $siret
      ownImportsOnly: $ownImportsOnly
      first: $first
    ) {
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
              siret
              name
            }
          }
        }
      }
    }
  }
`;

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

export async function downloadFromSignedUrl(signedUrl: string | undefined) {
  if (!signedUrl) {
    return;
  }
  const link = document.createElement("a");
  link.href = signedUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const registryExportFragment = gql`
  fragment RegistryExportFragment on RegistryExport {
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

export const GENERATE_REGISTRY_EXPORT = gql`
  mutation GenerateExport(
    $registryType: WasteRegistryType!
    $format: FormsRegisterExportFormat!
    $siret: String
    $delegateSiret: String
    $dateRange: DateFilter!
    $declarationType: DeclarationType
    $wasteTypes: [RegistryExportWasteType!]
    $wasteCodes: [String!]
  ) {
    generateWastesRegistryExport(
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
      ...RegistryExportFragment
    }
  }
  ${registryExportFragment}
`;

export const GET_REGISTRY_EXPORTS = gql`
  query RegistryExports($first: Int = 5) {
    registryExports(first: $first) {
      edges {
        node {
          ...RegistryExportFragment
        }
      }
    }
  }
  ${registryExportFragment}
`;

export const GET_REGISTRY_EXPORT = gql`
  query RegistryExport($id: ID!) {
    registryExport(id: $id) {
      ...RegistryExportFragment
    }
  }
  ${registryExportFragment}
`;

export const REGISTRY_EXPORT_DOWNLOAD_SIGNED_URL = gql`
  query RegistryExportDownloadSignedUrl($exportId: String!) {
    registryExportDownloadSignedUrl(exportId: $exportId) {
      fileKey
      signedUrl
    }
  }
`;

export const GET_MY_COMPANIES_WITH_DELEGATORS = gql`
  query MyCompaniesWithDelegators {
    myCompanies {
      edges {
        node {
          id
          givenName
          name
          orgId
          userRole
          delegators {
            orgId
            givenName
            name
          }
        }
      }
    }
  }
`;
