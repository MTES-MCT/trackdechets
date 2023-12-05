import {
  BsdDisplay,
  BsdStatusCode,
  BsdWithReview,
  ReviewStatusLabel,
  WorkflowDisplayType
} from "../common/types/bsdTypes";
import { formatBsd } from "./bsdMapper";
import {
  BsdasriType,
  BsdaType,
  BsdType,
  BsffType,
  EmitterType,
  Form,
  Maybe,
  UserPermission
} from "codegen-ui";
import {
  ACCEPTE,
  AJOUTER_ANNEXE_1,
  ANNEXE_BORDEREAU_SUITE,
  ANNULE,
  APPROUVER_REFUSER_REVISION,
  ARRIVE_ENTREPOS_PROVISOIRE,
  BROUILLON,
  BSD_SUITE_PREPARE,
  CONSULTER_REVISION,
  EMPORT_DIRECT_LABEL,
  ENTREPOS_TEMPORAIREMENT,
  EN_ATTENTE_BSD_SUITE,
  FAIRE_SIGNER,
  INITIAL,
  PARTIELLEMENT_REFUSE,
  PUBLIER,
  RECU,
  REFUSE,
  ROAD_CONTROL,
  SIGNATURE_ACCEPTATION_CONTENANT,
  SIGNATURE_ECO_ORG,
  SIGNER,
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
  VALIDER_SYNTHESE_LABEL,
  VALIDER_TRAITEMENT,
  completer_bsd_suite
} from "../common/wordings/dashboard/wordingsDashboard";
import { BsdCurrentTab } from "../common/types/commonTypes";
import { sub } from "date-fns";

export const getBsdView = (bsd): BsdDisplay | null => {
  const bsdView = formatBsd(bsd);
  return bsdView;
};

export const getBsdStatusLabel = (
  status: string,
  isDraft: boolean | undefined,
  bsdType?: BsdType,
  operationCode?: string,
  bsdaAnnexed?: boolean
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
      if (
        bsdType === BsdType.Bsff &&
        (operationCode === "R12" || operationCode === "D13")
      ) {
        return TRAITE_AVEC_RUPTURE_TRACABILITE;
      }
      return TRAITE;
    case BsdStatusCode.AwaitingChild:
    case BsdStatusCode.Grouped:
      if (bsdType === BsdType.Bsff) {
        return EN_ATTENTE_BSD_SUITE;
      }
      if (bsdType === BsdType.Bsda) {
        if (bsdaAnnexed) {
          return ANNEXE_BORDEREAU_SUITE;
        }
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
        if (operationCode === "R12" || operationCode === "D12") {
          return EN_ATTENTE_BSD_SUITE;
        }
        return ANNEXE_BORDEREAU_SUITE;
      }
      return EN_ATTENTE_BSD_SUITE;
    case BsdStatusCode.IntermediatelyProcessed:
      if (bsdType === BsdType.Bsff) {
        const operationCodesBsff = ["R12", "R13", "D13", "D14", "D15"];
        if (operationCode && operationCodesBsff.includes(operationCode)) {
          return EN_ATTENTE_BSD_SUITE;
        }
      }
      if (bsdType === BsdType.Bsdasri) {
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

const hasEmitterTransporterAndEcoOrgSiret = (
  bsd: BsdDisplay,
  siret: string
): boolean => {
  return [
    bsd.emitter?.company?.siret,
    bsd.ecoOrganisme?.siret,
    bsd.transporter?.company?.siret,
    bsd.transporter?.company?.orgId
  ].includes(siret);
};

const isSameSiretEmmiter = (currentSiret: string, bsd: BsdDisplay): boolean =>
  currentSiret === bsd.emitter?.company?.siret;

const isSameSiretDestination = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean => currentSiret === bsd.destination?.company?.siret;

export const isSameSiretTransporter = (
  currentSiret: string,
  bsd: BsdDisplay | Form
): boolean =>
  currentSiret === bsd.transporter?.company?.siret ||
  currentSiret === bsd.transporter?.company?.orgId;

export const isSynthesis = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdasriType.Synthesis;

const isGrouping = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdasriType.Grouping;

const isGathering = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdaType.Gathering;

const isReshipment = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdaType.Reshipment;

const isOtherCollection = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdaType.OtherCollections;

const isSimple = (bsdWorkflowType: string | undefined): boolean =>
  bsdWorkflowType === BsdasriType.Simple;

export const isCollection_2710 = (
  bsdWorkflowType: string | undefined
): boolean => bsdWorkflowType === BsdaType.Collection_2710;

const hasTemporaryStorage = (currentSiret: string, bsd: BsdDisplay): boolean =>
  [
    bsd.destination?.company?.siret,
    bsd.temporaryStorageDetail?.transporter?.company?.siret,
    bsd.temporaryStorageDetail?.transporter?.company?.orgId
  ].includes(currentSiret);

const isSameSiretTemporaryStorageTransporter = (
  currentSiret: string,
  bsd: BsdDisplay
) =>
  [
    bsd.temporaryStorageDetail?.transporter?.company?.siret,
    bsd.temporaryStorageDetail?.transporter?.company?.orgId
  ].includes(currentSiret);

const isSameSiretTemporaryStorageDestination = (
  currentSiret: string,
  bsd: BsdDisplay
) => currentSiret === bsd.temporaryStorageDetail?.destination?.company?.siret;

export const isBsvhu = (type: BsdType): boolean => type === BsdType.Bsvhu;
const isBsda = (type: BsdType): boolean => type === BsdType.Bsda;
export const isBsff = (type: BsdType): boolean => type === BsdType.Bsff;
const isBsdd = (type: BsdType): boolean => type === BsdType.Bsdd;
export const isBsdasri = (type: BsdType): boolean => type === BsdType.Bsdasri;

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
  const isActTab = bsdCurrentTab === "actTab" || bsdCurrentTab === "allBsdsTab";
  return isBsff(bsd.type) && !isActTab && isSameSiretEmmiter(currentSiret, bsd);
};

export const isEmetteurSign = (bsd: BsdDisplay, isTransporter: boolean) =>
  isTransporter && !isSynthesis(bsd.bsdWorkflowType?.toString());

export const isEcoOrgSign = (bsd: BsdDisplay, isHolder: boolean) =>
  isHolder && !isSynthesis(bsd.bsdWorkflowType?.toString());

export const getIsNonDraftLabel = (
  bsd: BsdDisplay,
  currentSiret: string,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab" || bsdCurrentTab === "allBsdsTab";
  const isFollowTab = bsdCurrentTab === "followTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (
    !isFollowTab &&
    (isBsvhuSign(bsd, currentSiret) ||
      isBsffSign(bsd, currentSiret, bsdCurrentTab) ||
      isBsdaSign(bsd, currentSiret)) &&
    permissions.includes(UserPermission.BsdCanSignEmission)
  ) {
    return SIGNER;
  }
  if (
    isActTab &&
    isBsdaSignWorker(bsd, currentSiret) &&
    permissions.includes(UserPermission.BsdCanSignWork)
  ) {
    return SIGNER;
  }

  if (isBsdasri(bsd.type)) {
    const isEcoOrganisme = currentSiret === bsd.ecoOrganisme?.siret;
    const isHolder = isSameSiretEmmiter(currentSiret, bsd) || isEcoOrganisme;
    const isTransporter = isSameSiretTransporter(currentSiret, bsd);

    if (
      isActTab &&
      isEcoOrgSign(bsd, isHolder) &&
      permissions.includes(UserPermission.BsdCanSignEmission)
    ) {
      if (isEcoOrganisme) {
        return SIGNATURE_ECO_ORG;
      }
      return SIGNER;
    }

    if (
      hasEmportDirect(bsd, currentSiret, isToCollectTab) &&
      permissions.includes(UserPermission.BsdCanSignTransport)
    ) {
      return EMPORT_DIRECT_LABEL;
    } else {
      if (
        isToCollectTab &&
        !isSynthesis(bsd.bsdWorkflowType?.toString()) &&
        permissions.includes(UserPermission.BsdCanSignTransport)
      ) {
        return FAIRE_SIGNER;
      }
    }

    if (
      isToCollectTab &&
      isTransporter &&
      isSynthesis(bsd.bsdWorkflowType?.toString()) &&
      permissions.includes(UserPermission.BsdCanSignTransport)
    ) {
      return VALIDER_SYNTHESE_LABEL;
    }
    return "";
  }

  if (
    !isFollowTab &&
    isSameSiretEmmiter(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignEmission)
  ) {
    return SIGNER;
  }
  return "";
};

export const getDraftOrInitialBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  if (!bsd.isDraft) {
    return getIsNonDraftLabel(bsd, currentSiret, permissions, bsdCurrentTab);
  } else {
    return permissions.includes(UserPermission.BsdCanUpdate) ? PUBLIER : "";
  }
};

export const isAppendix1 = (bsd: BsdDisplay): boolean =>
  bsd.emitterType === EmitterType.Appendix1;

const isAppendix1Producer = (bsd: BsdDisplay): boolean =>
  bsd.emitterType === EmitterType.Appendix1Producer;

export const canSkipEmission = (
  bsd: BsdDisplay,
  hasAutomaticSignature: boolean | undefined
): boolean =>
  (Boolean(bsd.ecoOrganisme?.siret) ||
    hasAutomaticSignature ||
    Boolean(bsd.emitter?.isPrivateIndividual)) &&
  isAppendix1Producer(bsd);

export const isSignTransportCanSkipEmission = (
  currentSiret: string,
  bsd: BsdDisplay,
  hasAutomaticSignature: boolean | undefined
) => {
  return (
    canSkipEmission(bsd, hasAutomaticSignature) &&
    isSameSiretTransporter(currentSiret, bsd)
  );
};

export const isSignEmission = (
  currentSiret: string,
  bsd: BsdDisplay,
  hasAutomaticSignature: boolean | undefined
) => {
  return (
    isAppendix1Producer(bsd) &&
    (hasAutomaticSignature ||
      (hasEmitterTransporterAndEcoOrgSiret(bsd, currentSiret) &&
        !bsd.emitter?.isPrivateIndividual))
  );
};

// s'inspire de https://github.com/MTES-MCT/trackdechets/blob/dev/back/src/forms/validation.ts#L1897
export const canAddAppendix1 = bsd => {
  // Once one of the appendix has been signed by the transporter,
  // you have 3 days maximum to add new appendix
  const currentDate = new Date();
  const { grouping } = bsd;
  const firstFormSignatureDate = grouping?.find(({ form }) => {
    if (form.takenOverAt) {
      return form.takenOverAt;
    }
    return "";
  });
  const firstTransporterSignatureDate = !!firstFormSignatureDate
    ? new Date(firstFormSignatureDate.form.takenOverAt)
    : currentDate;
  const limitDate = sub(currentDate, {
    days: 2,
    hours: currentDate.getHours(),
    minutes: currentDate.getMinutes()
  });

  if (firstTransporterSignatureDate < limitDate) {
    return false;
  }
  return true;
};

export const getSealedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  hasAutomaticSignature?: boolean
): string => {
  if (
    isBsdd(bsd.type) &&
    permissions.includes(UserPermission.BsdCanSignEmission)
  ) {
    if (isAppendix1(bsd) && canAddAppendix1(bsd)) {
      return AJOUTER_ANNEXE_1;
    }

    if (
      isSignTransportCanSkipEmission(currentSiret, bsd, hasAutomaticSignature)
    ) {
      return SIGNER;
    }
    if (isSignEmission(currentSiret, bsd, hasAutomaticSignature)) {
      const emitterSirets = [
        bsd.emitter?.company?.siret,
        bsd.ecoOrganisme?.siret
      ];
      const currentUserIsEmitter = emitterSirets.includes(currentSiret);
      if (currentUserIsEmitter) {
        return SIGNER;
      }
      return FAIRE_SIGNER;
    }
    if (isSameSiretEmmiter(currentSiret, bsd)) {
      return SIGNER;
    }
    if (hasEmitterTransporterAndEcoOrgSiret(bsd, currentSiret)) {
      return FAIRE_SIGNER;
    }
  }
  if (
    (isBsda(bsd.type) || isBsff(bsd.type) || isBsvhu(bsd.type)) &&
    permissions.includes(UserPermission.BsdCanSignEmission)
  ) {
    return SIGNER;
  }
  return "";
};

export const getSentBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab" || bsdCurrentTab === "allBsdsTab";
  const isCollectedTab = bsdCurrentTab === "collectedTab";

  if (hasRoadControlButton(bsd, isCollectedTab)) {
    return ROAD_CONTROL;
  }

  if (isBsdd(bsd.type)) {
    if (isAppendix1Producer(bsd)) {
      return "";
    }

    if (isActTab) {
      if (
        isSameSiretDestination(currentSiret, bsd) &&
        permissions.includes(UserPermission.BsdCanSignAcceptation)
      ) {
        if (bsd.isTempStorage) {
          return VALIDER_ENTREPOSAGE_PROVISOIRE;
        }

        return VALIDER_RECEPTION;
      }

      if (isAppendix1(bsd) && canAddAppendix1(bsd)) {
        return AJOUTER_ANNEXE_1;
      }
    }

    return "";
  }
  if (
    isBsdasri(bsd.type) &&
    currentSiret === bsd.destination?.company?.siret &&
    isActTab &&
    !bsd.synthesizedIn &&
    permissions.includes(UserPermission.BsdCanSignAcceptation)
  ) {
    return VALIDER_RECEPTION;
  }

  if (
    isBsff(bsd.type) &&
    isActTab &&
    isSameSiretDestination(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignAcceptation)
  ) {
    return VALIDER_RECEPTION;
  }

  if (
    isSameSiretDestination(currentSiret, bsd) &&
    (isBsvhu(bsd.type) || isBsda(bsd.type)) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    return VALIDER_TRAITEMENT;
  }
  return "";
};

export const getReceivedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab" || bsdCurrentTab === "allBsdsTab";

  if (
    isBsdasri(bsd.type) &&
    isActTab &&
    !bsd.synthesizedIn &&
    isSameSiretDestination(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    return VALIDER_TRAITEMENT;
  }

  if (isBsdd(bsd.type)) {
    if (isAppendix1Producer(bsd)) {
      return "";
    }
    if (
      bsd.isTempStorage &&
      isSameSiretTemporaryStorageDestination(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignAcceptation)
    ) {
      return VALIDER_ACCEPTATION;
    }

    if (
      !bsd.isTempStorage &&
      isSameSiretDestination(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignAcceptation)
    ) {
      return VALIDER_ACCEPTATION;
    }
  }

  if (
    (isBsda(bsd.type) || isBsvhu(bsd.type)) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    return VALIDER_TRAITEMENT;
  }
  if (
    isBsff(bsd.type) &&
    isActTab &&
    isSameSiretDestination(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    if (bsd.packagings?.length === 1) {
      return VALIDER_ACCEPTATION;
    }

    return SIGNATURE_ACCEPTATION_CONTENANT;
  }

  return "";
};

export const getSignByProducerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (
    isSameSiretTransporter(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignTransport)
  ) {
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
        (isGathering(bsd.bsdWorkflowType?.toString()) ||
          isReshipment(bsd.bsdWorkflowType?.toString()) ||
          isOtherCollection(bsd.bsdWorkflowType?.toString()) ||
          bsd.worker?.isDisabled)) ||
      isBsvhu(bsd.type)
    ) {
      return SIGNER;
    }
  } else {
    if (isBsdasri(bsd.type) && !isToCollectTab) {
      return "";
    }

    if (
      currentSiret === bsd.worker?.company?.siret ||
      currentSiret === bsd.transporter?.company?.orgId
    ) {
      return SIGNER;
    }
  }

  return "";
};

const getSignedByEmitterLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (
    isBsff(bsd.type) &&
    isToCollectTab &&
    isSameSiretTransporter(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignTransport)
  ) {
    return SIGNER;
  }
  if (
    isSameSiretTransporter(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignTransport)
  ) {
    return SIGNER;
  }
  return "";
};

const getAcceptedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[]
): string => {
  if (
    isBsff(bsd.type) &&
    isSameSiretDestination(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    if (bsd.packagings?.length === 1) {
      return VALIDER_TRAITEMENT;
    }
    return SIGNATURE_ACCEPTATION_CONTENANT;
  }
  if (isBsdd(bsd.type) && isAppendix1Producer(bsd)) {
    return "";
  }
  if (
    (isSameSiretDestination(currentSiret, bsd) ||
      isSameSiretTemporaryStorageDestination(currentSiret, bsd)) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    return VALIDER_TRAITEMENT;
  }
  return "";
};

export const getResentBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isCollectedTab = bsdCurrentTab === "collectedTab";
  if (hasRoadControlButton(bsd, isCollectedTab)) {
    return ROAD_CONTROL;
  }

  if (
    isBsdd(bsd.type) &&
    isSameSiretTemporaryStorageDestination(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignAcceptation)
  ) {
    return VALIDER_RECEPTION;
  }
  return "";
};

export const getResealedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[]
): string => {
  if (
    isBsdd(bsd.type) &&
    hasTemporaryStorage(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignEmission)
  ) {
    if (isSameSiretEmmiter(currentSiret, bsd)) {
      return SIGNER;
    }
    if (currentSiret === bsd.destination?.company?.siret) {
      return SIGNER;
    }
    return FAIRE_SIGNER;
  }
  return "";
};

export const getTempStoredBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[]
): string => {
  if (
    isBsdd(bsd.type) &&
    isSameSiretDestination(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignAcceptation)
  ) {
    return VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE;
  }
  return "";
};

export const getTempStorerAcceptedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[]
): string => {
  if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    if (
      bsd?.temporaryStorageDetail &&
      permissions.includes(UserPermission.BsdCanUpdate)
    ) {
      return completer_bsd_suite;
    } else if (permissions.includes(UserPermission.BsdCanSignOperation)) {
      return VALIDER_TRAITEMENT;
    }
  }
  return "";
};

export const getSignTempStorerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  permissions: UserPermission[]
): string => {
  if (
    isBsdd(bsd.type) &&
    isSameSiretTemporaryStorageTransporter(currentSiret, bsd) &&
    permissions.includes(UserPermission.BsdCanSignEmission)
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
  permissions: UserPermission[],
  bsdCurrentTab?: BsdCurrentTab,
  hasAutomaticSignature?: boolean
) => {
  switch (bsd.status) {
    case BsdStatusCode.Draft:
    case BsdStatusCode.Initial:
      return getDraftOrInitialBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab!
      );
    case BsdStatusCode.Sealed:
      return getSealedBtnLabel(
        currentSiret,
        bsd,
        permissions,
        hasAutomaticSignature
      );

    case BsdStatusCode.Sent:
      return getSentBtnLabel(currentSiret, bsd, permissions, bsdCurrentTab!);

    case BsdStatusCode.Resent:
      return getResentBtnLabel(currentSiret, bsd, permissions, bsdCurrentTab!);

    case BsdStatusCode.Resealed:
      return getResealedBtnLabel(currentSiret, bsd, permissions);

    case BsdStatusCode.TempStored:
      return getTempStoredBtnLabel(currentSiret, bsd, permissions);

    case BsdStatusCode.TempStorerAccepted:
      return getTempStorerAcceptedBtnLabel(currentSiret, bsd, permissions);

    case BsdStatusCode.SignedByTempStorer:
      return getSignTempStorerBtnLabel(currentSiret, bsd, permissions);

    case BsdStatusCode.Received:
    case BsdStatusCode.PartiallyRefused:
      return getReceivedBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab!
      );

    case BsdStatusCode.AwaitingChild:
      return "";

    case BsdStatusCode.SignedByProducer:
      return getSignByProducerBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab!
      );

    case BsdStatusCode.SignedByEmitter:
      return getSignedByEmitterLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab!
      );

    case BsdStatusCode.SignedByWorker:
      if (
        isSameSiretTransporter(currentSiret, bsd) &&
        permissions.includes(UserPermission.BsdCanSignTransport)
      ) {
        return SIGNER;
      }
      break;

    case BsdStatusCode.Accepted:
      return getAcceptedBtnLabel(currentSiret, bsd, permissions);
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

const canUpdateBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  bsd.emitterType !== EmitterType.Appendix1Producer &&
  [
    BsdStatusCode.Draft,
    BsdStatusCode.Sealed,
    BsdStatusCode.SignedByProducer
  ].includes(bsd.status);

const canDeleteBsdd = bsd =>
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
  canDeleteBsdd(bsd) ||
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

export const canReviewBsdd = (bsd, siret) =>
  bsd.type === BsdType.Bsdd &&
  ![BsdStatusCode.Draft, BsdStatusCode.Sealed, BsdStatusCode.Refused].includes(
    bsd.status
  ) &&
  bsd.emitterType !== EmitterType.Appendix1Producer &&
  !(
    bsd.emitterType === EmitterType.Producer &&
    isSameSiretEmmiter(siret, bsd) &&
    canUpdateBsd(bsd, siret)
  ) &&
  !(
    bsd.emitterType === EmitterType.Appendix2 &&
    isSameSiretDestination(siret, bsd) &&
    canUpdateBsd(bsd, siret)
  );

export const canReviewBsd = (bsd, siret) => {
  const isTransporter = isSameSiretTransporter(siret, bsd);
  const isDestination = isSameSiretDestination(siret, bsd);
  const isTransporterOnly = isTransporter && !isDestination;

  return (
    (canReviewBsdd(bsd, siret) || canReviewBsda(bsd, siret)) &&
    !isTransporterOnly
  );
};

const canUpdateBsda = bsd =>
  bsd.type === BsdType.Bsda &&
  ![
    BsdStatusCode.Processed,
    BsdStatusCode.Refused,
    BsdStatusCode.AwaitingChild
  ].includes(bsd.status);

const canUpdateBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status);

const canUpdateBsvhu = bsd =>
  bsd.type === BsdType.Bsvhu &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status);

export const canUpdateBsd = (bsd, siret) =>
  canUpdateBsdd(bsd) ||
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

export const hasEmportDirect = (
  bsd: BsdDisplay,
  currentSiret: string,
  isToCollectTab: boolean
): boolean => {
  const isTransporter = isSameSiretTransporter(currentSiret, bsd);

  return (
    isBsdasri(bsd.type) &&
    isToCollectTab &&
    isTransporter &&
    Boolean(bsd?.allowDirectTakeOver) &&
    isSimple(bsd?.bsdWorkflowType?.toString())
  );
};

export const hasBsdasriEmitterSign = (
  bsd: BsdDisplay,
  currentSiret: string,
  isToCollectTab: boolean
): boolean => {
  const isTransporter = isSameSiretTransporter(currentSiret, bsd);

  return (
    isBsdasri(bsd.type) &&
    hasEmportDirect(bsd, currentSiret, isToCollectTab) &&
    isToCollectTab &&
    isEmetteurSign(bsd, isTransporter)
  );
};

export const hasRoadControlButton = (
  bsd: BsdDisplay,
  isCollectedTab: boolean
) => {
  return ["SENT", "RESENT"].includes(bsd.status) && isCollectedTab;
};

export const canEditCustomInfoOrTransporterNumberPlate = (
  bsd: BsdDisplay
): boolean => {
  if (isBsdd(bsd.type)) {
    return ["SEALED", "SIGNED_BY_PRODUCER"].includes(bsd.status);
  }

  if (isBsda(bsd.type)) {
    return ["SIGNED_BY_PRODUCER", "SIGNED_BY_WORKER", "INITIAL"].includes(
      bsd.status
    );
  }
  if (isBsff(bsd.type)) {
    return ["INITIAL", "SIGNED_BY_EMITTER"].includes(bsd.status);
  }
  if (isBsdasri(bsd.type)) {
    return ["SIGNED_BY_PRODUCER", "INITIAL"].includes(bsd.status);
  }

  return false;
};

export const getOperationCodesFromSearchString = (value: any): string[] => {
  const searchCodes: string[] = [];

  value.match(/[rRdD]{1}( )\d{1,2}/g)?.forEach(code => {
    const cleanCode = code.toUpperCase();
    searchCodes.push(cleanCode);
    searchCodes.push(cleanCode.replace(" ", "").toUpperCase());
  });

  value.match(/[rRdD]{1}\d{1,2}/g)?.forEach(code => {
    const cleanCode = code.toUpperCase();
    searchCodes.push(cleanCode);
    searchCodes.push(cleanCode.replace(/([rRdD]{1})/, "$& "));
  });
  return searchCodes;
};
