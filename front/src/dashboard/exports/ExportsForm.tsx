import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import DateInput from "../../form/common/components/custom-inputs/DateInput";
import styles from "./ExportsForms.module.scss";
import {
  CompanyPrivate,
  CompanyType,
  Query,
  WasteRegistryType
} from "@td/codegen-ui";
import WasteTreeModal from "../../search/WasteTreeModal";

import { ALL_WASTES_TREE } from "@td/constants";
import { useLazyQuery, gql } from "@apollo/client";
import { NotificationError } from "../../Apps/common/Components/Error/Error";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import { sortCompaniesByName } from "../../common/helper";
import { wasteCodeValidator } from "../../form/common/wasteCode";

interface IProps {
  companies: CompanyPrivate[];
}

type Values = {
  exportType: WasteRegistryType;
  startDate: string;
  endDate: string;
  companies: CompanyPrivate[];
  wasteCode: string;
  exportFormat: string;
};

ExportsForm.fragments = {
  company: gql`
    fragment ExportsFormCompanyFragment on CompanyPrivate {
      orgId
      name
      givenName
      companyTypes
    }
  `
};

export const WASTES_REGISTRY_CSV = gql`
  query WastesRegistryCsv(
    $registryType: WasteRegistryType!
    $sirets: [String!]!
    $where: WasteRegistryWhere
  ) {
    wastesRegistryCsv(
      registryType: $registryType
      sirets: $sirets
      where: $where
    ) {
      downloadLink
    }
  }
`;

export const WASTES_REGISTRY_XLS = gql`
  query WastesRegistryXls(
    $registryType: WasteRegistryType!
    $sirets: [String!]!
    $where: WasteRegistryWhere
  ) {
    wastesRegistryXls(
      registryType: $registryType
      sirets: $sirets
      where: $where
    ) {
      downloadLink
    }
  }
`;

/**
 * Define possible export types based on company types
 */
function getPossibleExportTypes(companies: CompanyPrivate[]) {
  const companyTypes = companies.reduce((acc, company) => {
    company.companyTypes.forEach(t => {
      if (!acc.includes(t)) {
        acc.push(t);
      }
    });
    return acc;
  }, [] as CompanyType[]);

  const exportTypes: WasteRegistryType[] = [];

  if (
    companyTypes.filter(t =>
      [
        CompanyType.Producer,
        CompanyType.WasteVehicles,
        CompanyType.WasteCenter,
        CompanyType.Collector,
        CompanyType.Worker,
        CompanyType.EcoOrganisme
      ].includes(t)
    ).length > 0
  ) {
    exportTypes.push(WasteRegistryType.Outgoing);
  }

  if (
    companyTypes.filter(t =>
      [
        CompanyType.Wasteprocessor,
        CompanyType.WasteVehicles,
        CompanyType.Collector
      ].includes(t)
    ).length > 0
  ) {
    exportTypes.push(WasteRegistryType.Incoming);
  }

  if (companyTypes.includes(CompanyType.Transporter)) {
    exportTypes.push(WasteRegistryType.Transported);
  }

  if (
    companyTypes.includes(CompanyType.Trader) ||
    companyTypes.includes(CompanyType.Broker) ||
    companyTypes.includes(CompanyType.Intermediary)
  ) {
    exportTypes.push(WasteRegistryType.Managed);
  }

  exportTypes.push(WasteRegistryType.All);

  return exportTypes;
}

export default function ExportsForm({ companies }: IProps) {
  const [openWasteTreeModal, setOpenWasteTreeModal] = useState(false);

  const sortedCompanies = sortCompaniesByName(companies);

  const now = new Date();

  const initialValues: Values = {
    exportType: WasteRegistryType.Outgoing,
    startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
    endDate: now.toISOString(),
    companies,
    wasteCode: "",
    exportFormat: "CSV"
  };

  const [
    wastesRegistryCsv,
    { data: wastesCsvData, error: wastesCsvError, loading: wastesCsvLoading }
  ] = useLazyQuery<Pick<Query, "wastesRegistryCsv">>(WASTES_REGISTRY_CSV, {
    fetchPolicy: "network-only"
  });

  const [
    wastesRegistryXls,
    { data: wastesXlsData, error: wastesXlsError, loading: wastesXlsLoading }
  ] = useLazyQuery<Pick<Query, "wastesRegistryXls">>(WASTES_REGISTRY_XLS, {
    fetchPolicy: "network-only"
  });

  // Formik onSubmit callback
  const onSubmit = (values: Values) => {
    const {
      companies,
      exportType,
      startDate,
      endDate,
      wasteCode,
      exportFormat
    } = values;

    const downloadFile =
      exportFormat === "CSV" ? wastesRegistryCsv : wastesRegistryXls;

    const dateFilter =
      exportType === WasteRegistryType.Incoming
        ? { destinationReceptionDate: { _gte: startDate, _lte: endDate } }
        : { transporterTakenOverAt: { _gte: startDate, _lte: endDate } };

    downloadFile({
      variables: {
        sirets: companies.map(c => c.orgId),
        registryType: exportType,
        where: {
          ...dateFilter,
          ...(wasteCode ? { wasteCode: { _eq: wasteCode } } : {})
        }
      }
    });
  };

  // Formik validattion
  const validate = (values: Values) => {
    if (values.wasteCode) {
      const wasteCodeError = wasteCodeValidator(values.wasteCode);
      if (wasteCodeError) {
        return { wasteCode: wasteCodeError };
      }
    }
    if (values.startDate > values.endDate) {
      return {
        endDate: "La date de fin doit être supérieure à la date de début"
      };
    }
  };

  useEffect(() => {
    const data = wastesCsvData || wastesXlsData;

    if (!data) {
      return;
    }

    const key = Object.keys(data)[0];
    if (data[key].downloadLink) {
      window.open(data[key].downloadLink, "_blank");
    }
  }, [wastesCsvData, wastesXlsData]);

  return (
    <Formik<Values>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={validate}
    >
      {({ values, setFieldValue }) => {
        const exportTypes = getPossibleExportTypes(values.companies);
        if (!exportTypes.includes(values.exportType)) {
          setFieldValue("exportType", exportTypes[0]);
        }

        const error = wastesCsvError || wastesXlsError;
        const loading = wastesCsvLoading || wastesXlsLoading;

        return (
          <Form className={styles.exportForm}>
            <div className="tw-grid tw-justify-center tw-grid-cols-3 tw-gap-6">
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Type de registre
              </label>
              <Field
                className="tw-col-span-2 tw-max-w-md td-select"
                name="exportType"
                as="select"
              >
                <option
                  value={WasteRegistryType.Outgoing}
                  disabled={!exportTypes.includes(WasteRegistryType.Outgoing)}
                >
                  Déchets sortants
                </option>
                <option
                  value={WasteRegistryType.Incoming}
                  disabled={!exportTypes.includes(WasteRegistryType.Incoming)}
                >
                  Déchets entrants
                </option>
                <option
                  value={WasteRegistryType.Transported}
                  disabled={
                    !exportTypes.includes(WasteRegistryType.Transported)
                  }
                >
                  Transporteur
                </option>
                <option
                  value={WasteRegistryType.Managed}
                  disabled={!exportTypes.includes(WasteRegistryType.Managed)}
                >
                  Gestion
                </option>
                <option value={WasteRegistryType.All}>Exhaustif</option>
              </Field>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Début de la période (
                {values.exportType === WasteRegistryType.Incoming
                  ? "date de réception"
                  : "date d'expédition"}
                )
              </label>
              <div className="tw-col-span-2 tw-max-w-md">
                <Field
                  className={`td-input ${styles["max-w-xxs"]}`}
                  name="startDate"
                  component={DateInput}
                />
              </div>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Fin de la période (
                {values.exportType === WasteRegistryType.Incoming
                  ? "date de réception"
                  : "date d'expédition"}
                )
              </label>

              <div className="tw-col-span-2 tw-max-w-md">
                <Field
                  className={`td-input ${styles["max-w-xxs"]}`}
                  name="endDate"
                  component={DateInput}
                />
                <RedErrorMessage name="endDate"></RedErrorMessage>
              </div>

              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold ">
                Établissement
              </label>

              <Field name="companies">
                {() => (
                  <select
                    className="tw-col-span-2 tw-max-w-md td-select"
                    onChange={evt => {
                      const value = evt.target.value;
                      if (value === "all") {
                        setFieldValue("companies", sortedCompanies);
                      } else {
                        setFieldValue(
                          "companies",
                          sortedCompanies.filter(c => c.orgId === value)
                        );
                      }
                    }}
                  >
                    <option value="all" key="all">
                      Tous les établissements
                    </option>
                    {sortedCompanies.map((company, key) => {
                      const name =
                        company.givenName && company.givenName !== ""
                          ? company.givenName
                          : company.name;

                      return (
                        <option value={company.orgId} key={key}>
                          {`${name} - ${company.orgId}`}
                        </option>
                      );
                    })}
                  </select>
                )}
              </Field>

              <WasteTreeModal
                wasteTree={ALL_WASTES_TREE}
                open={openWasteTreeModal}
                onClose={() => setOpenWasteTreeModal(false)}
                onSelect={codes => {
                  setFieldValue("wasteCode", codes[0]);
                }}
              />
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Format d'export
              </label>
              <Field
                as="select"
                name="exportFormat"
                className="tw-col-span-2 tw-max-w-md td-select"
              >
                <option value="CSV">.csv</option>
                <option value="XLSX">.xlsx (Excel)</option>
              </Field>
            </div>
            <div className="tw-mt-5">
              {error && <NotificationError apolloError={error} />}
            </div>

            <div className="tw-container tw-flex tw-flex-row-reverse tw-mt-5">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? <span>Préparation de l'export...</span> : "Exporter"}
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
