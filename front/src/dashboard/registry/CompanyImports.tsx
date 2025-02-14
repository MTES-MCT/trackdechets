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
import { RegistryCompanySwitcher } from "./RegistryCompanySwitcher";
import {
  badges,
  downloadFromSignedUrl,
  GET_REGISTRY_IMPORTS,
  REGISTRY_DOWNLOAD_SIGNED_URL,
  TYPES
} from "./shared";

const HEADERS = [
  "Date",
  "Import",
  "Déclaration",
  "Déclaré par",
  "Fichier importé",
  "Rapport d'erreur"
];

export function CompanyImports() {
  const [siret, setSiret] = useState<string | undefined>();

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
    data?.registryImports.edges.map(importData => [
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
          <li>{importData.node.numberOfInsertions} ajoutée(s)</li>
        )}
        {importData.node.numberOfEdits > 0 && (
          <li>{importData.node.numberOfEdits} modifiée(s)</li>
        )}
        {importData.node.numberOfCancellations > 0 && (
          <li>{importData.node.numberOfCancellations} annulée(s)</li>
        )}
        {importData.node.numberOfSkipped > 0 && (
          <li>{importData.node.numberOfSkipped} ignorée(s)</li>
        )}
      </ul>,
      importData.node.createdBy.name,
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
    <div className="tw-p-6">
      <div>
        <RegistryCompanySwitcher onCompanySelect={v => setSiret(v)} />
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
        <p className="tw-mt-24 tw-text-xl tw-mb-4 tw-text-center">
          Aucun import n'a encore été réalisé pour cet établissement
        </p>
      )}
      {data && tableData.length > 0 && (
        <div>
          <Table
            bordered
            fixed
            caption="Historique des imports par entreprise"
            data={tableData}
            headers={HEADERS}
          />
        </div>
      )}
    </div>
  );
}
