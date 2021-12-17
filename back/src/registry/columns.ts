import * as Excel from "exceljs";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { GenericWaste } from "./types";

type Column = {
  field: keyof (IncomingWaste &
    OutgoingWaste &
    TransportedWaste &
    ManagedWaste &
    AllWaste);
  label: string;
  format?: (v: string | boolean | number | Date | string[]) => string;
};

const formatDate = (d: Date | null) => d?.toISOString().slice(0, 10) ?? "";
const formatBoolean = (b: boolean | null) => {
  if (b === null || b === undefined) {
    return "";
  }
  return b ? "O" : "N";
};
const formatNumber = (n: number) => n?.toFixed(3) ?? "";
const formatArray = (arr: any[]) => (Array.isArray(arr) ? arr.join(",") : "");

const columns: Column[] = [
  // Dénomination, nature et quantité :
  { field: "id", label: "N° de bordereau" },
  {
    field: "createdAt",
    label: "Date de création du bordereau",
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
  { field: "status", label: "Statut du bordereau" },
  { field: "wasteDescription", label: "Dénomination usuelle" },
  { field: "wasteCode", label: "Code du déchet" },
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
    label: "Code postaux collecte",
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
  { field: "transporterCompanyAddress", label: "Transporteur adresse" },
  { field: "transporterCompanyName", label: "Transporteur raison sociale" },
  { field: "transporterCompanySiret", label: "Transporteur SIRET" },
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
    label: "Code de traitement envisagé"
  },
  {
    field: "destinationPlannedOperationMode",
    label: "Mode de traitement envisagée"
  },
  { field: "destinationOperationCode", label: "Code de traitement réalisée" },
  {
    field: "destinationOperationNoTraceability",
    label: "Rupture de traçabilité autorisée",
    format: formatBoolean
  }
];

export function formatRow(waste: GenericWaste, useLabelAsKey = false) {
  return columns.reduce((acc, column) => {
    if (column.field in waste) {
      const key = useLabelAsKey ? column.label : column.field;
      return {
        ...acc,
        [key]: column.format
          ? column.format(waste[column.field])
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
    if (column.field in waste) {
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
