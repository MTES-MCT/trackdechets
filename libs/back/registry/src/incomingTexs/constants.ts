import { ParsedZodInputIncomingTexsItem } from "./validation/schema";

export const INCOMING_TEXS_HEADERS: {
  [key in keyof ParsedZodInputIncomingTexsItem]: string;
} = {
  reason: "Motif",
  customInfo: "Champ libre / Référence chantier",
  publicId: "Numéro unique",
  reportAsCompanySiret: "SIRET du déclarant",
  reportForCompanySiret: "SIRET du destinataire",
  wasteDescription: "Dénomination du déchet",
  wasteCode: "Code déchet",
  wasteCodeBale: "Code déchet Bâle",
  wastePop: "POP",
  wasteIsDangerous: "Dangereux",
  receptionDate: "Date de réception",
  wasteDap: "DAP",
  weightValue: "Poids en tonnes",
  weightIsEstimate: "Type de poids",
  volume: "Volume en M3",
  parcelInseeCodes: "Codes INSEE des parcelles",
  parcelNumbers: "Numéro(s) des parcelles",
  parcelCoordinates: "Coordonnées des parcelles",
  sisIdentifiers: "Identifiant SIS des terrains",
  initialEmitterCompanyType: "Type de producteur initial",
  initialEmitterCompanyOrgId: "Numéro d'identification du producteur initial",
  initialEmitterCompanyName: "Raison sociale du producteur initial",
  initialEmitterCompanyAddress: "Adresse du producteur initial",
  initialEmitterCompanyPostalCode: "Code postal du producteur initial",
  initialEmitterCompanyCity: "Commune du producteur initial",
  initialEmitterCompanyCountryCode: "Code pays du producteur initial",
  initialEmitterMunicipalitiesInseeCodes: "Code(s) INSEE de(s) commune(s)",
  initialEmitterMunicipalitiesNames: "Commune(s)",
  emitterCompanyType: "Type d'expéditeur ou détenteur",
  emitterCompanyOrgId: "Numéro d'identification de l'expéditeur ou détenteur",
  emitterCompanyName: "Raison sociale de l'expéditeur ou détenteur",
  emitterPickupSiteAddress:
    "Libellé de l'adresse de prise en charge de l'expéditeur ou détenteur",
  emitterPickupSitePostalCode:
    "Code postal de prise en charge de l'expéditeur ou détenteur",
  emitterPickupSiteCity:
    "Commune de prise en charge de l'expéditeur ou détenteur",
  emitterPickupSiteCountryCode:
    "Pays de prise en charge de l'expéditeur ou détenteur",
  emitterCompanyAddress: "Adresse de l'expéditeur ou détenteur",
  emitterCompanyPostalCode: "Code postal de l'expéditeur ou détenteur",
  emitterCompanyCity: "Commune de l'expéditeur ou détenteur",
  emitterCompanyCountryCode: "Pays de l'expéditeur ou détenteur",
  brokerCompanySiret: "SIRET du courtier",
  brokerCompanyName: "Raison sociale du courtier",
  brokerCompanyRecepisseNumber: "Numéro de récépissé du courtier",
  traderCompanySiret: "SIRET du négociant",
  traderCompanyName: "Raison sociale du négociant",
  traderCompanyRecepisseNumber: "Numéro de récépissé du négociant",
  operationCode: "Code d'opération réalisé",
  operationMode: "Mode d'opération réalisé",
  noTraceability: "Rupture de traçabilité autorisée",
  nextDestinationIsAbroad: "Destination ultérieure à l'étranger",
  declarationNumber: "Numéro de déclaration",
  notificationNumber: "Numéro de notification",
  movementNumber: "Numéro de mouvement",
  nextOperationCode: "Code d'opération ultérieure prévue",
  isUpcycled: "Terre valorisée",
  destinationParcelInseeCodes:
    "Codes INSEE des parcelles de destination si valorisation",
  destinationParcelNumbers:
    "Numéro(s) des parcelles de destination si valorisation",
  destinationParcelCoordinates:
    "Coordonnées des parcelles de destination si valorisation",
  transporter1TransportMode: "Mode de transport du transporteur n°1",
  transporter1CompanyType: "Type de transporteur n°1",
  transporter1CompanyOrgId: "Numéro d'identification du transporteur n°1",
  transporter1RecepisseNumber: "Numéro de récépissé du transporteur n°1",
  transporter1CompanyName: "Raison sociale du transporteur n°1",
  transporter1CompanyAddress: "Adresse du transporteur n°1",
  transporter1CompanyPostalCode: "Code postal du transporteur n°1",
  transporter1CompanyCity: "Commune du transporteur n°1",
  transporter1CompanyCountryCode: "Code pays du transporteur n°1",
  transporter2TransportMode: "Mode de transport du transporteur n°2",
  transporter2CompanyType: "Type de transporteur n°2",
  transporter2CompanyOrgId: "Numéro d'identification du transporteur n°2",
  transporter2RecepisseNumber: "Numéro de récépissé du transporteur n°2",
  transporter2CompanyName: "Raison sociale du transporteur n°2",
  transporter2CompanyAddress: "Adresse du transporteur n°2",
  transporter2CompanyPostalCode: "Code postal du transporteur n°2",
  transporter2CompanyCity: "Commune du transporteur n°2",
  transporter2CompanyCountryCode: "Code pays du transporteur n°2",
  transporter3TransportMode: "Mode de transport du transporteur n°3",
  transporter3CompanyType: "Type de transporteur n°3",
  transporter3CompanyOrgId: "Numéro d'identification du transporteur n°3",
  transporter3RecepisseNumber: "Numéro de récépissé du transporteur n°3",
  transporter3CompanyName: "Raison sociale du transporteur n°3",
  transporter3CompanyAddress: "Adresse du transporteur n°3",
  transporter3CompanyPostalCode: "Code postal du transporteur n°3",
  transporter3CompanyCity: "Commune du transporteur n°3",
  transporter3CompanyCountryCode: "Code pays du transporteur n°3",
  transporter4TransportMode: "Mode de transport du transporteur n°4",
  transporter4CompanyType: "Type de transporteur n°4",
  transporter4CompanyOrgId: "Numéro d'identification du transporteur n°4",
  transporter4RecepisseNumber: "Numéro de récépissé du transporteur n°4",
  transporter4CompanyName: "Raison sociale du transporteur n°4",
  transporter4CompanyAddress: "Adresse du transporteur n°4",
  transporter4CompanyPostalCode: "Code postal du transporteur n°4",
  transporter4CompanyCity: "Commune du transporteur n°4",
  transporter4CompanyCountryCode: "Code pays du transporteur n°4",
  transporter5TransportMode: "Mode de transport du transporteur n°5",
  transporter5CompanyType: "Type de transporteur n°5",
  transporter5CompanyOrgId: "Numéro d'identification du transporteur n°5",
  transporter5RecepisseNumber: "Numéro de récépissé du transporteur n°5",
  transporter5CompanyName: "Raison sociale du transporteur n°5",
  transporter5CompanyAddress: "Adresse du transporteur n°5",
  transporter5CompanyPostalCode: "Code postal du transporteur n°5",
  transporter5CompanyCity: "Commune du transporteur n°5",
  transporter5CompanyCountryCode: "Code pays du transporteur n°5"
};
