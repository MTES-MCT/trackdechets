import { useLazyQuery, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
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
import RegistryMenu from "./RegistryMenu";
import {
  badges,
  downloadFromSignedUrl,
  GET_REGISTRY_IMPORTS,
  REGISTRY_DOWNLOAD_SIGNED_URL
} from "./shared";
import { RegistryCompanySwitcher } from "./RegistryCompanySwitcher";

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
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

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
      format(new Date(importData.node.createdAt), "dd/MM/yyyy HH'h'mm"),
      <div>
        {badges[importData.node.status]}
        <div>{importData.node.type}</div>
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
      <div className="tw-flex tw-justify-center">
        <Button
          title="Voir le fichier d'import"
          priority="secondary"
          iconId="fr-icon-download-line"
          onClick={() => downloadImportFile(importData.node.id)}
          size="small"
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
            <p className="tw-mt-10 tw-text-2xl tw-text-center">
              Aucun import n'a encore été réalisé pour cette entreprise
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
      </div>
    </div>
  );
}
