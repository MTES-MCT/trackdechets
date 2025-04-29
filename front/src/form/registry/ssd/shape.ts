import {
  ADMINISTRATIVE_ACT_REFERENCES,
  SSD_PROCESSING_OPERATIONS_CODES
} from "@td/constants";
import { FormShape } from "../builder/types";
import { CompanySelector } from "../common/CompanySelector";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";
import { ReportFor } from "../common/ReportFor";
import { SecondaryWasteCodes } from "./SecondaryWasteCodes";
import { z } from "zod";
import {
  nonEmptyString,
  optionalString,
  filteredArray,
  nonEmptyNumber,
  optionalNumber,
  booleanString
} from "../builder/validation";

export const ssdFormShape: FormShape = [
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
      },
      {
        shape: "layout",
        fields: [
          {
            name: "useDate",
            shape: "generic",
            label: "Date d'utilisation",
            required: true,
            validation: {
              useDate: optionalString
            },
            type: "date",
            style: { className: "fr-col-4" }
          },
          {
            name: "dispatchDate",
            shape: "generic",
            label: "Date d'expédition",
            required: true,
            validation: {
              dispatchDate: optionalString
            },
            type: "date",
            style: { className: "fr-col-4" }
          }
        ],
        infoText:
          "Merci de renseigner une date d'utilisation ou une date d'expédition"
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
        Component: SecondaryWasteCodes,
        shape: "custom",
        names: ["secondaryWasteCodes", "secondaryWasteDescriptions"],
        validation: {
          secondaryWasteCodes: filteredArray,
          secondaryWasteDescriptions: filteredArray
        }
      },
      {
        name: "product",
        shape: "generic",
        label: "Produit",
        required: true,
        validation: {
          product: nonEmptyString
        },
        type: "text",
        style: { className: "fr-col-10" }
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
    tabId: "processing",
    tabTitle: "Traitement",
    fields: [
      {
        shape: "layout",
        fields: [
          {
            name: "processingDate",
            shape: "generic",
            label: "Date de traitement",
            required: true,
            validation: {
              processingDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-4" }
          },
          {
            name: "processingEndDate",
            shape: "generic",
            label: "Date de fin de traitement",
            validation: {
              processingEndDate: optionalString
            },
            type: "date",
            style: { className: "fr-col-4" }
          }
        ]
      },
      {
        shape: "layout",
        fields: [
          {
            name: "operationCode",
            shape: "generic",
            type: "select",
            label: "Code de traitement réalisé",
            required: true,
            defaultOption: "Sélectionnez un traitement",
            validation: {
              operationCode: nonEmptyString
            },
            style: { className: "fr-col-4" },
            choices: SSD_PROCESSING_OPERATIONS_CODES.map(code => ({
              label: code,
              value: code
            }))
          },
          {
            name: "operationMode",
            shape: "generic",
            type: "select",
            label: "Mode de traitement",
            required: true,
            defaultOption: "Sélectionnez un mode",
            validation: {
              operationMode: nonEmptyString
            },
            style: { className: "fr-col-4" },
            choices: [
              { value: "REUTILISATION", label: "Réutilisation" },
              { value: "RECYCLAGE", label: "Recyclage" },
              {
                value: "VALORISATION_ENERGETIQUE",
                label: "Valorisation énergétique"
              },
              { value: "AUTRES_VALORISATIONS", label: "Autres valorisations" }
            ]
          }
        ]
      },
      {
        name: "administrativeActReference",
        shape: "generic",
        type: "select",
        label: "Référence de l'acte administratif",
        required: true,
        validation: {
          administrativeActReference: nonEmptyString
        },
        style: { className: "fr-col-4" },
        choices: ADMINISTRATIVE_ACT_REFERENCES.map(reference => ({
          label: reference,
          value: reference
        }))
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
          excludeTypes: ["PERSONNE_PHYSIQUE"]
        },
        validation: {
          destinationCompanyType: optionalString,
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
      }
    ]
  }
];
