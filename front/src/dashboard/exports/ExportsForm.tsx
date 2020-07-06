import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { Formik, Form, Field } from "formik";
import DateInput from "../../form/custom-inputs/DateInput";
import styles from "./ExportsForms.module.scss";
import {
  CompanyPrivate,
  FormsRegisterExportType,
  CompanyType,
} from "../../generated/graphql/types";
import WasteTreeModal from "../../search/WasteTreeModal";
import { wasteCodeValidator } from "../../form/waste-code/waste-code.validator";
import WasteCodeLookup from "../../form/waste-code/nomenclature-dechets.json";
import { useLazyQuery } from "@apollo/react-hooks";
import { NotificationError } from "../../common/Error";
import RedErrorMessage from "../../common/RedErrorMessage";
import { FaHourglassHalf } from "react-icons/fa";

interface IProps {
  companies: CompanyPrivate[];
}

type Values = {
  exportType: FormsRegisterExportType;
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

const FORMS_REGISTER = gql`
  query FormsRegister(
    $sirets: [String!]!
    $exportType: FormsRegisterExportType
    $startDate: DateTime
    $endDate: DateTime
    $wasteCode: String
    $exportFormat: FormsRegisterExportFormat
  ) {
    formsRegister(
      sirets: $sirets
      exportType: $exportType
      startDate: $startDate
      endDate: $endDate
      wasteCode: $wasteCode
      exportFormat: $exportFormat
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

  const exportTypes: FormsRegisterExportType[] = [];

  if (
    companyTypes.filter(t =>
      [
        CompanyType.Producer,
        CompanyType.WasteVehicles,
        CompanyType.WasteCenter,
      ].includes(t)
    ).length > 0
  ) {
    exportTypes.push(FormsRegisterExportType.Outgoing);
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
    exportTypes.push(FormsRegisterExportType.Incoming);
  }

  if (companyTypes.includes(CompanyType.Transporter)) {
    exportTypes.push(FormsRegisterExportType.Transported);
  }

  if (companyTypes.includes(CompanyType.Trader)) {
    exportTypes.push(FormsRegisterExportType.Traded);
  }

  exportTypes.push(FormsRegisterExportType.All);

  return exportTypes;
}

export default function ExportsForm({ companies }: IProps) {
  const [openWasteTreeModal, setOpenWasteTreeModal] = useState(false);

  const now = new Date();

  const initialValues: Values = {
    exportType: FormsRegisterExportType.Outgoing,
    startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
    endDate: now.toISOString(),
    companies,
    wasteCode: "",
    exportFormat: "CSV",
  };

  const [downloadFile, { data, error, loading }] = useLazyQuery(
    FORMS_REGISTER,
    {
      fetchPolicy: "network-only",
    }
  );

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

    downloadFile({
      variables: {
        sirets: companies.map(c => c.siret),
        exportType,
        startDate: startDate,
        endDate: endDate,
        wasteCode,
        exportFormat,
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
        const wasteCodeDetail = WasteCodeLookup.find(
          l => l.code === values.wasteCode
        );

        const exportTypes = getPossibleExportTypes(values.companies);
        if (!exportTypes.includes(values.exportType)) {
          setFieldValue("exportType", exportTypes[0]);
        }

        return (
          <Form className="tw-m-0">
            <div className="tw-grid tw-justify-center tw-grid-cols-3 tw-gap-6">
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Type de registre
              </label>
              <Field
                className="tw-col-span-2 tw-max-w-md"
                name="exportType"
                as="select"
              >
                <option
                  value={FormsRegisterExportType.Outgoing}
                  disabled={
                    !exportTypes.includes(FormsRegisterExportType.Outgoing)
                  }
                >
                  Déchets sortants
                </option>
                <option
                  value={FormsRegisterExportType.Incoming}
                  disabled={
                    !exportTypes.includes(FormsRegisterExportType.Incoming)
                  }
                >
                  Déchets entrants
                </option>
                <option
                  value={FormsRegisterExportType.Transported}
                  disabled={
                    !exportTypes.includes(FormsRegisterExportType.Transported)
                  }
                >
                  Transporteur
                </option>
                <option
                  value={FormsRegisterExportType.Traded}
                  disabled={
                    !exportTypes.includes(FormsRegisterExportType.Traded)
                  }
                >
                  Négociant
                </option>
                <option value={FormsRegisterExportType.All}>Exhaustif</option>
              </Field>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Date de début
              </label>
              <Field
                className={`tw-col-span-2 ${styles["max-w-xxs"]}`}
                name="startDate"
                component={DateInput}
              ></Field>
              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Date de fin
              </label>

              <div className="tw-col-span-2 tw-max-w-md">
                <Field
                  className={`tw-col-span-2 ${styles["max-w-xxs"]}`}
                  name="endDate"
                  component={DateInput}
                ></Field>

                <RedErrorMessage name="endDate"></RedErrorMessage>
              </div>

              <label className="tw-col-span-1 tw-text-right tw-flex tw-items-start tw-justify-end tw-font-bold">
                Établissement
              </label>

              <Field name="companies">
                {() => (
                  <select
                    className="tw-col-span-2 max-w-md"
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
                    className={`${styles["max-w-xxs"]} tw-mr-4`}
                  ></Field>
                  <button
                    className={`button-outline primary small tw-text-xs ${styles["max-w-xxs"]} tw-mr-4`}
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
                className="tw-col-span-2 tw-max-w-md"
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
                className="button tw-justify-end"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    Préparation de l'export... <FaHourglassHalf />
                  </span>
                ) : (
                  "Exporter"
                )}
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
