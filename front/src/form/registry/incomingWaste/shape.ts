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
import { InseeCodes } from "../common/InseeCodes";
import { Address } from "../common/Address";
import { FrenchCompanySelector } from "../common/FrenchCompanySelector";
import { INCOMING_WASTE_PROCESSING_OPERATIONS_CODES } from "@td/constants";
import { TransporterSelector } from "../common/TransporterSelector/TransporterSelector";
import { RegistryCompanyType } from "@td/codegen-ui";
import { TransportMode } from "@td/codegen-ui";
/*

transporters
*/

export const incomingWasteFormShape: FormShape = [
  {
    tabId: "declaration",
    tabTitle: "Déclaration",
    fields: [
      {
        name: "publicId",
        shape: "generic",
        type: "text",
        label: "Identifiant unique",
        required: true,
        validation: {
          publicId: nonEmptyString
        },
        style: { className: "fr-col-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET du destinataire",
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
    tabTitle: "Déchets",
    fields: [
      {
        Component: WasteCodeSelector,
        props: { name: "wasteCode" },
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
        label: "Dénomination du déchet",
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
        label: "Code déchet Bâle",
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
        label: "POP - Contient des polluants organiques persistants",
        required: true,
        validation: {
          wastePop: booleanString
        }
      },
      {
        name: "wasteIsDangerous",
        shape: "generic",
        type: "checkbox",
        label: "Déchet dangereux",
        required: false,
        validation: {
          wasteIsDangerous: booleanString
        }
      },
      {
        name: "receptionDate",
        shape: "generic",
        label: "Date de réception",
        required: true,
        validation: {
          receptionDate: nonEmptyString
        },
        type: "date",
        style: { className: "fr-col-4" }
      },
      {
        name: "weighingHour",
        shape: "generic",
        label: "Heure de pesée",
        required: false,
        validation: {
          weighingHour: optionalString
        },
        type: "time",
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
          label: "producteur"
        },
        validation: {
          initialEmitterCompanyType: z
            .string()
            .nullish()
            .transform(val => val || null),
          initialEmitterCompanyOrgId: z
            .string()
            .nullish()
            .transform(val => val || null),
          initialEmitterCompanyName: z
            .string()
            .nullish()
            .transform(val => val || null),
          initialEmitterCompanyAddress: z
            .string()
            .nullish()
            .transform(val => val || null),
          initialEmitterCompanyPostalCode: z
            .string()
            .nullish()
            .transform(val => val || null),
          initialEmitterCompanyCity: z
            .string()
            .nullish()
            .transform(val => val || null),
          initialEmitterCompanyCountryCode: z
            .string()
            .nullish()
            .transform(val => val || null)
        },
        shape: "custom",
        names: [
          "initialEmitterCompanyType",
          "initialEmitterCompanyOrgId",
          "initialEmitterCompanyName",
          "initialEmitterCompanyAddress",
          "initialEmitterCompanyPostalCode",
          "initialEmitterCompanyCity",
          "initialEmitterCompanyCountryCode"
        ]
      },
      {
        Component: InseeCodes,
        props: {
          prefix: "initialEmitter",
          title: "Code(s) INSEE de(s) commune(s)"
        },
        validation: {
          initialEmitterMunicipalitiesInseeCodes: filteredArray
        },
        shape: "custom",
        names: ["initialEmitterMunicipalitiesInseeCodes"]
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
          label: "expéditeur"
        },
        validation: {
          emitterCompanyType: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterCompanyOrgId: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterCompanyName: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterCompanyAddress: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterCompanyPostalCode: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterCompanyCity: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterCompanyCountryCode: z
            .string()
            .nullish()
            .transform(val => val || null)
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
          title: "Chantier ou lieu de collecte"
        },
        validation: {
          emitterPickupSiteName: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterPickupSiteAddress: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterPickupSitePostalCode: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterPickupSiteCity: z
            .string()
            .nullish()
            .transform(val => val || null),
          emitterPickupSiteCountryCode: z
            .string()
            .nullish()
            .transform(val => val || null)
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
        Component: FrenchCompanySelector,
        props: {
          prefix: "ecoOrganisme",
          shortMode: true,
          title: "Éco-organisme (optionnel)",
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
        Component: FrenchCompanySelector,
        props: {
          prefix: "broker",
          shortMode: true,
          title: "Courtier (optionnel)",
          reducedMargin: true
        },
        validation: {
          brokerCompanySiret: optionalString,
          brokerCompanyName: optionalString
        },
        shape: "custom",
        names: ["brokerCompanySiret", "brokerCompanyName"]
      },
      {
        name: "brokerRecepisseNumber",
        shape: "generic",
        label: "Numéro de récépissé",
        required: true,
        validation: {
          brokerRecepisseNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        Component: FrenchCompanySelector,
        props: {
          prefix: "trader",
          shortMode: true,
          title: "Négociant (optionnel)",
          reducedMargin: true
        },
        validation: {
          traderCompanySiret: optionalString,
          traderCompanyName: optionalString
        },
        shape: "custom",
        names: ["traderCompanySiret", "traderCompanyName"]
      },
      {
        name: "traderRecepisseNumber",
        shape: "generic",
        label: "Numéro de récépissé",
        required: true,
        validation: {
          traderRecepisseNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      }
    ]
  },
  {
    tabId: "operation",
    tabTitle: "Traitement",
    fields: [
      {
        shape: "layout",
        fields: [
          {
            name: "operationCode",
            shape: "generic",
            type: "select",
            label: "Code de traitement réalisé",
            required: true,
            validation: {
              operationCode: nonEmptyString
            },
            style: { className: "fr-col-4" },
            choices: INCOMING_WASTE_PROCESSING_OPERATIONS_CODES.map(code => ({
              label: code,
              value: code
            }))
          },
          {
            name: "operationMode",
            shape: "generic",
            type: "select",
            label: "Mode de traitement",
            required: false,
            validation: {
              operationMode: optionalString
            },
            style: { className: "fr-col-4" },
            choices: [
              { value: "REUTILISATION", label: "Réutilisation" },
              { value: "RECYCLAGE", label: "Recyclage" },
              {
                value: "VALORISATION_ENERGETIQUE",
                label: "Valorisation énergétique"
              },
              { value: "AUTRES_VALORISATIONS", label: "Autres valorisations" },
              { value: "ELIMINATION", label: "Élimination" }
            ]
          }
        ]
      },
      {
        name: "noTraceability",
        shape: "generic",
        type: "checkbox",
        label: "Rupture de traçabilité autorisée",
        required: false,
        validation: {
          noTraceability: booleanString
        }
      },
      {
        name: "ttdImportNumber",
        shape: "generic",
        label: "Numéro de notification ou de déclaration d'import",
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
        label: "Numéro de mouvement",
        required: false,
        validation: {
          movementNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "nextOperationCode",
        shape: "generic",
        type: "select",
        label: "Code de traitement ultérieur prévu",
        required: false,
        validation: {
          nextOperationCode: optionalString
        },
        style: { className: "fr-col-4" },
        choices: INCOMING_WASTE_PROCESSING_OPERATIONS_CODES.map(code => ({
          label: code,
          value: code
        }))
      },
      {
        name: "isDirectSupply",
        shape: "generic",
        type: "checkbox",
        label: "Approvisionnement direct (pipeline, convoyeur)",
        required: false,
        validation: {
          isDirectSupply: booleanString
        }
      }
    ]
  },
  {
    tabId: "transporter",
    tabTitle: "Transport",
    fields: [
      {
        Component: TransporterSelector,
        props: {},
        validation: {
          transporter: z.array(
            z.object({
              TransportMode: z.nativeEnum(TransportMode),
              CompanyType: z.nativeEnum(RegistryCompanyType),
              CompanyOrgId: optionalString,
              RecepisseIsExempted: z.boolean().optional(),
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
