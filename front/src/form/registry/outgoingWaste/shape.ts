import { z } from "zod";
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
import {
  INCOMING_TEXS_WASTE_CODES,
  INCOMING_WASTE_PROCESSING_OPERATIONS_CODES
} from "@td/constants";
import { TransporterSelector } from "../common/TransporterSelector/TransporterSelector";
import { RegistryCompanyType } from "@td/codegen-ui";
import { TransportMode } from "@td/codegen-ui";
import { EcoOrganismes } from "../common/EcoOrganismes";
import { Operation } from "../common/Operation";
import { Labels, InfoLabels } from "../common/Labels";
import { OptionalCompanySelector } from "../common/OptionalCompanySelector";

export const outgoingWasteFormShape: FormShape = [
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
        style: { className: "fr-col-md-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET de l'expéditeur ou du détenteur",
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
        props: { name: "wasteCode", blackList: INCOMING_TEXS_WASTE_CODES },
        shape: "custom",
        names: ["wasteCode"],
        required: true,
        validation: {
          wasteCode: nonEmptyString
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
        style: { className: "fr-col-12 fr-col-md-10" }
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
        style: { className: "fr-col-md-4" }
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
          label: "producteur initial",
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
      }
    ]
  },
  {
    tabId: "emitter",
    tabTitle: "Expéditeur",
    fields: [
      {
        name: "dispatchDate",
        shape: "generic",
        label: Labels.dispatchDate,
        required: true,
        validation: {
          dispatchDate: nonEmptyString
        },
        type: "date",
        style: { className: "fr-col-10 fr-col-md-4" }
      },
      {
        Component: Address,
        props: {
          prefix: "reportForPickupSite",
          nameEnabled: true,
          title: "Chantier ou lieu de collecte (optionnel)"
        },
        validation: {
          reportForPickupSiteName: optionalString,
          reportForPickupSiteAddress: optionalString,
          reportForPickupSitePostalCode: optionalString,
          reportForPickupSiteCity: optionalString,
          reportForPickupSiteCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "reportForPickupSiteName",
          "reportForPickupSiteAddress",
          "reportForPickupSitePostalCode",
          "reportForPickupSiteCity",
          "reportForPickupSiteCountryCode"
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
          reducedMargin: true,
          label: "courtier",
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
          reducedMargin: true,
          label: "négociant",
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
          operationCodes: INCOMING_WASTE_PROCESSING_OPERATIONS_CODES,
          showNoTraceability: false,
          showNextOperationCode: false,
          isPlannedOperation: true
        },
        names: ["operationCode", "operationMode"],
        validation: {
          operationCode: nonEmptyString,
          operationMode: optionalString
        },
        shape: "custom"
      },
      {
        name: "gistridNumber",
        shape: "generic",
        label: Labels.gistridNumber,
        infoLabel: InfoLabels.gistrid,
        required: true,
        validation: {
          gistridNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-md-10" }
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
        style: { className: "fr-col-md-10" }
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
          excludeTypes: ["COMMUNES", "PERSONNE_PHYSIQUE"],
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
          title: "Lieu de dépôt du destinataire (optionnel)"
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
        name: "isDirectSupply",
        shape: "generic",
        type: "checkbox",
        label: Labels.isDirectSupply,
        required: true,
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
