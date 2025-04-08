import { useLazyQuery, useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Download from "@codegouvfr/react-dsfr/Download";
import Table from "@codegouvfr/react-dsfr/Table";
import {
  Query,
  QueryRegistryDownloadSignedUrlArgs,
  RegistryDownloadTarget
} from "@td/codegen-ui";
import { pluralize } from "@td/constants";
import { format } from "date-fns";
import React from "react";
import { InlineLoader } from "../../../Apps/common/Components/Loader/Loaders";
import {
  GET_REGISTRY_IMPORTS,
  REGISTRY_DOWNLOAD_SIGNED_URL,
  TYPES,
  badges,
  downloadFromSignedUrl
} from "../shared";

type Props = { siret: string };

const HEADERS = [
  "Date",
  "Import",
  "Déclaration",
  "Déclaré par",
  "Fichier importé",
  "Rapport d'erreur"
];

export function FileImportsTable({ siret }: Props) {
  const { loading, error, data } = useQuery<Pick<Query, "registryImports">>(
    GET_REGISTRY_IMPORTS,
    { variables: { siret, first: 25 }, skip: !siret }
  );

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryDownloadSignedUrl">,
    Partial<QueryRegistryDownloadSignedUrlArgs>
  >(REGISTRY_DOWNLOAD_SIGNED_URL);

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

  const tableData =
    data?.registryImports.edges.map(importData => {
      const reportedByAssociation = importData.node.associations?.find(
        a => !!a.reportedAs.siret && a.reportedAs.siret !== a.reportedFor.siret
      );
      const reportedBy = reportedByAssociation
        ? `${importData.node.createdBy.name} - ${reportedByAssociation.reportedAs.name} (${reportedByAssociation.reportedAs.siret})`
        : importData.node.createdBy.name;
      return [
        format(new Date(importData.node.createdAt), "dd/MM/yyyy HH'h'mm"),
        <div>
          {badges[importData.node.status]("import")}
          <div>{TYPES[importData.node.type]}</div>
        </div>,
        <ul>
          {importData.node.numberOfErrors > 0 && (
            <li>
              <strong>{importData.node.numberOfErrors} en erreur</strong>
            </li>
          )}
          {importData.node.numberOfInsertions > 0 && (
            <li>
              {importData.node.numberOfInsertions}{" "}
              {pluralize(
                "ajoutée",
                importData.node.numberOfInsertions,
                "ajoutées"
              )}
            </li>
          )}
          {importData.node.numberOfEdits > 0 && (
            <li>
              {importData.node.numberOfEdits}{" "}
              {pluralize(
                "modifiée",
                importData.node.numberOfEdits,
                "modifiées"
              )}
            </li>
          )}
          {importData.node.numberOfCancellations > 0 && (
            <li>
              {importData.node.numberOfCancellations}{" "}
              {pluralize(
                "annulée",
                importData.node.numberOfCancellations,
                "annulées"
              )}
            </li>
          )}
          {importData.node.numberOfSkipped > 0 && (
            <li>
              {importData.node.numberOfSkipped}{" "}
              {pluralize(
                "ignorée",
                importData.node.numberOfSkipped,
                "ignorées"
              )}
            </li>
          )}
        </ul>,
        <div>{reportedBy}</div>,
        <div className="tw-flex">
          <Download
            style={{
              width: "100%"
            }}
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
      ];
    }) ?? [];
  return (
    <div>
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
        <p className="tw-mt-24 tw-text-xl tw-mb-4 tw-text-center">
          Aucun import n'a encore été réalisé pour cet établissement
        </p>
      )}
      {data && tableData.length > 0 && (
        <div>
          <Table
            bordered
            fixed
            caption="Déclarations par fichiers"
            data={tableData}
            headers={HEADERS}
          />
        </div>
      )}
    </div>
  );
}
