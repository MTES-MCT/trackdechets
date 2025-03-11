import { FormShape } from "../builder/types";
import { CompanySelector } from "../common/CompanySelector";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";

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
      { Component: CompanySelector, name: "reportFor", shape: "custom" },
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
      { Component: WasteCodeSelector, name: "wasteCode", shape: "custom" },
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
        name: "product",
        shape: "generic",
        label: "Produit",
        validation: { required: false },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        Component: WeightSelector,
        shape: "custom"
      }
    ]
  },
  {
    tabTitle: "Traitement",
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
  }
];
