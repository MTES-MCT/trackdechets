import { useLazyQuery, useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Download } from "@codegouvfr/react-dsfr/Download";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Table from "@codegouvfr/react-dsfr/Table";
import {
  Query,
  QueryRegistryDownloadSignedUrlArgs,
  RegistryDownloadTarget,
  RegistryImportStatus
} from "@td/codegen-ui";
import { format } from "date-fns";
import React, { useState } from "react";

import styles from "./MyImports.module.scss";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { ImportModal } from "./ImportModal";
import {
  badges,
  downloadFromSignedUrl,
  formatStats,
  GET_REGISTRY_IMPORTS,
  REGISTRY_DOWNLOAD_SIGNED_URL,
  TYPES
} from "./shared";

const HEADERS = [
  "Importé le",
  "Registre",
  "Déclarations",
  "Établissements concernés",
  "Fichier importé",
  "Rapport d'erreur"
];

const PAGE_SIZE = 20;

export function MyImports() {
  const [pageIndex, setPageIndex] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { loading, error, data, refetch } = useQuery<
    Pick<Query, "registryImports">
  >(GET_REGISTRY_IMPORTS, {
    variables: { ownImportsOnly: true, first: PAGE_SIZE }
  });

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryDownloadSignedUrl">,
    Partial<QueryRegistryDownloadSignedUrlArgs>
  >(REGISTRY_DOWNLOAD_SIGNED_URL, { fetchPolicy: "no-cache" });

  async function downloadErrorFile(importId: string) {
    const link = await getDownloadLink({
      variables: { importId, target: RegistryDownloadTarget.ErrorFile }
    });
    downloadFromSignedUrl(link.data?.registryDownloadSignedUrl.signedUrl);
  }
  async function downloadImportFile(importId: string) {
    const link = await getDownloadLink({
      variables: { importId, target: RegistryDownloadTarget.ImportFile }
    });
    downloadFromSignedUrl(link.data?.registryDownloadSignedUrl.signedUrl);
  }

  const totalCount = data?.registryImports.totalCount;
  const pageCount = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  function gotoPage(page: number) {
    setPageIndex(page);

    refetch({
      skip: page * PAGE_SIZE
    });
  }

  const tableData =
    data?.registryImports.edges.map(importData => [
      <div>
        <div>
          {format(new Date(importData.node.createdAt), "dd/MM/yyyy HH'h'mm")}
        </div>
        {badges[importData.node.status]("import")}
      </div>,
      TYPES[importData.node.type],
      importData.node.numberOfErrors +
        importData.node.numberOfInsertions +
        importData.node.numberOfEdits +
        importData.node.numberOfCancellations +
        importData.node.numberOfSkipped ===
        0 &&
      ![RegistryImportStatus.Pending, RegistryImportStatus.Started].includes(
        importData.node.status
      )
        ? "Fichier d'import vide"
        : formatStats(importData.node),
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
      <div>
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
      ![RegistryImportStatus.Pending, RegistryImportStatus.Started].includes(
        importData.node.status
      ) && (
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
      )
    ]) ?? [];

  return (
    <>
      <div className="tw-px-6 tw-py-4">
        <div className="tw-flex tw-gap-6">
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
          <div className="tw-flex tw-items-center">
            <a
              href="https://faq.trackdechets.fr/integration-du-rndts-dans-trackdechets/importer-un-registre"
              target="_blank"
              rel="noreferrer"
              className="fr-link fr-text--sm force-external-link-content force-underline-link"
            >
              Retrouvez les modèles de registres dans la documentation
            </a>
          </div>
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
            <p className="tw-mt-24 tw-text-xl tw-mb-4">
              Vous n'avez pas encore fait d'import
            </p>
            <p className="tw-text-sm">
              Utilisez le bouton "Importer" ci-dessus pour réaliser un import
            </p>
          </div>
        )}
        {data && tableData.length > 0 && (
          <div>
            <div className="tw-mt-8">
              <div className="tw-flex tw-justify-between">
                <h2 className="tw-text-2xl tw-font-bold">
                  Historique de mes imports
                </h2>
                <div>
                  <Button
                    priority="secondary"
                    iconId="fr-icon-refresh-line"
                    iconPosition="right"
                    size="small"
                    onClick={() => refetch()}
                  >
                    Rafraîchir
                  </Button>
                </div>
              </div>
              <Table
                bordered
                className={styles.fullWidthTable}
                noCaption
                data={tableData}
                headers={HEADERS}
              />
            </div>
            <div className="tw-flex tw-justify-center">
              <Pagination
                showFirstLast
                count={pageCount}
                defaultPage={pageIndex + 1}
                getPageLinkProps={pageNumber => ({
                  onClick: event => {
                    event.preventDefault();
                    gotoPage(pageNumber - 1);
                  },
                  href: "#",
                  key: `pagination-link-${pageNumber}`
                })}
                className={"fr-mt-1w"}
              />
            </div>
          </div>
        )}
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          gotoPage(0);
        }}
      />
    </>
  );
}
