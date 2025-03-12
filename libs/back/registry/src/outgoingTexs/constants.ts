import { ParsedZodInputOutgoingTexsItem } from "./validation/schema";

export const OUTGOING_TEXS_HEADERS: {
  [key in keyof ParsedZodInputOutgoingTexsItem]: string;
} = {
  reason: "Motif",
  publicId: "Identifiant unique",
  reportAsCompanySiret: "SIRET du déclarant",
  reportForCompanySiret: "SIRET de l'expéditeur ou du détenteur",
  reportForPickupSiteName:
    "Référence du chantier ou du lieu de collecte de l'expéditeur ou du détenteur",
  reportForPickupSiteAddress:
    "Libellé de l'adresse du chantier ou du lieu de collecte de l'expéditeur ou du détenteur",
  reportForPickupSitePostalCode:
    "Code postal du chantier ou du lieu de collecte de l'expéditeur ou du détenteur",
  reportForPickupSiteCity:
    "Commune du chantier ou du lieu de collecte de l'expéditeur ou du détenteur",
  reportForPickupSiteCountryCode:
    "Code pays du chantier ou du lieu de collecte de l'expéditeur ou du détenteur",
  wasteDescription:
    "Dénomination usuelle des terres excavées et sédiments ou des déchets",
  wasteCode: "Code déchet",
  wasteCodeBale: "Code déchet Bâle",
  wastePop: "POP",
  wasteIsDangerous: "Dangereux",
  wasteDap: "DAP",
  dispatchDate: "Date d'expédition",
  weightValue: "Poids en tonnes",
  weightIsEstimate: "Type de poids",
  volume: "Volume en M3",
  initialEmitterCompanyType: "Type de producteur initial",
  initialEmitterCompanyOrgId: "Numéro d'identification du producteur initial",
  initialEmitterCompanyName: "Raison sociale du producteur initial",
  initialEmitterCompanyAddress: "Libellé de l'adresse du producteur initial",
  initialEmitterCompanyPostalCode: "Code postal du producteur initial",
  initialEmitterCompanyCity: "Commune du producteur initial",
  initialEmitterCompanyCountryCode: "Code pays du producteur initial",
  initialEmitterMunicipalitiesInseeCodes: "Code(s) INSEE de(s) commune(s)",
  parcelInseeCodes: "Codes INSEE des parcelles",
  parcelNumbers: "Numéro(s) des parcelles",
  parcelCoordinates: "Coordonnées des parcelles",
  sisIdentifier: "Identifiant SIS du terrain",
  destinationCompanyType: "Type de destinataire",
  destinationCompanyOrgId: "Numéro d'identification du destinataire",
  destinationCompanyName: "Raison sociale du destinataire",
  destinationCompanyAddress: "Libellé de l'adresse du destinataire",
  destinationCompanyPostalCode: "Code postal du destinataire",
  destinationCompanyCity: "Commune du destinataire",
  destinationCompanyCountryCode: "Code pays du destinataire",
  destinationDropSiteAddress: "Libellé de l'adresse de dépôt du destinataire",
  destinationDropSitePostalCode:
    "Code postal de l'adresse de dépôt du destinataire",
  destinationDropSiteCity: "Commune de l'adresse de dépôt du destinataire",
  destinationDropSiteCountryCode:
    "Code pays de l'adresse de dépôt du destinataire",
  gistridNumber: "Numéro de notification ou de déclaration GISTRID",
  movementNumber: "Numéro de mouvement",
  operationCode: "Code de traitement prévu",
  operationMode: "Mode de traitement prévu",
  isUpcycled: "Terre valorisée",
  destinationParcelInseeCodes:
    "Codes INSEE des parcelles de destination si valorisation",
  destinationParcelNumbers:
    "Numéro(s) des parcelles de destination si valorisation",
  destinationParcelCoordinates:
    "Coordonnées des parcelles de destination si valorisation",
  ecoOrganismeSiret: "SIRET de l'éco-organisme",
  ecoOrganismeName: "Raison sociale de l'éco-organisme",
  brokerCompanySiret: "SIRET du courtier",
  brokerCompanyName: "Raison sociale du courtier",
  brokerRecepisseNumber: "Numéro de récépissé du courtier",
  traderCompanySiret: "SIRET du négociant",
  traderCompanyName: "Raison sociale du négociant ",
  traderRecepisseNumber: "Numéro de récépissé du négociant",
  isDirectSupply: "Approvisionnement direct",
  transporter1TransportMode: "Mode de transport du transporteur n°1",
  transporter1CompanyType: "Type de transporteur n°1",
  transporter1CompanyOrgId: "Numéro d'identification du transporteur n°1",
  transporter1CompanyName: "Raison sociale du transporteur n°1",
  transporter1CompanyAddress: "Libellé de l'adresse du transporteur n°1",
  transporter1CompanyPostalCode: "Code postal du transporteur n°1",
  transporter1CompanyCity: "Commune du transporteur n°1",
  transporter1CompanyCountryCode: "Code pays du transporteur n°1",
  transporter1RecepisseIsExempted: "Exemption de récépissé du transporteur n°1",
  transporter1RecepisseNumber: "Numéro de récépissé du transporteur n°1",
  transporter2TransportMode: "Mode de transport du transporteur n°2",
  transporter2CompanyType: "Type de transporteur n°2",
  transporter2CompanyOrgId: "Numéro d'identification du transporteur n°2",
  transporter2CompanyName: "Raison sociale du transporteur n°2",
  transporter2CompanyAddress: "Libellé de l'adresse du transporteur n°2",
  transporter2CompanyPostalCode: "Code postal du transporteur n°2",
  transporter2CompanyCity: "Commune du transporteur n°2",
  transporter2CompanyCountryCode: "Code pays du transporteur n°2",
  transporter2RecepisseIsExempted: "Exemption de récépissé du transporteur n°2",
  transporter2RecepisseNumber: "Numéro de récépissé du transporteur n°2",
  transporter3TransportMode: "Mode de transport du transporteur n°3",
  transporter3CompanyType: "Type de transporteur n°3",
  transporter3CompanyOrgId: "Numéro d'identification du transporteur n°3",
  transporter3CompanyName: "Raison sociale du transporteur n°3",
  transporter3CompanyAddress: "Libellé de l'adresse du transporteur n°3",
  transporter3CompanyPostalCode: "Code postal du transporteur n°3",
  transporter3CompanyCity: "Commune du transporteur n°3",
  transporter3CompanyCountryCode: "Code pays du transporteur n°3",
  transporter3RecepisseIsExempted: "Exemption de récépissé du transporteur n°3",
  transporter3RecepisseNumber: "Numéro de récépissé du transporteur n°3",
  transporter4TransportMode: "Mode de transport du transporteur n°4",
  transporter4CompanyType: "Type de transporteur n°4",
  transporter4CompanyOrgId: "Numéro d'identification du transporteur n°4",
  transporter4CompanyName: "Raison sociale du transporteur n°4",
  transporter4CompanyAddress: "Libellé de l'adresse du transporteur n°4",
  transporter4CompanyPostalCode: "Code postal du transporteur n°4",
  transporter4CompanyCity: "Commune du transporteur n°4",
  transporter4CompanyCountryCode: "Code pays du transporteur n°4",
  transporter4RecepisseIsExempted: "Exemption de récépissé du transporteur n°4",
  transporter4RecepisseNumber: "Numéro de récépissé du transporteur n°4",
  transporter5TransportMode: "Mode de transport du transporteur n°5",
  transporter5CompanyType: "Type de transporteur n°5",
  transporter5CompanyOrgId: "Numéro d'identification du transporteur n°5",
  transporter5CompanyName: "Raison sociale du transporteur n°5",
  transporter5CompanyAddress: "Libellé de l'adresse du transporteur n°5",
  transporter5CompanyPostalCode: "Code postal du transporteur n°5",
  transporter5CompanyCity: "Commune du transporteur n°5",
  transporter5CompanyCountryCode: "Code pays du transporteur n°5",
  transporter5RecepisseIsExempted: "Exemption de récépissé du transporteur n°5",
  transporter5RecepisseNumber: "Numéro de récépissé du transporteur n°5"
};
