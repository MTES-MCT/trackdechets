import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import DateInput from "form/common/components/custom-inputs/DateInput";
import styles from "./ExportsForms.module.scss";
import {
  CompanyPrivate,
  CompanyType,
  Query,
  WasteRegisterType,
} from "generated/graphql/types";
import WasteTreeModal from "search/WasteTreeModal";
import { wasteCodeValidator } from "form/bsdd/components/waste-code/waste-code.validator";
import { WASTES } from "generated/constants";
import { useLazyQuery, gql } from "@apollo/client";
import { NotificationError } from "common/components/Error";
import RedErrorMessage from "common/components/RedErrorMessage";

interface IProps {
  companies: CompanyPrivate[];
}

type Values = {
  exportType: WasteRegisterType;
  startDate: string;
  endDate: string;
  companies: CompanyPrivate[];
  wasteCode: string;
  exportFormat: string;
};

ExportsForm.fragments = {
  company: gql`
    fragment ExportsFormCompanyFragment on CompanyPrivate {
      siret
      name
      givenName
      companyTypes
    }
  `,
};

export const WASTES_DOWNLOAD_LINK = gql`
  query WastesDownloadLink(
    $registerType: WasteRegisterType!
    $sirets: [String!]!
    $fileType: WasteRegisterFileType!
    $where: WasteRegisterWhere
  ) {
    wastesDownloadLink(
      registerType: $registerType
      sirets: $sirets
      fileType: $fileType
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

  const exportTypes: WasteRegisterType[] = [];

  if (
    companyTypes.filter(t =>
      [
        CompanyType.Producer,
        CompanyType.WasteVehicles,
        CompanyType.WasteCenter,
      ].includes(t)
    ).length > 0
  ) {
    exportTypes.push(WasteRegisterType.Outgoing);
  }

  if (
    companyTypes.filter(t =>
      [
        CompanyType.Wasteprocessor,
        CompanyType.WasteVehicles,
        CompanyType.Collector,
      ].includes(t)
    ).length > 0
  ) {
    exportTypes.push(WasteRegisterType.Incoming);
  }

  if (companyTypes.includes(CompanyType.Transporter)) {
    exportTypes.push(WasteRegisterType.Transported);
  }

  if (
    companyTypes.includes(CompanyType.Trader) ||
    companyTypes.includes(CompanyType.Broker)
  ) {
    exportTypes.push(WasteRegisterType.Managed);
  }

  exportTypes.push(WasteRegisterType.All);

  return exportTypes;
}

export default function ExportsForm({ companies }: IProps) {
  const [openWasteTreeModal, setOpenWasteTreeModal] = useState(false);

  const now = new Date();

  const initialValues: Values = {
    exportType: WasteRegisterType.Outgoing,
    startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
    endDate: now.toISOString(),
    companies,
    wasteCode: "",
    exportFormat: "CSV",
  };

  const [downloadFile, { data, error, loading }] = useLazyQuery<
    Pick<Query, "wastesDownloadLink">
  >(WASTES_DOWNLOAD_LINK, {
    fetchPolicy: "network-only",
  });

  // Formik onSubmit callback
  const onSubmit = (values: Values) => {
    const {
      companies,
      exportType,
      startDate,
      endDate,
      wasteCode,
      exportFormat,
    } = values;

    console.log(values);

    downloadFile({
      variables: {
        sirets: companies.map(c => c.siret),
        registerType: exportType,
        fileType: exportFormat,
        where: {
          createdAt: {
            _gte: startDate,
            _lte: endDate,
          },
          ...(wasteCode ? { wasteCode: { _eq: wasteCode } } : {}),
        },
      },
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
        endDate: "La date de fin doit être supérieure à la date de début",
      };
    }
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    const key = Object.keys(data)[0];
    if (data[key].downloadLink) {
      window.open(data[key].downloadLink, "_blank");
    }
  }, [data]);

  return (
    <Formik<Values>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={validate}
    >
      {({ values, setFieldValue }) => {
        const wasteCodeDetail = WASTES.find(
          waste => waste.code === values.wasteCode
        );

        const exportTypes = getPossibleExportTypes(values.companies);
        if (!exportTypes.includes(values.exportType)) {
          setFieldValue("exportType", exportTypes[0]);
        }

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
                  value={WasteRegisterType.Outgoing}
                  disabled={!exportTypes.includes(WasteRegisterType.Outgoing)}
                >
                  Déchets sortants
                </option>
                <option
                  value={WasteRegisterType.Incoming}
                  disabled={!exportTypes.includes(WasteRegisterType.Incoming)}
                >
                  Déchets entrants
                </option>
                <option
                  value={WasteRegisterType.Transported}
                  disabled={
                    !exportTypes.includes(WasteRegisterType.Transported)
                  }
                >
                  Transporteur
                </option>
                <option
                  value={WasteRegisterType.Managed}
                  disabled={!exportTypes.includes(WasteRegisterType.Managed)}
                >
                  Gestion
                </option>
                {/* <option value={FormsRegisterExportType.All}>Exhaustif</option> */}
              </Field>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Date de début
              </label>
              <div className="tw-col-span-2 tw-max-w-md">
                <Field
                  className={`td-input ${styles["max-w-xxs"]}`}
                  name="startDate"
                  component={DateInput}
                />
              </div>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Date de fin
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
                        setFieldValue("companies", companies);
                      } else {
                        setFieldValue(
                          "companies",
                          companies.filter(c => c.siret === value)
                        );
                      }
                    }}
                  >
                    <option value="all" key="all">
                      Tous les établissements
                    </option>
                    {companies.map((company, key) => (
                      <option value={company.siret} key={key}>
                        {company.givenName || company.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Code déchet (optionnel)
              </label>
              <div className="tw-col-span-2 tw-max-w-md">
                <div className="tw-container tw-flex tw-flex-row">
                  <Field
                    name="wasteCode"
                    className={`${styles["max-w-xxs"]} tw-mr-4 td-input`}
                  />
                  <button
                    type="button"
                    className={`btn btn--outline-primary btn--small-text ${styles["max-w-xxs"]} tw-mr-4`}
                    onClick={() => setOpenWasteTreeModal(true)}
                  >
                    Liste des codes déchets
                  </button>
                </div>
                {wasteCodeDetail && <div>{wasteCodeDetail.description}</div>}
                <RedErrorMessage name="wasteCode"></RedErrorMessage>
              </div>

              <WasteTreeModal
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
