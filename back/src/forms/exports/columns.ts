import Excel from "exceljs";
import countries from "world-countries";
import { Column, FormFlattened } from "./types";

const identity = (v: any) => v ?? "";
const formatDate = (d: Date | null) => d?.toISOString().slice(0, 10) ?? "";
const formatBoolean = (b: boolean | null) => {
  if (b === null) {
    return "";
  }
  return b ? "O" : "N";
};
const formatCountry = (code: string): string => {
  const country = countries.find(country => country.cca2 === code);
  return country?.translations.fra.common ?? "";
};

const columns: Column[] = [
  { field: "readableId", label: "N° de bordereau", format: identity },
  { field: "customId", label: "Identifiant secondaire", format: identity },
  // cadre 1
  { field: "emitterCompanySiret", label: "Émetteur siret", format: identity },
  { field: "emitterCompanyName", label: "Émetteur nom", format: identity },
  {
    field: "emitterCompanyContact",
    label: "Émetteur contact",
    format: identity
  },
  {
    field: "emitterCompanyAddress",
    label: "Émetteur adresse",
    format: identity
  },
  { field: "emitterWorkSiteName", label: "Chantier nom", format: identity },
  {
    field: "emitterWorkSiteAddress",
    label: "Chantier adresse",
    format: identity
  },
  {
    field: "ecoOrganismeName",
    label: "Éco-organisme nom",
    format: identity
  },
  // cadre 2 ou cadre 14 (entreposage provisoire ou reconditionnement)
  {
    field: "recipientCompanySiret",
    label: "Destination siret",
    format: identity
  },
  { field: "recipientCompanyName", label: "Destination nom", format: identity },
  {
    field: "recipientCompanyAddress",
    label: "Destination adresse",
    format: identity
  },
  {
    field: "recipientCompanyMail",
    label: "Destination email",
    format: identity
  },
  {
    field: "recipientProcessingOperation",
    label: "Opération prévue D/R",
    format: identity
  },
  // cadre 2 (entreposage provisoire ou reconditionnement)
  {
    field: "temporaryStorageCompanySiret",
    label: "Entreposage ou reconditonnement siret",
    format: identity
  },
  {
    field: "temporaryStorageCompanyName",
    label: "Entreposage ou reconditonnement nom",
    format: identity
  },
  {
    field: "temporaryStorageCompanyContact",
    label: "Entreposage ou reconditonnement contact",
    format: identity
  },
  {
    field: "temporaryStorageCompanyPhone",
    label: "Entreposage ou reconditonnement N°tél",
    format: identity
  },
  {
    field: "temporaryStorageCompanyAddress",
    label: "Entreposage ou reconditonnement adresse",
    format: identity
  },
  {
    field: "temporaryStorageCompanyMail",
    label: "Entreposage ou reconditonnement email",
    format: identity
  },
  // cadre 3 à 6
  {
    field: "wasteDetailsCode",
    label: "Déchet rubrique",
    format: identity
  },
  {
    field: "wasteDetailsQuantity",
    label: "Déchet quantité estimée (en tonnes)",
    format: identity
  },
  {
    field: "wasteDetailsPop",
    label: "Contient des pop",
    format: value => (value ? "Oui" : "Non")
  },
  // cadre 7
  { field: "traderCompanySiret", label: "Négociant siret", format: identity },
  { field: "traderCompanyName", label: "Négociant nom", format: identity },

  { field: "traderReceipt", label: "Négociant récépissé N°", format: identity },
  {
    field: "traderValidityLimit",
    label: "Négociant récépissé validité",
    format: formatDate
  },
  {
    field: "traderCompanyContact",
    label: "Négociant contact",
    format: identity
  },
  {
    field: "traderCompanyAddress",
    label: "Négociant adresse",
    format: identity
  },
  // cadre 8
  {
    field: "transporterCompanySiret",
    label: "Transporteur siret",
    format: identity
  },
  {
    field: "transporterCompanyName",
    label: "Transporteur nom",
    format: identity
  },
  {
    field: "transporterCompanyAddress",
    label: "Transporteur adresse",
    format: identity
  },
  {
    field: "transporterIsExemptedOfReceipt",
    label: "Transporteur exemption de récépissé",
    format: formatBoolean
  },
  {
    field: "transporterReceipt",
    label: "Transporteur récépissé N°",
    format: identity
  },
  {
    field: "transporterValidityLimit",
    label: "Transporteur récépissé validité",
    format: formatDate
  },
  {
    field: "transporterNumberPlate",
    label: "Transporteur immatriculation",
    format: identity
  },
  {
    field: "sentAt",
    label: "Date de prise en charge",
    format: formatDate
  },
  // cadre 10
  { field: "receivedAt", label: "Date de présentation", format: formatDate },
  { field: "isAccepted", label: "Lot accepté", format: identity },
  {
    field: "quantityReceived",
    label: "Déchet quantité réelle (en tonnes)",
    format: identity
  },
  // cadre 11
  {
    field: "processingOperationDone",
    label: "Opération réalisée D/R",
    format: identity
  },
  {
    field: "noTraceability",
    label: "Perte de traçabilité",
    format: formatBoolean
  },
  // cadre 12 (destination ultérieure)
  {
    field: "nextDestinationProcessingOperation",
    label: "Destination ultérieure opération réalisée D/R",
    format: identity
  },
  {
    field: "nextDestinationCompanyName",
    label: "Destination ultérieure nom",
    format: identity
  },
  {
    field: "nextDestinationCompanyContact",
    label: "Destination ultérieure contact",
    format: identity
  },
  {
    field: "nextDestinationCompanyMail",
    label: "Destination ultérieure email",
    format: identity
  },
  {
    field: "nextDestinationCompanyPhone",
    label: "Destination ultérieure téléphone",
    format: identity
  },
  {
    field: "nextDestinationCompanyAddress",
    label: "Destination ultérieure adresse",
    format: identity
  },
  {
    field: "nextDestinationCompanyCountry",
    label: "Destination ultérieure pays",
    format: formatCountry
  },
  // cadre 18 (entreposage provisoire)
  {
    field: "temporaryStorageTransporterCompanySiret",
    label: "Transporteur après entreposage ou reconditionnement siret",
    format: identity
  },
  {
    field: "temporaryStorageTransporterCompanyName",
    label: "Transporteur après entreposage ou reconditionnement nom",
    format: identity
  },
  {
    field: "temporaryStorageTransporterCompanyAddress",
    label: "Transporteur après entreposage ou reconditionnement adresse",
    format: identity
  },
  {
    field: "temporaryStorageTransporterIsExemptedOfReceipt",
    label:
      "Transporteur après entreposage ou reconditionnement exemption de récépissé",
    format: formatBoolean
  },
  {
    field: "temporaryStorageTransporterReceipt",
    label: "Transporteur après entreposage ou reconditionnement récépissé",
    format: identity
  },
  {
    field: "temporaryStorageTransporterValidityLimit",
    label:
      "Transporteur après entreposage ou reconditionnement récépissé validité",
    format: formatDate
  },
  {
    field: "temporaryStorageTransporterNumberPlate",
    label:
      "Transporteur après entreposage ou reconditionnement plaque d'immatriculation",
    format: identity
  }
];

/**
 * Format row values and optionally use label as key
 */
export function formatRow(
  form: FormFlattened,
  useLabelAsKey = false
): { [key: string]: string } {
  return columns.reduce((acc, column) => {
    if (column.field in form) {
      const key = useLabelAsKey ? column.label : column.field;
      return {
        ...acc,
        [key]: column.format(form[column.field])
      };
    }
    return acc;
  }, {});
}

/**
 * GET XLSX headers based of the first row
 */
export function getXlsxHeaders(form: FormFlattened): Partial<Excel.Column>[] {
  return columns.reduce<Partial<Excel.Column>[]>((acc, column) => {
    if (column.field in form) {
      return [
        ...acc,
        {
          header: column.label,
          key: column.field,
          width: 20
        }
      ];
    }
    return acc;
  }, []);
}
