import {
  BsdDisplay,
  BsdStatusCode,
  ReviewStatusLabel,
  WorkflowDisplayType
} from "../common/types/bsdTypes";
import { formatBsd } from "./bsdMapper";
import {
  Bsda,
  BsdasriType,
  Bsdasri,
  BsdaType,
  BsdType,
  BsffType,
  EmitterType,
  Form,
  Maybe,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus,
  UserPermission,
  Transporter,
  BsdaTransporter,
  BsffTransporter,
  BsvhuStatus
} from "@td/codegen-ui";
import {
  ACCEPTE,
  AJOUTER_ANNEXE_1,
  ANNEXE_BORDEREAU_SUITE,
  ANNULE,
  ARRIVE_ENTREPOS_PROVISOIRE,
  BROUILLON,
  BSD_SUITE_PREPARE,
  CONSULTER_REVISION,
  EMPORT_DIRECT_LABEL,
  ENTREPOS_TEMPORAIREMENT,
  EN_ATTENTE_BSD_SUITE,
  EN_ATTENTE_TRAITEMENT,
  FAIRE_SIGNER,
  GERER_REVISION,
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
  SIGNE_PAR_TRANSPORTEUR_N,
  SUIVI_PAR_PNTTD,
  SUPRIMER_REVISION,
  TRAITE,
  TRAITE_AVEC_RUPTURE_TRACABILITE,
  VALIDER_ACCEPTATION,
  VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE,
  VALIDER_ENTREPOSAGE_PROVISOIRE,
  VALIDER_RECEPTION,
  VALIDER_SYNTHESE_LABEL,
  VALIDER_TRAITEMENT,
  FIN_DE_MISSION,
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
  bsdaAnnexed?: boolean,
  transporters?: Transporter[] | BsdaTransporter[] | BsffTransporter[]
) => {
  switch (status) {
    case BsdStatusCode.Draft:
      return BROUILLON;
    case BsdStatusCode.Sealed:
      return INITIAL;
    case BsdStatusCode.Sent:
      if (bsdType && transporters && transporters.length > 1) {
        // Le code qui suit permet d'afficher "Signé par le transporteur N"
        // en cas de transport multi-modal
        let lastTransporterNumero: Maybe<number> = null;
        if (isBsdd(bsdType)) {
          lastTransporterNumero = (transporters as Transporter[]).filter(t =>
            Boolean(t.takenOverAt)
          ).length;
        } else if (isBsda(bsdType) || isBsff(bsdType)) {
          lastTransporterNumero = (transporters as BsdaTransporter[]).filter(
            t => Boolean(t.transport?.signature?.date)
          ).length;
        }
        if (lastTransporterNumero)
          return SIGNE_PAR_TRANSPORTEUR_N(lastTransporterNumero);
      }
      return SIGNE_PAR_TRANSPORTEUR;
    case BsdStatusCode.Received:
      if (bsdType === BsdType.Bsdasri) {
        return ACCEPTE;
      }
      if (bsdType === BsdType.Bspaoh) {
        return ACCEPTE;
      }
      if (bsdType === BsdType.Bsvhu) {
        return EN_ATTENTE_TRAITEMENT;
      }
      return RECU;
    case BsdStatusCode.Accepted:
      return ACCEPTE;
    case BsdStatusCode.Processed:
      return TRAITE;
    case BsdStatusCode.AwaitingChild:
    case BsdStatusCode.Grouped:
      if (bsdType === BsdType.Bsff) {
        return EN_ATTENTE_TRAITEMENT;
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
        if (operationCode === "R12" || operationCode === "D13") {
          return EN_ATTENTE_BSD_SUITE;
        }
        return ANNEXE_BORDEREAU_SUITE;
      }
      return EN_ATTENTE_BSD_SUITE;
    case BsdStatusCode.IntermediatelyProcessed:
      if (bsdType === BsdType.Bsff) {
        return EN_ATTENTE_TRAITEMENT;
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

export const isBsvhu = (type: BsdType): boolean => type === BsdType.Bsvhu;
const isBsda = (type: BsdType): boolean => type === BsdType.Bsda;
export const isBsff = (type: BsdType): boolean => type === BsdType.Bsff;
const isBsdd = (type: BsdType): boolean => type === BsdType.Bsdd;
export const isBsdasri = (type: BsdType): boolean => type === BsdType.Bsdasri;
export const isBspaoh = (type: BsdType): boolean => type === BsdType.Bspaoh;

export enum ActorType {
  Emitter = "EMITTER",
  Transporter = "TRANSPORTER",
  NextTransporter = "NEXTTRANSPORTER",
  Destination = "DESTINATION",
  Intermediary = "INTERMEDIARY",
  EcoOrganisme = "ECOORGANISME",
  Broker = "BROKER",
  Worker = "WORKER",
  TempStorage = "TEMPSTORAGE",
  Trader = "TRADER"
}

interface ActorTypes {
  type: ActorType;
  strict?: boolean;
}

export const isSiretActorForBsd = (
  bsd: BsdDisplay,
  siret: string,
  actorTypes: ActorTypes[]
): boolean => {
  const actorTypesForSiret = [
    ...(siret === bsd.emitter?.company?.siret ? [ActorType.Emitter] : []),
    ...(siret === bsd.ecoOrganisme?.siret ? [ActorType.EcoOrganisme] : []),
    ...(siret === bsd.destination?.company?.siret
      ? [ActorType.Destination]
      : []),
    ...(siret === bsd.worker?.company?.siret ? [ActorType.Worker] : []),
    ...(siret === bsd.transporter?.company?.siret
      ? [ActorType.Transporter]
      : []),
    ...(siret === bsd.broker?.company?.siret ? [ActorType.Broker] : []),
    ...(siret === bsd.trader?.company?.siret ? [ActorType.Trader] : []),
    ...(bsd.intermediaries?.some(p => p.siret === siret)
      ? [ActorType.Intermediary]
      : []),
    ...(siret === bsd.temporaryStorageDetail?.destination?.company?.siret
      ? [ActorType.TempStorage]
      : []),
    ...(siret === getNextTransporter(bsd)?.company?.siret
      ? [ActorType.NextTransporter]
      : [])
  ];

  return actorTypesForSiret.length === 0
    ? false
    : actorTypes
        .map(({ type, strict = false }) => {
          return actorTypesForSiret.includes(type) && strict
            ? actorTypesForSiret.includes(type) &&
                actorTypesForSiret.length === 1
            : actorTypesForSiret.includes(type);
        })
        .reduce((acc, curr) => acc && curr, true);
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

const isSameSiretEmitter = (currentSiret: string, bsd: BsdDisplay): boolean =>
  currentSiret === bsd.emitter?.company?.siret;

const isSameSiretEcorganisme = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean => currentSiret === bsd.ecoOrganisme?.siret;

const isSameSiretDestination = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean => currentSiret === bsd.destination?.company?.siret;

// destination finale après entreposage provisoire
const isSameSiretFinalBsddDestination = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean =>
  currentSiret === bsd.temporaryStorageDetail?.destination?.company?.siret;

const isSameSiretWorker = (currentSiret: string, bsd: BsdDisplay): boolean =>
  currentSiret === bsd.worker?.company?.siret;

export const isSameSiretTransporter = (
  currentSiret: string,
  bsd: BsdDisplay | Form
): boolean =>
  currentSiret === bsd.transporter?.company?.siret ||
  currentSiret === bsd.transporter?.company?.orgId;

// Renvoie le premier transporteur de la liste qui n'a pas encore
// pris en charge le déchet.
export const getNextTransporter = (bsd: BsdDisplay) => {
  const nextTransporter = (bsd.transporters ?? []).find(t => {
    const signatureDate = isBsdd(bsd.type)
      ? (t as Transporter).takenOverAt
      : (t as BsdaTransporter).transport?.signature?.date;
    return !signatureDate;
  });
  return nextTransporter ?? null;
};

// Cas du transport multi-modal BSDD, vérifie si l'établissement
// courant est le prochain transporteur dans la liste des transporteurs
// multi-modaux à devoir prendre en charge le déchet.
export const isSameSiretNextTransporter = (
  currentSiret: string,
  bsd: BsdDisplay
): boolean => {
  // Premier transporteur de la liste qui n'a pas encore pris en charge le déchet.
  const nextTransporter = getNextTransporter(bsd);
  if (nextTransporter) {
    return currentSiret === nextTransporter.company?.orgId;
  }
  return false;
};

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

const hasWorker = (bsd: BsdDisplay): boolean =>
  isBsda(bsd.type) && !bsd.worker?.isDisabled && !!bsd.worker?.company?.siret;

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

const isIrregularSituation = bsd => bsd.emitter?.irregularSituation;

// emitter is irregular and has no siret, transporter signature is needed
const canIrregularSituationSignWithNoSiret = (
  bsd: BsdDisplay,
  currentSiret: string
) => {
  return (
    bsd.status === BsvhuStatus.Initial &&
    isIrregularSituation(bsd) &&
    bsd.emitter?.noSiret &&
    isSiretActorForBsd(bsd, currentSiret, [
      { type: ActorType.Transporter, strict: true }
    ])
  );
};

// emitter is irregular and has registered siret, he can sign
const canIrregularSituationSignWithSiretRegistered = (
  bsd: BsdDisplay,
  currentSiret: string,
  isEmitterRegistered?: boolean
) => {
  return (
    bsd.status === BsvhuStatus.Initial &&
    isIrregularSituation(bsd) &&
    !bsd.emitter?.noSiret &&
    isEmitterRegistered &&
    isSiretActorForBsd(bsd, currentSiret, [
      { type: ActorType.Emitter, strict: true }
    ])
  );
};

// emitter is irregular and has no registered siret, transporter signature is needed
const canIrregularSituationSignWithSiretNotRegistered = (
  bsd: BsdDisplay,
  currentSiret: string,
  isEmitterRegistered?: boolean
) => {
  return (
    bsd.status === BsvhuStatus.Initial &&
    isIrregularSituation(bsd) &&
    !bsd.emitter?.noSiret &&
    !isEmitterRegistered &&
    isSiretActorForBsd(bsd, currentSiret, [
      { type: ActorType.Transporter, strict: true }
    ])
  );
};

export const isBsvhuSign = (
  bsd: BsdDisplay,
  currentSiret: string,
  isEmitterRegistered?: boolean
) =>
  isBsvhu(bsd.type) &&
  ((isSameSiretEmitter(currentSiret, bsd) && !isIrregularSituation(bsd)) ||
    canIrregularSituationSignWithNoSiret(bsd, currentSiret) ||
    canIrregularSituationSignWithSiretRegistered(
      bsd,
      currentSiret,
      isEmitterRegistered
    ) ||
    canIrregularSituationSignWithSiretNotRegistered(
      bsd,
      currentSiret,
      isEmitterRegistered
    ));

export const isBsffSign = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab: BsdCurrentTab
) => {
  const isActTab = bsdCurrentTab === "actTab" || bsdCurrentTab === "allBsdsTab";
  return isBsff(bsd.type) && !isActTab && isSameSiretEmitter(currentSiret, bsd);
};

export const isEmetteurSign = (bsd: BsdDisplay, isTransporter: boolean) =>
  isTransporter && !isSynthesis(bsd.bsdWorkflowType?.toString());

export const isEcoOrgSign = (bsd: BsdDisplay, isHolder: boolean) =>
  isHolder && !isSynthesis(bsd.bsdWorkflowType?.toString());

export const getIsNonDraftLabel = (
  bsd: BsdDisplay,
  currentSiret: string,
  permissions: UserPermission[],
  bsdCurrentTab: BsdCurrentTab,
  isEmitterRegistered?: boolean
): string => {
  const isActTab = bsdCurrentTab === "actTab" || bsdCurrentTab === "allBsdsTab";
  const isFollowTab = bsdCurrentTab === "followTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (
    isBsda(bsd.type) &&
    isCollection_2710(bsd.bsdWorkflowType?.toString()) &&
    isSameSiretEmitter(currentSiret, bsd) &&
    !isSameSiretDestination(currentSiret, bsd) &&
    bsd.ecoOrganisme?.siret !== currentSiret
  ) {
    return "";
  }

  if (
    !isFollowTab &&
    (isBsvhuSign(bsd, currentSiret, isEmitterRegistered) ||
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
    const isHolder = isSameSiretEmitter(currentSiret, bsd) || isEcoOrganisme;
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
    isSameSiretEmitter(currentSiret, bsd) &&
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
  bsdCurrentTab: BsdCurrentTab,
  isEmitterRegistered?: boolean
): string => {
  if (!bsd.isDraft) {
    return getIsNonDraftLabel(
      bsd,
      currentSiret,
      permissions,
      bsdCurrentTab,
      isEmitterRegistered
    );
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
  hasAutomaticSignature: boolean | undefined,
  emitterIsExutoireOrTtr: boolean | undefined
): boolean =>
  ((Boolean(bsd.ecoOrganisme?.siret) && !emitterIsExutoireOrTtr) ||
    hasAutomaticSignature ||
    Boolean(bsd.emitter?.isPrivateIndividual)) &&
  isAppendix1Producer(bsd);

export const isSignTransportCanSkipEmission = (
  currentSiret: string,
  bsd: BsdDisplay,
  hasAutomaticSignature: boolean | undefined,
  emitterIsExutoireOrTtr: boolean | undefined
) => {
  return (
    canSkipEmission(bsd, hasAutomaticSignature, emitterIsExutoireOrTtr) &&
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
  // you have 5 days maximum to add new appendix
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
    days: 4,
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
  hasAutomaticSignature?: boolean,
  emitterIsExutoireOrTtr?: boolean
): string => {
  if (
    isBsdd(bsd.type) &&
    (permissions.includes(UserPermission.BsdCanSignEmission) ||
      permissions.includes(UserPermission.BsdCanSignTransport))
  ) {
    if (
      isAppendix1(bsd) &&
      canAddAppendix1(bsd) &&
      hasAppendix1Cta(bsd, currentSiret)
    ) {
      return AJOUTER_ANNEXE_1;
    }

    if (
      isSignTransportCanSkipEmission(
        currentSiret,
        bsd,
        hasAutomaticSignature,
        emitterIsExutoireOrTtr
      )
    ) {
      return SIGNER;
    }
    if (isAppendix1Producer(bsd)) {
      if (bsd.ecoOrganisme?.siret === currentSiret) {
        return "";
      }

      if (isSignEmission(currentSiret, bsd, hasAutomaticSignature)) {
        const currentUserIsEmitter =
          bsd.emitter?.company?.siret === currentSiret;
        if (currentUserIsEmitter) {
          return SIGNER;
        }
        return FAIRE_SIGNER;
      }
    }
    if (isSameSiretEmitter(currentSiret, bsd)) {
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
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (hasRoadControlButton(bsd, isCollectedTab)) {
    return ROAD_CONTROL;
  }
  // BSDD
  if (isBsdd(bsd.type)) {
    if (isAppendix1Producer(bsd)) {
      return "";
    }

    if (
      isToCollectTab &&
      isSameSiretNextTransporter(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignTransport)
    ) {
      return SIGNER;
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

      if (
        isAppendix1(bsd) &&
        canAddAppendix1(bsd) &&
        hasAppendix1Cta(bsd, currentSiret) &&
        permissions.includes(UserPermission.BsdCanUpdate)
      ) {
        return AJOUTER_ANNEXE_1;
      }
    }

    return "";
  }
  //BSDASRI
  if (
    isBsdasri(bsd.type) &&
    currentSiret === bsd.destination?.company?.siret &&
    isActTab &&
    !bsd.synthesizedIn &&
    permissions.includes(UserPermission.BsdCanSignAcceptation)
  ) {
    return VALIDER_RECEPTION;
  }
  // BSFF
  if (isBsff(bsd.type)) {
    if (
      isActTab &&
      isSameSiretDestination(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignAcceptation)
    ) {
      return VALIDER_RECEPTION;
    }
    if (
      isToCollectTab &&
      isSameSiretNextTransporter(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignTransport)
    ) {
      return SIGNER;
    }
  }
  // BSDA
  if (isBsda(bsd.type)) {
    if (
      isToCollectTab &&
      isSameSiretNextTransporter(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignTransport)
    ) {
      return SIGNER;
    }

    if (
      isActTab &&
      isSameSiretDestination(currentSiret, bsd) &&
      permissions.includes(UserPermission.BsdCanSignOperation)
    ) {
      return VALIDER_TRAITEMENT;
    }
  }
  // VHU
  if (
    isSameSiretDestination(currentSiret, bsd) &&
    isBsvhu(bsd.type) &&
    permissions.includes(UserPermission.BsdCanSignOperation)
  ) {
    return VALIDER_RECEPTION;
  }
  // PAOH
  if (isBspaoh(bsd.type)) {
    if (
      currentSiret === bsd.transporter?.company?.siret &&
      isCollectedTab &&
      permissions.includes(UserPermission.BsdCanSignDelivery) &&
      !bsd.destination?.["handedOverToDestination"]?.signature
    ) {
      return FIN_DE_MISSION;
    }
    if (
      currentSiret === bsd.destination?.company?.siret &&
      isActTab &&
      permissions.includes(UserPermission.BsdCanSignAcceptation)
    ) {
      return VALIDER_RECEPTION;
    }
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
    isBspaoh(bsd.type) &&
    isSameSiretDestination(currentSiret, bsd) &&
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
    if (isBsdd(bsd.type) && isToCollectTab) {
      return SIGNER;
    }
    if (isBsdasri(bsd.type)) {
      if (!isSynthesis(bsd.bsdWorkflowType?.toString())) {
        return SIGNER;
      }
    }
    if (
      isBspaoh(bsd.type) &&
      isToCollectTab &&
      permissions.includes(UserPermission.BsdCanSignTransport)
    ) {
      return SIGNER;
    }
    if (
      (isBsda(bsd.type) &&
        (isGathering(bsd.bsdWorkflowType?.toString()) ||
          isReshipment(bsd.bsdWorkflowType?.toString()) ||
          isOtherCollection(bsd.bsdWorkflowType?.toString()) ||
          bsd.worker?.isDisabled) &&
        ((!hasWorker(bsd) &&
          permissions.includes(UserPermission.BsdCanSignTransport)) ||
          (hasWorker(bsd) &&
            currentSiret === bsd.worker?.company?.siret &&
            permissions.includes(UserPermission.BsdCanSignWork)))) ||
      isBsvhu(bsd.type)
    ) {
      return SIGNER;
    }
  } else {
    if (
      isBsdasri(bsd.type) &&
      !isToCollectTab &&
      (permissions.includes(UserPermission.BsdCanSignTransport) ||
        permissions.includes(UserPermission.BsdCanSignAcceptation))
    ) {
      return "";
    }

    if (
      currentSiret === bsd.worker?.company?.siret &&
      permissions.includes(UserPermission.BsdCanSignWork)
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
    ((!bsd.isTempStorage && isSameSiretDestination(currentSiret, bsd)) ||
      (bsd.isTempStorage &&
        isSameSiretTemporaryStorageDestination(currentSiret, bsd))) &&
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
    (permissions.includes(UserPermission.BsdCanSignEmission) ||
      permissions.includes(UserPermission.BsdCanSignTransport))
  ) {
    if (isSameSiretEmitter(currentSiret, bsd)) {
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
    (permissions.includes(UserPermission.BsdCanSignEmission) ||
      permissions.includes(UserPermission.BsdCanSignTransport))
  ) {
    return SIGNER;
  }
  return "";
};

const getReviewCurrentApproval = (
  bsd: BsdDisplay | Form | Bsda | Bsdasri,
  siret: string
) => {
  return bsd?.metadata?.latestRevision?.approvals?.find(
    approval => approval.approverSiret === siret
  );
};

export const canApproveOrRefuseReview = (
  bsd: BsdDisplay | Form | Bsda | Bsdasri,
  siret: string
) => {
  const currentApproval = getReviewCurrentApproval(bsd, siret);

  return (
    bsd.metadata?.latestRevision?.status === RevisionRequestStatus.Pending &&
    currentApproval?.status === RevisionRequestApprovalStatus.Pending
  );
};

export const getPrimaryActionsReviewsLabel = (
  bsd: BsdDisplay,
  currentSiret: string
) => {
  if (canApproveOrRefuseReview(bsd, currentSiret)) {
    return GERER_REVISION;
  }

  if (canDeleteReview(bsd, currentSiret)) {
    return SUPRIMER_REVISION;
  }

  return CONSULTER_REVISION;
};

export const canDeleteReview = (bsd: BsdDisplay, currentSiret: string) => {
  return (
    bsd.metadata?.latestRevision?.authoringCompany?.siret === currentSiret &&
    bsd.metadata?.latestRevision?.status === RevisionRequestStatus.Pending
  );
};

export const getPrimaryActionsLabelFromBsdStatus = (
  bsd: BsdDisplay,
  currentSiret: string,
  permissions: UserPermission[],
  bsdCurrentTab?: BsdCurrentTab,
  hasAutomaticSignature?: boolean,
  emitterIsExutoireOrTtr?: boolean,
  isEmitterRegistered?: boolean
) => {
  const isReturnTab = bsdCurrentTab === "returnTab";

  if (isReturnTab) return ROAD_CONTROL;

  switch (bsd.status) {
    case BsdStatusCode.Draft:
    case BsdStatusCode.Initial:
      return getDraftOrInitialBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab!,
        isEmitterRegistered
      );
    case BsdStatusCode.Sealed:
      return getSealedBtnLabel(
        currentSiret,
        bsd,
        permissions,
        hasAutomaticSignature,
        emitterIsExutoireOrTtr
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
      return WorkflowDisplayType.REEXPEDITION;
    case BsdaType.Collection_2710:
      return WorkflowDisplayType.Collection_2710;

    case BsdasriType.Grouping:
      return WorkflowDisplayType.GRP;
    case BsdasriType.Synthesis:
      return WorkflowDisplayType.SYNTH;

    case BsffType.Groupement:
      return WorkflowDisplayType.REGROUPEMENT;
    case BsffType.Reexpedition:
      return WorkflowDisplayType.REEXPEDITION;
    case BsffType.Reconditionnement:
      return WorkflowDisplayType.RECONDITIONNEMENT;

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
    BsdStatusCode.SignedByProducer,
    BsdStatusCode.Sent
  ].includes(bsd.status);

const canDeleteBsdd = (bsd, siret) =>
  bsd.type === BsdType.Bsdd &&
  bsd.emitterType !== EmitterType.Appendix1Producer &&
  ([BsdStatusCode.Draft, BsdStatusCode.Sealed].includes(bsd.status) ||
    (bsd.status === BsdStatusCode.SignedByProducer &&
      isSameSiretEmitter(siret, bsd)));

const canDeleteBsda = (bsd, siret) =>
  bsd.type === BsdType.Bsda &&
  (bsd.status === BsdStatusCode.Initial ||
    (bsd.status === BsdStatusCode.SignedByProducer &&
      bsd.emitter?.company?.siret === siret));

const canDeleteBsdasri = (bsd, siret) =>
  bsd.type === BsdType.Bsdasri &&
  (bsd.status === BsdStatusCode.Initial ||
    (isSameSiretEmitter(siret, bsd) &&
      bsd.status === BsdStatusCode.SignedByProducer));

const canDeleteBsvhu = (bsd, siret) =>
  bsd.type === BsdType.Bsvhu &&
  (bsd.status === BsdStatusCode.Initial ||
    (isSameSiretEmitter(siret, bsd) &&
      bsd.status === BsdStatusCode.SignedByProducer));

const canDeleteBspaoh = bsd =>
  bsd.type === BsdType.Bspaoh && bsd.status === BsdStatusCode.Initial;

const canDuplicateBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri && bsd.bsdWorkflowType === BsdasriType.Simple;

const canDuplicateBsda = bsd => bsd.type === BsdType.Bsda;

const canDuplicateBsvhu = bsd => bsd.type === BsdType.Bsvhu;

const canDuplicateBspaoh = bsd => bsd.type === BsdType.Bspaoh;

const canDuplicateBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  bsd.emitterType !== EmitterType.Appendix1Producer;

export const canDuplicateBsff = (bsd, siret) => {
  const emitterSiret = bsd.emitter?.company?.siret;
  const transporterOrgsIds = bsd.transporters?.map(t => t.company?.orgId);
  const destinationSiret = bsd.destination?.company?.siret;
  return (
    bsd.type === BsdType.Bsff &&
    [emitterSiret, destinationSiret, ...transporterOrgsIds]
      .filter(Boolean)
      .includes(siret)
  );
};

export const canDuplicate = (bsd, siret) =>
  canDuplicateBsdd(bsd) ||
  canDuplicateBsdasri(bsd) ||
  canDuplicateBsff(bsd, siret) ||
  canDuplicateBsda(bsd) ||
  canDuplicateBsvhu(bsd) ||
  canDuplicateBspaoh(bsd);

export const canClone = () => {
  return import.meta.env.VITE_ALLOW_CLONING_BSDS === "true";
};

const canDeleteBsff = (bsd, siret) =>
  bsd.type === BsdType.Bsff &&
  (bsd.status === BsdStatusCode.Initial ||
    (isSameSiretEmitter(siret, bsd) &&
      bsd.status === BsdStatusCode.SignedByEmitter)) &&
  canDuplicateBsff(bsd, siret);

export const canDeleteBsd = (bsd, siret) =>
  canDeleteBsdd(bsd, siret) ||
  canDeleteBsda(bsd, siret) ||
  canDeleteBsdasri(bsd, siret) ||
  canDeleteBsff(bsd, siret) ||
  canDeleteBspaoh(bsd) ||
  canDeleteBsvhu(bsd, siret);

const canUpdateBsff = (bsd, siret) =>
  bsd.type === BsdType.Bsff &&
  [
    BsdStatusCode.Initial,
    BsdStatusCode.SignedByEmitter,
    BsdStatusCode.Sent
  ].includes(bsd.status) &&
  canDuplicateBsff(bsd, siret);

export const canReviewBsda = (bsd: BsdDisplay, siret: string) => {
  if (bsd.type !== BsdType.Bsda || bsd.status === BsdStatusCode.Initial) {
    return false;
  }

  const isDestination = isSameSiretDestination(siret, bsd);
  const isEmitter = isSameSiretEmitter(siret, bsd);
  const isWorker = isSameSiretWorker(siret, bsd);
  const isEcoOrganisme = isSameSiretEcorganisme(siret, bsd);

  return (
    (isEmitter &&
      // On ne propose pas le bouton "Réviser" à l'émetteur
      // lorsqu'il est le seul à avoir signé car il peut encore
      // modifier le BSDA
      bsd.status !== BsdStatusCode.SignedByProducer) ||
    isDestination ||
    isWorker ||
    isEcoOrganisme
  );
};

export const canReviewBsdasri = (bsd: BsdDisplay, siret: string) => {
  if (bsd.type !== BsdType.Bsdasri || bsd.status === BsdStatusCode.Initial) {
    return false;
  }

  // TRA-14348 tous les champs de révision sont grisés dans ce cas
  // donc on enlève le bouton
  if (
    bsd.bsdWorkflowType === BsdasriType.Synthesis &&
    bsd.status === BsdStatusCode.Received
  ) {
    return false;
  }

  // TRA-15009 tous les champs de révision sont grisés dans ce cas
  // donc on enlève le bouton
  if (bsd.groupedIn || bsd.synthesizedIn) {
    return false;
  }

  const isDestination = isSameSiretDestination(siret, bsd);
  const isEmitter = isSameSiretEmitter(siret, bsd);
  const isEcoOrganisme = isSameSiretEcorganisme(siret, bsd);

  return (
    (isEmitter &&
      // On ne propose pas le bouton "Réviser" à l'émetteur
      // lorsqu'il est le seul à avoir signé car il peut encore
      // modifier le BSDASRI
      bsd.status !== BsdStatusCode.SignedByProducer) ||
    isDestination ||
    isEcoOrganisme
  );
};

export const canReviewBsdd = (bsd: BsdDisplay, siret: string) => {
  if (
    bsd.type !== BsdType.Bsdd ||
    bsd.status === BsdStatusCode.Draft ||
    bsd.status === BsdStatusCode.Sealed ||
    bsd.status === BsdStatusCode.Refused
  ) {
    return false;
  }

  const isEmitter = isSameSiretEmitter(siret, bsd);
  const isDestination = isSameSiretDestination(siret, bsd);
  const isEcoOrganisme = isSameSiretEcorganisme(siret, bsd);
  const isDestinationFinale = isSameSiretFinalBsddDestination(siret, bsd);

  if (bsd.emitterType === EmitterType.Appendix1Producer) {
    const isTransporter = isSameSiretTransporter(siret, bsd);
    return (
      // On n'autorise les révisions qu'à partir de la signature transporteur
      bsd.status !== BsdStatusCode.SignedByProducer &&
      (isEmitter || isTransporter)
    );
  } else {
    // vérifier que ça s'applique aussi au bordereau de tournée dédié
    return (
      isDestination ||
      isEcoOrganisme ||
      isDestinationFinale ||
      (isEmitter &&
        // On ne propose pas le bouton "Réviser" à l'émetteur
        // lorsqu'il est le seul à avoir signé car il peut encore
        // modifier le BSDD
        bsd.status !== BsdStatusCode.SignedByProducer)
    );
  }
};

// Specs révision https://docs.google.com/spreadsheets/d/1Mp2Q2Esn3jFa3RT1NtW7WAYq0vh9-iv-xoppEoW80Hk/edit?gid=0#gid=0
export const canReviewBsd = (bsd: BsdDisplay, siret: string) => {
  return (
    (bsd.type === BsdType.Bsdd && canReviewBsdd(bsd, siret)) ||
    (bsd.type === BsdType.Bsda && canReviewBsda(bsd, siret)) ||
    (bsd.type === BsdType.Bsdasri && canReviewBsdasri(bsd, siret))
  );
};

const canUpdateBsda = bsd =>
  bsd.type === BsdType.Bsda &&
  ![
    BsdStatusCode.Processed,
    BsdStatusCode.Refused,
    BsdStatusCode.AwaitingChild
  ].includes(bsd.status);

const canUpdateBsdasri = (bsd, siret) =>
  bsd.type === BsdType.Bsdasri &&
  ![
    BsdStatusCode.Accepted,
    BsdStatusCode.Received,
    BsdStatusCode.Processed,
    BsdStatusCode.Refused
  ].includes(bsd.status) &&
  !(
    isSynthesis(bsd.bsdWorkflowType?.toString()) &&
    bsd.status === BsdStatusCode.Accepted
  ) &&
  !(
    isSynthesis(bsd.bsdWorkflowType?.toString()) &&
    [BsdStatusCode.Sealed, BsdStatusCode.Sent].includes(bsd.status) &&
    isSameSiretDestination(siret, bsd)
  );

const canUpdateBsvhu = bsd =>
  bsd.type === BsdType.Bsvhu &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status);

const canUpdateBspaoh = bsd =>
  bsd.type === BsdType.Bspaoh &&
  ![BsdStatusCode.Processed, BsdStatusCode.Refused].includes(bsd.status);

export const canUpdateBsd = (bsd, siret) =>
  canUpdateBsdd(bsd) ||
  canUpdateBsda(bsd) ||
  canUpdateBsdasri(bsd, siret) ||
  canUpdateBsff(bsd, siret) ||
  canUpdateBsvhu(bsd) ||
  canUpdateBspaoh(bsd);

export const canGeneratePdf = bsd => !bsd.isDraft;

export const canMakeCorrection = (bsd: BsdDisplay, siret: string) => {
  // On ne permet pas la correction des contenants qui sont
  // déjà inclut dans un bordereau suite
  const haveNextBsff = () =>
    !!bsd.packagings && bsd.packagings.every(p => !!p.nextBsff);

  return (
    bsd.type === BsdType.Bsff &&
    isSameSiretDestination(siret, bsd) &&
    (bsd.status === BsdStatusCode.Processed ||
      bsd.status === BsdStatusCode.Refused ||
      (bsd.status === BsdStatusCode.IntermediatelyProcessed && !haveNextBsff()))
  );
};

export const hasAppendix1Cta = (
  bsd: BsdDisplay,
  currentSiret: string
): boolean => {
  const isBroker = isSiretActorForBsd(bsd, currentSiret, [
    { type: ActorType.Broker, strict: true }
  ]);

  const isIntermediary = isSiretActorForBsd(bsd, currentSiret, [
    { type: ActorType.Intermediary, strict: true }
  ]);

  const isTrader = isSiretActorForBsd(bsd, currentSiret, [
    { type: ActorType.Trader, strict: true }
  ]);

  return (
    bsd.type === BsdType.Bsdd &&
    bsd?.emitterType === EmitterType.Appendix1 &&
    (BsdStatusCode.Sealed === bsd.status ||
      BsdStatusCode.Sent === bsd.status) &&
    !isBroker &&
    !isIntermediary &&
    !isTrader
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
    isEmetteurSign(bsd, isTransporter) &&
    !bsd.isDraft &&
    bsd.status === BsdStatusCode.Initial
  );
};

export const hasRoadControlButton = (
  bsd: BsdDisplay,
  isCollectedTab: boolean,
  isReturnTab?: boolean
) => {
  const isAppendix1 = bsd.emitterType === "APPENDIX1_PRODUCER";
  if (!isAppendix1 && isReturnTab) return true;

  // L'action principale sur le paoh collecté est la déclaration de dépôt par le transporteur
  if (bsd.type === BsdType.Bspaoh) {
    return false;
  }
  if (isAppendix1 && isCollectedTab) {
    return false;
  }
  return ["SENT", "RESENT"].includes(bsd.status) && isCollectedTab;
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
