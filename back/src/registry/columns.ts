import * as Excel from "exceljs";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { GenericWaste } from "./types";
import { formatStatusLabel } from "@td/constants";

// Type for custom fields that might not be in the DB
// But that we still want to display (ie for user convenience)
export const CUSTOM_WASTE_COLUMNS = ["statusLabel"];
export type CustomWasteColumns = {
  statusLabel: string;
};

type Column = {
  field: keyof (IncomingWaste &
    OutgoingWaste &
    TransportedWaste &
    ManagedWaste &
    AllWaste &
    CustomWasteColumns);
  label: string;
  format?: (v: unknown, full: unknown) => string | number | null;
};

const formatDate = (d: Date | null) => d?.toISOString().slice(0, 10) ?? "";
const formatBoolean = (b: boolean | null) => {
  if (b === null || b === undefined) {
    return "";
  }
  return b ? "O" : "N";
};
const formatNumber = (n: number) => (!!n ? parseFloat(n.toFixed(3)) : null); // return as a number to allow xls cells formulas
const formatArray = (arr: any[]) => (Array.isArray(arr) ? arr.join(",") : "");
const formatOperationCode = (code?: string) =>
  code ? code.replace(/ /g, "") : ""; // be consistent and remove all white spaces
/**
 * Clean Final Operation lists
 */
const formatFinalOperations = (val?: string[]) =>
  val ? val.map(quant => quant.replace(/ /g, "")).join("; ") : ""; // be consistent and remove all white spaces
const formatFinalOperationWeights = (val?: number[]) =>
  val ? val.map(quant => quant.toFixed(2)).join("; ") : "";

export const columns: Column[] = [
  // Dénomination, nature et quantité :
  { field: "id", label: "N° de bordereau" },
  {
    field: "createdAt",
    label: "Date de création du bordereau",
    format: formatDate
  },
  {
    field: "updatedAt",
    label: "Date de dernière modification du bordereau",
    format: formatDate
  },
  {
    field: "transporterTakenOverAt",
    label: "Date d'expédition",
    format: formatDate
  },
  {
    field: "destinationReceptionDate",
    label: "Date de réception",
    format: formatDate
  },
  {
    field: "destinationOperationDate",
    label: "Date de réalisation de l'opération",
    format: formatDate
  },
  { field: "bsdType", label: "Type de bordereau" },
  { field: "customId", label: "Identifiant secondaire" },
  { field: "status", label: "Statut du bordereau (code)" },
  {
    field: "statusLabel",
    label: "Statut du bordereau",
    format: formatStatusLabel
  },
  { field: "wasteDescription", label: "Dénomination usuelle" },
  { field: "wasteCode", label: "Code du déchet" },
  {
    field: "wasteIsDangerous",
    label: "Déchet dangereux",
    format: formatBoolean
  },
  { field: "pop", label: "POP", format: formatBoolean },
  { field: "weight", label: "Quantité de déchet", format: formatNumber },
  // Origine du déchet
  {
    field: "initialEmitterCompanyName",
    label: "Producteur initial raison sociale"
  },
  { field: "initialEmitterCompanySiret", label: "Producteur initial SIRET" },
  {
    field: "initialEmitterPostalCodes",
    label: "Producteurs initiaux code postaux",
    format: formatArray
  },
  {
    field: "initialEmitterCompanyAddress",
    label: "Producteur initial adresse"
  },
  { field: "emitterCustomInfo", label: "Champ libre expéditeur" },
  { field: "emitterCompanyName", label: "Expéditeur raison sociale" },
  { field: "emitterCompanySiret", label: "Expéditeur SIRET" },
  { field: "emitterCompanyAddress", label: "Expéditeur adresse" },
  { field: "emitterPickupsiteName", label: "Nom du point de prise en charge" },
  { field: "emitterPickupsiteAddress", label: "Adresse de prise en charge" },
  { field: "emitterCompanyMail", label: "Expéditeur contact" },
  { field: "workerCompanyName", label: "Entreprise de travaux raison sociale" },
  { field: "workerCompanySiret", label: "Entreprise de travaux SIRET" },
  { field: "workerCompanyAddress", label: "Entreprise de travaux adresse" },
  // Gestion du déchets
  { field: "ecoOrganismeName", label: "Éco-organisme raison sociale" },
  { field: "ecoOrganismeSiren", label: "Éco-organisme SIREN" },
  { field: "managedEndDate", label: "Date de cession", format: formatDate },
  {
    field: "managedStartDate",
    label: "Date d'acquisition",
    format: formatDate
  },
  { field: "traderCompanyName", label: "Négociant raison sociale" },
  { field: "traderCompanySiret", label: "Négociant SIRET" },
  { field: "traderRecepisseNumber", label: "Négociant récépissé " },
  { field: "brokerCompanyName", label: "Courtier raison sociale" },
  { field: "brokerCompanySiret", label: "Courtier SIRET" },
  { field: "brokerRecepisseNumber", label: "Courtier N°récepissé" },
  // Transport du déchet

  {
    field: "transporterCustomInfo",
    label: "Champ libre transporteur"
  },
  { field: "transporterCompanyName", label: "Transporteur raison sociale" },
  {
    field: "transporterCompanySiret",
    label: "Transporteur SIRET ou numéro de TVA le cas échéant"
  },
  { field: "transporterCompanyAddress", label: "Transporteur adresse" },
  {
    field: "transporterRecepisseIsExempted",
    label: "Transporteur exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporterRecepisseNumber", label: "Transporteur récépissé" },
  {
    field: "transporterNumberPlates",
    label: "Transporteur immatriculation",
    format: formatArray
  },
  { field: "transporterCompanyMail", label: "Transporteur contact" },

  { field: "wasteAdr", label: "ADR" },
  // Destination du déchet
  {
    field: "destinationCustomInfo",
    label: "Champ libre destination"
  },
  { field: "destinationCap", label: "CAP" },
  { field: "destinationCompanyName", label: "Destination raison sociale" },
  { field: "destinationCompanySiret", label: "Destination SIRET" },
  { field: "destinationCompanyAddress", label: "Destination adresse" },
  {
    field: "postTempStorageDestinationName",
    label: "Destination post entreposage provisoire Raison Sociale"
  },
  {
    field: "postTempStorageDestinationSiret",
    label: "Destination post entreposage provisoire SIRET"
  },
  {
    field: "postTempStorageDestinationAddress",
    label: "Destination post entreposage provisoire Adresse"
  },
  {
    field: "postTempStorageDestinationPostalCode",
    label: "Destination post entreposage provisoire Code Postal"
  },
  {
    field: "postTempStorageDestinationCity",
    label: "Destination post entreposage provisoire Ville"
  },
  {
    field: "destinationReceptionAcceptationStatus",
    label: "Statut d'acceptation du déchet"
  },
  {
    field: "destinationReceptionWeight",
    label: "Quantité de déchet entrant (t)",
    format: formatNumber
  },
  {
    field: "destinationPlannedOperationCode",
    label: "Code opération prévu",
    format: formatOperationCode
  },
  {
    field: "destinationOperationMode",
    label: "Mode de traitement réalisé"
  },
  {
    field: "destinationOperationCode",
    label: "Code opération réalisé",
    format: formatOperationCode
  },
  {
    field: "destinationOperationNoTraceability",
    label: "Rupture de traçabilité autorisée",
    format: formatBoolean
  },
  {
    field: "destinationFinalOperationCodes",
    label: "Opération(s) finale(s) réalisée(s) par la traçabilité suite",
    format: formatFinalOperations
  },
  {
    field: "destinationFinalOperationWeights",
    label: "Quantité(s) liée(s)",
    format: formatFinalOperationWeights
  },
  {
    field: "transporter2CompanyName",
    label: "Transporteur n°2 raison sociale"
  },
  { field: "transporter2CompanyAddress", label: "Transporteur n°2 adresse" },
  { field: "transporter2CompanySiret", label: "Transporteur n°2 SIRET" },
  {
    field: "transporter2RecepisseIsExempted",
    label: "Transporteur n°2 exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporter2RecepisseNumber", label: "Transporteur n°2 récépissé" },
  {
    field: "transporter2NumberPlates",
    label: "Transporteur n°2 immatriculation",
    format: formatArray
  },
  { field: "transporter2CompanyMail", label: "Transporteur n°2 contact" },
  {
    field: "transporter3CompanyName",
    label: "Transporteur n°3 raison sociale"
  },
  { field: "transporter3CompanySiret", label: "Transporteur n°3 SIRET" },
  { field: "transporter3CompanyAddress", label: "Transporteur n°3 adresse" },
  {
    field: "transporter3RecepisseIsExempted",
    label: "Transporteur n°3 exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporter3RecepisseNumber", label: "Transporteur n°3 récépissé" },
  {
    field: "transporter3NumberPlates",
    label: "Transporteur n°3 immatriculation",
    format: formatArray
  },
  { field: "transporter3CompanyMail", label: "Transporteur n°3 contact" }
];

export function formatRow(waste: GenericWaste, useLabelAsKey = false) {
  return columns.reduce((acc, column) => {
    if (
      column.field in waste ||
      CUSTOM_WASTE_COLUMNS.includes(column.field || "")
    ) {
      const key = useLabelAsKey ? column.label : column.field;
      return {
        ...acc,
        [key]: column.format
          ? column.format(waste[column.field], waste)
          : waste[column.field] ?? ""
      };
    }
    return acc;
  }, {});
}

/**
 * GET XLSX headers based of the first row
 */
export function getXlsxHeaders(waste: GenericWaste): Partial<Excel.Column>[] {
  return columns.reduce<Partial<Excel.Column>[]>((acc, column) => {
    if (
      column.field in waste ||
      CUSTOM_WASTE_COLUMNS.includes(column.field || "")
    ) {
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
