import {
  IncomingWasteV2,
  SsdWasteV2,
  RegistryV2ExportSource,
  BsdSubType,
  RegistryV2ExportType
} from "@td/codegen-back";
import { isDefined } from "../common/helpers";
import { format } from "date-fns";
import { TransportMode } from "@prisma/client";
import { formatStatusLabel as _formatStatusLabel } from "@td/constants";

import { fr } from "date-fns/locale";
import { GenericWasteV2 } from "./types";

type formatOptions = {
  separator?: string;
  waste?: GenericWasteV2;
};

type columnInfos = {
  label: string;
  format?: (v: unknown, options?: formatOptions) => string | number | null;
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
const formatArray = (arr: any[], opts = { separator: "," }) =>
  Array.isArray(arr) ? arr.join(opts.separator) : "";
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

const formatSource = (source: RegistryV2ExportSource) => {
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

const formatStatusLabel = (status: string | null, opts: formatOptions) => {
  return _formatStatusLabel(status, opts.waste);
};

export const EXPORT_COLUMNS: {
  SSD: Partial<Record<keyof SsdWasteV2, columnInfos>>;
  INCOMING: Partial<Record<keyof IncomingWasteV2, columnInfos>>;
} = {
  SSD: {
    source: { label: "Source", format: formatSource },
    publicId: { label: "Numéro unique" },
    reportAsSiret: { label: "SIRET du déclarant" },
    reportForSiret: { label: "SIRET de l'émetteur" },
    reportForName: { label: "Raison sociale de l'émetteur" },
    useDate: { label: "Date d'utilisation", format: formatDate },
    dispatchDate: { label: "Date d'expédition", format: formatDate },
    wasteCode: { label: "Code déchet" },
    wasteDescription: { label: "Dénomination du déchet" },
    wasteCodeBale: { label: "Code déchet Bâle" },
    secondaryWasteCodes: {
      label: "Codes déchets secondaires",
      format: formatArray
    },
    secondaryWasteDescriptions: {
      label: "Dénominations des déchets secondaires",
      format: formatArray
    },
    product: { label: "Produit" },
    weightValue: { label: "Poids en tonnes", format: formatNumber },
    weightIsEstimate: { label: "Type de poids", format: formatEstimateBoolean },
    volume: { label: "Quantité en M3", format: formatNumber },
    processingDate: { label: "Date de traitement", format: formatDate },
    processingEndDate: {
      label: "Date de fin de traitement",
      format: formatDate
    },
    destinationType: { label: "Type de destinataire" },
    destinationOrgId: { label: "Numéro d'identification du destinataire" },
    destinationName: { label: "Raison sociale du destinataire" },
    destinationAddress: { label: "Adresse du destinataire" },
    destinationPostalCode: { label: "Code postal du destinataire" },
    destinationCity: { label: "Commune du destinataire" },
    destinationCountryCode: { label: "Pays du destinataire" },
    operationCode: { label: "Code d'opération", format: formatOperationCode },
    operationMode: { label: "Mode de traitement" },
    administrativeActReference: { label: "Référence de l'acte administratif" }
  },
  INCOMING: {
    source: { label: "Source", format: formatSource },
    publicId: { label: "Numéro unique" },
    bsdId: { label: "N° de bordereau" },
    reportAsSiret: { label: "SIRET du déclarant" },
    createdAt: { label: "Date de création du bordereau", format: formatDate },
    updatedAt: {
      label: "Date de dernière modification du bordereau",
      format: formatDate
    },
    transporterTakenOverAt: { label: "Date d'expédition", format: formatDate },
    destinationReceptionDate: {
      label: "Date de réception",
      format: formatDate
    },
    weighingHour: { label: "Heure de pesée" },
    destinationOperationDate: {
      label: "Date de réalisation de l'opération",
      format: formatDate
    },
    bsdType: { label: "Type de bordereau" },
    bsdSubType: { label: "Sous-type", format: formatSubType },
    customId: { label: "Identifiant secondaire" },
    status: { label: "Statut du bordereau", format: formatStatusLabel },
    wasteDescription: { label: "Dénomination usuelle" },
    wasteCode: { label: "Code du déchet" },
    wasteCodeBale: { label: "Code déchet Bâle" },
    wastePop: { label: "POP", format: formatBoolean },
    wasteIsDangerous: { label: "Déchet dangereux", format: formatBoolean },
    weight: { label: "Quantité de déchet", format: formatNumber },
    initialEmitterCompanyName: { label: "Producteur initial raison sociale" },
    initialEmitterCompanySiret: { label: "Producteur initial SIRET" },
    initialEmitterCompanyAddress: { label: "Producteur initial adresse" },
    initialEmitterCompanyPostalCode: {
      label: "Producteur initial Code postal"
    },
    initialEmitterCompanyCity: { label: "Producteur initial Commune" },
    initialEmitterCompanyCountry: { label: "Producteur initial Pays" },
    initialEmitterMunicipalitiesNames: {
      label: "Producteur(s) - Commune(s)",
      format: formatArray
    },
    initialEmitterMunicipalitiesInseeCodes: {
      label: "Producteur(s) - Code(s) INSEE de(s) commune(s)",
      format: formatArray
    },
    emitterCompanyIrregularSituation: {
      label: "Expéditeur situation irrégulière",
      format: formatBoolean
    },
    emitterCompanyName: { label: "Expéditeur raison sociale" },
    emitterCompanyGivenName: { label: "Expéditeur Nom usuel" },
    emitterCompanySiret: { label: "Expéditeur SIRET" },
    emitterCompanyAddress: { label: "Expéditeur Adresse" },
    emitterCompanyPostalCode: { label: "Expéditeur Code postal" },
    emitterCompanyCity: { label: "Expéditeur Commune" },
    emitterCompanyCountry: { label: "Expéditeur Pays" },
    emitterPickupsiteName: { label: "Nom du point de prise en charge" },
    emitterPickupsiteAddress: { label: "Prise en charge adresse" },
    emitterPickupsitePostalCode: { label: "Prise en charge Code postal" },
    emitterPickupsiteCity: { label: "Prise en charge Commune" },
    emitterPickupsiteCountry: { label: "Prise en charge Pays" },
    emitterCompanyMail: { label: "Expéditeur contact" },
    workerCompanyName: { label: "Entreprise de travaux raison sociale" },
    workerCompanySiret: { label: "Entreprise de travaux SIRET" },
    workerCompanyAddress: { label: "Entreprise de travaux adresse" },
    workerCompanyPostalCode: { label: "Entreprise de travaux Code postal" },
    workerCompanyCity: { label: "Entreprise de travaux Commune" },
    workerCompanyCountry: { label: "Entreprise de travaux Pays" },
    parcelCities: { label: "Parcelle commune", format: formatArray },
    parcelInseeCodes: { label: "Parcelle code Insee", format: formatArray },
    parcelNumbers: {
      label: "Parcelle numéro",
      format: formatArrayWithMissingElements
    },
    parcelCoordinates: {
      label: "Parcelle coordonnées",
      format: formatArrayWithMissingElements
    },
    sisIdentifiers: {
      label: "Identifiant SIS du terrain",
      format: formatArrayWithMissingElements
    },
    ecoOrganismeName: { label: "Éco-organisme raison sociale" },
    ecoOrganismeSiret: { label: "Éco-organisme SIRET" },
    traderCompanyName: { label: "Négociant raison sociale" },
    traderCompanySiret: { label: "Négociant SIRET" },
    traderCompanyMail: { label: "Négociant contact" },
    traderRecepisseNumber: { label: "Négociant récépissé" },
    brokerCompanyName: { label: "Courtier raison sociale" },
    brokerCompanySiret: { label: "Courtier SIRET" },
    brokerCompanyMail: { label: "Courtier contact" },
    brokerRecepisseNumber: { label: "Courtier N° récepissé" },
    transporter1CompanyName: { label: "Transporteur raison sociale" },
    transporter1CompanyGivenName: { label: "Transporteur Nom usuel" },
    transporter1CompanySiret: {
      label: "Transporteur SIRET ou n° de TVA intracommunautaire"
    },
    transporter1CompanyAddress: { label: "Transporteur adresse" },
    transporter1CompanyPostalCode: { label: "Transporteur Code postal" },
    transporter1CompanyCity: { label: "Transporteur Commune" },
    transporter1CompanyCountry: { label: "Transporteur Pays" },
    transporter1RecepisseIsExempted: {
      label: "Transporteur exemption de récépissé",
      format: formatBoolean
    },
    transporter1RecepisseNumber: { label: "Transporteur récépissé" },
    transporter1TransportMode: {
      label: "Transporteur mode de transport",
      format: formatTransportMode
    },
    transporter1CompanyMail: { label: "Transporteur contact" },
    wasteAdr: { label: "Mention ADR" },
    nonRoadRegulationMention: { label: "Mention RID, ADNR, IMDG" },
    destinationCap: { label: "CAP" },
    wasteDap: { label: "DAP" },
    destinationCompanyName: { label: "Destination raison sociale" },
    destinationCompanyGivenName: { label: "Destination Nom usuel" },
    destinationCompanySiret: { label: "Destination SIRET" },
    destinationCompanyAddress: { label: "Destination adresse" },
    destinationCompanyPostalCode: { label: "Destination Code postal" },
    destinationCompanyCity: { label: "Destination Commune" },
    destinationCompanyMail: { label: "Destination Contact" },
    destinationReceptionAcceptationStatus: {
      label: "Statut d'acceptation du déchet"
    },
    destinationReceptionWeight: {
      label: "Quantité réceptionnée nette (tonnes)",
      format: formatNumber
    },
    destinationReceptionRefusedWeight: {
      label: "Quantité refusée nette (tonnes)",
      format: formatNumber
    },
    destinationReceptionAcceptedWeight: {
      label: "Quantité acceptée / traitée nette (tonnes)",
      format: formatNumber
    },
    destinationReceptionWeightIsEstimate: {
      label: "Type de poids de la quantité traitée nette",
      format: formatBoolean
    },
    destinationReceptionVolume: {
      label: "Volume en M3 de la quantité traitée",
      format: formatNumber
    },
    destinationPlannedOperationCode: {
      label: "Code opération prévu",
      format: formatOperationCode
    },
    destinationOperationCode: {
      label: "Code opération réalisé",
      format: formatOperationCode
    },
    destinationOperationMode: { label: "Mode de traitement réalisé" },
    destinationHasCiterneBeenWashedOut: {
      label: "Rinçage citerne",
      format: formatHasCiterneBeenWashedOut
    },
    destinationOperationNoTraceability: {
      label: "Rupture de traçabilité autorisée",
      format: formatBoolean
    },
    declarationNumber: { label: "N° de déclaration" },
    notificationNumber: { label: "N° de notification" },
    movementNumber: { label: "N° de mouvement" },
    nextOperationCode: {
      label: "Code d'opération ultérieure prévue",
      format: formatOperationCode
    },
    isUpcycled: { label: "Parcelle(s) valorisée(s)", format: formatBoolean },
    destinationParcelInseeCodes: {
      label: "Parcelle(s) valorisée(s) - Code(s) INSEE",
      format: formatArray
    },
    destinationParcelNumbers: {
      label: "Parcelle(s) valorisée(s) - Numéro(s)",
      format: formatArrayWithMissingElements
    },
    destinationParcelCoordinates: {
      label: "Parcelle(s) valorisée(s) - Coordonnées",
      format: formatArrayWithMissingElements
    },
    transporter2CompanyName: { label: "Transporteur n°2 raison sociale" },
    transporter2CompanyGivenName: { label: "Transporteur n°2 Nom usuel" },
    transporter2CompanySiret: {
      label: "Transporteur n°2 SIRET ou n° de TVA intracommunautaire"
    },
    transporter2CompanyAddress: { label: "Transporteur n°2 adresse" },
    transporter2CompanyPostalCode: { label: "Transporteur n°2 Code postal" },
    transporter2CompanyCity: { label: "Transporteur n°2 Commune" },
    transporter2CompanyCountry: { label: "Transporteur n°2 Pays" },
    transporter2RecepisseIsExempted: {
      label: "Transporteur n°2 exemption de récépissé",
      format: formatBoolean
    },
    transporter2RecepisseNumber: { label: "Transporteur n°2 récépissé" },
    transporter2TransportMode: {
      label: "Transporteur n°2 mode de transport",
      format: formatTransportMode
    },
    transporter2CompanyMail: { label: "Transporteur n°2 contact" },
    transporter3CompanyName: { label: "Transporteur n°3 raison sociale" },
    transporter3CompanyGivenName: { label: "Transporteur n°3 Nom usuel" },
    transporter3CompanySiret: {
      label: "Transporteur n°3 SIRET ou n° de TVA intracommunautaire"
    },
    transporter3CompanyAddress: { label: "Transporteur n°3 adresse" },
    transporter3CompanyPostalCode: { label: "Transporteur n°3 Code postal" },
    transporter3CompanyCity: { label: "Transporteur n°3 Commune" },
    transporter3CompanyCountry: { label: "Transporteur n°3 Pays" },
    transporter3RecepisseIsExempted: {
      label: "Transporteur n°3 exemption de récépissé",
      format: formatBoolean
    },
    transporter3RecepisseNumber: { label: "Transporteur n°3 récépissé" },
    transporter3TransportMode: {
      label: "Transporteur n°3 mode de transport",
      format: formatTransportMode
    },
    transporter3CompanyMail: { label: "Transporteur n°3 contact" },
    transporter4CompanyName: { label: "Transporteur n°4 raison sociale" },
    transporter4CompanyGivenName: { label: "Transporteur n°4 Nom usuel" },
    transporter4CompanySiret: {
      label: "Transporteur n°4 SIRET ou n° de TVA intracommunautaire"
    },
    transporter4CompanyAddress: { label: "Transporteur n°4 adresse" },
    transporter4CompanyPostalCode: { label: "Transporteur n°4 Code postal" },
    transporter4CompanyCity: { label: "Transporteur n°4 Commune" },
    transporter4CompanyCountry: { label: "Transporteur n°4 Pays" },
    transporter4RecepisseIsExempted: {
      label: "Transporteur n°4 exemption de récépissé",
      format: formatBoolean
    },
    transporter4RecepisseNumber: { label: "Transporteur n°4 récépissé" },
    transporter4TransportMode: {
      label: "Transporteur n°4 mode de transport",
      format: formatTransportMode
    },
    transporter4CompanyMail: { label: "Transporteur n°4 contact" },
    transporter5CompanyName: { label: "Transporteur n°5 raison sociale" },
    transporter5CompanyGivenName: { label: "Transporteur n°5 Nom usuel" },
    transporter5CompanySiret: {
      label: "Transporteur n°5 SIRET ou n° de TVA intracommunautaire"
    },
    transporter5CompanyAddress: { label: "Transporteur n°5 adresse" },
    transporter5CompanyPostalCode: { label: "Transporteur n°5 Code postal" },
    transporter5CompanyCity: { label: "Transporteur n°5 Commune" },
    transporter5CompanyCountry: { label: "Transporteur n°5 Pays" },
    transporter5RecepisseIsExempted: {
      label: "Transporteur n°5 exemption de récépissé",
      format: formatBoolean
    },
    transporter5RecepisseNumber: { label: "Transporteur n°5 récépissé" },
    transporter5TransportMode: {
      label: "Transporteur n°5 mode de transport",
      format: formatTransportMode
    },
    transporter5CompanyMail: { label: "Transporteur n°5 contact" }
  }
};

export function formatRow(
  waste: GenericWasteV2,
  exportType: RegistryV2ExportType,
  useLabelAsKey?: boolean
): Record<string, string> {
  const columns = EXPORT_COLUMNS[exportType];
  return Object.entries(columns).reduce(
    (
      acc: Record<string, string>,
      [key, columnInfos]: [string, columnInfos]
    ) => {
      if (key in waste) {
        return {
          ...acc,
          [useLabelAsKey ? columnInfos.label : key]: columnInfos.format
            ? columnInfos.format(waste[key], {
                waste,
                separator: ","
              })
            : waste[key] ?? ""
        };
      }
      return acc;
    },
    {}
  );
}
