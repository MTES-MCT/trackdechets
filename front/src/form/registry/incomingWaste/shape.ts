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
/*

emitterCompanyType
emitterCompanyOrgId
emitterPickupSiteName
emitterPickupSiteAddress
emitterPickupSitePostalCode
emitterPickupSiteCity
emitterPickupSiteCountryCode


ecoOrganismeSiret
ecoOrganismeName
brokerCompanySiret
brokerCompanyName
brokerRecepisseNumber
traderCompanySiret
traderCompanyName
traderRecepisseNumber

operationCode
operationMode
noTraceability

operationCode
operationMode
noTraceability
ttdImportNumber
movementNumber
nextOperationCode
isDirectSupply

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
          wastePop: z.boolean()
        }
      },
      {
        name: "wasteIsDangerous",
        shape: "generic",
        type: "checkbox",
        label: "Déchet dangereux",
        required: false,
        validation: {
          wasteIsDangerous: z.boolean().optional()
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
          prefix: "initialEmitter"
        },
        validation: {
          initialEmitterMunicipalitiesInseeCodes: filteredArray
        },
        shape: "custom",
        names: ["initialEmitterMunicipalitiesInseeCodes"]
      }
    ]
  }
];
