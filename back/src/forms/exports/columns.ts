import { Column } from "./types";

const identity = (v: any) => v || "";
const formatDate = (d: string | null) => (d ? d.slice(0, 10) : "");
const formatBoolean = (b: boolean | null) => {
  if (b === null) {
    return "";
  }
  return b ? "O" : "N";
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
  // cadre 2
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
  // cadre 3 à 6
  { field: "wasteDetailsCode", label: "Déchet rubrique", format: identity },
  {
    field: "wasteDetailsQuantity",
    label: "Déchet quantité (en tonnes)",
    format: identity
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
  // cadre 14
  {
    field: "temporaryStorageDestinationCompanySiret",
    label: "Destination siret",
    format: identity
  },
  {
    field: "temporaryStorageDestinationCompanyName",
    label: "Entreposage / reconditionnement nom",
    format: identity
  },
  {
    field: "temporaryStorageDetailCompanyAddress",
    label: "Entreposage / reconditionnement adresse",
    format: identity
  },
  {
    field: "temporaryStorageDetailCompanyMail",
    label: "Entreposage / reconditionnement email",
    format: identity
  }
];

export default columns;
