import { ParsedZodInputTransportedItem } from "./validation/schema";

export const TRANSPORTED_HEADERS: {
  [key in keyof ParsedZodInputTransportedItem]: string;
} = {
  reason: "Motif",
  publicId: "Identifiant unique",
  reportAsCompanySiret: "SIRET du déclarant",
  reportForCompanySiret: "SIRET du transporteur",
  reportForTransportMode: "Mode de transport du transporteur",
  reportForTransportIsWaste: "Transport de déchet",
  reportForRecepisseIsExempted: "Exemption de récépissé du transporteur",
  reportForRecepisseNumber: "Numéro de récépissé du transporteur",
  reportForTransportAdr: "Mention ADR",
  reportForTransportOtherTmdCode: "Mention RID, ADNR, IMDG",
  reportForTransportPlates: "Numéro(s) d'immatriculation(s)",
  wasteDescription:
    "Dénomination usuelle des terres et sédiments ou des déchets",
  wasteCode: "Code déchet",
  wasteCodeBale: "Code déchet Bâle",
  wastePop: "POP",
  wasteIsDangerous: "Dangereux",
  collectionDate: "Date d'enlèvement",
  unloadingDate: "Date de déchargement",
  weightValue: "Poids en tonnes",
  weightIsEstimate: "Type de poids",
  volume: "Volume en M3",
  emitterCompanyType: "Type d'expéditeur ou de remettant",
  emitterCompanyOrgId:
    "Numéro d'identification de l'expéditeur ou du remettant",
  emitterCompanyName: "Raison sociale de l'expéditeur ou du remettant",
  emitterCompanyAddress: "Libellé de l'adresse de l'expéditeur ou du remettant",
  emitterCompanyPostalCode: "Code postal de l'expéditeur ou du remettant",
  emitterCompanyCity: "Commune de l'expéditeur ou du remettant",
  emitterCompanyCountryCode: "Code pays de l'expéditeur ou du remettant",
  emitterPickupSiteName:
    "Référence du chantier ou du lieu de collecte de l'expéditeur ou du remettant",
  emitterPickupSiteAddress:
    "Libellé de l'adresse du chantier ou du lieu de collecte de l'expéditeur ou du remettant",
  emitterPickupSitePostalCode:
    "Code postal du chantier ou du lieu de collecte de l'expéditeur ou du remettant",
  emitterPickupSiteCity:
    "Commune du chantier ou du lieu de collecte de l'expéditeur ou du remettant",
  emitterPickupSiteCountryCode:
    "Code pays du chantier ou du lieu de collecte de l'expéditeur ou du remettant",
  destinationCompanyType: "Type de destinataire",
  destinationCompanyOrgId: "Numéro d'identification du destinataire",
  destinationCompanyName: "Raison sociale du destinataire",
  destinationCompanyAddress: "Libellé de l'adresse du destinataire",
  destinationCompanyPostalCode: "Code postal du destinataire",
  destinationCompanyCity: "Commune du destinataire",
  destinationCompanyCountryCode: "Code pays du destinataire",
  destinationDropSiteAddress: "Libellé de l'adresse de dépôt du destinataire",
  destinationDropSitePostalCode: "Code postal du lieu de dépôt du destinataire",
  destinationDropSiteCity: "Commune du lieu de dépôt du destinataire",
  destinationDropSiteCountryCode: "Code pays du lieu de dépôt du destinataire",
  gistridNumber: "Numéro de notification ou de déclaration GISTRID",
  movementNumber: "Numéro de mouvement",
  ecoOrganismeSiret: "SIRET de l'éco-organisme",
  ecoOrganismeName: "Raison sociale de l'éco-organisme",
  brokerCompanySiret: "SIRET du courtier",
  brokerCompanyName: "Raison sociale du courtier",
  brokerRecepisseNumber: "Numéro de récépissé du courtier",
  traderCompanySiret: "SIRET du négociant",
  traderCompanyName: "Raison sociale du négociant",
  traderRecepisseNumber: "Numéro de récépissé du négociant"
};
