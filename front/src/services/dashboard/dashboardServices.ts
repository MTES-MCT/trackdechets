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
import {
  ACCEPTE,
  ANNEXE_BORDEREAU_REGROUPEMENT,
  ARRIVE_ENTREPOS_PROVISOIRE,
  BROUILLON,
  ENTREPOS_TEMPORAIREMENT,
  EN_ATTENTE_OU_BSD_SUITE,
  EN_ATTENTE_RECEPTION,
  EN_ATTENTE_REGROUPEMENT,
  EN_ATTENTE_SIGNATURE,
  EN_ATTENTE_SIGNATURE_EMETTEUR,
  EN_ATTENTE_SIGNATURE_ENTREPOS_PROVISOIRE,
  INITIAL,
  PARTIELLEMENT_REFUSE,
  PUBLIER,
  RECU,
  REFUSE,
  REGROUPE_AVEC_RUPTURE_TRACABILITE,
  SIGNATURE_ACCEPTATION_CONTENANT,
  SIGNATURE_ECO_ORG,
  SIGNATURE_EMETTEUR,
  SIGNATURE_PRODUCTEUR,
  SIGNATURE_TRANSPORTEUR,
  SIGNER,
  SIGNER_ENLEVEMENT,
  SIGNER_ENTREPOSAGE_PROVISOIRE,
  SIGNER_EN_TANT_QUE_TRAVAUX,
  SIGNER_PAR_ENTREPOS_PROVISOIRE,
  SIGNER_PAR_ENTREPRISE_TRAVAUX,
  SIGNER_RECEPTION,
  SIGNER_TRAITEMENT,
  SIGNE_PAR_EMETTEUR,
  SIGNE_PAR_PRODUCTEUR,
  SUIVI_PAR_PNTTD,
  TRAITE,
  VALIDER,
  VALIDER_ACCEPTATION,
  VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE,
  VALIDER_ENTREPOSAGE_PROVISOIRE,
  VALIDER_RECEPTION,
  VALIDER_TRAITEMENT,
} from "../../assets/wordings/dashboard/wordingsDashboard";

export const getBsdView = (bsd): BsdDisplay | null => {
  const bsdView = formatBsd(bsd);
  return bsdView;
};

// TODO a revoir avec harmonisation des codes status
export const getBsdStatusLabel = (
  status: string,
  isDraft: boolean | undefined,
  bsdType: BsdType | undefined
) => {
  switch (status) {
    case BsdStatusCode.DRAFT:
      return BROUILLON; // Bsdd
    case BsdStatusCode.SEALED:
      return EN_ATTENTE_SIGNATURE_EMETTEUR; // Bsdd
    case BsdStatusCode.SENT:
      return EN_ATTENTE_RECEPTION; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BsdStatusCode.RECEIVED:
      return RECU; // Bsdd | Bsdasri | Bsff
    case BsdStatusCode.ACCEPTED:
      return ACCEPTE; // bsdd | Bsff
    case BsdStatusCode.PROCESSED:
      return TRAITE; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BsdStatusCode.AWAITING_GROUP:
      return EN_ATTENTE_REGROUPEMENT; // Bsdd | Bsdasri;
    case BsdStatusCode.GROUPED:
      return ANNEXE_BORDEREAU_REGROUPEMENT; // Bsdd
    case BsdStatusCode.NO_TRACEABILITY:
      return REGROUPE_AVEC_RUPTURE_TRACABILITE; // Bsdd
    case BsdStatusCode.REFUSED:
      return REFUSE; // Bsvhu| Bsdd | Bsdasri| Bsff | Bsda;
    case BsdStatusCode.TEMP_STORED:
      return ARRIVE_ENTREPOS_PROVISOIRE; // Bsdd
    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      return ENTREPOS_TEMPORAIREMENT; // Bsdd;
    case BsdStatusCode.RESEALED:
      return EN_ATTENTE_SIGNATURE_ENTREPOS_PROVISOIRE; // Bsdd
    case BsdStatusCode.RESENT:
      return EN_ATTENTE_SIGNATURE; // Bsdd;
    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return SIGNE_PAR_PRODUCTEUR; // Bsvhu| Bsdd | Bsdasri | Bsda
    case BsdStatusCode.INITIAL: // Bsvhu| Bsdasri | Bsff | Bsda
      if (isDraft) {
        return BROUILLON;
      }
      if (
        !isDraft &&
        (bsdType === BsdType.Bsdasri ||
          bsdType === BsdType.Bsda ||
          bsdType === BsdType.Bsvhu)
      ) {
        return INITIAL;
      } else if (!isDraft) {
        return EN_ATTENTE_SIGNATURE_EMETTEUR;
      }
      break;
    case BsdStatusCode.SIGNED_BY_EMITTER:
      return SIGNE_PAR_EMETTEUR; // Bsff
    case BsdStatusCode.INTERMEDIATELY_PROCESSED:
      return ANNEXE_BORDEREAU_REGROUPEMENT; // Bsff
    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      return SIGNER_PAR_ENTREPOS_PROVISOIRE; // bsdd
    case BsdStatusCode.PARTIALLY_REFUSED:
      return PARTIELLEMENT_REFUSE; // Bsff
    case BsdStatusCode.FOLLOWED_WITH_PNTTD:
      return SUIVI_PAR_PNTTD; // bsdd
    case BsdStatusCode.SIGNED_BY_WORKER:
      return SIGNER_PAR_ENTREPRISE_TRAVAUX; // Bsda
    case BsdStatusCode.AWAITING_CHILD:
      return EN_ATTENTE_OU_BSD_SUITE; // Bsda

    default:
      return "Error unknown status";
  }
};

const includesSiretActors = (bsd: BsdDisplay, siret: string): boolean => {
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

const getDraftBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsdd(bsd.type)) {
    return VALIDER;
  }
  if (
    bsd.isDraft &&
    (isBsda(bsd.type) ||
      isBsff(bsd.type) ||
      isBsdasri(bsd.type) ||
      isBsvhu(bsd.type))
  ) {
    return PUBLIER;

    // isDraft=false
  } else if (!bsd.isDraft) {
    if (isBsvhu(bsd.type) && isSameSiretEmmiter(currentSiret, bsd)) {
      return SIGNER;
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
      return SIGNER;
    }
    if (isBsdasri(bsd.type)) {
      const isEcoOrganisme = currentSiret === bsd.ecoOrganisme?.siret;
      const isHolder = isSameSiretEmmiter(currentSiret, bsd) || isEcoOrganisme;
      const isTransporter = isSameSiretTransporter(currentSiret, bsd);

      // TODO isActTab see /dashboard/components/BSDList/BSDasri/WorkflowAction/WorkflowAction.tsx
      if (isHolder && !isSynthesis(bsd.bsdWorkflowType?.toString())) {
        if (isEcoOrganisme) {
          return SIGNATURE_ECO_ORG;
        }
        return SIGNATURE_PRODUCTEUR;
      }

      // TODO isToCollectTab see /dashboard/components/BSDList/BSDasri/WorkflowAction/WorkflowAction.tsx
      if (isTransporter && !isSynthesis(bsd.bsdWorkflowType?.toString())) {
        return SIGNATURE_EMETTEUR;
      }
      return "";
    }

    if (isSameSiretEmmiter(currentSiret, bsd)) {
      return SIGNATURE_EMETTEUR;
    }
  }
  return "";
};

const getSealedBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsdd(bsd.type) && includesSiretActors(bsd, currentSiret)) {
    if (hasEmmiterAndEcoOrganismeSiret(bsd, currentSiret)) {
      return SIGNATURE_EMETTEUR;
    }
  }
  if (isBsda(bsd.type) || isBsff(bsd.type)) {
    return SIGNATURE_EMETTEUR;
  }
  if (isBsvhu(bsd.type)) {
    return SIGNER;
  }
  return "";
};

const getSentBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsdd(bsd.type)) {
    if (isSameSiretDestination(currentSiret, bsd) && bsd.isTempStorage) {
      return VALIDER_ENTREPOSAGE_PROVISOIRE;
    }
    return VALIDER_RECEPTION;
  }
  if (
    (isBsdasri(bsd.type) &&
      currentSiret ===
        bsd.destination?.company
          ?.siret) /* TODO && only isAct tab for dasri */ ||
    (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd))
  ) {
    return SIGNER_RECEPTION;
  }

  if (
    isSameSiretDestination(currentSiret, bsd) &&
    (isBsvhu(bsd.type) || isBsda(bsd.type))
  ) {
    return SIGNER_ENLEVEMENT;
  }
  return "";
};

const getReceivedBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (
    (isBsdd(bsd.type) &&
      bsd.isTempStorage &&
      isSameSiretTemporaryStorageDestination(currentSiret, bsd)) ||
    (!bsd.isTempStorage && isSameSiretDestination(currentSiret, bsd))
  ) {
    return VALIDER_ACCEPTATION;
  }
  if (isBsda(bsd.type) || isBsvhu(bsd.type)) {
    return SIGNER_TRAITEMENT;
  }
  if (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    // TODO bsff status received with packagings see dashboard/components/BSDList/BSFF/WorkflowAction/WorkflowAction.tsx
    return SIGNATURE_ACCEPTATION_CONTENANT;
  }

  if (
    isBsdasri(bsd.type) &&
    isSameSiretDestination(currentSiret, bsd) /* && TODO only for act list */
  ) {
    return SIGNER_RECEPTION;
  }
  return "";
};

const getSignByProducerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (
    (isBsdd(bsd.type) && isSameSiretTransporter(currentSiret, bsd)) ||
    (isBsdasri(bsd.type) &&
      isSameSiretTransporter(currentSiret, bsd) &&
      !isSynthesis(bsd.bsdWorkflowType?.toString()))
  ) {
    return SIGNATURE_TRANSPORTEUR;
  }

  if (
    (isBsda(bsd.type) &&
      (isGathering(bsd.bsdWorkflowType?.toString()) ||
        isReshipment(bsd.bsdWorkflowType?.toString()) ||
        bsd.worker?.isDisabled)) ||
    (isBsvhu(bsd.type) && isSameSiretTransporter(currentSiret, bsd))
  ) {
    return SIGNER_ENLEVEMENT;
  }

  if (currentSiret === bsd.worker?.company?.siret) {
    return SIGNER_EN_TANT_QUE_TRAVAUX;
  }
  return "";
};

const getAcceptedBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    // TODO bsff status accepted with packagings see dashboard/components/BSDList/BSFF/WorkflowAction/WorkflowAction.tsx
    return SIGNATURE_ACCEPTATION_CONTENANT;
  }
  if (
    isSameSiretDestination(currentSiret, bsd) ||
    isSameSiretTemporaryStorageDestination(currentSiret, bsd)
  ) {
    return VALIDER_TRAITEMENT;
  }
  return "";
};

/* TODO à revoir avec harmonisation libéllés et status */
export const getCtaLabelFromStatus = (
  bsd: BsdDisplay,
  currentSiret: string
) => {
  switch (bsd.status) {
    case BsdStatusCode.DRAFT:
    case BsdStatusCode.INITIAL:
      return getDraftBtnLabel(currentSiret, bsd);
    case BsdStatusCode.SEALED:
      return getSealedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.SENT:
      return getSentBtnLabel(currentSiret, bsd);

    case BsdStatusCode.RESENT:
      if (
        isBsdd(bsd.type) &&
        isSameSiretTemporaryStorageDestination(currentSiret, bsd)
      ) {
        return VALIDER_RECEPTION;
      }
      break;

    case BsdStatusCode.RESEALED:
      if (isBsdd(bsd.type) && hasTemporaryStorage(currentSiret, bsd)) {
        return SIGNER_ENTREPOSAGE_PROVISOIRE;
      }
      break;

    case BsdStatusCode.TEMP_STORED:
      if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
        return VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE;
      }
      break;

    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
        return VALIDER_TRAITEMENT;
      }
      break;

    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      if (
        isBsdd(bsd.type) &&
        isSameSiretTemporaryStorageTransporter(currentSiret, bsd)
      ) {
        return SIGNATURE_TRANSPORTEUR;
      }
      break;

    case BsdStatusCode.RECEIVED:
    case BsdStatusCode.PARTIALLY_REFUSED:
    case BsdStatusCode.AWAITING_CHILD:
      return getReceivedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return getSignByProducerBtnLabel(currentSiret, bsd);

    case BsdStatusCode.SIGNED_BY_EMITTER:
    case BsdStatusCode.SIGNED_BY_WORKER:
      if (isSameSiretTransporter(currentSiret, bsd)) {
        return SIGNER_ENLEVEMENT;
      }
      break;

    case BsdStatusCode.ACCEPTED:
      return getAcceptedBtnLabel(currentSiret, bsd);
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
