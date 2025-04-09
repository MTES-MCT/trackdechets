import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import styles from "./ExportsForms.module.scss";
import { CompanyPrivate, Query, WasteRegistryType } from "@td/codegen-ui";
import WasteTreeModal from "../../Apps/common/Components/search/WasteTreeModal";

import { ALL_WASTES_TREE } from "@td/constants";
import { useLazyQuery, gql } from "@apollo/client";
import { NotificationError } from "../../Apps/common/Components/Error/Error";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import { sortCompaniesByName } from "../../common/helper";
import { wasteCodeValidator } from "../../form/common/wasteCode";
import Select from "@codegouvfr/react-dsfr/Select";
import Input from "@codegouvfr/react-dsfr/Input";
import { format } from "date-fns";
import Button from "@codegouvfr/react-dsfr/Button";

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
function getPossibleExportTypes() {
  const exportTypes: WasteRegistryType[] = [];
  exportTypes.push(WasteRegistryType.All);

  return exportTypes;
}

export default function ExportsForm({ companies }: IProps) {
  const [openWasteTreeModal, setOpenWasteTreeModal] = useState(false);

  const sortedCompanies = sortCompaniesByName(companies);

  const now = new Date();

  const initialValues: Values = {
    exportType: WasteRegistryType.All,
    startDate: format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(now, "yyyy-MM-dd"),
    companies,
    wasteCode: "",
    exportFormat: "XLSX"
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

    const dateFilter = {
      transporterTakenOverAt: { _gte: startDate, _lte: endDate }
    };

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
        const exportTypes = getPossibleExportTypes();
        if (!exportTypes.includes(values.exportType)) {
          setFieldValue("exportType", exportTypes[0]);
        }

        const error = wastesCsvError || wastesXlsError;
        const loading = wastesCsvLoading || wastesXlsLoading;

        return (
          <Form className={styles.exportForm}>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-10">
                <Field name="exportType">
                  {({ field }) => {
                    return (
                      <Select
                        label="Type de registre"
                        nativeSelectProps={field}
                        disabled
                      >
                        <option value={WasteRegistryType.All}>Exhaustif</option>
                      </Select>
                    );
                  }}
                </Field>
              </div>
              <div className="fr-col-10">
                <Field name="startDate">
                  {({ field }) => {
                    return (
                      <Input
                        label="Début de la période (date d'expédition)"
                        nativeInputProps={{
                          type: "date",
                          value: field.value,
                          onChange: field.onChange,
                          name: field.name
                        }}
                      />
                    );
                  }}
                </Field>
              </div>
              <div className="fr-col-10">
                <Field name="endDate">
                  {({ field }) => {
                    return (
                      <Input
                        label="Fin de la période (date d'expédition)"
                        nativeInputProps={{
                          type: "date",
                          value: field.value,
                          onChange: field.onChange,
                          name: field.name
                        }}
                      />
                    );
                  }}
                </Field>
                <RedErrorMessage name="endDate"></RedErrorMessage>
              </div>

              <div className="fr-col-10">
                <Field name="companies">
                  {({ field, form }) => {
                    const handleChange = evt => {
                      const value = evt.target.value;

                      if (value === "all") {
                        form.setFieldValue("companies", sortedCompanies);
                      } else {
                        const selectedCompany = sortedCompanies.find(
                          c => c.orgId === value
                        );
                        form.setFieldValue(
                          "companies",
                          selectedCompany ? [selectedCompany] : []
                        );
                      }
                    };

                    return (
                      <Select
                        label="Établissement"
                        nativeSelectProps={{
                          value:
                            Array.isArray(field.value) &&
                            field.value.length === sortedCompanies.length
                              ? "all"
                              : field.value?.[0]?.orgId ?? "",
                          name: field.name,
                          onChange: handleChange
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
                      </Select>
                    );
                  }}
                </Field>
              </div>

              <WasteTreeModal
                wasteTree={ALL_WASTES_TREE}
                open={openWasteTreeModal}
                onClose={() => setOpenWasteTreeModal(false)}
                onSelect={codes => {
                  setFieldValue("wasteCode", codes[0]);
                }}
              />
              <div className="fr-col-10">
                <Field name="exportFormat">
                  {({ field }) => {
                    return (
                      <Select label="Format d'export" nativeSelectProps={field}>
                        <option value="XLSX">.xlsx (Excel)</option>
                        <option value="CSV">.csv</option>{" "}
                      </Select>
                    );
                  }}
                </Field>
              </div>
            </div>
            <div className="fr-col-10 fr-mb-4w">
              {error && <NotificationError apolloError={error} />}
            </div>

            <div className="fr-col-10 fr-col-offset-8">
              <Button type="submit" priority="primary" disabled={loading}>
                {loading ? <span>Préparation de l'export...</span> : "Exporter"}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
