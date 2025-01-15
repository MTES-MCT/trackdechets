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
    publicId: { label: "Identifiant unique" },
    reportAsSiret: { label: "SIRET du déclarant" },
    reportForSiret: { label: "SIRET de l'émetteur" },
    reportForName: { label: "Raison sociale de l'émetteur" },
    useDate: { label: "Date d'utilisation", format: formatDate },
    dispatchDate: { label: "Date d'expédition", format: formatDate },
    wasteDescription: { label: "Dénomination du déchet" },
    wasteCode: { label: "Code déchet" },
    wasteCodeBale: { label: "Code déchet Bâle" },
    secondaryWasteDescriptions: {
      label: "Dénominations des déchets secondaires",
      format: formatArray
    },
    secondaryWasteCodes: {
      label: "Codes déchets secondaires",
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
    operationCode: {
      label: "Code de traitement réalisé",
      format: formatOperationCode
    },
    operationMode: { label: "Mode de traitement" },
    administrativeActReference: { label: "Référence de l'acte administratif" },
    destinationType: { label: "Type de destinataire" },
    destinationOrgId: { label: "Numéro d'identification du destinataire" },
    destinationName: { label: "Raison sociale du destinataire" },
    destinationAddress: { label: "Libellé de l'adresse du destinataire" },
    destinationPostalCode: { label: "Code postal du destinataire" },
    destinationCity: { label: "Commune du destinataire" },
    destinationCountryCode: { label: "Code pays du destinataire" }
  },
  INCOMING: {
    source: { label: "Source", format: formatSource },
    publicId: { label: "identifiant unique" },
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
    bsdSubType: { label: "Sous-type de bordereau", format: formatSubType },
    customId: { label: "Identifiant secondaire" },
    status: { label: "Statut du bordereau", format: formatStatusLabel },
    wasteDescription: { label: "Dénomination usuelle" },
    wasteCode: { label: "Code déchet" },
    wasteCodeBale: { label: "Code déchet Bâle" },
    wastePop: { label: "POP", format: formatBoolean },
    wasteIsDangerous: { label: "Dangereux", format: formatBoolean },
    weight: { label: "Émetteur - Quantité de déchet ", format: formatNumber },
    initialEmitterCompanySiret: {
      label: "Producteur initial - N° d'identification"
    },
    initialEmitterCompanyName: { label: "Producteur initial - Raison sociale" },
    initialEmitterCompanyAddress: {
      label: "Producteur initial - Libellé adresse"
    },
    initialEmitterCompanyPostalCode: {
      label: "Producteur initial - Code postal"
    },
    initialEmitterCompanyCity: { label: "Producteur initial - Commune" },
    initialEmitterCompanyCountry: { label: "Producteur initial - Code pays" },
    initialEmitterMunicipalitiesInseeCodes: {
      label: "Producteur(s) - Code(s) INSEE de(s) commune(s)",
      format: formatArray
    },
    initialEmitterMunicipalitiesNames: {
      label: "Producteur(s) - Commune(s)",
      format: formatArray
    },
    emitterCompanyIrregularSituation: {
      label: "Expéditeur - Situation irrégulière",
      format: formatBoolean
    },
    emitterCompanySiret: { label: "Expéditeur - N° d'identification" },
    emitterCompanyName: { label: "Expéditeur - Raison sociale" },
    emitterCompanyGivenName: { label: "Expéditeur - Nom usuel" },
    emitterCompanyAddress: { label: "Expéditeur - Libellé adresse" },
    emitterCompanyPostalCode: { label: "Expéditeur - Code postal" },
    emitterCompanyCity: { label: "Expéditeur - Commune" },
    emitterCompanyCountry: { label: "Expéditeur - Code pays" },
    emitterPickupsiteName: {
      label: "Expéditeur - Référence du chantier / lieu de collecte"
    },
    emitterPickupsiteAddress: {
      label: "Expéditeur - Libellé adresse du chantier / lieu de collecte"
    },
    emitterPickupsitePostalCode: {
      label: "Expéditeur - Code postal du chantier / lieu de collecte"
    },
    emitterPickupsiteCity: {
      label: "Expéditeur - Commune du chantier / lieu de collecte"
    },
    emitterPickupsiteCountry: {
      label: "Expéditeur - Code pays du chantier / lieu de collecte"
    },
    emitterCompanyMail: { label: "Expéditeur - Contact" },
    workerCompanyName: { label: "Entreprise de travaux - Raison sociale" },
    workerCompanySiret: { label: "Entreprise de travaux - SIRET" },
    workerCompanyAddress: { label: "Entreprise de travaux - Libellé adresse" },
    workerCompanyPostalCode: { label: "Entreprise de travaux - Code postal" },
    workerCompanyCity: { label: "Entreprise de travaux - Commune" },
    workerCompanyCountry: { label: "Entreprise de travaux - Pays" },
    parcelCities: { label: "Parcelle(s) - Commune(s)", format: formatArray },
    parcelInseeCodes: {
      label: "Parcelle(s) - Code(s) postal(aux) ou INSEE",
      format: formatArray
    },
    parcelNumbers: {
      label: "Parcelle(s) - Numéro(s)",
      format: formatArrayWithMissingElements
    },
    parcelCoordinates: {
      label: "Parcelle(s) - Coordonnées",
      format: formatArrayWithMissingElements
    },
    sisIdentifiers: {
      label: "Identifiant SIS du terrain",
      format: formatArrayWithMissingElements
    },
    ecoOrganismeSiret: { label: "Éco-organisme - SIRET" },
    ecoOrganismeName: { label: "Éco-organisme - Raison sociale" },
    brokerCompanySiret: { label: "Courtier - SIRET" },
    brokerCompanyName: { label: "Courtier - Raison sociale" },
    brokerRecepisseNumber: { label: "Courtier - N° de récépissé" },
    brokerCompanyMail: { label: "Courtier - Contact" },
    traderCompanySiret: { label: "Négociant - SIRET" },
    traderCompanyName: { label: "Négociant - Raison sociale" },
    traderRecepisseNumber: { label: "Négociant - Récépissé" },
    traderCompanyMail: { label: "Négociant - Contact" },
    isDirectSupply: {
      label: "Transport direct (pipeline, convoyeur)",
      format: formatBoolean
    },
    transporter1TransportMode: {
      label: "Transporteur - Mode de transport",
      format: formatTransportMode
    },
    transporter1CompanySiret: {
      label: "Transporteur - SIRET ou n° de TVA intracommunautaire"
    },
    transporter1CompanyName: { label: "Transporteur - Raison sociale" },
    transporter1CompanyGivenName: { label: "Transporteur - Nom usuel" },
    transporter1CompanyAddress: { label: "Transporteur - Libellé adresse" },
    transporter1CompanyPostalCode: { label: "Transporteur - Code postal" },
    transporter1CompanyCity: { label: "Transporteur - Commune" },
    transporter1CompanyCountry: { label: "Transporteur - Code Pays" },
    transporter1CompanyMail: { label: "Transporteur - Contact" },
    transporter1RecepisseIsExempted: {
      label: "Transporteur - Exemption de récépissé",
      format: formatBoolean
    },
    transporter1RecepisseNumber: { label: "Transporteur - N° de récépissé" },
    wasteAdr: { label: "Mention ADR" },
    nonRoadRegulationMention: { label: "Mention RID, ADNR, IMDG" },
    destinationCap: { label: "CAP" },
    wasteDap: { label: "DAP" },
    destinationCompanySiret: { label: "Destination - N° d'identification" },
    destinationCompanyName: { label: "Destination - Raison sociale" },
    destinationCompanyGivenName: { label: "Destination - Nom usuel" },
    destinationCompanyAddress: { label: "Destination - Libellé adresse" },
    destinationCompanyPostalCode: { label: "Destination - Code postal" },
    destinationCompanyCity: { label: "Destination - Commune" },
    destinationCompanyMail: { label: "Destination - Contact" },
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
      format: formatEstimateBoolean
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
      label: "Code de traitement réalisé",
      format: formatOperationCode
    },
    destinationOperationMode: { label: "Mode de traitement" },
    destinationHasCiterneBeenWashedOut: {
      label: "Rinçage citerne",
      format: formatHasCiterneBeenWashedOut
    },
    destinationOperationNoTraceability: {
      label: "Rupture de traçabilité autorisée",
      format: formatBoolean
    },
    declarationNumber: { label: "Numéro de déclaration GISTRID" },
    notificationNumber: { label: "Numéro de notification GISTRID" },
    movementNumber: { label: "N° de mouvement" },
    nextOperationCode: {
      label: "Code de traitement ultérieur prévu",
      format: formatOperationCode
    },
    isUpcycled: { label: "Terres valorisées", format: formatBoolean },
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
    transporter2TransportMode: {
      label: "Transporteur n°2 - Mode de transport",
      format: formatTransportMode
    },
    transporter2CompanySiret: {
      label: "Transporteur n°2 - SIRET ou n° de TVA intracommunautaire"
    },
    transporter2CompanyName: { label: "Transporteur n°2 - Raison sociale" },
    transporter2CompanyGivenName: { label: "Transporteur n°2 - Nom usuel" },
    transporter2CompanyAddress: { label: "Transporteur n°2 - Libellé adresse" },
    transporter2CompanyPostalCode: { label: "Transporteur n°2 - Code postal" },
    transporter2CompanyCity: { label: "Transporteur n°2 - Commune" },
    transporter2CompanyCountry: { label: "Transporteur n°2 - Code pays" },
    transporter2CompanyMail: { label: "Transporteur n°2 - Contact" },
    transporter2RecepisseIsExempted: {
      label: "Transporteur n°2 - Exemption de récépissé",
      format: formatBoolean
    },
    transporter2RecepisseNumber: {
      label: "Transporteur n°2 - N° de récépissé"
    },
    transporter3TransportMode: {
      label: "Transporteur n°3 - Mode de transport",
      format: formatTransportMode
    },
    transporter3CompanySiret: {
      label: "Transporteur n°3 - SIRET ou n° de TVA intracommunautaire"
    },
    transporter3CompanyName: { label: "Transporteur n°3 - Raison sociale" },
    transporter3CompanyGivenName: { label: "Transporteur n°3 - Nom usuel" },
    transporter3CompanyAddress: { label: "Transporteur n°3 - Libellé adresse" },
    transporter3CompanyPostalCode: { label: "Transporteur n°3 - Code postal" },
    transporter3CompanyCity: { label: "Transporteur n°3 - Commune" },
    transporter3CompanyCountry: { label: "Transporteur n°3 - Code pays" },
    transporter3CompanyMail: { label: "Transporteur n°3 - Contact" },
    transporter3RecepisseIsExempted: {
      label: "Transporteur n°3 - Exemption de récépissé",
      format: formatBoolean
    },
    transporter3RecepisseNumber: {
      label: "Transporteur n°3 - N° de récépissé"
    },
    transporter4TransportMode: {
      label: "Transporteur n°4 - Mode de transport",
      format: formatTransportMode
    },
    transporter4CompanySiret: {
      label: "Transporteur n°4 - SIRET ou n° de TVA intracommunautaire"
    },
    transporter4CompanyName: { label: "Transporteur n°4 - Raison sociale" },
    transporter4CompanyGivenName: { label: "Transporteur n°4 - Nom usuel" },
    transporter4CompanyAddress: { label: "Transporteur n°4 - Libellé adresse" },
    transporter4CompanyPostalCode: { label: "Transporteur n°4 - Code postal" },
    transporter4CompanyCity: { label: "Transporteur n°4 - Commune" },
    transporter4CompanyCountry: { label: "Transporteur n°4 - Code pays" },
    transporter4CompanyMail: { label: "Transporteur n°4 - Contact" },
    transporter4RecepisseIsExempted: {
      label: "Transporteur n°4 - Exemption de récépissé",
      format: formatBoolean
    },
    transporter4RecepisseNumber: {
      label: "Transporteur n°4 - N° de récépissé"
    },
    transporter5TransportMode: {
      label: "Transporteur n°5 - Mode de transport",
      format: formatTransportMode
    },
    transporter5CompanySiret: {
      label: "Transporteur n°5 - SIRET ou n° de TVA intracommunautaire"
    },
    transporter5CompanyName: { label: "Transporteur n°5 - Raison sociale" },
    transporter5CompanyGivenName: { label: "Transporteur n°5 - Nom usuel" },
    transporter5CompanyAddress: { label: "Transporteur n°5 - Libellé adresse" },
    transporter5CompanyPostalCode: { label: "Transporteur n°5 - Code postal" },
    transporter5CompanyCity: { label: "Transporteur n°5 - Commune" },
    transporter5CompanyCountry: { label: "Transporteur n°5 - Pays" },
    transporter5CompanyMail: { label: "Transporteur n°5 - Contact" },
    transporter5RecepisseIsExempted: {
      label: "Transporteur n°5 - Exemption de récépissé",
      format: formatBoolean
    },
    transporter5RecepisseNumber: { label: "Transporteur n°5 - N° de récépissé" }
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
