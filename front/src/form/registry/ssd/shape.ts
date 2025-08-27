import {
  ADMINISTRATIVE_ACT_REFERENCES,
  ADMINISTRATIVE_ACT_EXPLANATIONS,
  SSD_PROCESSING_OPERATIONS_CODES,
  SSD_OPERATION_MODES
} from "@td/constants";
import { FormShape } from "../builder/types";
import { CompanySelector } from "../common/CompanySelector";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";
import { ReportFor } from "../common/ReportFor";
import { SecondaryWasteCodes } from "./SecondaryWasteCodes";
import {
  nonEmptyString,
  optionalString,
  nonEmptyNumber,
  optionalNumber,
  booleanString,
  fieldArray
} from "../builder/validation";
import { Operation } from "../common/Operation";
import { Labels, InfoLabels } from "../common/Labels";

export const ssdFormShape: FormShape = [
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
        props: { name: "wasteCode" },
        shape: "custom",
        names: ["wasteCode"],
        required: true,
        validation: {
          wasteCode: nonEmptyString
        },
        style: { parentClassName: "fr-grid-row--bottom tw-relative" },
        //@ts-ignore
        isWasteSelector: true
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
        Component: SecondaryWasteCodes,
        shape: "custom",
        names: ["secondaryWasteCodes", "secondaryWasteDescriptions"],
        validation: {
          secondaryWasteCodes: fieldArray,
          secondaryWasteDescriptions: fieldArray
        }
      },
      {
        name: "administrativeActReference",
        shape: "generic",
        type: "select",
        label: Labels.administrativeActReference,
        defaultOption: "Sélectionnez une référence",
        required: true,
        validation: {
          administrativeActReference: nonEmptyString
        },
        style: { className: "fr-col-md-4" },
        choices: ADMINISTRATIVE_ACT_REFERENCES.map(reference => ({
          label: reference,
          value: reference
        })),
        infoText: (selectedAct: string | null) => {
          if (selectedAct) {
            return ADMINISTRATIVE_ACT_EXPLANATIONS[selectedAct];
          }
          return null;
        }
      }
    ]
  },
  {
    tabId: "processing",
    tabTitle: "Traitement",
    fields: [
      {
        name: "product",
        shape: "generic",
        label: Labels.product,
        required: true,
        validation: {
          product: nonEmptyString
        },
        type: "text",
        style: { className: "fr-col-12 fr-col-md-10" }
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
        shape: "layout",
        fields: [
          {
            name: "processingDate",
            shape: "generic",
            label: Labels.processingDate,
            required: true,
            validation: {
              processingDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-8 fr-col-md-4" }
          },
          {
            name: "processingEndDate",
            shape: "generic",
            label: Labels.processingEndDate,
            validation: {
              processingEndDate: optionalString
            },
            type: "date",
            style: { className: "fr-col-8 fr-col-md-4" }
          }
        ]
      },
      {
        Component: Operation,
        props: {
          operationCodes: SSD_PROCESSING_OPERATIONS_CODES,
          operationModes: SSD_OPERATION_MODES,
          showNoTraceability: false,
          showNextOperationCode: false
        },
        names: ["operationCode", "operationMode"],
        validation: {
          operationCode: nonEmptyString,
          operationMode: optionalString
        },
        shape: "custom"
      }
    ]
  },
  {
    tabId: "destination",
    tabTitle: "Produit",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "destination",
          label: "destination",
          excludeTypes: ["PERSONNE_PHYSIQUE", "COMMUNES"],
          required: true
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
      },
      {
        shape: "layout",
        fields: [
          {
            name: "useDate",
            shape: "generic",
            label: Labels.useDate,
            required: true,
            validation: {
              useDate: optionalString
            },
            type: "date",
            style: { className: "fr-col-8 fr-col-md-4" }
          },
          {
            name: "dispatchDate",
            shape: "generic",
            label: Labels.dispatchDate,
            required: true,
            validation: {
              dispatchDate: optionalString
            },
            type: "date",
            style: { className: "fr-col-8 fr-col-md-4" }
          }
        ],
        infoText:
          "Renseigner une date d'utilisation sur le site ou date d'expédition"
      }
    ]
  }
];
