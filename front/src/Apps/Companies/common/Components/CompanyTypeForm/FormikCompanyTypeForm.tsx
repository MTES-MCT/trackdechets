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
  "values" | "handleChange" | "handleBlur" | "setFieldValue" | "errors"
>;

const FormikCompanyTypeForm: React.FC<FormikCompanyTypeFormProps> = ({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  errors
}) => {
  const companyTypes = values.companyTypes;
  const collectorTypes = values.collectorTypes;
  const wasteProcessorTypes = values.wasteProcessorTypes;
  const wasteVehiclesTypes = values.wasteVehiclesTypes;
  const ecoOrganismeAgreements = values.ecoOrganismeAgreements;

  // La couche d'affichage des données au niveau de <CompanyTypeForm /> ne fait
  // pas de différence entre type et sous-type d'établissement. La correspondance
  // est gérée ici pour mettre à jour l'un des champs suivants :
  // `companyType`, `wasteProcessTypes`, `collectorTypes` ou `wasteVehiclesTypes`,
  const handleToggle = (value: AllCompanyType, checked: boolean) => {
    if (COMPANY_TYPE_VALUES.includes(value as CompanyType)) {
      if (checked) {
        setFieldValue("companyTypes", [...companyTypes, value as CompanyType]);
      } else {
        setFieldValue(
          "companyTypes",
          companyTypes.filter(c => c !== value)
        );
      }
    }

    if (COLLECTOR_TYPE_VALUES.includes(value as CollectorType)) {
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

    if (WASTE_PROCESSOR_TYPE_VALUES.includes(value as WasteProcessorType)) {
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

    if (WASTE_VEHICLES_TYPE_VALUES.includes(value as WasteVehiclesType)) {
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
  };

  const allCompanyTypes = [
    ...companyTypes,
    ...collectorTypes,
    ...wasteProcessorTypes,
    ...wasteVehiclesTypes
  ];

  function fieldProps(name: string) {
    return {
      name,
      onChange: handleChange,
      onBlur: handleBlur,
      value: values[name]
    };
  }

  return (
    <CompanyTypeForm
      inputValues={{
        companyTypes: allCompanyTypes,
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
          value: index => fieldProps(`ecoOrganismeAgreements[${index}]`),
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
          receiptNumber: (errors?.transporterReceipt as any)?.receiptNumber,
          validityLimit: (errors?.transporterReceipt as any)?.validityLimit,
          department: (errors?.transporterReceipt as any)?.department
        },
        brokerReceipt: {
          receiptNumber: (errors?.brokerReceipt as any)?.receiptNumber,
          validityLimit: (errors?.brokerReceipt as any)?.validityLimit,
          department: (errors?.brokerReceipt as any)?.department
        },
        traderReceipt: {
          receiptNumber: (errors?.traderReceipt as any)?.receiptNumber,
          validityLimit: (errors?.traderReceipt as any)?.validityLimit,
          department: (errors?.traderReceipt as any)?.department
        },
        vhuAgrementDemolisseur: {
          agrementNumber: (errors?.vhuAgrementDemolisseur as any)
            ?.agrementNumber,
          department: (errors?.vhuAgrementDemolisseur as any)?.department
        },
        vhuAgrementBroyeur: {
          agrementNumber: (errors?.vhuAgrementBroyeur as any)?.agrementNumber,
          department: (errors?.vhuAgrementBroyeur as any)?.department
        },
        workerCertification: {
          certificationNumber: (errors.workerCertification as any)
            ?.certificationNumber,
          validityLimit: (errors.workerCertification as any)?.validityLimit,
          organisation: (errors.workerCertification as any)?.organisation
        },
        ecoOrganismeAgreements: errors?.ecoOrganismeAgreements
      }}
    />
  );
};

export default React.memo(FormikCompanyTypeForm);
