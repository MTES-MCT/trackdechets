import {
  BsdDisplay,
  BsdStatusCode,
  WorkflowDisplayType,
} from "../../common/types/bsdTypes";
import { formatBsd } from "../../mapper/dashboard/bsdMapper";
import {
  Bsd,
  BsdasriType,
  BsdaType,
  BsdType,
  BsffType,
  Maybe,
} from "../../generated/graphql/types";

export const getBsdView = (bsd): BsdDisplay | null => {
  const bsdView = formatBsd(bsd);
  return bsdView;
};

export const getBsdStatusLabel = (
  status: string,
  isDraft: boolean,
  bsdType: BsdType
) => {
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
    case BsdStatusCode.INITIAL: // Bsvhu| Bsdasri | Bsff | Bsda
      if (
        isDraft ||
        (!isDraft &&
          (bsdType === BsdType.Bsdasri ||
            bsdType === BsdType.Bsda ||
            bsdType === BsdType.Bsvhu))
      ) {
        return "initial";
      } else if (!isDraft) {
        return "En attente de signature par l'émetteur";
      } else {
        return "initial";
      }
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

/* TODO à revoir avec harmonisation libéllés et status */
export const getCtaLabelFromStatus = (
  bsdType: BsdType,
  status: BsdStatusCode,
  isDraft: boolean | undefined,
  isWorkerDisabled: boolean | undefined,
  bsdWorkflowType: Maybe<BsdaType> | BsdasriType | BsffType | undefined
) => {
  switch (status) {
    case BsdStatusCode.DRAFT:
    case BsdStatusCode.INITIAL:
      if (bsdType === BsdType.Bsdd) {
        return "Valider";
      }
      if (
        isDraft &&
        (bsdType === BsdType.Bsda ||
          bsdType === BsdType.Bsff ||
          bsdType === BsdType.Bsdasri ||
          bsdType === BsdType.Bsvhu)
      ) {
        return "Publier";
      } else {
        if (bsdType === BsdType.Bsdasri) {
          return "Signature producteur";
        }
        if (bsdType === BsdType.Bsvhu) {
          return "Signer";
        }
        return "Signer en tant qu'émetteur";
      }
    case BsdStatusCode.SEALED:
      if (bsdType === BsdType.Bsdd) {
        return "Signer en tant qu'émetteur";
      }
      if (bsdType === BsdType.Bsda || bsdType === BsdType.Bsff) {
        return "Signature émetteur";
      }
      if (bsdType === BsdType.Bsvhu) {
        return "Signer";
      }
      break;

    case BsdStatusCode.SENT:
      if (bsdType === BsdType.Bsdd) {
        return "Valider la réception";
      }
      if (
        bsdType === BsdType.Bsdasri &&
        bsdWorkflowType === BsdasriType.Synthesis
      ) {
        // TODO à revérifier cas dasri sans synth(pas de bouton) et cas dasri avec synth (signature réception)
        return "Signature réception";
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
      if (!isWorkerDisabled) {
        return "Signer en tant qu'entreprise de travaux";
      }
      break;

    case BsdStatusCode.ACCEPTED:
      return "Valider le traitement";

    default:
      return "";
  }
};

export const validateBsd = (bsd: Bsd) => {
  /* TODO 

    - validation selon le type de bsd
    - query de validation
    - ...
*/
};

export const getWorkflowLabel = (
  bsdWorkflowType: Maybe<BsdaType> | BsdasriType | BsffType | undefined
): WorkflowDisplayType => {
  switch (bsdWorkflowType) {
    case BsdaType.Gathering:
      return WorkflowDisplayType.GRP;
    case BsdaType.Reshipment:
      return WorkflowDisplayType.TRANSIT;

    case BsdasriType.Grouping:
      return WorkflowDisplayType.GRP;
    case BsdasriType.Synthesis:
      return WorkflowDisplayType.SYNTH;

    case BsffType.Groupement:
      return WorkflowDisplayType.GRP;
    case BsffType.Reexpedition:
      return WorkflowDisplayType.TRANSIT;

    default:
      return WorkflowDisplayType.DEFAULT;
  }
};

export const hasBsdSuite = (bsdDisplay: BsdDisplay): boolean => {
  //TODO
  return false;
};
