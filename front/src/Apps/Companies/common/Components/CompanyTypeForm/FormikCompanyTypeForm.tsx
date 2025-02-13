import React from "react";
import {
  BrokerReceipt,
  CollectorType,
  CompanyType,
  Maybe,
  TraderReceipt,
  TransporterReceipt,
  VhuAgrement,
  WasteProcessorType,
  WasteVehiclesType,
  WorkerCertification
} from "@td/codegen-ui";
import { FormikProps } from "formik";
import {
  AllCompanyType,
  COLLECTOR_TYPE_VALUES,
  COMPANY_TYPE_VALUES,
  WASTE_PROCESSOR_TYPE_VALUES,
  WASTE_VEHICLES_TYPE_VALUES
} from "../../utils";
import CompanyTypeForm from "./CompanyTypeForm";

export interface FormikCompanyTypeValues {
  companyTypes: CompanyType[];
  workerCertification?: Maybe<Omit<WorkerCertification, "id">>;
  transporterReceipt?: Maybe<Omit<TransporterReceipt, "id">>;
  brokerReceipt?: Maybe<Omit<BrokerReceipt, "id">>;
  traderReceipt?: Maybe<Omit<TraderReceipt, "id">>;
  vhuAgrementBroyeur?: Maybe<Omit<VhuAgrement, "id">>;
  vhuAgrementDemolisseur?: Maybe<Omit<VhuAgrement, "id">>;
  collectorTypes: CollectorType[];
  wasteProcessorTypes: WasteProcessorType[];
  wasteVehiclesTypes: WasteVehiclesType[];
  ecoOrganismeAgreements: string[];
}

type FormikCompanyTypeFormProps = Pick<
  FormikProps<FormikCompanyTypeValues>,
  | "values"
  | "handleChange"
  | "handleBlur"
  | "setFieldValue"
  | "errors"
  | "touched"
  | "submitCount"
>;

const FormikCompanyTypeForm = ({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  errors,
  touched,
  submitCount
}: FormikCompanyTypeFormProps): React.JSX.Element => {
  const companyTypes = values.companyTypes;
  const collectorTypes = values.collectorTypes;
  const wasteProcessorTypes = values.wasteProcessorTypes;
  const wasteVehiclesTypes = values.wasteVehiclesTypes;
  const ecoOrganismeAgreements = values.ecoOrganismeAgreements;

  const isSubmitted = submitCount > 0;

  // Reçoit le type ou sous-type d'établissement qui a été sélectionné, pour mettre
  // à jour l'un des champs suivants : `companyType`, `wasteProcessTypes`, `collectorTypes`
  // ou `wasteVehiclesTypes`.
  //
  // Ex pour un type: { parentValue: undefined, value: "PRODUCER"}
  // Ex pour un sous-type: { parentValue: "COLLECTOR", value: "OTHER_NON_DANGEROUS_WASTES"}
  const handleToggle = (
    parentValue: AllCompanyType | undefined,
    value: AllCompanyType,
    checked: boolean
  ) => {
    if (!parentValue && COMPANY_TYPE_VALUES.includes(value as CompanyType)) {
      if (checked) {
        setFieldValue("companyTypes", [...companyTypes, value as CompanyType]);
      } else {
        setFieldValue(
          "companyTypes",
          companyTypes.filter(c => c !== value)
        );
      }
    }

    if (
      parentValue === "COLLECTOR" &&
      COLLECTOR_TYPE_VALUES.includes(value as CollectorType)
    ) {
      if (checked) {
        setFieldValue("collectorTypes", [
          ...collectorTypes,
          value as CollectorType
        ]);
      } else {
        setFieldValue(
          "collectorTypes",
          collectorTypes.filter(c => c !== value)
        );
      }
    }

    if (
      parentValue === "WASTEPROCESSOR" &&
      WASTE_PROCESSOR_TYPE_VALUES.includes(value as WasteProcessorType)
    ) {
      if (checked) {
        setFieldValue("wasteProcessorTypes", [
          ...wasteProcessorTypes,
          value as WasteProcessorType
        ]);
      } else {
        setFieldValue(
          "wasteProcessorTypes",
          wasteProcessorTypes.filter(c => c !== value)
        );
      }
    }

    if (
      parentValue === "WASTE_VEHICLES" &&
      WASTE_VEHICLES_TYPE_VALUES.includes(value as WasteVehiclesType)
    ) {
      if (checked) {
        setFieldValue("wasteVehiclesTypes", [
          ...wasteVehiclesTypes,
          value as WasteVehiclesType
        ]);
      } else {
        setFieldValue(
          "wasteVehiclesTypes",
          wasteVehiclesTypes.filter(c => c !== value)
        );
      }
    }

    if (value === CompanyType.EcoOrganisme) {
      if (checked) {
        setFieldValue("ecoOrganismeAgreements", [""]);
      } else {
        setFieldValue("ecoOrganismeAgreements", []);
      }
    }
  };

  const allcompanyTypes = [
    ...companyTypes,
    ...collectorTypes.map(type => `COLLECTOR.${type}`),
    ...wasteProcessorTypes.map(type => `WASTEPROCESSOR.${type}`),
    ...wasteVehiclesTypes.map(type => `WASTE_VEHICLES.${type}`)
  ];

  function fieldProps(name: string, index?: number) {
    let value;
    if (name.includes(".")) {
      value = name.split(".").reduce((a, b) => a[b] || "", values);
    } else {
      value = values[name];
    }

    let fieldName = name;

    if (index !== undefined) {
      value = value[index];
      fieldName = `${fieldName}[${index}]`;
    }

    return {
      name: fieldName,
      onChange: handleChange,
      onBlur: handleBlur,
      value
    };
  }

  return (
    <CompanyTypeForm
      inputValues={{
        companyTypes: allcompanyTypes,
        workerCertification: {
          hasSubSectionThree:
            values.workerCertification?.hasSubSectionThree ?? false
        },
        ecoOrganismeAgreements
      }}
      handleToggle={handleToggle}
      inputProps={{
        transporterReceipt: {
          receiptNumber: fieldProps("transporterReceipt.receiptNumber"),
          validityLimit: fieldProps("transporterReceipt.validityLimit"),
          department: fieldProps("transporterReceipt.department")
        },
        brokerReceipt: {
          receiptNumber: fieldProps("brokerReceipt.receiptNumber"),
          validityLimit: fieldProps("brokerReceipt.validityLimit"),
          department: fieldProps("brokerReceipt.department")
        },
        traderReceipt: {
          receiptNumber: fieldProps("traderReceipt.receiptNumber"),
          validityLimit: fieldProps("traderReceipt.validityLimit"),
          department: fieldProps("traderReceipt.department")
        },
        vhuAgrementBroyeur: {
          agrementNumber: fieldProps("vhuAgrementBroyeur.agrementNumber"),
          department: fieldProps("vhuAgrementBroyeur.department")
        },
        vhuAgrementDemolisseur: {
          agrementNumber: fieldProps("vhuAgrementDemolisseur.agrementNumber"),
          department: fieldProps("vhuAgrementDemolisseur.department")
        },
        workerCertification: {
          hasSubSectionThree: fieldProps(
            "workerCertification.hasSubSectionThree"
          ),
          hasSubSectionFour: fieldProps(
            "workerCertification.hasSubSectionFour"
          ),
          certificationNumber: fieldProps(
            "workerCertification.certificationNumber"
          ),
          validityLimit: fieldProps("workerCertification.validityLimit"),
          organisation: fieldProps("workerCertification.organisation")
        },
        ecoOrganismeAgreements: {
          value: index => fieldProps(`ecoOrganismeAgreements`, index),
          push: (v: string) => {
            setFieldValue("ecoOrganismeAgreements", [
              ...ecoOrganismeAgreements,
              v
            ]);
          },
          remove: (index: number) => {
            setFieldValue(
              "ecoOrganismeAgreements",
              ecoOrganismeAgreements.filter((_, i) => i !== index)
            );
          }
        }
      }}
      inputErrors={{
        transporterReceipt: {
          receiptNumber:
            isSubmitted && touched?.transporterReceipt
              ? (errors?.transporterReceipt as any)?.receiptNumber
              : null,
          validityLimit:
            isSubmitted && touched?.transporterReceipt
              ? (errors?.transporterReceipt as any)?.validityLimit
              : null,
          department:
            isSubmitted && touched?.transporterReceipt
              ? (errors?.transporterReceipt as any)?.department
              : null
        },
        brokerReceipt: {
          receiptNumber:
            isSubmitted && touched?.brokerReceipt
              ? (errors?.brokerReceipt as any)?.receiptNumber
              : null,
          validityLimit:
            isSubmitted && touched?.brokerReceipt
              ? (errors?.brokerReceipt as any)?.validityLimit
              : null,
          department:
            isSubmitted && touched?.brokerReceipt
              ? (errors?.brokerReceipt as any)?.department
              : null
        },
        traderReceipt: {
          receiptNumber:
            isSubmitted && touched?.traderReceipt
              ? (errors?.traderReceipt as any)?.receiptNumber
              : null,
          validityLimit:
            isSubmitted && touched?.traderReceipt
              ? (errors?.traderReceipt as any)?.validityLimit
              : null,
          department:
            isSubmitted && touched?.traderReceipt
              ? (errors?.traderReceipt as any)?.department
              : null
        },
        workerCertification: {
          certificationNumber:
            isSubmitted && touched?.workerCertification
              ? (errors.workerCertification as any)?.certificationNumber
              : null,
          validityLimit:
            isSubmitted && touched?.workerCertification
              ? (errors.workerCertification as any)?.validityLimit
              : null,
          organisation:
            isSubmitted && touched?.workerCertification
              ? (errors.workerCertification as any)?.organisation
              : null
        },
        ecoOrganismeAgreements:
          isSubmitted && touched?.ecoOrganismeAgreements
            ? ((errors?.ecoOrganismeAgreements ?? []) as string[])
            : []
      }}
    />
  );
};

export default React.memo(FormikCompanyTypeForm);
