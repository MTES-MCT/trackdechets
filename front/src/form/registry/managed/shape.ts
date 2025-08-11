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
  filteredArray,
  fieldArray
} from "../builder/validation";
import { CompanySelector } from "../common/CompanySelector";
import { Address } from "../common/Address";
import { INCOMING_WASTE_PROCESSING_OPERATIONS_CODES } from "@td/constants";
import { TransporterSelector } from "../common/TransporterSelector/TransporterSelector";
import { RegistryCompanyType } from "@td/codegen-ui";
import { TransportMode } from "@td/codegen-ui";
import { EcoOrganismes } from "../common/EcoOrganismes";
import { ParcelsVisualizer } from "../common/ParcelsVisualizer/ParcelsVisualizer";
import { Operation } from "../common/Operation";
import { Labels, InfoLabels } from "../common/Labels";
import { TexsAnalysisFile } from "../common/TexsAnalysisFile";

export const managedFormShape: FormShape = [
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
          reportForLabel: "SIRET du courtier ou négociant",
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
        shape: "layout",
        fields: [
          {
            name: "managingStartDate",
            shape: "generic",
            label: Labels.managingStartDate,
            required: true,
            validation: {
              managingStartDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-8 fr-col-md-4" }
          },
          {
            name: "managingEndDate",
            shape: "generic",
            label: Labels.managingEndDate,
            required: true,
            validation: {
              managingEndDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-8 fr-col-md-4" }
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
      },
      {
        names: ["texsAnalysisFileId"],
        shape: "custom",
        Component: TexsAnalysisFile,
        validation: {
          texsAnalysisFileId: optionalString
        }
      },
      {
        name: "wasteDap",
        shape: "generic",
        label: Labels.wasteDap,
        validation: {
          wasteDap: optionalString
        },
        type: "text",
        style: { className: "fr-col-md-4" }
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
      },
      {
        Component: ParcelsVisualizer,
        props: {
          prefix: "parcel",
          title: "Parcelles (optionnel)"
        },
        names: ["parcelNumbers", "parcelInseeCodes", "parcelCoordinates"],
        validation: {
          parcelNumbers: fieldArray,
          parcelInseeCodes: fieldArray,
          parcelCoordinates: fieldArray
        },
        shape: "custom"
      },
      {
        name: "sisIdentifier",
        shape: "generic",
        label: Labels.sisIdentifier,
        required: false,
        validation: {
          sisIdentifier: optionalString
        },
        type: "text",
        style: { className: "fr-col-md-10" }
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
      }
    ]
  },
  {
    tabId: "tempStorer",
    tabTitle: "Installation TTR",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "tempStorer",
          label: "installation de Tri Transit Regroupement",
          excludeTypes: ["COMMUNES", "PERSONNE_PHYSIQUE"],
          required: false
        },
        validation: {
          tempStorerCompanyType: optionalString,
          tempStorerCompanyOrgId: optionalString,
          tempStorerCompanyName: optionalString,
          tempStorerCompanyAddress: optionalString,
          tempStorerCompanyPostalCode: optionalString,
          tempStorerCompanyCity: optionalString,
          tempStorerCompanyCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "tempStorerCompanyType",
          "tempStorerCompanyOrgId",
          "tempStorerCompanyName",
          "tempStorerCompanyAddress",
          "tempStorerCompanyPostalCode",
          "tempStorerCompanyCity",
          "tempStorerCompanyCountryCode"
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
    tabId: "ecoOrganisme",
    tabTitle: "Éco-organisme",
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
          showNextOperationCode: false
        },
        names: ["operationCode", "operationMode"],
        validation: {
          operationCode: nonEmptyString,
          operationMode: optionalString
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
        Component: ParcelsVisualizer,
        props: {
          prefix: "destinationParcel",
          title: "Parcelles de destination si valorisation",
          hideIfDisabled: true
        },
        names: [
          "destinationParcelNumbers",
          "destinationParcelInseeCodes",
          "destinationParcelCoordinates"
        ],
        validation: {
          destinationParcelNumbers: fieldArray,
          destinationParcelInseeCodes: fieldArray,
          destinationParcelCoordinates: fieldArray
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
