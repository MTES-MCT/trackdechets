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
import { isValidWebsite } from "@td/constants";

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
  ecoOrganismePartnersIds: string[];
}

type RhfCompanyTypeFormProps = Pick<
  UseFormReturn<RhfCompanyTypeFormField>,
  "watch" | "register" | "setValue" | "formState" | "trigger"
>;

/**
 * Implémentation de <CompanyTypeForm /> contrôlé par
 * React Hook Form
 */
const RhfCompanyTypeForm = ({
  watch,
  register,
  setValue,
  formState,
  trigger
}: RhfCompanyTypeFormProps): React.JSX.Element => {
  const companyTypes = watch("companyTypes");
  const collectorTypes = watch("collectorTypes");
  const wasteProcessorTypes = watch("wasteProcessorTypes");
  const wasteVehiclesTypes = watch("wasteVehiclesTypes");
  const ecoOrganismeAgreements = watch("ecoOrganismeAgreements");
  const ecoOrganismePartnersIds = watch("ecoOrganismePartnersIds");

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

    if (
      parentValue === "COLLECTOR" &&
      COLLECTOR_TYPE_VALUES.includes(value as CollectorType)
    ) {
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

    if (
      parentValue === "WASTEPROCESSOR" &&
      WASTE_PROCESSOR_TYPE_VALUES.includes(value as WasteProcessorType)
    ) {
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

    if (
      parentValue === "WASTE_VEHICLES" &&
      WASTE_VEHICLES_TYPE_VALUES.includes(value as WasteVehiclesType)
    ) {
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

    // Pour le moment seuls les VHUs sont concernés par les éco-organismes partenaires
    if (value === CompanyType.WasteVehicles) {
      if (!checked) {
        setValue("ecoOrganismePartnersIds", []);
      }
    }
  };

  const { errors } = formState;

  const allCompanyTypes = [
    ...companyTypes,
    ...collectorTypes.map(type => `COLLECTOR.${type}`),
    ...wasteProcessorTypes.map(type => `WASTEPROCESSOR.${type}`),
    ...wasteVehiclesTypes.map(type => `WASTE_VEHICLES.${type}`)
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
        ecoOrganismeAgreements,
        ecoOrganismePartnersIds
      }}
      handleToggle={handleToggle}
      inputProps={{
        transporterReceipt: {
          receiptNumber: register("transporterReceipt.receiptNumber", {
            validate: (value, { transporterReceipt, companyTypes }) => {
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
            },
            onChange: () => {
              // handle dependant validation between transporter recepisse fields
              trigger([
                "transporterReceipt.department",
                "transporterReceipt.validityLimit"
              ]);
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
            },
            onChange: () => {
              // handle dependant validation between transporter recepisse fields
              trigger([
                "transporterReceipt.receiptNumber",
                "transporterReceipt.department"
              ]);
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
            },
            onChange: () => {
              // handle dependant validation between transporter recepisse fields
              trigger([
                "transporterReceipt.receiptNumber",
                "transporterReceipt.validityLimit"
              ]);
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
          agrementNumber: register("vhuAgrementBroyeur.agrementNumber"),
          department: register("vhuAgrementBroyeur.department")
        },
        vhuAgrementDemolisseur: {
          agrementNumber: register("vhuAgrementDemolisseur.agrementNumber"),
          department: register("vhuAgrementDemolisseur.department")
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
              validate: v => {
                if (!v) {
                  return "Champ requis";
                }
                if (!isValidWebsite(v)) {
                  return "Invalide URL";
                }
              }
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
        },
        ecoOrganismePartnersIds: {
          onChange: (value: string[]) => {
            setValue("ecoOrganismePartnersIds", value, {
              shouldDirty: true
            });
          },
          value: ecoOrganismePartnersIds
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
        workerCertification: {
          certificationNumber:
            errors.workerCertification?.certificationNumber?.message,
          validityLimit: errors.workerCertification?.validityLimit?.message,
          organisation: errors.workerCertification?.organisation?.message
        },
        ecoOrganismePartnersIds: errors.ecoOrganismePartnersIds?.message,
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
