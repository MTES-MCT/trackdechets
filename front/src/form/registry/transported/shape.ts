import { type UseFormSetValue } from "react-hook-form";
import { FormShape } from "../builder/types";
import { ReportFor } from "../common/ReportFor";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";
import {
  nonEmptyString,
  optionalNumber,
  nonEmptyNumber,
  booleanString,
  optionalString,
  filteredArray
} from "../builder/validation";
import { CompanySelector } from "../common/CompanySelector";
import { Address } from "../common/Address";
import { TRANSPORT_MODES } from "../common/TransporterSelector/TransporterForm";
import { TransporterTags } from "../common/TransporterTags";
import { EcoOrganismes } from "../common/EcoOrganismes";
import { type RegistryCompanyInfos } from "../../../dashboard/registry/RegistryCompanySwitcher";
import { Labels, InfoLabels } from "../common/Labels";
import { OptionalCompanySelector } from "../common/OptionalCompanySelector";

export const transportedFormShape: FormShape = [
  {
    tabId: "declaration",
    tabTitle: "Déclaration",
    fields: [
      {
        name: "publicId",
        shape: "generic",
        type: "text",
        label: Labels.publicId,
        infoLabel: InfoLabels.publicId,
        required: true,
        validation: {
          publicId: nonEmptyString
        },
        style: { className: "fr-col-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET du transporteur",
          reportAsLabel: "SIRET du déclarant",
          onCompanySelect: (
            _,
            setValue: UseFormSetValue<any>,
            company?: RegistryCompanyInfos
          ) => {
            if (company?.transporterReceipt?.receiptNumber) {
              setValue(
                "reportForRecepisseNumber",
                company.transporterReceipt.receiptNumber
              );
            }
          }
        },
        names: ["reportForCompanySiret", "reportAsCompanySiret"],
        validation: {
          reportForCompanySiret: nonEmptyString,
          reportAsCompanySiret: optionalString
        },
        shape: "custom"
      }
    ]
  },
  {
    tabId: "waste",
    tabTitle: "Déchet",
    fields: [
      {
        name: "reportForTransportIsWaste",
        shape: "generic",
        type: "checkbox",
        label: "Le transport concerne un déchet",
        required: true,
        validation: {
          reportForTransportIsWaste: booleanString
        }
      },
      {
        Component: WasteCodeSelector,
        props: { name: "wasteCode" },
        shape: "custom",
        names: ["wasteCode"],
        required: false,
        validation: {
          wasteCode: optionalString
        },
        style: { parentClassName: "fr-grid-row--bottom tw-relative" }
      },
      {
        name: "wasteDescription",
        shape: "generic",
        label:
          "Dénomination usuelle des terres excavées et sédiments ou des déchets",
        required: true,
        validation: {
          wasteDescription: nonEmptyString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "wasteCodeBale",
        shape: "generic",
        label: Labels.wasteCodeBale,
        infoLabel: InfoLabels.wasteCodeBale,
        validation: {
          wasteCodeBale: optionalString
        },
        type: "text",
        style: { className: "fr-col-4" }
      },
      {
        name: "wastePop",
        shape: "generic",
        type: "checkbox",
        label: Labels.wastePop,
        tooltip:
          "Le terme POP recouvre un ensemble de substances organiques qui possèdent 4 propriétés : persistantes, bioaccumulables, toxiques et mobiles.",
        required: true,
        validation: {
          wastePop: booleanString
        }
      },
      {
        name: "wasteIsDangerous",
        shape: "generic",
        type: "checkbox",
        label: Labels.wasteIsDangerous,
        tooltip:
          "Certains déchets avec un code sans astérisque peuvent, selon les cas, être dangereux ou non dangereux.",
        required: false,
        validation: {
          wasteIsDangerous: booleanString
        }
      },
      {
        shape: "layout",
        fields: [
          {
            name: "collectionDate",
            shape: "generic",
            label: Labels.collectionDate,
            required: true,
            validation: {
              collectionDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-4" }
          },
          {
            name: "unloadingDate",
            shape: "generic",
            label: Labels.unloadingDate,
            required: true,
            validation: {
              unloadingDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-4" }
          }
        ]
      },
      {
        Component: WeightSelector,
        shape: "custom",
        names: ["weightValue", "weightIsEstimate", "volume"],
        validation: {
          weightValue: nonEmptyNumber,
          volume: optionalNumber,
          weightIsEstimate: booleanString
        }
      }
    ]
  },
  {
    tabId: "emitter",
    tabTitle: "Expéditeur",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "emitter",
          label: "expéditeur",
          excludeTypes: ["COMMUNES"],
          required: true
        },
        validation: {
          emitterCompanyType: nonEmptyString,
          emitterCompanyOrgId: optionalString,
          emitterCompanyName: optionalString,
          emitterCompanyAddress: optionalString,
          emitterCompanyPostalCode: optionalString,
          emitterCompanyCity: optionalString,
          emitterCompanyCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "emitterCompanyType",
          "emitterCompanyOrgId",
          "emitterCompanyName",
          "emitterCompanyAddress",
          "emitterCompanyPostalCode",
          "emitterCompanyCity",
          "emitterCompanyCountryCode"
        ]
      },
      {
        Component: Address,
        props: {
          prefix: "emitterPickupSite",
          nameEnabled: true,
          title: "Chantier ou lieu de collecte (optionnel)"
        },
        validation: {
          emitterPickupSiteName: optionalString,
          emitterPickupSiteAddress: optionalString,
          emitterPickupSitePostalCode: optionalString,
          emitterPickupSiteCity: optionalString,
          emitterPickupSiteCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "emitterPickupSiteName",
          "emitterPickupSiteAddress",
          "emitterPickupSitePostalCode",
          "emitterPickupSiteCity",
          "emitterPickupSiteCountryCode"
        ]
      },
      {
        name: "gistridNumber",
        shape: "generic",
        title: "Transfert transfrontalier de déchets",
        label: Labels.gistridNumber,
        infoLabel: InfoLabels.gistrid,
        required: true,
        validation: {
          gistridNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "movementNumber",
        shape: "generic",
        label: Labels.movementNumber,
        required: true,
        validation: {
          movementNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      }
    ]
  },
  {
    tabId: "intermediaries",
    tabTitle: "Intervenants",
    fields: [
      {
        Component: EcoOrganismes,
        props: {
          reducedMargin: true
        },
        validation: {
          ecoOrganismeSiret: optionalString,
          ecoOrganismeName: optionalString
        },
        shape: "custom",
        names: ["ecoOrganismeSiret", "ecoOrganismeName"]
      },
      {
        Component: OptionalCompanySelector,
        props: {
          prefix: "brokerCompany",
          shortMode: true,
          label: "courtier",
          reducedMargin: true,
          recepisseName: "brokerRecepisseNumber",
          onCompanySelected: (company, setValue) => {
            if (company.brokerReceipt?.receiptNumber) {
              setValue(
                "brokerRecepisseNumber",
                company.brokerReceipt.receiptNumber
              );
            }
          }
        },
        validation: {
          brokerCompanySiret: optionalString,
          brokerCompanyName: optionalString,
          brokerRecepisseNumber: optionalString
        },
        shape: "custom",
        names: [
          "brokerCompanySiret",
          "brokerCompanyName",
          "brokerRecepisseNumber"
        ]
      },
      {
        Component: OptionalCompanySelector,
        props: {
          prefix: "traderCompany",
          shortMode: true,
          label: "négociant",
          reducedMargin: true,
          recepisseName: "traderRecepisseNumber",
          onCompanySelected: (company, setValue) => {
            if (company.traderReceipt?.receiptNumber) {
              setValue(
                "traderRecepisseNumber",
                company.traderReceipt.receiptNumber
              );
            }
          }
        },
        validation: {
          traderCompanySiret: optionalString,
          traderCompanyName: optionalString,
          traderRecepisseNumber: optionalString
        },
        shape: "custom",
        names: [
          "traderCompanySiret",
          "traderCompanyName",
          "traderRecepisseNumber"
        ]
      }
    ]
  },
  {
    tabId: "destination",
    tabTitle: "Destinataire",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "destination",
          label: "destination",
          excludeTypes: ["COMMUNES"],
          required: true
        },
        validation: {
          destinationCompanyType: nonEmptyString,
          destinationCompanyOrgId: optionalString,
          destinationCompanyName: optionalString,
          destinationCompanyAddress: optionalString,
          destinationCompanyPostalCode: optionalString,
          destinationCompanyCity: optionalString,
          destinationCompanyCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "destinationCompanyType",
          "destinationCompanyOrgId",
          "destinationCompanyName",
          "destinationCompanyAddress",
          "destinationCompanyPostalCode",
          "destinationCompanyCity",
          "destinationCompanyCountryCode"
        ]
      },
      {
        Component: Address,
        props: {
          prefix: "destinationDropSite",
          nameEnabled: false,
          title: "Lieu de dépôt du destinataire"
        },
        validation: {
          destinationDropSiteAddress: optionalString,
          destinationDropSitePostalCode: optionalString,
          destinationDropSiteCity: optionalString,
          destinationDropSiteCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "destinationDropSiteAddress",
          "destinationDropSitePostalCode",
          "destinationDropSiteCity",
          "destinationDropSiteCountryCode"
        ]
      }
    ]
  },
  {
    tabId: "transporter",
    tabTitle: "Transport",
    fields: [
      {
        name: "reportForTransportMode",
        shape: "generic",
        type: "select",
        label: "Mode de transport",
        required: true,
        defaultOption: "Sélectionnez un mode de transport",
        validation: {
          reportForTransportMode: nonEmptyString
        },
        style: { className: "fr-col-5" },
        choices: TRANSPORT_MODES
      },
      {
        name: "reportForRecepisseIsExempted",
        shape: "generic",
        type: "checkbox",
        label: Labels.reportForRecepisseIsExempted,

        required: false,
        validation: {
          reportForRecepisseIsExempted: booleanString
        }
      },
      {
        name: "reportForRecepisseNumber",
        shape: "generic",
        label: "Numéro de récépissé",
        required: false,
        validation: {
          reportForRecepisseNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-4" }
      },
      {
        name: "reportForTransportAdr",
        shape: "generic",
        label: "Mention ADR",
        required: false,
        validation: {
          reportForTransportAdr: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "reportForTransportOtherTmdCode",
        shape: "generic",
        label: "Mention RID, ADN, IMDG",
        required: false,
        validation: {
          reportForTransportOtherTmdCode: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        Component: TransporterTags,
        props: {
          label: "Immatriculations",
          prefix: "reportForTransport",
          infoText:
            "Renseigner au moins une plaque d'immatriculation si le mode de transport est Route"
        },
        validation: {
          reportForTransportPlates: filteredArray
        },
        shape: "custom",
        names: ["reportForTransportPlates"]
      }
    ]
  }
];
