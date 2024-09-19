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
  PENDING: (
    <Badge small severity="info">
      En attente
    </Badge>
  ),
  STARTED: (
    <Badge small severity="info">
      En cours
    </Badge>
  ),
  SUCCESSFUL: (
    <Badge small severity="success">
      Complet
    </Badge>
  ),
  PARTIALLY_SUCCESSFUL: (
    <Badge small severity="warning">
      Partiel
    </Badge>
  ),
  FAILED: (
    <Badge small severity="error">
      Refus
    </Badge>
  ),
  CANCELED: (
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
