import {
  BsdDisplay,
  BsdStatusCode,
  BsdWithReview,
  ReviewStatusLabel,
  WorkflowDisplayType,
} from "../common/types/bsdTypes";
import { formatBsd } from "./bsdMapper";
import {
  BsdasriType,
  BsdaType,
  BsdType,
  BsffType,
  EmitterType,
  Maybe,
} from "../../generated/graphql/types";
import {
  ACCEPTE,
  ANNEXE_BORDEREAU_SUITE,
  ANNULE,
  APPROUVER_REFUSER_REVISION,
  ARRIVE_ENTREPOS_PROVISOIRE,
  BROUILLON,
  BSD_SUITE_PREPARE,
  CONSULTER_REVISION,
  ENTREPOS_TEMPORAIREMENT,
  EN_ATTENTE_BSD_SUITE,
  FAIRE_SIGNER,
  INITIAL,
  PARTIELLEMENT_REFUSE,
  PUBLIER,
  RECU,
  REFUSE,
  SIGNATURE_ACCEPTATION_CONTENANT,
  SIGNATURE_ECO_ORG,
  SIGNER,
  SIGNER_ENLEVEMENT,
  SIGNER_EN_TANT_QUE_TRAVAUX,
  SIGNER_PAR_ENTREPOS_PROVISOIRE,
  SIGNER_PAR_ENTREPRISE_TRAVAUX,
  SIGNE_PAR_EMETTEUR,
  SIGNE_PAR_TRANSPORTEUR,
  SUIVI_PAR_PNTTD,
  TRAITE,
  TRAITE_AVEC_RUPTURE_TRACABILITE,
  VALIDER_ACCEPTATION,
  VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE,
  VALIDER_ENTREPOSAGE_PROVISOIRE,
  VALIDER_RECEPTION,
  VALIDER_TRAITEMENT,
  completer_bsd_suite,
} from "../common/wordings/dashboard/wordingsDashboard";
import { BsdCurrentTab } from "Apps/common/types/commonTypes";

export const getBsdView = (bsd): BsdDisplay | null => {
  const bsdView = formatBsd(bsd);
  return bsdView;
};

export const getBsdStatusLabel = (
  status: string,
  isDraft: boolean | undefined,
  bsdType?: BsdType
) => {
  switch (status) {
    case BsdStatusCode.Draft:
      return BROUILLON;
    case BsdStatusCode.Sealed:
      return INITIAL;
    case BsdStatusCode.Sent:
      return SIGNE_PAR_TRANSPORTEUR;
    case BsdStatusCode.Received:
      if (bsdType === BsdType.Bsdasri) {
        return ACCEPTE;
      }
      return RECU;
    case BsdStatusCode.Accepted:
      return ACCEPTE;
    case BsdStatusCode.Processed:
      if (bsdType === BsdType.Bsff) {
        return TRAITE_AVEC_RUPTURE_TRACABILITE;
      }
      return TRAITE;
    case BsdStatusCode.AwaitingChild:
    case BsdStatusCode.Grouped:
      if (bsdType === BsdType.Bsda || bsdType === BsdType.Bsff) {
        return EN_ATTENTE_BSD_SUITE;
      }
      return ANNEXE_BORDEREAU_SUITE;
    case BsdStatusCode.NoTraceability:
      return TRAITE_AVEC_RUPTURE_TRACABILITE;
    case BsdStatusCode.Refused:
      return REFUSE;
    case BsdStatusCode.TempStored:
      return ARRIVE_ENTREPOS_PROVISOIRE;
    case BsdStatusCode.TempStorerAccepted:
      return ENTREPOS_TEMPORAIREMENT;
    case BsdStatusCode.Resealed:
      return BSD_SUITE_PREPARE;
    case BsdStatusCode.Resent:
      return SIGNE_PAR_TRANSPORTEUR;
    case BsdStatusCode.SignedByProducer:
      if (bsdType === BsdType.Bsdd) {
        return INITIAL;
      }
      return SIGNE_PAR_EMETTEUR;
    case BsdStatusCode.Initial:
      if (isDraft) {
        return BROUILLON;
      } else {
        return INITIAL;
      }
    case BsdStatusCode.SignedByEmitter:
      return SIGNE_PAR_EMETTEUR;
    case BsdStatusCode.SignedByTempStorer:
      return SIGNER_PAR_ENTREPOS_PROVISOIRE;
    case BsdStatusCode.PartiallyRefused:
      return PARTIELLEMENT_REFUSE;
    case BsdStatusCode.FollowedWithPnttd:
      return SUIVI_PAR_PNTTD;
    case BsdStatusCode.SignedByWorker:
      return SIGNER_PAR_ENTREPRISE_TRAVAUX;
    case BsdStatusCode.AwaitingGroup:
      if (bsdType === BsdType.Bsdasri) {
        return ANNEXE_BORDEREAU_SUITE;
      }
      return EN_ATTENTE_BSD_SUITE;
    case BsdStatusCode.IntermediatelyProcessed:
      if (bsdType === BsdType.Bsdasri || bsdType === BsdType.Bsff) {
        return ANNEXE_BORDEREAU_SUITE;
      }
      return EN_ATTENTE_BSD_SUITE;
    case BsdStatusCode.Canceled:
      return ANNULE;

    default:
      return "unknown status";
  }
};

export const getRevisionStatusLabel = (status: string) => {
  switch (status) {
    case BsdStatusCode.Canceled:
      return ReviewStatusLabel.Cancelled;
    case BsdStatusCode.Refused:
      return ReviewStatusLabel.Refused;
    case BsdStatusCode.Accepted:
      return ReviewStatusLabel.Accepted;
    case BsdStatusCode.Pending:
      return ReviewStatusLabel.Pending;

    default:
      break;
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

export const isCollection_2710 = (
  bsdWorkflowType: string | undefined
): boolean => bsdWorkflowType === BsdaType.Collection_2710;

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

export const isBsdaSign = (bsd: BsdDisplay, currentSiret: string) => {
  if (isBsda(bsd.type)) {
    return (
      (isCollection_2710(bsd.bsdWorkflowType?.toString()) &&
        isSameSiretDestination(currentSiret, bsd)) ||
      (bsd.emitter?.isPrivateIndividual &&
        bsd.worker?.isDisabled &&
        isSameSiretTransporter(currentSiret, bsd))
    );
  }
  return false;
};
export const isBsdaSignWorker = (bsd: BsdDisplay, currentSiret: string) => {
  if (isBsda(bsd.type)) {
    return (
      bsd.emitter?.isPrivateIndividual &&
      currentSiret === bsd.worker?.company?.siret
    );
  }
  return false;
};

export const isBsvhuSign = (bsd: BsdDisplay, currentSiret: string) =>
  isBsvhu(bsd.type) && isSameSiretEmmiter(currentSiret, bsd);

export const isBsffSign = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab: BsdCurrentTab
) => {
  const isActTab = bsdCurrentTab === "actTab";
  return isBsff(bsd.type) && !isActTab && isSameSiretEmmiter(currentSiret, bsd);
};

export const isEmetteurSign = (bsd: BsdDisplay, isTransporter: boolean) =>
  isTransporter && !isSynthesis(bsd.bsdWorkflowType?.toString());

export const isEcoOrgSign = (bsd: BsdDisplay, isHolder: boolean) =>
  isHolder && !isSynthesis(bsd.bsdWorkflowType?.toString());

export const getIsNonDraftLabel = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab";
  const isFollowTab = bsdCurrentTab === "followTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (
    !isFollowTab &&
    (isBsvhuSign(bsd, currentSiret) ||
      isBsffSign(bsd, currentSiret, bsdCurrentTab) ||
      isBsdaSign(bsd, currentSiret))
  ) {
    return SIGNER;
  }
  if (isActTab && isBsdaSignWorker(bsd, currentSiret)) {
    return SIGNER_EN_TANT_QUE_TRAVAUX;
  }

  if (isBsdasri(bsd.type)) {
    const isEcoOrganisme = currentSiret === bsd.ecoOrganisme?.siret;
    const isHolder = isSameSiretEmmiter(currentSiret, bsd) || isEcoOrganisme;
    const isTransporter = isSameSiretTransporter(currentSiret, bsd);

    if (isActTab && isEcoOrgSign(bsd, isHolder)) {
      if (isEcoOrganisme) {
        return SIGNATURE_ECO_ORG;
      }
      return SIGNER;
    }

    if (isToCollectTab && isEmetteurSign(bsd, isTransporter)) {
      return SIGNER;
    }
    return "";
  }

  if (!isFollowTab && isSameSiretEmmiter(currentSiret, bsd)) {
    return SIGNER;
  }
  return "";
};

export const getDraftOrInitialBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  if (!bsd.isDraft) {
    return getIsNonDraftLabel(bsd, currentSiret, bsdCurrentTab);
  } else {
    return PUBLIER;
  }
};

const isAppendix1 = (bsd: BsdDisplay): boolean =>
  bsd.emitterType === EmitterType.Appendix1;

const isAppendix1Producer = (bsd: BsdDisplay): boolean =>
  bsd.emitterType === EmitterType.Appendix1Producer;

export const canSkipEmission = (bsd: BsdDisplay): boolean =>
  isAppendix1Producer(bsd) && Boolean(bsd.ecoOrganisme?.siret);

export const getSealedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (isBsdd(bsd.type)) {
    if (!isAppendix1(bsd)) {
      if (canSkipEmission(bsd) && isSameSiretTransporter(currentSiret, bsd)) {
        return SIGNER;
      }

      if (isAppendix1Producer(bsd)) {
        if (
          includesSiretActors(bsd, currentSiret) &&
          !bsd?.emitter?.isPrivateIndividual
        ) {
          if (hasEmmiterAndEcoOrganismeSiret(bsd, currentSiret)) {
            return SIGNER;
          } else {
            return FAIRE_SIGNER;
          }
        }
      }
      if (includesSiretActors(bsd, currentSiret)) {
        if (hasEmmiterAndEcoOrganismeSiret(bsd, currentSiret)) {
          return SIGNER;
        } else {
          return FAIRE_SIGNER;
        }
      }
    }
  }
  if (isBsda(bsd.type) || isBsff(bsd.type) || isBsvhu(bsd.type)) {
    return SIGNER;
  }
  return "";
};

export const getSentBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab";

  if (isBsdd(bsd.type)) {
    if (isAppendix1Producer(bsd)) {
      return "";
    }

    if (isActTab && isSameSiretDestination(currentSiret, bsd)) {
      if (bsd.isTempStorage) {
        return VALIDER_ENTREPOSAGE_PROVISOIRE;
      }
      return VALIDER_RECEPTION;
    }

    return "";
  }
  if (
    (isBsdasri(bsd.type) &&
      isActTab &&
      currentSiret === bsd.destination?.company?.siret) ||
    (isBsff(bsd.type) && isActTab && isSameSiretDestination(currentSiret, bsd))
  ) {
    return VALIDER_RECEPTION;
  }

  if (
    isSameSiretDestination(currentSiret, bsd) &&
    (isBsvhu(bsd.type) || isBsda(bsd.type))
  ) {
    return VALIDER_TRAITEMENT;
  }
  return "";
};

export const getReceivedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab";

  if (
    isBsdasri(bsd.type) &&
    isActTab &&
    isSameSiretDestination(currentSiret, bsd)
  ) {
    return VALIDER_TRAITEMENT;
  }

  if (isBsdd(bsd.type)) {
    if (isAppendix1Producer(bsd)) {
      return "";
    }
    if (
      bsd.isTempStorage &&
      isSameSiretTemporaryStorageDestination(currentSiret, bsd)
    ) {
      return VALIDER_ACCEPTATION;
    }

    if (!bsd.isTempStorage && isSameSiretDestination(currentSiret, bsd)) {
      return VALIDER_ACCEPTATION;
    }
  }

  if (isBsda(bsd.type) || isBsvhu(bsd.type)) {
    return VALIDER_TRAITEMENT;
  }
  if (
    isBsff(bsd.type) &&
    isActTab &&
    isSameSiretDestination(currentSiret, bsd)
  ) {
    // ajouter bsff status received with packagings see dashboard/components/BSDList/BSFF/WorkflowAction/WorkflowAction.tsx
    return SIGNATURE_ACCEPTATION_CONTENANT;
  }

  return "";
};

export const getSignByProducerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (isSameSiretTransporter(currentSiret, bsd)) {
    if (isBsdd(bsd.type)) {
      return SIGNER;
    }
    if (isBsdasri(bsd.type)) {
      if (!isSynthesis(bsd.bsdWorkflowType?.toString())) {
        return SIGNER;
      }
    }

    if (
      (isBsda(bsd.type) &&
        currentSiret === bsd.transporter?.company?.orgId &&
        (isGathering(bsd.bsdWorkflowType?.toString()) ||
          isReshipment(bsd.bsdWorkflowType?.toString()) ||
          bsd.worker?.isDisabled)) ||
      isBsvhu(bsd.type)
    ) {
      return SIGNER;
    }
  } else {
    if (isBsdasri(bsd.type) && !isToCollectTab) {
      return "";
    }
  }

  if (currentSiret === bsd.worker?.company?.siret) {
    return SIGNER_EN_TANT_QUE_TRAVAUX;
  }
  return "";
};

const getSignedByEmitterLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (
    isBsff(bsd.type) &&
    isToCollectTab &&
    isSameSiretTransporter(currentSiret, bsd)
  ) {
    return SIGNER;
  }
  if (isSameSiretTransporter(currentSiret, bsd)) {
    return SIGNER;
  }
  return "";
};

const getAcceptedBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    // ajouter bsff status accepted with packagings see dashboard/components/BSDList/BSFF/WorkflowAction/WorkflowAction.tsx
    return SIGNATURE_ACCEPTATION_CONTENANT;
  }
  if (isBsdd(bsd.type) && isAppendix1Producer(bsd)) {
    return "";
  }
  if (
    isSameSiretDestination(currentSiret, bsd) ||
    isSameSiretTemporaryStorageDestination(currentSiret, bsd)
  ) {
    return VALIDER_TRAITEMENT;
  }
  return "";
};

export const getResentBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (
    isBsdd(bsd.type) &&
    isSameSiretTemporaryStorageDestination(currentSiret, bsd)
  ) {
    return VALIDER_RECEPTION;
  }
  return "";
};

export const getResealedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (isBsdd(bsd.type) && hasTemporaryStorage(currentSiret, bsd)) {
    return SIGNER;
  }
  return "";
};

export const getTempStoredBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    return VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE;
  }
  return "";
};

export const getTempStorerAcceptedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    if (bsd?.temporaryStorageDetail) {
      return completer_bsd_suite;
    } else {
      return VALIDER_TRAITEMENT;
    }
  }
  return "";
};

export const getSignTempStorerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (
    isBsdd(bsd.type) &&
    isSameSiretTemporaryStorageTransporter(currentSiret, bsd)
  ) {
    return SIGNER;
  }
  return "";
};

const getReviewCurrentApproval = (
  bsd: BsdDisplay | BsdWithReview,
  siret: string
) => {
  const { review } = bsd;

  return review?.approvals?.find(approval => approval.approverSiret === siret);
};

export const canApproveOrRefuseReview = (
  bsd: BsdDisplay | BsdWithReview,
  siret: string
) => {
  const { review } = bsd;
  const currentApproval = getReviewCurrentApproval(bsd, siret);

  return (
    review?.status === BsdStatusCode.Pending &&
    currentApproval?.status === BsdStatusCode.Pending
  );
};

export const getPrimaryActionsReviewsLabel = (
  bsd: BsdDisplay,
  currentSiret: string
) => {
  if (canApproveOrRefuseReview(bsd, currentSiret)) {
    return APPROUVER_REFUSER_REVISION;
  }

  return CONSULTER_REVISION;
};

export const canDeleteReview = (bsd: BsdDisplay, currentSiret: string) => {
  const { review } = bsd;
  return (
    review?.authoringCompany.siret === currentSiret &&
    review?.status === BsdStatusCode.Pending
  );
};

export const getPrimaryActionsLabelFromBsdStatus = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab?: BsdCurrentTab
) => {
  switch (bsd.status) {
    case BsdStatusCode.Draft:
    case BsdStatusCode.Initial:
      return getDraftOrInitialBtnLabel(currentSiret, bsd, bsdCurrentTab!);
    case BsdStatusCode.Sealed:
      return getSealedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.Sent:
      return getSentBtnLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.Resent:
      return getResentBtnLabel(currentSiret, bsd);

    case BsdStatusCode.Resealed:
      return getResealedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.TempStored:
      return getTempStoredBtnLabel(currentSiret, bsd);

    case BsdStatusCode.TempStorerAccepted:
      return getTempStorerAcceptedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.SignedByTempStorer:
      return getSignTempStorerBtnLabel(currentSiret, bsd);

    case BsdStatusCode.Received:
    case BsdStatusCode.PartiallyRefused:
      return getReceivedBtnLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.AwaitingChild:
      return "";

    case BsdStatusCode.SignedByProducer:
      return getSignByProducerBtnLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.SignedByEmitter:
      return getSignedByEmitterLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.SignedByWorker:
      if (isSameSiretTransporter(currentSiret, bsd)) {
        return SIGNER_ENLEVEMENT;
      }
      break;

    case BsdStatusCode.Accepted:
      return getAcceptedBtnLabel(currentSiret, bsd);
    default:
      return "";
  }
};

export const canPublishBsd = (
  bsd: BsdDisplay,
  currentSiret: string
): boolean => {
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

export const getWorkflowLabel = (
  bsdWorkflowType:
    | Maybe<BsdaType>
    | BsdasriType
    | BsffType
    | EmitterType
    | undefined
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

    case EmitterType.Appendix2:
      return WorkflowDisplayType.ANNEXE_2;

    case EmitterType.Appendix1:
      return WorkflowDisplayType.TOURNEE;

    case EmitterType.Appendix1Producer:
      return WorkflowDisplayType.ANNEXE_1;

    default:
      return WorkflowDisplayType.DEFAULT;
  }
};

export const hasBsdSuite = (bsd: BsdDisplay, currentSiret): boolean => {
  return (
    !isAppendix1(bsd) &&
    (bsd.status === BsdStatusCode.TempStorerAccepted ||
      (bsd.status === BsdStatusCode.Accepted && !bsd.isTempStorage)) &&
    isSameSiretDestination(currentSiret, bsd) &&
    bsd.type === BsdType.Bsdd
  );
};

const canUpdateOrDeleteBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  bsd.emitterType !== EmitterType.Appendix1Producer &&
  [BsdStatusCode.Draft, BsdStatusCode.Sealed].includes(bsd.status);

const canDeleteBsda = (bsd, siret) =>
  bsd.type === BsdType.Bsda &&
  (bsd.status === BsdStatusCode.Initial ||
    (bsd.status === BsdStatusCode.SignedByProducer &&
      bsd.emitter?.company?.siret === siret));

const canDeleteBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri && bsd.status === BsdStatusCode.Initial;

const canDeleteBsvhu = bsd =>
  bsd.type === BsdType.Bsvhu && bsd.status === BsdStatusCode.Initial;

const canDuplicateBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri && bsd.bsdWorkflowType === BsdasriType.Simple;

const canDuplicateBsda = bsd => bsd.type === BsdType.Bsda;

const canDuplicateBsvhu = bsd => bsd.type === BsdType.Bsvhu;

const canDuplicateBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  bsd.emitterType !== EmitterType.Appendix1Producer;

export const canDuplicateBsff = (bsd, siret) => {
  const emitterSiret = bsd.emitter?.company?.siret;
  const transporterSiret = bsd.transporter?.company?.siret;
  const destinationSiret = bsd.destination?.company?.siret;
  return (
    bsd.type === BsdType.Bsff &&
    [emitterSiret, transporterSiret, destinationSiret].includes(siret)
  );
};

export const canDuplicate = (bsd, siret) =>
  canDuplicateBsdd(bsd) ||
  canDuplicateBsdasri(bsd) ||
  canDuplicateBsff(bsd, siret) ||
  canDuplicateBsda(bsd) ||
  canDuplicateBsvhu(bsd);

const canDeleteBsff = (bsd, siret) =>
  bsd.type === BsdType.Bsff &&
  bsd.status === BsdStatusCode.Initial &&
  canDuplicateBsff(bsd, siret);

export const canDeleteBsd = (bsd, siret) =>
  canUpdateOrDeleteBsdd(bsd) ||
  canDeleteBsda(bsd, siret) ||
  canDeleteBsdasri(bsd) ||
  canDeleteBsff(bsd, siret) ||
  canDeleteBsvhu(bsd);

const canUpdateBsff = (bsd, siret) =>
  bsd.type === BsdType.Bsff &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status) &&
  canDuplicateBsff(bsd, siret);

const canReviewBsda = (bsd, siret) =>
  bsd.type === BsdType.Bsda && !canDeleteBsda(bsd, siret);

export const canReviewBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  ![BsdStatusCode.Draft, BsdStatusCode.Sealed, BsdStatusCode.Refused].includes(
    bsd.status
  ) &&
  bsd.emitterType !== EmitterType.Appendix1Producer;

export const canReviewBsd = (bsd, siret) =>
  canReviewBsdd(bsd) || canReviewBsda(bsd, siret);

const canUpdateBsda = bsd =>
  bsd.type === BsdType.Bsda &&
  ![
    BsdStatusCode.Processed,
    BsdStatusCode.Refused,
    BsdStatusCode.AwaitingChild,
  ].includes(bsd.status);

const canUpdateBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status);

const canUpdateBsvhu = bsd =>
  bsd.type === BsdType.Bsvhu &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status);

export const canUpdateBsd = (bsd, siret) =>
  canUpdateOrDeleteBsdd(bsd) ||
  canUpdateBsda(bsd) ||
  canUpdateBsdasri(bsd) ||
  canUpdateBsff(bsd, siret) ||
  canUpdateBsvhu(bsd);

export const canGeneratePdf = bsd => bsd.type === BsdType.Bsff || !bsd.isDraft;

export const hasAppendix1Cta = (bsd: BsdDisplay): boolean => {
  return (
    bsd.type === BsdType.Bsdd &&
    bsd?.emitterType === EmitterType.Appendix1 &&
    (BsdStatusCode.Sealed === bsd.status || BsdStatusCode.Sent === bsd.status)
  );
};
