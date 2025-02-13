import React, { useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { ExportModal } from "./ExportModal";

import styles from "./MyExports.module.scss";
import {
  DeclarationType,
  Query,
  QueryRegistryV2ExportDownloadSignedUrlArgs,
  RegistryV2ExportStatus,
  RegistryV2ExportType
} from "@td/codegen-ui";
import {
  badges,
  downloadFromSignedUrl,
  GET_REGISTRY_V2_EXPORTS,
  REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL
} from "./shared";

import { format, getYear, startOfYear, endOfYear } from "date-fns";
import classNames from "classnames";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";

const getRegistryTypeWording = (registryType: RegistryV2ExportType): string => {
  switch (registryType) {
    case RegistryV2ExportType.Ssd:
      return `Sortie de statut de déchet`;
    case RegistryV2ExportType.Incoming:
      return `Registre entrant`;
    case RegistryV2ExportType.Managed:
      return `Registre géré`;
    case RegistryV2ExportType.Outgoing:
      return `Registre sortant`;
    case RegistryV2ExportType.Transported:
      return `Registre transporté`;
    case RegistryV2ExportType.All:
      return `Registre exhaustif`;
    default:
      return `Registre exhaustif`;
  }
};

const getDeclarationTypeWording = (
  declarationType: DeclarationType
): string => {
  switch (declarationType) {
    case DeclarationType.All:
      return `Tous`;
    case DeclarationType.Bsd:
      return `Tracé (bordereaux)`;
    case DeclarationType.Registry:
      return `Déclaré (registre national)`;
    default:
      return `Tous`;
  }
};

const formatRegistryDates = (
  createdAt: string,
  startDate: string,
  endDate?: string | null
): string => {
  const startDateObj = new Date(startDate);
  const endDateObj = endDate ? new Date(endDate) : null;
  if (
    format(startOfYear(startDateObj), "yyyy-MM-dd") ===
      format(startDateObj, "yyyy-MM-dd") &&
    endDateObj &&
    format(endOfYear(endDateObj), "yyyy-MM-dd") ===
      format(endDateObj, "yyyy-MM-dd")
  ) {
    return `${getYear(startDateObj)}`;
  }
  if (!endDateObj) {
    return `du ${format(startDateObj, "dd/MM/yyyy")} au ${format(
      new Date(createdAt),
      "dd/MM/yyyy"
    )}`;
  }
  return `du ${format(startDateObj, "dd/MM/yyyy")} au ${format(
    endDateObj,
    "dd/MM/yyyy"
  )}`;
};

export function MyExports() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [downloadLoadingExportId, setDownloadLoadingExportId] = useState<
    string | null
  >(null);
  const [refetchTimeout, setRefetchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const {
    data: exportsData,
    loading: exportsLoading,
    refetch
  } = useQuery<Pick<Query, "registryV2Exports">>(GET_REGISTRY_V2_EXPORTS);
  const registryExports = exportsData?.registryV2Exports?.edges;

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryV2ExportDownloadSignedUrl">,
    Partial<QueryRegistryV2ExportDownloadSignedUrlArgs>
  >(REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL, { fetchPolicy: "no-cache" });

  async function downloadRegistryExportFile(exportId: string) {
    setDownloadLoadingExportId(exportId);
    try {
      const link = await getDownloadLink({
        variables: { exportId }
      });
      downloadFromSignedUrl(
        link.data?.registryV2ExportDownloadSignedUrl.signedUrl
      );
    } finally {
      setDownloadLoadingExportId(null);
    }
  }

  useEffect(() => {
    if (
      registryExports?.some(
        registryExport =>
          registryExport.node.status === RegistryV2ExportStatus.Pending ||
          registryExport.node.status === RegistryV2ExportStatus.Started
      ) &&
      !refetchTimeout
    ) {
      const timeout = setTimeout(() => {
        setRefetchTimeout(null);
        refetch();
      }, 5000);
      setRefetchTimeout(timeout);
    }
    return () => {
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryExports]);

  return (
    <>
      <div
        className={classNames([
          "tw-flex-grow",
          styles.myRegistryExportsContainer
        ])}
      >
        <div className="tw-p-6 tw-pb-0">
          <div className="tw-flex">
            <div>
              <Button
                priority="primary"
                iconId="fr-icon-download-line"
                iconPosition="right"
                onClick={() => setIsExportModalOpen(true)}
              >
                Exporter
              </Button>
            </div>
          </div>
        </div>
        <div className="tw-p-6">
          {!exportsLoading ? (
            <Table
              caption="Exports récents"
              data={
                registryExports
                  ? registryExports.map(registryExport => [
                      <div>
                        <div>
                          {format(
                            new Date(registryExport.node.createdAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </div>
                        {badges[registryExport.node.status]("export")}
                      </div>,
                      <div>
                        {[
                          `${
                            registryExport.node.companies[0]?.givenName &&
                            registryExport.node.companies[0]?.givenName !== ""
                              ? registryExport.node.companies[0]?.givenName
                              : registryExport.node.companies[0]?.name
                          } - ${registryExport.node.companies[0]?.orgId}`,
                          ...(registryExport.node.companies.length > 1
                            ? [
                                `et ${
                                  registryExport.node.companies.length - 1
                                } autre${
                                  registryExport.node.companies.length > 2
                                    ? "s"
                                    : ""
                                } `
                              ]
                            : [])
                        ].join(", ")}
                        {registryExport.node.companies.length > 1 ? (
                          <Tooltip
                            kind="hover"
                            className={styles.prewrap}
                            title={registryExport.node.companies
                              .slice(1)
                              .map(
                                company =>
                                  `${
                                    company.givenName &&
                                    company.givenName !== ""
                                      ? company.givenName
                                      : company.name
                                  } - ${company.orgId}`
                              )
                              .join(",\n")}
                          />
                        ) : null}
                      </div>,
                      getRegistryTypeWording(registryExport.node.registryType),
                      getDeclarationTypeWording(
                        registryExport.node.declarationType
                      ),
                      formatRegistryDates(
                        registryExport.node.createdAt,
                        registryExport.node.startDate,
                        registryExport.node.endDate
                      ),
                      registryExport.node.status ===
                        RegistryV2ExportStatus.Pending ||
                      registryExport.node.status ===
                        RegistryV2ExportStatus.Started ||
                      downloadLoadingExportId === registryExport.node.id ? (
                        <div style={{ width: "fit-content" }}>
                          <InlineLoader size={32} />
                        </div>
                      ) : registryExport.node.status ===
                        RegistryV2ExportStatus.Successful ? (
                        <Button
                          title="Télécharger"
                          priority="secondary"
                          iconId="fr-icon-download-line"
                          onClick={() =>
                            downloadRegistryExportFile(registryExport.node.id)
                          }
                          size="small"
                        />
                      ) : (
                        ""
                      )
                    ])
                  : []
              }
              headers={[
                "Date",
                "Établissements",
                "Type de registre",
                "Type de déclaration",
                "Période",
                "Fichier"
              ]}
            />
          ) : null}
        </div>
      </div>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          refetch();
        }}
      />
    </>
  );
}
