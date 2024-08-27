import React from "react";
import { UseFormReturn, Validate } from "react-hook-form";
import {
  AllCompanyType,
  COLLECTOR_TYPE_VALUES,
  COMPANY_TYPE_VALUES,
  WASTE_PROCESSOR_TYPE_VALUES,
  WASTE_VEHICLES_TYPE_VALUES
} from "../../utils";
import CompanyTypeForm from "./CompanyTypeForm";
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

export interface RhfCompanyTypeFormField {
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

type RhfCompanyTypeFormProps = Pick<
  UseFormReturn<RhfCompanyTypeFormField>,
  "watch" | "register" | "setValue" | "formState"
>;

/**
 * Implémentation de <CompanyTypeForm /> contrôlé par
 * React Hook Form
 */
const RhfCompanyTypeForm = ({
  watch,
  register,
  setValue,
  formState
}: RhfCompanyTypeFormProps): React.JSX.Element => {
  const companyTypes = watch("companyTypes");
  const collectorTypes = watch("collectorTypes");
  const wasteProcessorTypes = watch("wasteProcessorTypes");
  const wasteVehiclesTypes = watch("wasteVehiclesTypes");
  const ecoOrganismeAgreements = watch("ecoOrganismeAgreements");

  // La couche d'affichage des données au niveau de <CompanyTypeForm /> ne fait
  // pas de différence entre type et sous-type d'établissement. La correspondance
  // est gérée ici pour mettre à jour l'un des champs suivants :
  // `companyType`, `wasteProcessTypes`, `collectorTypes` ou `wasteVehiclesTypes`,
  const handleToggle = (value: AllCompanyType, checked: boolean) => {
    if (COMPANY_TYPE_VALUES.includes(value as CompanyType)) {
      if (checked) {
        setValue("companyTypes", [...companyTypes, value as CompanyType], {
          shouldDirty: true,
          shouldValidate: true
        });
      } else {
        setValue(
          "companyTypes",
          companyTypes.filter(c => c !== value),
          {
            shouldDirty: true,
            shouldValidate: true
          }
        );
      }
    }

    if (COLLECTOR_TYPE_VALUES.includes(value as CollectorType)) {
      if (checked) {
        setValue(
          "collectorTypes",
          [...collectorTypes, value as CollectorType],
          {
            shouldDirty: true
          }
        );
      } else {
        setValue(
          "collectorTypes",
          collectorTypes.filter(c => c !== value),
          {
            shouldDirty: true
          }
        );
      }
    }

    if (WASTE_PROCESSOR_TYPE_VALUES.includes(value as WasteProcessorType)) {
      if (checked) {
        setValue(
          "wasteProcessorTypes",
          [...wasteProcessorTypes, value as WasteProcessorType],
          {
            shouldDirty: true
          }
        );
      } else {
        setValue(
          "wasteProcessorTypes",
          wasteProcessorTypes.filter(c => c !== value),
          {
            shouldDirty: true
          }
        );
      }
    }

    if (WASTE_VEHICLES_TYPE_VALUES.includes(value as WasteVehiclesType)) {
      if (checked) {
        setValue(
          "wasteVehiclesTypes",
          [...wasteVehiclesTypes, value as WasteVehiclesType],
          {
            shouldDirty: true
          }
        );
      } else {
        setValue(
          "wasteVehiclesTypes",
          wasteVehiclesTypes.filter(c => c !== value),
          {
            shouldDirty: true
          }
        );
      }
    }

    if (value === CompanyType.EcoOrganisme) {
      if (checked) {
        setValue("ecoOrganismeAgreements", [""]);
      } else {
        setValue("ecoOrganismeAgreements", []);
      }
    }
  };

  const { errors } = formState;

  const allCompanyTypes = [
    ...companyTypes,
    ...collectorTypes,
    ...wasteProcessorTypes,
    ...wasteVehiclesTypes
  ];

  const hasSubSectionThree = watch("workerCertification.hasSubSectionThree");

  const requiredWhenHasSubSectionThree: Validate<
    string,
    RhfCompanyTypeFormField
  > = (value, { companyTypes }) => {
    if (
      companyTypes.includes(CompanyType.Worker) &&
      hasSubSectionThree &&
      !value
    ) {
      return "Champ requis";
    }
    return true;
  };

  const requiredWhenCompanyType: (
    companyType: CompanyType,
    wasteVehicleType?: WasteVehiclesType
  ) => Validate<string, RhfCompanyTypeFormField> =
    (companyType, wasteVehicleType) =>
    (value, { companyTypes, wasteVehiclesTypes }) => {
      if (
        companyTypes.includes(companyType) &&
        (!wasteVehicleType || wasteVehiclesTypes.includes(wasteVehicleType)) &&
        !value
      ) {
        return "Champ requis";
      }
      return true;
    };

  return (
    <CompanyTypeForm
      inputValues={{
        companyTypes: allCompanyTypes,
        workerCertification: {
          hasSubSectionThree
        },
        ecoOrganismeAgreements
      }}
      handleToggle={handleToggle}
      inputProps={{
        transporterReceipt: {
          receiptNumber: register("transporterReceipt.receiptNumber", {
            validate: (value, { transporterReceipt, companyTypes }) => {
              // FIXME utiliser `trigger`pour re-valider en cas de changement
              // après un premier submit
              if (
                companyTypes.includes(CompanyType.Transporter) &&
                // Validation "tout un rien"
                !value &&
                (!!transporterReceipt?.validityLimit ||
                  !!transporterReceipt?.department)
              ) {
                return "Champ requis";
              }
              return true;
            }
          }),
          validityLimit: register("transporterReceipt.validityLimit", {
            validate: (value, { transporterReceipt, companyTypes }) => {
              if (
                companyTypes.includes(CompanyType.Transporter) &&
                // Validation "tout un rien"
                !value &&
                (!!transporterReceipt?.receiptNumber ||
                  !!transporterReceipt?.department)
              ) {
                return "Champ requis";
              }
              return true;
            }
          }),
          department: register("transporterReceipt.department", {
            validate: (value, { transporterReceipt, companyTypes }) => {
              if (
                companyTypes.includes(CompanyType.Transporter) &&
                // Validation "tout un rien"
                !value &&
                (!!transporterReceipt?.receiptNumber ||
                  !!transporterReceipt?.validityLimit)
              ) {
                return "Champ requis";
              }
              return true;
            }
          })
        },
        brokerReceipt: {
          receiptNumber: register("brokerReceipt.receiptNumber", {
            validate: requiredWhenCompanyType(CompanyType.Broker)
          }),
          validityLimit: register("brokerReceipt.validityLimit", {
            validate: requiredWhenCompanyType(CompanyType.Broker)
          }),
          department: register("brokerReceipt.department", {
            validate: requiredWhenCompanyType(CompanyType.Broker)
          })
        },
        traderReceipt: {
          receiptNumber: register("traderReceipt.receiptNumber", {
            validate: requiredWhenCompanyType(CompanyType.Trader)
          }),
          validityLimit: register("traderReceipt.validityLimit", {
            validate: requiredWhenCompanyType(CompanyType.Trader)
          }),
          department: register("traderReceipt.department", {
            validate: requiredWhenCompanyType(CompanyType.Trader)
          })
        },
        vhuAgrementBroyeur: {
          agrementNumber: register("vhuAgrementBroyeur.agrementNumber", {
            validate: requiredWhenCompanyType(
              CompanyType.WasteVehicles,
              WasteVehiclesType.Broyeur
            )
          }),
          department: register("vhuAgrementBroyeur.department", {
            validate: requiredWhenCompanyType(
              CompanyType.WasteVehicles,
              WasteVehiclesType.Broyeur
            )
          })
        },
        vhuAgrementDemolisseur: {
          agrementNumber: register("vhuAgrementDemolisseur.agrementNumber", {
            validate: requiredWhenCompanyType(
              CompanyType.WasteVehicles,
              WasteVehiclesType.Demolisseur
            )
          }),
          department: register("vhuAgrementDemolisseur.department", {
            validate: requiredWhenCompanyType(
              CompanyType.WasteVehicles,
              WasteVehiclesType.Demolisseur
            )
          })
        },
        workerCertification: {
          hasSubSectionThree: register(
            "workerCertification.hasSubSectionThree"
          ),
          hasSubSectionFour: register("workerCertification.hasSubSectionFour"),
          certificationNumber: register(
            "workerCertification.certificationNumber",
            {
              validate: requiredWhenHasSubSectionThree
            }
          ),
          validityLimit: register("workerCertification.validityLimit", {
            validate: requiredWhenHasSubSectionThree
          }),
          organisation: register("workerCertification.organisation", {
            validate: requiredWhenHasSubSectionThree
          })
        },
        ecoOrganismeAgreements: {
          value: index =>
            register(`ecoOrganismeAgreements.${index}`, {
              required: "Champ requis"
            }),
          push: (v: string) => {
            setValue("ecoOrganismeAgreements", [...ecoOrganismeAgreements, v]);
          },
          remove: (index: number) => {
            setValue(
              "ecoOrganismeAgreements",
              ecoOrganismeAgreements.filter((_, i) => i !== index)
            );
          }
        }
      }}
      inputErrors={{
        transporterReceipt: {
          receiptNumber: errors?.transporterReceipt?.receiptNumber?.message,
          validityLimit: errors?.transporterReceipt?.validityLimit?.message,
          department: errors?.transporterReceipt?.department?.message
        },
        brokerReceipt: {
          receiptNumber: errors?.brokerReceipt?.receiptNumber?.message,
          validityLimit: errors?.brokerReceipt?.validityLimit?.message,
          department: errors?.brokerReceipt?.department?.message
        },
        traderReceipt: {
          receiptNumber: errors?.traderReceipt?.receiptNumber?.message,
          validityLimit: errors?.traderReceipt?.validityLimit?.message,
          department: errors?.traderReceipt?.department?.message
        },
        vhuAgrementBroyeur: {
          agrementNumber: errors?.vhuAgrementBroyeur?.agrementNumber?.message,
          department: errors?.vhuAgrementBroyeur?.department?.message
        },
        vhuAgrementDemolisseur: {
          agrementNumber:
            errors?.vhuAgrementDemolisseur?.agrementNumber?.message,
          department: errors?.vhuAgrementDemolisseur?.department?.message
        },
        workerCertification: {
          certificationNumber:
            errors.workerCertification?.certificationNumber?.message,
          validityLimit: errors.workerCertification?.validityLimit?.message,
          organisation: errors.workerCertification?.organisation?.message
        },
        ecoOrganismeAgreements: ecoOrganismeAgreements.map((_, i) => {
          if (!!errors.ecoOrganismeAgreements) {
            return errors.ecoOrganismeAgreements[i]?.message ?? null;
          }
          return null;
        })
      }}
    />
  );
};

export default React.memo(RhfCompanyTypeForm);
