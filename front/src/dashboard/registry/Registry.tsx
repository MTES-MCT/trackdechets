import { gql, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { Query } from "@td/codegen-ui";
import React, { useState } from "react";

import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { MEDIA_QUERIES } from "../../common/config";
import { useMedia } from "../../common/use-media";
import { ImportModal } from "./ImportModal";
import RegistryMenu from "./RegistryMenu";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { format } from "date-fns";

const HEADERS = [
  "Date",
  "Import",
  "Déclaration",
  "Déclarant",
  "Entreprise délégataire",
  "Fichier importé",
  "Rapport d'erreur"
];

const GET_REGISTRY_IMPORTS = gql`
  query GetRegistryImports($siret: String!) {
    registryImports(siret: $siret) {
      edges {
        node {
          id
          createdAt
          status
          type
          s3FileKey
          numberOfErrors
          numberOfInsertions
          numberOfEdits
          numberOfCancellations
          createdBy {
            name
          }
        }
      }
    }
  }
`;

export function Registry() {
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { loading, error, data } = useQuery<Pick<Query, "registryImports">>(
    GET_REGISTRY_IMPORTS,
    { variables: { siret: "84392249300013" } } // TODO
  );

  const tableData =
    data?.registryImports.edges.map(importData => [
      format(new Date(importData.node.createdAt), "yyyy-MM-dd HH:mm"),
      importData.node.type,
      <ul>
        <li>en erreur</li>
        <li>ajoutées</li>
        <li>modifiées</li>
        <li>annulées</li>
      </ul>,
      importData.node.createdBy.name,
      "todo",
      "todo",
      "todo"
    ]) ?? [];

  return (
    <div id="companies" className="companies dashboard">
      {!isMobile && <RegistryMenu />}
      <div className="dashboard-content">
        <div className="tw-p-6">
          <div>
            <Button
              priority="primary"
              iconId="fr-icon-upload-line"
              iconPosition="right"
              onClick={() => setIsImportModalOpen(true)}
            >
              Importer
            </Button>
          </div>
          {loading && <InlineLoader />}
          {error && (
            <Alert
              closable
              description={error.message}
              severity="error"
              title="Erreur lors du chargement"
            />
          )}
          {data && (
            <div>
              <Table
                bordered
                fixed
                caption="Historique des importations"
                data={tableData}
                headers={HEADERS}
              />
            </div>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
