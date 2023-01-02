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

const hasAllSiretActors = (bsd: BsdDisplay, siret: string): boolean => {
  return [
    bsd.emitter?.company?.siret,
    bsd.ecoOrganisme?.siret,
    bsd.transporter?.company?.siret,
  ].includes(siret);
};
const hasEmmiterAndEcoOrganismeSiret = (
  bsd: BsdDisplay,
  siret: string
): boolean => {
  return [bsd.emitter?.company?.siret, bsd.ecoOrganisme?.siret].includes(siret);
};

const isSameSiretEmmiter = (currentSiret: string, bsd: BsdDisplay): boolean =>
  currentSiret === bsd.emitter?.company?.siret;

const isSameSiretDestination = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean => currentSiret === bsd.destination?.company?.siret;

const isSameSiretTransporter = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean => currentSiret === bsd.transporter?.company?.siret;

const isSynthesis = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdasriType.Synthesis;

const isGrouping = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdasriType.Grouping;

const isGathering = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdaType.Gathering;

const isReshipment = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdaType.Reshipment;

const isCollection_2710 = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdaType.Collection_2710;

const hasTemporaryStorage = (currentSiret: string, bsd: BsdDisplay): boolean =>
  [
    bsd.destination?.company?.siret,
    bsd.temporaryStorageDetail?.transporter?.company?.siret,
  ].includes(currentSiret);

const isSameSiretTemporaryStorageTransporter = (
  currentSiret: string,
  bsd: BsdDisplay
) => currentSiret === bsd.temporaryStorageDetail?.transporter?.company?.siret;

const isSameSiretTemporaryStorageDestination = (
  currentSiret: string,
  bsd: BsdDisplay
) => currentSiret === bsd.temporaryStorageDetail?.destination?.company?.siret;

const isBsvhu = (type: BsdType): boolean => type === BsdType.Bsvhu;
const isBsda = (type: BsdType): boolean => type === BsdType.Bsda;
const isBsff = (type: BsdType): boolean => type === BsdType.Bsff;
const isBsdd = (type: BsdType): boolean => type === BsdType.Bsdd;
const isBsdasri = (type: BsdType): boolean => type === BsdType.Bsdasri;

/* TODO à revoir avec harmonisation libéllés et status */
export const getCtaLabelFromStatus = (
  bsd: BsdDisplay,
  currentSiret: string
) => {
  switch (bsd.status) {
    case BsdStatusCode.DRAFT:
    case BsdStatusCode.INITIAL:
      if (isBsdd(bsd.type)) {
        return "Valider";
      }
      if (
        bsd.isDraft &&
        (isBsda(bsd.type) ||
          isBsff(bsd.type) ||
          isBsdasri(bsd.type) ||
          isBsvhu(bsd.type))
      ) {
        return "Publier";

        // non DRAFT
      } else if (!bsd.isDraft) {
        if (isBsvhu(bsd.type) && isSameSiretEmmiter(currentSiret, bsd)) {
          return "Signer";
        }
        if (
          (isBsff(bsd.type) && isSameSiretEmmiter(currentSiret, bsd)) ||
          (isBsda(bsd.type) &&
            isCollection_2710(bsd.bsdWorkflowType?.toString()) &&
            isSameSiretDestination(currentSiret, bsd)) ||
          (isBsda(bsd.type) &&
            // @ts-ignore
            bsd.emitter?.isPrivateIndividual &&
            bsd.worker?.isDisabled &&
            isSameSiretTransporter(currentSiret, bsd))
        ) {
          return "Signer";
        }
        if (isBsdasri(bsd.type)) {
          const isEcoOrganisme = currentSiret === bsd.ecoOrganisme?.siret;
          const isHolder =
            isSameSiretEmmiter(currentSiret, bsd) || isEcoOrganisme;
          const isTransporter = isSameSiretTransporter(currentSiret, bsd);

          // TODO only on act list tab
          if (isHolder && !isSynthesis(bsd.bsdWorkflowType?.toString())) {
            if (isEcoOrganisme) {
              return "Signature Éco-organisme";
            }
            return "Signature producteur";
          }

          // TODO only to collect tab
          if (isTransporter && !isSynthesis(bsd.bsdWorkflowType?.toString())) {
            return "Signer en tant qu'émetteur";
          }
          return "";
        }

        if (isSameSiretEmmiter(currentSiret, bsd)) {
          return "Signer en tant qu'émetteur";
        }
      }
      break;
    case BsdStatusCode.SEALED:
      if (isBsdd(bsd.type) && hasAllSiretActors(bsd, currentSiret)) {
        if (hasEmmiterAndEcoOrganismeSiret(bsd, currentSiret)) {
          return "Signer en tant qu'émetteur";
        }
      }
      if (isBsda(bsd.type) || isBsff(bsd.type)) {
        return "Signature émetteur";
      }
      if (isBsvhu(bsd.type)) {
        return "Signer";
      }
      break;

    case BsdStatusCode.SENT:
      if (isBsdd(bsd.type)) {
        if (isSameSiretDestination(currentSiret, bsd) && bsd.isTempStorage) {
          return "Valider l'entreposage provisoire";
        }
        return "Valider la réception";
      }
      if (
        (isBsdasri(bsd.type) &&
          currentSiret ===
            bsd.destination?.company
              ?.siret) /* TODO && only isAct tab for dasri */ ||
        (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd))
      ) {
        return "Signature réception";
      }

      if (
        isSameSiretDestination(currentSiret, bsd) &&
        (isBsvhu(bsd.type) || isBsda(bsd.type))
      ) {
        return "Signer l'enlèvement";
      }
      break;

    case BsdStatusCode.RESENT:
      if (
        isBsdd(bsd.type) &&
        isSameSiretTemporaryStorageDestination(currentSiret, bsd)
      ) {
        return "Valider la réception";
      }
      break;

    case BsdStatusCode.RESEALED:
      if (isBsdd(bsd.type) && hasTemporaryStorage(currentSiret, bsd)) {
        return "Signer en tant qu'entreposage provisoire";
      }
      break;

    case BsdStatusCode.TEMP_STORED:
      if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
        return "Valider l'acceptation de l'entreposage provisoire";
      }
      break;

    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
        return "Valider le traitement";
      }
      break;

    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      if (
        isBsdd(bsd.type) &&
        isSameSiretTemporaryStorageTransporter(currentSiret, bsd)
      ) {
        return "Signature transporteur";
      }
      break;

    case BsdStatusCode.RECEIVED:
    case BsdStatusCode.PARTIALLY_REFUSED:
    case BsdStatusCode.AWAITING_CHILD:
      if (
        (isBsdd(bsd.type) &&
          bsd.isTempStorage &&
          isSameSiretTemporaryStorageDestination(currentSiret, bsd)) ||
        (!bsd.isTempStorage && isSameSiretDestination(currentSiret, bsd))
      ) {
        return "Valider l'acceptation";
      }
      if (isBsda(bsd.type) || isBsvhu(bsd.type)) {
        return "Signer le traitement";
      }
      if (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
        // TODO bsff packagings
        return "Signature acceptation et traitement par contenant";
      }

      if (
        isBsdasri(bsd.type) &&
        isSameSiretDestination(
          currentSiret,
          bsd
        ) /* && TODO only for act list */
      ) {
        return "Signer la réception";
      }
      break;

    case BsdStatusCode.SIGNED_BY_PRODUCER:
      if (
        (isBsdd(bsd.type) && isSameSiretTransporter(currentSiret, bsd)) ||
        (isBsdasri(bsd.type) &&
          isSameSiretTransporter(currentSiret, bsd) &&
          !isSynthesis(bsd.bsdWorkflowType?.toString()))
      ) {
        return "Signature transporteur";
      }

      if (
        (isBsda(bsd.type) &&
          (isGathering(bsd.bsdWorkflowType?.toString()) ||
            isReshipment(bsd.bsdWorkflowType?.toString()) ||
            bsd.worker?.isDisabled)) ||
        (isBsvhu(bsd.type) && isSameSiretTransporter(currentSiret, bsd))
      ) {
        return "Signer l'enlèvement";
      }

      if (currentSiret === bsd.worker?.company?.siret) {
        return "Signer en tant qu'entreprise de travaux";
      }
      break;

    case BsdStatusCode.SIGNED_BY_EMITTER:
    case BsdStatusCode.SIGNED_BY_WORKER:
      if (isSameSiretTransporter(currentSiret, bsd)) {
        return "Signer l'enlèvement";
      }
      break;

    case BsdStatusCode.ACCEPTED:
      return "Valider le traitement";

    default:
      return "";
  }
};

export const canPublishBsd = (
  bsd: BsdDisplay,
  currentSiret: string
): boolean => {
  // TODO vérif
  if (isBsdasri(bsd.type) && bsd.isDraft) {
    if (isGrouping(bsd.bsdWorkflowType?.toString()) && !bsd.grouping?.length) {
      return false;
    }
    if (
      isSynthesis(bsd.bsdWorkflowType?.toString()) &&
      !bsd.synthesizing?.length
    ) {
      return false;
    }
    return true;
  }

  if (isBsff(bsd.type)) {
    const emitterSiret = bsd.emitter?.company?.siret;
    const transporterSiret = bsd.transporter?.company?.siret;
    const destinationSiret = bsd.destination?.company?.siret;

    if (
      bsd.isDraft &&
      [emitterSiret, transporterSiret, destinationSiret].includes(currentSiret)
    ) {
      return true;
    }
  }

  return true;
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

export const hasBsdSuite = (bsd: BsdDisplay, currentSiret): boolean => {
  return (
    (bsd.status === BsdStatusCode.TEMP_STORER_ACCEPTED ||
      (bsd.status === BsdStatusCode.ACCEPTED && !bsd.isTempStorage)) &&
    isSameSiretDestination(currentSiret, bsd)
  );
};
