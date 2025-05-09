import { RegistryCompanyType, TransportMode } from "@td/codegen-ui";
import {
  INCOMING_TEXS_WASTE_CODES,
  INCOMING_TEXS_PROCESSING_OPERATIONS_CODES
} from "@td/constants";
import { z } from "zod";
import { FormShape } from "../builder/types";
import {
  booleanString,
  filteredArray,
  nonEmptyNumber,
  nonEmptyString,
  optionalNumber,
  optionalString
} from "../builder/validation";
import { Address } from "../common/Address";
import { CompanySelector } from "../common/CompanySelector";
import { EcoOrganismes } from "../common/EcoOrganismes";
import { Parcels } from "../common/Parcels";
import { ReportFor } from "../common/ReportFor";
import { TransporterSelector } from "../common/TransporterSelector/TransporterSelector";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";
import { Operation } from "../common/Operation";
import { Labels } from "../common/Labels";
import { OptionalCompanySelector } from "../common/OptionalCompanySelector";

export const incomingTexsFormShape: FormShape = [
  {
    tabId: "declaration",
    tabTitle: "Déclaration",
    fields: [
      {
        name: "publicId",
        shape: "generic",
        type: "text",
        label: Labels.publicId,
        required: true,
        validation: {
          publicId: nonEmptyString
        },
        style: { className: "fr-col-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET de l'émetteur",
          reportAsLabel: "SIRET du déclarant"
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
        Component: WasteCodeSelector,
        props: {
          name: "wasteCode",
          whiteList: INCOMING_TEXS_WASTE_CODES
        },
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
        label: Labels.wasteDescription,
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
        name: "receptionDate",
        shape: "generic",
        label: Labels.receptionDate,
        required: true,
        validation: {
          receptionDate: nonEmptyString
        },
        type: "date",
        style: { className: "fr-col-4" }
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
    tabId: "initialEmitter",
    tabTitle: "Producteur",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "initialEmitter",
          label: "producteur initial (optionnel)",
          required: false
        },
        validation: {
          initialEmitterCompanyType: optionalString,
          initialEmitterCompanyOrgId: optionalString,
          initialEmitterCompanyName: optionalString,
          initialEmitterCompanyAddress: optionalString,
          initialEmitterCompanyPostalCode: optionalString,
          initialEmitterCompanyCity: optionalString,
          initialEmitterCompanyCountryCode: optionalString,
          initialEmitterMunicipalitiesInseeCodes: filteredArray
        },
        shape: "custom",
        names: [
          "initialEmitterCompanyType",
          "initialEmitterCompanyOrgId",
          "initialEmitterCompanyName",
          "initialEmitterCompanyAddress",
          "initialEmitterCompanyPostalCode",
          "initialEmitterCompanyCity",
          "initialEmitterCompanyCountryCode",
          "initialEmitterMunicipalitiesInseeCodes"
        ]
      },
      {
        Component: Parcels,
        props: {
          prefix: "parcel",
          title: "Parcelles d'origine"
        },
        names: ["parcelNumbers", "parcelInseeCodes", "parcelCoordinates"],
        validation: {
          parcelNumbers: filteredArray,
          parcelInseeCodes: filteredArray,
          parcelCoordinates: filteredArray
        },
        shape: "custom"
      },
      {
        name: "sisIdentifier",
        shape: "generic",
        label: Labels.sisIdentifier,
        validation: {
          sisIdentifier: optionalString
        },
        type: "text",
        style: { className: "fr-col-4" }
      },
      {
        name: "ttdImportNumber",
        shape: "generic",
        title: "Transfert transfrontalier de déchets",
        label: Labels.ttdImportNumber,
        required: false,
        validation: {
          ttdImportNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "movementNumber",
        shape: "generic",
        label: Labels.movementNumber,
        required: false,
        validation: {
          movementNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
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
          label: "détenteur ou expéditeur",
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
          title: "Courtier (optionnel)",
          reducedMargin: true,
          toggleLabel: "Présence d'un courtier",
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
          title: "Négociant (optionnel)",
          reducedMargin: true,
          toggleLabel: "Présence d'un négociant",
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
    tabId: "operation",
    tabTitle: "Traitement",
    fields: [
      {
        Component: Operation,
        props: {
          operationCodes: INCOMING_TEXS_PROCESSING_OPERATIONS_CODES,
          showNoTraceability: true,
          showNextOperationCode: true
        },
        names: [
          "operationCode",
          "operationMode",
          "noTraceability",
          "nextOperationCode"
        ],
        validation: {
          operationCode: nonEmptyString,
          operationMode: optionalString,
          noTraceability: booleanString,
          nextOperationCode: optionalString
        },
        shape: "custom"
      },
      {
        name: "isUpcycled",
        shape: "generic",
        type: "checkbox",
        label: Labels.isUpcycled,
        required: false,
        validation: {
          isUpcycled: booleanString
        }
      },
      {
        Component: Parcels,
        props: {
          prefix: "destinationParcel",
          title: "Parcelles de destination si valorisation"
        },
        names: [
          "destinationParcelInseeCodes",
          "destinationParcelNumbers",
          "destinationParcelCoordinates"
        ],
        validation: {
          destinationParcelNumbers: filteredArray,
          destinationParcelInseeCodes: filteredArray,
          destinationParcelCoordinates: filteredArray
        },
        shape: "custom"
      }
    ]
  },
  {
    tabId: "transporter",
    tabTitle: "Transport",
    fields: [
      {
        name: "isDirectSupply",
        shape: "generic",
        type: "checkbox",
        label: Labels.isDirectSupply,
        required: false,
        validation: {
          isDirectSupply: booleanString
        }
      },
      {
        Component: TransporterSelector,
        props: {},
        validation: {
          transporter: z.array(
            z.object({
              TransportMode: z.nativeEnum(TransportMode),
              CompanyType: z.nativeEnum(RegistryCompanyType),
              CompanyOrgId: optionalString,
              RecepisseIsExempted: booleanString,
              RecepisseNumber: optionalString,
              CompanyName: optionalString,
              CompanyAddress: optionalString,
              CompanyPostalCode: optionalString,
              CompanyCity: optionalString,
              CompanyCountryCode: optionalString
            })
          )
        },
        shape: "custom",
        names: ["transporter"]
      }
    ]
  }
];
