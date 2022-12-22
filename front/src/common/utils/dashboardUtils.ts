import { BsdType } from "../../generated/graphql/types";
import { BsdStatusCode } from "../types/bsdTypes";

export const getBsdStatusLabel = (status: string) => {
  switch (status) {
    case BsdStatusCode.DRAFT:
      return "Brouillon"; // Bsdd
    case BsdStatusCode.SEALED:
      return "En attente de signature par l’émetteur"; // Bsdd
    case BsdStatusCode.SENT:
      return "EN ATTENTE DE RÉCEPTION"; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BsdStatusCode.RECEIVED:
      return "reçu, en attente d’acceptation ou de refus"; // Bsdd | Bsdasri | Bsff
    case BsdStatusCode.ACCEPTED:
      return "ACCEPTÉ, EN ATTENTE DE TRAITEMENT"; // bsdd | Bsff
    case BsdStatusCode.PROCESSED:
      return "Traité"; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BsdStatusCode.AWAITING_GROUP:
      return "EN ATTENTE DE REGROUPEMENT"; // Bsdd | Bsdasri;
    case BsdStatusCode.GROUPED:
      return "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT"; // Bsdd
    case BsdStatusCode.NO_TRACEABILITY:
      return "regroupé, avec autorisation de RUPTURE DE TRAÇABILITÉ"; // Bsdd
    case BsdStatusCode.REFUSED:
      return "REFUSÉ"; // Bsvhu| Bsdd | Bsdasri| Bsff | Bsda;
    case BsdStatusCode.TEMP_STORED:
      return "ARRIVÉ À L’ENTREPOSAGE PROVISOIRE, EN ATTENTE D’ACCEPTATION"; // Bsdd
    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      return "entreposé temporairement ou en reconditionnement"; // Bsdd;
    case BsdStatusCode.RESEALED:
      return "en attente de signature par l’installation d’entreposage provisoire"; // Bsdd
    case BsdStatusCode.RESENT:
      return "EN ATTENTE DE RÉCEPTION pour traitement"; // Bsdd;
    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return "signé par le producteur"; // Bsvhu| Bsdd | Bsdasri | Bsda
    case BsdStatusCode.INITIAL:
      return "initial"; // Bsvhu| Bsdasri | Bsff | Bsda
    case BsdStatusCode.SIGNED_BY_EMITTER:
      return "signé par l’émetteur"; // Bsff
    case BsdStatusCode.INTERMEDIATELY_PROCESSED:
      return "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT"; // Bsff
    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      return "Signé par l'installation d'entreposage provisoire"; // bsdd
    case BsdStatusCode.PARTIALLY_REFUSED:
      return "Partiellement refusé"; // Bsff
    case BsdStatusCode.FOLLOWED_WITH_PNTTD:
      return "Suivi via PNTTD"; // bsdd
    case BsdStatusCode.SIGNED_BY_WORKER:
      return "Signé par l'entreprise de travaux"; // Bsda
    case BsdStatusCode.AWAITING_CHILD:
      return "En attente ou associé à un BSD suite"; // Bsda

    default:
      return "Error unknown status";
  }
};

/* TODO à re vérifier 

    bsd suite ?
*/
export const getCtaLabelFromStatus = (
  bsdType: BsdType,
  status: BsdStatusCode
) => {
  switch (status) {
    case BsdStatusCode.DRAFT:
    case BsdStatusCode.INITIAL:
      if (bsdType === BsdType.Bsdd) {
        return "Valider";
      }
      if (
        bsdType === BsdType.Bsda ||
        bsdType === BsdType.Bsff ||
        bsdType === BsdType.Bsdasri ||
        bsdType === BsdType.Bsvhu
      ) {
        return "Publier";
      }
      break;
    case BsdStatusCode.SEALED:
      if (bsdType === BsdType.Bsdd) {
        return "Signer en tant qu'émetteur";
      }
      if (bsdType === BsdType.Bsda || bsdType === BsdType.Bsff) {
        return "Signature émetteur";
      }
      if (bsdType === BsdType.Bsdasri) {
        return "Signature producteur";
      }
      if (bsdType === BsdType.Bsvhu) {
        return "Signer";
      }
      break;

    case BsdStatusCode.SENT:
      if (bsdType === BsdType.Bsdd || bsdType === BsdType.Bsdasri) {
        return "Signature transporteur";
      }

      if (
        bsdType === BsdType.Bsff ||
        bsdType === BsdType.Bsvhu ||
        bsdType === BsdType.Bsda
      ) {
        return "Signer l'enlèvement";
      }
      break;

    case BsdStatusCode.RESEALED:
    case BsdStatusCode.TEMP_STORED:
      if (bsdType === BsdType.Bsdd) {
        return "Signer en tant qu'entreposage provisoire";
      }
      break;

    case BsdStatusCode.RECEIVED:
    case BsdStatusCode.AWAITING_CHILD:
      if (bsdType === BsdType.Bsdd) {
        return "Valider l'acceptation";
      }
      if (bsdType === BsdType.Bsda || bsdType === BsdType.Bsvhu) {
        return "Signer le traitement";
      }
      if (bsdType === BsdType.Bsff || bsdType === BsdType.Bsdasri) {
        return "Signer la réception";
      }
      break;

    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return "Signer en tant qu'entreprise de travaux";

    case BsdStatusCode.ACCEPTED:
      return "Valider le traitement";

    default:
      return "";
  }
};
