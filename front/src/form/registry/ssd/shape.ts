import { SSD_PROCESSING_OPERATIONS_CODES } from "@td/constants";
import { FormShape } from "../builder/types";
import { CompanySelector } from "../common/CompanySelector";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";
import { ReportFor } from "../common/ReportFor";
import { SecondaryWasteCodes } from "./SecondaryWasteCodes";

export const ssdFormShape: FormShape = [
  {
    tabTitle: "Déclaration",
    fields: [
      {
        name: "reason",
        shape: "generic",
        type: "select",
        label: "Motif",
        validation: { required: false },
        style: { className: "fr-col-8" },
        choices: [
          { label: "Modifier", value: "EDIT" },
          { label: "Annuler", value: "CANCEL" }
        ]
      },
      {
        name: "publicId",
        shape: "generic",
        type: "text",
        label: "Identifiant unique",
        validation: { required: true },
        style: { className: "fr-col-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET du déclarant",
          reportAsLabel: "SIRET de l'émetteur de la déclaration"
        },
        names: ["reportAsSiret", "reportForSiret"],
        shape: "custom"
      },
      {
        name: "usedAt",
        shape: "generic",
        label: "Date d'utilisation",
        validation: { required: true },
        type: "date",
        style: { className: "fr-col-4" }
      },
      {
        name: "sentAt",
        shape: "generic",
        label: "Date d'expédition",
        validation: { required: true },
        type: "date",
        style: { className: "fr-col-4" }
      }
    ]
  },
  {
    tabTitle: "Déchet",
    fields: [
      {
        Component: WasteCodeSelector,
        props: { name: "wasteCode" },
        shape: "custom",
        names: ["wasteCode"],
        style: { parentClassName: "fr-grid-row--bottom tw-relative" }
      },
      {
        name: "wasteDecription",
        shape: "generic",
        label: "Dénomination du déchet",
        validation: { required: true },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "wasteBale",
        shape: "generic",
        label: "Code déchet Bâle",
        validation: { required: false },
        type: "text",
        style: { className: "fr-col-4" }
      },
      {
        Component: SecondaryWasteCodes,
        shape: "custom",
        names: ["secondaryWasteCodes", "secondaryWasteDecriptions"]
      },
      {
        name: "product",
        shape: "generic",
        label: "Produit",
        validation: { required: false },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        Component: WeightSelector,
        shape: "custom",
        names: ["weightValue", "weightIsEstimate", "weightIsEstimate"]
      }
    ]
  },
  {
    tabTitle: "Traitement",
    fields: [
      {
        shape: "layout",
        fields: [
          {
            name: "processingDate",
            shape: "generic",
            label: "Date de traitement",
            validation: { required: true },
            type: "date",
            style: { className: "fr-col-4" }
          },
          {
            name: "processingEndDate",
            shape: "generic",
            label: "Date de fin de traitement",
            validation: { required: false },
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
            validation: { required: true },
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
            validation: { required: true },
            style: { className: "fr-col-4" },
            choices: [
              { value: "REUTILISATION", label: "Réutilisation" },
              { value: "RECYCLAGE", label: "Recyclage" },
              {
                value: "VALORISATION_ENERGETIQUE",
                label: "Valorisatio énergétique"
              },
              { value: "ELIMINATION", label: "Elimination" },
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
        validation: { required: true },
        style: { className: "fr-col-4" },
        choices: [
          { label: "Implicite", value: "Implicite" },
          {
            label: "Arrêté du 29 juillet 2014",
            value: "Arrêté du 29 juillet 2014"
          },
          { label: "Arrêté du 24 août 2016", value: "Arrêté du 24 août 2016" },
          {
            label: "Arrêté du 10 juillet 2017",
            value: "Arrêté du 10 juillet 2017"
          },
          {
            label: "Arrêté du 11 décembre 2018",
            value: "Arrêté du 11 décembre 2018"
          },
          {
            label: "Arrêté du 22 février 2019",
            value: "Arrêté du 22 février 2019"
          },
          {
            label: "Arrêté du 25 février 2019",
            value: "Arrêté du 25 février 2019"
          },
          { label: "Arrêté du 4 juin 2021", value: "Arrêté du 4 juin 2021" },
          {
            label: "Arrêté du 13 décembre 2021",
            value: "Arrêté du 13 décembre 2021"
          },
          {
            label: "Arrêté du 21 décembre 2021",
            value: "Arrêté du 21 décembre 2021"
          },
          {
            label: "Arrêté du 19 février 2024",
            value: "Arrêté du 19 février 2024"
          }
        ]
      }
    ]
  },
  {
    tabTitle: "Destinataire",
    fields: [
      {
        Component: CompanySelector,
        props: { prefix: "destination", label: "destination" },
        shape: "custom",
        names: [
          "destinationCompanyType",
          "destinationCompanyOrgId",
          "destinationCompanyName",
          "destinationCompanyAddress",
          "destinationCompanyPostalCode",
          "destinationCompanyCity",
          "destinationCompanyCountry"
        ]
      }
    ]
  }
];
