import * as Excel from "exceljs";
import {
  AllWaste,
  BsdSubType,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  SsdWaste,
  TransportedWaste
} from "@td/codegen-back";
import { GenericWaste } from "./types";
import { formatStatusLabel } from "@td/constants";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TransportMode } from "@prisma/client";
import { isDefined } from "../common/helpers";
import { RegistryExportSource } from "@td/codegen-back";

// Type for custom fields that might not be in the DB
// But that we still want to display (ie for user convenience)
export const CUSTOM_WASTE_COLUMNS = ["statusLabel"];
export type CustomWasteColumns = {
  statusLabel: string;
};

export type WasteField = keyof (SsdWaste &
  IncomingWaste &
  OutgoingWaste &
  TransportedWaste &
  ManagedWaste &
  AllWaste &
  CustomWasteColumns);

type Column = {
  field: WasteField;
  label: string;
  format?: (v: unknown, full: unknown) => string | number | null;
};

export const formatDate = (d: Date | null) => {
  if (!d) return "";
  return format(d, "yyyy-MM-dd", {
    locale: fr
  });
};

const formatBoolean = (b: boolean | null) => {
  if (b === null || b === undefined) {
    return "";
  }
  return b ? "O" : "N";
};
const formatNumber = (n: number) =>
  isDefined(n) ? parseFloat(n.toFixed(3)) : null; // return as a number to allow xls cells formulas
const formatArray = (arr: any[], sep = ",") =>
  Array.isArray(arr) ? arr.join(sep) : "";
const formatArrayWithMissingElements = (arr: any[]) => {
  if (!Array.isArray(arr)) {
    return "";
  }
  return arr.map(elem => elem ?? "").join(",");
};
const formatOperationCode = (code?: string) =>
  code ? code.replace(/ /g, "") : ""; // be consistent and remove all white spaces

const formatTransportMode = (mode?: TransportMode): string => {
  if (!mode) return "";

  switch (mode) {
    case "ROAD":
      return "Route";
    case "RAIL":
      return "Voie ferrée";
    case "AIR":
      return "Voie aérienne";
    case "RIVER":
      return "Voie fluviale";
    case "SEA":
      return "Voie maritime";
    case "OTHER":
      return "Autre";
    default:
      return "";
  }
};

export const formatSubType = (subType?: BsdSubType) => {
  if (!subType) return "";

  switch (subType) {
    case "INITIAL":
      return "Initial";
    case "TOURNEE":
      return "Tournée dédiée";
    case "APPENDIX1":
      return "Annexe 1";
    case "APPENDIX2":
      return "Annexe 2";
    case "TEMP_STORED":
      return "Entreposage provisoire";
    case "COLLECTION_2710":
      return "Collecte en déchetterie";
    case "GATHERING":
      return "Groupement";
    case "GROUPEMENT":
      return "Regroupement";
    case "RESHIPMENT":
      return "Réexpédition";
    case "RECONDITIONNEMENT":
      return "Reconditionnement";
    case "SYNTHESIS":
      return "Synthèse";
    default:
      return "";
  }
};

const formatHasCiterneBeenWashedOut = (
  hasCiterneBeenWashedOut: boolean | null | undefined
) => {
  if (!isDefined(hasCiterneBeenWashedOut)) return "";

  return hasCiterneBeenWashedOut ? "Effectué" : "Non effectué";
};

const formatSource = (source: RegistryExportSource) => {
  switch (source) {
    case "BSD":
      return "Tracé";
    case "REGISTRY":
      return "Déclaré";
    default:
      return "";
  }
};

const formatEstimateBoolean = (isEstimate: boolean | null) => {
  if (isEstimate === null || isEstimate === undefined) {
    return "";
  }
  return isEstimate ? "ESTIME" : "REEL";
};

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
  { field: "bsdSubType", label: "Sous-type", format: formatSubType },
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
  {
    field: "weight",
    label: "Quantité de déchet",
    format: formatNumber
  },
  // Origine du déchet
  {
    field: "initialEmitterCompanyName",
    label: "Producteur initial raison sociale"
  },
  { field: "initialEmitterCompanySiret", label: "Producteur initial SIRET" },
  {
    field: "initialEmitterCompanyAddress",
    label: "Producteur initial adresse"
  },
  {
    field: "initialEmitterCompanyPostalCode",
    label: "Producteur initial Code postal"
  },
  {
    field: "initialEmitterCompanyCity",
    label: "Producteur initial Commune"
  },
  {
    field: "initialEmitterCompanyCountry",
    label: "Producteur initial Pays"
  },
  {
    field: "emitterCompanyIrregularSituation",
    label: "Expéditeur situation irrégulière",
    format: formatBoolean
  },
  { field: "emitterCompanyName", label: "Expéditeur raison sociale" },
  { field: "emitterCompanyGivenName", label: "Expéditeur Nom usuel" },
  { field: "emitterCompanySiret", label: "Expéditeur SIRET" },
  { field: "emitterCompanyAddress", label: "Expéditeur Adresse" },
  { field: "emitterCompanyPostalCode", label: "Expéditeur Code postal" },
  { field: "emitterCompanyCity", label: "Expéditeur Commune" },
  { field: "emitterCompanyCountry", label: "Expéditeur Pays" },
  { field: "emitterPickupsiteName", label: "Nom du point de prise en charge" },
  { field: "emitterPickupsiteAddress", label: "Prise en charge adresse" },
  {
    field: "emitterPickupsitePostalCode",
    label: "Prise en charge Code postal"
  },
  { field: "emitterPickupsiteCity", label: "Prise en charge Commune" },
  { field: "emitterPickupsiteCountry", label: "Prise en charge Pays" },
  { field: "emitterCompanyMail", label: "Expéditeur contact" },
  { field: "workerCompanyName", label: "Entreprise de travaux raison sociale" },
  { field: "workerCompanySiret", label: "Entreprise de travaux SIRET" },
  { field: "workerCompanyAddress", label: "Entreprise de travaux adresse" },
  {
    field: "workerCompanyPostalCode",
    label: "Entreprise de travaux Code postal"
  },
  { field: "workerCompanyCity", label: "Entreprise de travaux Commune" },
  { field: "workerCompanyCountry", label: "Entreprise de travaux Pays" },
  {
    field: "parcelCities",
    label: "Parcelle commune",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "parcelPostalCodes",
    label: "Parcelle code postal",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "parcelNumbers",
    label: "Parcelle numéro",
    format: formatArrayWithMissingElements
  },
  {
    field: "parcelCoordinates",
    label: "Parcelle coordonnées",
    format: formatArrayWithMissingElements
  },
  // Gestion du déchets
  { field: "ecoOrganismeName", label: "Éco-organisme raison sociale" },
  { field: "ecoOrganismeSiren", label: "Éco-organisme SIREN" },
  { field: "traderCompanyName", label: "Négociant raison sociale" },
  { field: "traderCompanySiret", label: "Négociant SIRET" },
  { field: "traderCompanyMail", label: "Négociant contact" },
  { field: "traderRecepisseNumber", label: "Négociant récépissé " },
  { field: "brokerCompanyName", label: "Courtier raison sociale" },
  { field: "brokerCompanySiret", label: "Courtier SIRET" },
  { field: "brokerCompanyMail", label: "Courtier contact" },
  { field: "brokerRecepisseNumber", label: "Courtier N°récepissé" },
  // Transport du déchet

  // Intermédiaires
  {
    field: "intermediary1CompanyName",
    label: "Intermédiaire n°1 - Raison sociale"
  },
  { field: "intermediary1CompanySiret", label: "Intermédiaire n°1 - SIRET" },
  {
    field: "intermediary2CompanyName",
    label: "Intermédiaire n°2 - Raison sociale"
  },
  { field: "intermediary2CompanySiret", label: "Intermédiaire n°2 - SIRET" },
  {
    field: "intermediary3CompanyName",
    label: "Intermédiaire n°3 - Raison sociale"
  },
  { field: "intermediary3CompanySiret", label: "Intermédiaire n°3 - SIRET" },
  { field: "transporterCompanyName", label: "Transporteur raison sociale" },
  { field: "transporterCompanyGivenName", label: "Transporteur Nom usuel" },
  {
    field: "transporterCompanySiret",
    label: "Transporteur SIRET ou n° de TVA intracommunautaire"
  },
  { field: "transporterCompanyAddress", label: "Transporteur adresse" },
  { field: "transporterCompanyPostalCode", label: "Transporteur Code postal" },
  { field: "transporterCompanyCity", label: "Transporteur Commune" },
  { field: "transporterCompanyCountry", label: "Transporteur Pays" },
  {
    field: "transporterRecepisseIsExempted",
    label: "Transporteur exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporterRecepisseNumber", label: "Transporteur récépissé" },
  {
    field: "transporterNumberPlates",
    label: "Transporteur immatriculation",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "transporterTransportMode",
    label: "Transporteur mode de transport",
    format: formatTransportMode
  },
  {
    field: "transporterHandedOverSignatureDate",
    label: "Transporteur date de dépôt",
    format: formatDate
  },
  { field: "transporterCompanyMail", label: "Transporteur contact" },

  { field: "wasteAdr", label: "Mention ADR" },
  { field: "nonRoadRegulationMention", label: "Mention RID, ADNR, IMDG" },
  // Destination du déchet
  { field: "destinationCap", label: "CAP" },
  { field: "destinationCompanyName", label: "Destination raison sociale" },
  { field: "destinationCompanyGivenName", label: "Destination Nom usuel" },
  { field: "destinationCompanySiret", label: "Destination SIRET" },
  { field: "destinationCompanyAddress", label: "Destination adresse" },
  { field: "destinationCompanyPostalCode", label: "Destination Code postal" },
  { field: "destinationCompanyCity", label: "Destination Commune" },
  { field: "destinationCompanyCountry", label: "Destination Pays" },
  { field: "destinationCompanyMail", label: "Destination Contact" },
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
    field: "postTempStorageDestinationCountry",
    label: "Destination post entreposage provisoire Pays"
  },
  {
    field: "destinationReceptionAcceptationStatus",
    label: "Statut d'acceptation du déchet"
  },
  {
    field: "destinationReceptionWeight",
    label: "Quantité réceptionnée nette (tonnes)",
    format: formatNumber
  },
  {
    field: "destinationReceptionRefusedWeight",
    label: "Quantité refusée nette (tonnes)",
    format: formatNumber
  },
  {
    field: "destinationReceptionAcceptedWeight",
    label: "Quantité acceptée / traitée nette (tonnes)",
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
    field: "destinationHasCiterneBeenWashedOut",
    label: "Rinçage citerne",
    format: formatHasCiterneBeenWashedOut
  },
  {
    field: "destinationOperationNoTraceability",
    label: "Rupture de traçabilité autorisée",
    format: formatBoolean
  },
  {
    field: "destinationFinalOperationCompanySirets",
    label: "SIRET de la destination finale",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "destinationFinalOperationCodes",
    label: "Code opération finale réalisée",
    format: (codes: string[]) =>
      formatArray(codes.map(c => formatOperationCode(c)))
  },
  {
    field: "destinationFinalOperationWeights",
    label: "Quantité finale (tonnes)",
    format: (quantities: number[]) =>
      formatArray(
        quantities.map(q => q.toLocaleString("fr")),
        " - "
      )
  },
  {
    field: "nextDestinationNotificationNumber",
    label: "N° de notification / déclaration"
  },
  {
    field: "nextDestinationProcessingOperation",
    label: "Code d'opération ultérieure prévue",
    format: formatOperationCode
  },
  {
    field: "transporter2CompanyName",
    label: "Transporteur n°2 raison sociale"
  },
  {
    field: "transporter2CompanyGivenName",
    label: "Transporteur n°2 Nom usuel"
  },
  { field: "transporter2CompanyAddress", label: "Transporteur n°2 adresse" },
  {
    field: "transporter2CompanyPostalCode",
    label: "Transporteur n°2 Code postal"
  },
  { field: "transporter2CompanyCity", label: "Transporteur n°2 Commune" },
  { field: "transporter2CompanyCountry", label: "Transporteur n°2 Pays" },

  {
    field: "transporter2CompanySiret",
    label: "Transporteur n°2 SIRET ou n° de TVA intracommunautaire"
  },
  {
    field: "transporter2RecepisseIsExempted",
    label: "Transporteur n°2 exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporter2RecepisseNumber", label: "Transporteur n°2 récépissé" },
  {
    field: "transporter2NumberPlates",
    label: "Transporteur n°2 immatriculation",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "transporter2TransportMode",
    label: "Transporteur n°2 mode de transport",
    format: formatTransportMode
  },
  {
    field: "transporter2HandedOverSignatureDate",
    label: "Transporteur n°2 date de dépôt",
    format: formatDate
  },
  { field: "transporter2CompanyMail", label: "Transporteur n°2 contact" },
  {
    field: "transporter3CompanyName",
    label: "Transporteur n°3 raison sociale"
  },
  {
    field: "transporter3CompanyGivenName",
    label: "Transporteur n°3 Nom usuel"
  },
  {
    field: "transporter3CompanySiret",
    label: "Transporteur n°3 SIRET ou n° de TVA intracommunautaire"
  },
  { field: "transporter3CompanyAddress", label: "Transporteur n°3 adresse" },
  {
    field: "transporter3CompanyPostalCode",
    label: "Transporteur n°3 Code postal"
  },
  { field: "transporter3CompanyCity", label: "Transporteur n°3 Commune" },
  { field: "transporter3CompanyCountry", label: "Transporteur n°3 Pays" },
  {
    field: "transporter3RecepisseIsExempted",
    label: "Transporteur n°3 exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporter3RecepisseNumber", label: "Transporteur n°3 récépissé" },
  {
    field: "transporter3NumberPlates",
    label: "Transporteur n°3 immatriculation",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "transporter3TransportMode",
    label: "Transporteur n°3 mode de transport",
    format: formatTransportMode
  },
  {
    field: "transporter3HandedOverSignatureDate",
    label: "Transporteur n°3 date de dépôt",
    format: formatDate
  },
  { field: "transporter3CompanyMail", label: "Transporteur n°3 contact" },
  {
    field: "transporter4CompanyName",
    label: "Transporteur n°4 raison sociale"
  },
  {
    field: "transporter4CompanyGivenName",
    label: "Transporteur n°4 Nom usuel"
  },
  {
    field: "transporter4CompanySiret",
    label: "Transporteur n°4 SIRET ou n° de TVA intracommunautaire"
  },
  { field: "transporter4CompanyAddress", label: "Transporteur n°4 adresse" },
  {
    field: "transporter4CompanyPostalCode",
    label: "Transporteur n°4 Code postal"
  },
  { field: "transporter4CompanyCity", label: "Transporteur n°4 Commune" },
  { field: "transporter4CompanyCountry", label: "Transporteur n°4 Pays" },
  {
    field: "transporter4RecepisseIsExempted",
    label: "Transporteur n°4 exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporter4RecepisseNumber", label: "Transporteur n°4 récépissé" },
  {
    field: "transporter4NumberPlates",
    label: "Transporteur n°4 immatriculation",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "transporter4TransportMode",
    label: "Transporteur n°4 mode de transport",
    format: formatTransportMode
  },
  {
    field: "transporter4HandedOverSignatureDate",
    label: "Transporteur n°4 date de dépôt",
    format: formatDate
  },
  { field: "transporter4CompanyMail", label: "Transporteur n°4 contact" },
  {
    field: "transporter5CompanyName",
    label: "Transporteur n°5 raison sociale"
  },
  {
    field: "transporter5CompanyGivenName",
    label: "Transporteur n°5 Nom usuel"
  },
  {
    field: "transporter5CompanySiret",
    label: "Transporteur n°5 SIRET ou n° de TVA intracommunautaire"
  },
  { field: "transporter5CompanyAddress", label: "Transporteur n°5 adresse" },
  {
    field: "transporter5CompanyPostalCode",
    label: "Transporteur n°5 Code postal"
  },
  { field: "transporter5CompanyCity", label: "Transporteur n°5 Commune" },
  { field: "transporter5CompanyCountry", label: "Transporteur n°5 Pays" },
  {
    field: "transporter5RecepisseIsExempted",
    label: "Transporteur n°5 exemption de récépissé",
    format: formatBoolean
  },
  { field: "transporter5RecepisseNumber", label: "Transporteur n°5 récépissé" },
  {
    field: "transporter5NumberPlates",
    label: "Transporteur n°5 immatriculation",
    format: (v: string[]) => formatArray(v)
  },
  {
    field: "transporter5TransportMode",
    label: "Transporteur n°5 mode de transport",
    format: formatTransportMode
  },
  {
    field: "transporter5HandedOverSignatureDate",
    label: "Transporteur n°5 date de dépôt",
    format: formatDate
  },
  { field: "transporter5CompanyMail", label: "Transporteur n°5 contact" },
  // registry V2 fields (some are already handled above)
  {
    field: "source",
    label: "Source",
    format: formatSource
  },
  {
    field: "publicId",
    label: "Numéro unique"
  },
  {
    field: "reportAsSiret",
    label: "SIRET du déclarant"
  },
  {
    field: "reportForSiret",
    label: "SIRET de l'émetteur"
  },
  {
    field: "reportForName",
    label: "Raison sociale de l'émetteur"
  },
  {
    field: "useDate",
    label: "Date d'utilisation",
    format: formatDate
  },
  {
    field: "dispatchDate",
    label: "Date d'expédition",
    format: formatDate
  },
  {
    field: "wasteCodeBale",
    label: "Code déchet Bâle"
  },
  {
    field: "secondaryWasteCodes",
    label: "Codes déchets secondaires"
  },
  {
    field: "secondaryWasteDescriptions",
    label: "Dénominations des déchets secondaires"
  },
  {
    field: "product",
    label: "Produit"
  },
  {
    field: "weightValue",
    label: "Poids en tonnes",
    format: formatNumber
  },
  {
    field: "weightIsEstimate",
    label: "Type de poids",
    format: formatEstimateBoolean
  },
  {
    field: "volume",
    label: "Quantité en M3",
    format: formatNumber
  },
  {
    field: "processingDate",
    label: "Date de traitement",
    format: formatDate
  },
  {
    field: "processingEndDate",
    label: "Date de fin de traitement",
    format: formatDate
  },
  {
    field: "destinationType",
    label: "Type de destinataire"
  },
  {
    field: "destinationOrgId",
    label: "Numéro d'identification du destinataire"
  },
  {
    field: "destinationName",
    label: "Raison sociale du destinataire"
  },
  {
    field: "destinationAddress",
    label: "Adresse du destinataire"
  },
  {
    field: "destinationPostalCode",
    label: "Code postal du destinataire"
  },
  {
    field: "destinationCity",
    label: "Commune du destinataire"
  },
  {
    field: "destinationCountryCode",
    label: "Pays du destinataire"
  },
  {
    field: "operationCode",
    label: "Code d'opération",
    format: formatOperationCode
  },
  {
    field: "operationMode",
    label: "Mode de traitement"
  },
  {
    field: "administrativeActReference",
    label: "Référence de l'acte administratif"
  }
];

export function formatRow(
  waste: GenericWaste,
  useLabelAsKey = false
): Record<string, string> {
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
