import React, { useMemo } from "react";
import { ExportModal } from "./ExportModal";

import styles from "./MyExports.module.scss";
import {
  DeclarationType,
  RegistryExportStatus,
  RegistryV2ExportType,
  RegistryV2Export,
  RegistryExhaustiveExport
} from "@td/codegen-ui";
import { badges } from "./shared";

import { format, getYear, startOfYear, endOfYear } from "date-fns";
import Button from "@codegouvfr/react-dsfr/Button";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Alert from "@codegouvfr/react-dsfr/Alert";
import RegistryTable from "./RegistryTable";
import { useRegistryExport } from "./RegistryV2ExportContext";
import { useRegistryExportModal } from "./RegistryV2ExportModalContext";

export const getRegistryTypeWording = (
  registryType: RegistryV2ExportType
): string => {
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
  }
};

export const getDeclarationTypeWording = (
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
    if (getYear(startDateObj) === getYear(endDateObj)) {
      return `${getYear(startDateObj)}`;
    } else {
      return `${getYear(startDateObj)} - ${getYear(endDateObj)}`;
    }
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
  const {
    type,
    pageIndex,
    pageCount,
    downloadLoadingExportId,
    exportsLoading,
    registryExports,
    downloadRegistryExportFile,
    gotoPage,
    refetch,
    error
  } = useRegistryExport();
  const { onOpen: onOpenExportModal } = useRegistryExportModal();

  const tableData = useMemo(() => {
    if (!registryExports) return [];

    const getCommonColumns = (
      registryExport: RegistryV2Export | RegistryExhaustiveExport
    ) => ({
      date: (
        <div>
          <div>
            {format(new Date(registryExport.createdAt), "dd/MM/yyyy HH:mm")}
          </div>
          <div className={styles.badge}>
            {badges[registryExport.status]("export")}
          </div>
        </div>
      ),
      companies: (
        <div>
          {(registryExport.status === RegistryExportStatus.Started ||
            registryExport.status === RegistryExportStatus.Pending) &&
          registryExport.companies.length > 1 ? null : (
            <>
              {[
                `${
                  registryExport.companies[0]?.givenName &&
                  registryExport.companies[0]?.givenName !== ""
                    ? registryExport.companies[0]?.givenName
                    : registryExport.companies[0]?.name
                } - ${registryExport.companies[0]?.orgId}`,
                ...(registryExport.companies.length > 1
                  ? [
                      `et ${registryExport.companies.length - 1} autre${
                        registryExport.companies.length > 2 ? "s" : ""
                      } `
                    ]
                  : [])
              ].join(", ")}
              {registryExport.companies.length > 1 ? (
                <Tooltip
                  kind="hover"
                  className={styles.prewrap}
                  title={registryExport.companies
                    .slice(1)
                    .map(
                      company =>
                        `${
                          company.givenName && company.givenName !== ""
                            ? company.givenName
                            : company.name
                        } - ${company.orgId}`
                    )
                    .join(",\n")}
                />
              ) : null}
            </>
          )}
        </div>
      ),
      period: formatRegistryDates(
        registryExport.createdAt,
        registryExport.startDate,
        registryExport.endDate
      ),
      file:
        registryExport.status === RegistryExportStatus.Pending ||
        registryExport.status === RegistryExportStatus.Started ||
        downloadLoadingExportId === registryExport.id ? (
          <div className="tw-px-2" style={{ width: "fit-content" }}>
            <InlineLoader size={32} />
          </div>
        ) : registryExport.status === RegistryExportStatus.Successful ? (
          <div className="tw-px-2">
            <Button
              title="Télécharger"
              priority="secondary"
              iconId="fr-icon-download-line"
              onClick={() => downloadRegistryExportFile(registryExport.id)}
              size="small"
            />
          </div>
        ) : (
          ""
        )
    });

    return registryExports.map(registryExport => {
      const commonColumns = getCommonColumns(registryExport);

      if (type === "registryV2") {
        return [
          commonColumns.date,
          commonColumns.companies,
          getRegistryTypeWording(registryExport.registryType),
          getDeclarationTypeWording(registryExport.declarationType),
          commonColumns.period,
          commonColumns.file
        ];
      } else {
        return [
          commonColumns.date,
          commonColumns.companies,
          commonColumns.period,
          commonColumns.file
        ];
      }
    });
  }, [
    registryExports,
    downloadLoadingExportId,
    downloadRegistryExportFile,
    type
  ]);

  return (
    <>
      <>
        <div>
          <div className="tw-flex">
            <div>
              <Button
                id="export-reglementaire-btn"
                priority="primary"
                iconId="fr-icon-download-line"
                iconPosition="right"
                onClick={onOpenExportModal}
              >
                Exporter
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <div className="fr-mt-2w">
            <Alert
              closable
              description={error.message}
              severity="error"
              title="Erreur lors du chargement"
            />
          </div>
        )}
        {import.meta.env.VITE_REGISTRY_EXPORT_ISSUE_NOTICE && (
          <div className="fr-mt-2w">
            <Alert
              description={import.meta.env.VITE_REGISTRY_EXPORT_ISSUE_NOTICE}
              severity="info"
              small
            />
          </div>
        )}
        {registryExports && registryExports.length === 0 && (
          <div className="tw-text-center">
            <p className="tw-mt-24 tw-text-xl tw-mb-4">
              Vous n'avez pas encore fait d'export
            </p>
            <p className="tw-text-sm">
              Utilisez le bouton "Exporter" ci-dessus pour réaliser un export
            </p>
          </div>
        )}
        {registryExports && registryExports.length > 0 && (
          <div className="tw-mt-8">
            <div className="tw-flex tw-justify-between">
              <h2 className="tw-text-2xl tw-font-bold">Exports récents</h2>
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
            {!exportsLoading ? (
              <RegistryTable
                data={tableData}
                headers={[
                "Date",
                "Établissements",
                ...(type === "registryV2"
                  ? ["Type de registre", "Type de déclaration"]
                  : []),
                "Période",
                "Fichier"
                ]}
              />
            ) : (
              <InlineLoader />
            )}
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
      </>
      <ExportModal />
    </>
  );
}
