import { useLazyQuery, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import { Download } from "@codegouvfr/react-dsfr/Download";
import Table from "@codegouvfr/react-dsfr/Table";
import {
  Query,
  QueryRegistryDownloadSignedUrlArgs,
  RegistryDownloadTarget
} from "@td/codegen-ui";
import React, { useState } from "react";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { format } from "date-fns";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { MEDIA_QUERIES } from "../../common/config";
import { useMedia } from "../../common/use-media";
import { ImportModal } from "./ImportModal";
import RegistryMenu from "./RegistryMenu";
import {
  badges,
  downloadFromSignedUrl,
  GET_REGISTRY_IMPORTS,
  REGISTRY_DOWNLOAD_SIGNED_URL
} from "./shared";

const HEADERS = [
  "Importé le",
  "Registre",
  "Déclarations",
  "Etablissements concernés",
  "Fichier importé",
  "Rapport d'erreur"
];

export function MyImports() {
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { loading, error, data, refetch } = useQuery<
    Pick<Query, "registryImports">
  >(GET_REGISTRY_IMPORTS, { variables: { ownImportsOnly: true, first: 25 } });

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryDownloadSignedUrl">,
    Partial<QueryRegistryDownloadSignedUrlArgs>
  >(REGISTRY_DOWNLOAD_SIGNED_URL);

  async function downloadErrorFile(importId: string) {
    const link = await getDownloadLink({
      variables: { importId, target: RegistryDownloadTarget.ErrorFile }
    });
    await downloadFromSignedUrl(link.data?.registryDownloadSignedUrl.signedUrl);
  }
  async function downloadImportFile(importId: string) {
    const link = await getDownloadLink({
      variables: { importId, target: RegistryDownloadTarget.ImportFile }
    });
    await downloadFromSignedUrl(link.data?.registryDownloadSignedUrl.signedUrl);
  }

  const tableData =
    data?.registryImports.edges.map(importData => [
      <div>
        <div>
          {format(new Date(importData.node.createdAt), "dd/MM/yyyy HH'h'mm")}
        </div>
        {badges[importData.node.status]}
      </div>,
      importData.node.type,
      <ul>
        {importData.node.numberOfErrors > 0 && (
          <li>
            <strong>{importData.node.numberOfErrors} en erreur</strong>
          </li>
        )}
        {importData.node.numberOfInsertions > 0 && (
          <li>{importData.node.numberOfInsertions} ajoutée(s)</li>
        )}
        {importData.node.numberOfEdits > 0 && (
          <li>{importData.node.numberOfEdits} modifiée(s)</li>
        )}
        {importData.node.numberOfCancellations > 0 && (
          <li>{importData.node.numberOfCancellations} annulée(s)</li>
        )}
      </ul>,
      importData.node.associations
        .map(
          association =>
            `${association.reportedFor.name} - ${association.reportedFor.siret}`
        )
        .slice(0, 3)
        .concat(
          importData.node.associations.length > 3
            ? [`Et ${importData.node.associations.length - 3} autres`]
            : []
        )
        .join("\n"),
      <div className="tw-flex">
        <Download
          details={(
            importData.node.originalFileName.split(".").pop() ?? ""
          ).toUpperCase()}
          label={importData.node.originalFileName
            .split(".")
            .slice(0, -1)
            .join(".")}
          linkProps={{
            href: "#",
            onClick: e => {
              e.preventDefault();
              downloadImportFile(importData.node.id);
            }
          }}
        />
      </div>,
      <div className="tw-flex tw-justify-center">
        {importData.node.numberOfErrors > 0 && (
          <Button
            title="Voir le rapport d'erreur"
            priority="secondary"
            iconId="fr-icon-download-line"
            onClick={() => downloadErrorFile(importData.node.id)}
            size="small"
          />
        )}
      </div>
    ]) ?? [];

  return (
    <div id="companies" className="companies dashboard">
      {!isMobile && <RegistryMenu />}
      <div className="dashboard-content tw-flex-grow">
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
            <Button
              priority="secondary"
              iconId="fr-icon-refresh-line"
              iconPosition="right"
              onClick={() => refetch()}
            >
              Rafraichir
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
          {data && tableData.length === 0 && (
            <div className="tw-text-center">
              <p className="tw-mt-10 tw-text-2xl">
                Vous n'avez pas encore fait d'import
              </p>
              <p>
                Utilisez le bouton "Importer" ci-dessus pour réaliser un import
              </p>
            </div>
          )}
          {data && tableData.length > 0 && (
            <div>
              <Table
                bordered
                fixed
                caption="Historique de mes imports"
                data={tableData}
                headers={HEADERS}
              />
            </div>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
