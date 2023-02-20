import {
  BsdDisplay,
  BsdStatusCode,
  WorkflowDisplayType,
} from "../Common/types/bsdTypes";
import { formatBsd } from "./bsdMapper";
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
} from "../Common/wordings/dashboard/wordingsDashboard";
import { BsdCurrentTab } from "Apps/Common/types/commonTypes";

export const getBsdView = (bsd): BsdDisplay | null => {
  const bsdView = formatBsd(bsd);
  return bsdView;
};

// a revoir avec harmonisation des codes status
export const getBsdStatusLabel = (
  status: string,
  isDraft: boolean | undefined,
  bsdType: BsdType | undefined
) => {
  switch (status) {
    case BsdStatusCode.DRAFT:
      return BROUILLON;
    case BsdStatusCode.SEALED:
      return EN_ATTENTE_SIGNATURE_EMETTEUR;
    case BsdStatusCode.SENT:
      return EN_ATTENTE_RECEPTION;
    case BsdStatusCode.RECEIVED:
      return RECU;
    case BsdStatusCode.ACCEPTED:
      return ACCEPTE;
    case BsdStatusCode.PROCESSED:
      return TRAITE;
    case BsdStatusCode.AWAITING_GROUP:
      return EN_ATTENTE_REGROUPEMENT;
    case BsdStatusCode.GROUPED:
      return ANNEXE_BORDEREAU_REGROUPEMENT;
    case BsdStatusCode.NO_TRACEABILITY:
      return REGROUPE_AVEC_RUPTURE_TRACABILITE;
    case BsdStatusCode.REFUSED:
      return REFUSE;
    case BsdStatusCode.TEMP_STORED:
      return ARRIVE_ENTREPOS_PROVISOIRE;
    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      return ENTREPOS_TEMPORAIREMENT;
    case BsdStatusCode.RESEALED:
      return EN_ATTENTE_SIGNATURE_ENTREPOS_PROVISOIRE;
    case BsdStatusCode.RESENT:
      return EN_ATTENTE_SIGNATURE;
    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return SIGNE_PAR_PRODUCTEUR;
    case BsdStatusCode.INITIAL:
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
      return SIGNE_PAR_EMETTEUR;
    case BsdStatusCode.INTERMEDIATELY_PROCESSED:
      return ANNEXE_BORDEREAU_REGROUPEMENT;
    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      return SIGNER_PAR_ENTREPOS_PROVISOIRE;
    case BsdStatusCode.PARTIALLY_REFUSED:
      return PARTIELLEMENT_REFUSE;
    case BsdStatusCode.FOLLOWED_WITH_PNTTD:
      return SUIVI_PAR_PNTTD;
    case BsdStatusCode.SIGNED_BY_WORKER:
      return SIGNER_PAR_ENTREPRISE_TRAVAUX;
    case BsdStatusCode.AWAITING_CHILD:
      return EN_ATTENTE_OU_BSD_SUITE;

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

const isDraft = (bsd: BsdDisplay) => {
  if (bsd.isDraft) {
    return (
      isBsda(bsd.type) ||
      isBsff(bsd.type) ||
      isBsdasri(bsd.type) ||
      isBsvhu(bsd.type)
    );
  }
  return false;
};

const isBsdaSign = (bsd: BsdDisplay, currentSiret: string) => {
  if (isBsda(bsd.type)) {
    return (
      (isCollection_2710(bsd.bsdWorkflowType?.toString()) &&
        isSameSiretDestination(currentSiret, bsd)) ||
      // @ts-ignore
      (bsd.emitter?.isPrivateIndividual &&
        bsd.worker?.isDisabled &&
        isSameSiretTransporter(currentSiret, bsd))
    );
  }
  return false;
};

const isBsvhuSign = (bsd: BsdDisplay, currentSiret: string) =>
  isBsvhu(bsd.type) && isSameSiretEmmiter(currentSiret, bsd);

const isBsffSign = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab: BsdCurrentTab
) => {
  const isActTab = bsdCurrentTab === "actTab";
  return isBsff(bsd.type) && !isActTab && isSameSiretEmmiter(currentSiret, bsd);
};

const isEmetteurSign = (bsd: BsdDisplay, isTransporter: boolean) =>
  isTransporter && !isSynthesis(bsd.bsdWorkflowType?.toString());

const isEcoOrgSign = (bsd: BsdDisplay, isHolder: boolean) =>
  isHolder && !isSynthesis(bsd.bsdWorkflowType?.toString());

const getIsNonDraftLabel = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (isBsvhuSign(bsd, currentSiret)) {
    return SIGNER;
  }
  if (
    isBsffSign(bsd, currentSiret, bsdCurrentTab) ||
    isBsdaSign(bsd, currentSiret)
  ) {
    return SIGNER;
  }
  if (isBsdasri(bsd.type)) {
    const isEcoOrganisme = currentSiret === bsd.ecoOrganisme?.siret;
    const isHolder = isSameSiretEmmiter(currentSiret, bsd) || isEcoOrganisme;
    const isTransporter = isSameSiretTransporter(currentSiret, bsd);

    if (isActTab && isEcoOrgSign(bsd, isHolder)) {
      if (isEcoOrganisme) {
        return SIGNATURE_ECO_ORG;
      }
      return SIGNATURE_PRODUCTEUR;
    }

    if (isToCollectTab && isEmetteurSign(bsd, isTransporter)) {
      return SIGNATURE_EMETTEUR;
    }
    return "";
  }

  if (isSameSiretEmmiter(currentSiret, bsd)) {
    return SIGNATURE_EMETTEUR;
  }
  return "";
};

const getDraftBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  if (isBsdd(bsd.type)) {
    return VALIDER;
  }
  if (isDraft(bsd)) {
    return PUBLIER;
  } else if (!bsd.isDraft) {
    return getIsNonDraftLabel(bsd, currentSiret, bsdCurrentTab);
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

const getSentBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab";

  if (isBsdd(bsd.type)) {
    if (isSameSiretDestination(currentSiret, bsd) && bsd.isTempStorage) {
      return VALIDER_ENTREPOSAGE_PROVISOIRE;
    }
    return VALIDER_RECEPTION;
  }
  if (
    (isBsdasri(bsd.type) &&
      isActTab &&
      currentSiret === bsd.destination?.company?.siret) ||
    (isBsff(bsd.type) && isActTab && isSameSiretDestination(currentSiret, bsd))
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

const getReceivedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isActTab = bsdCurrentTab === "actTab";
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
  if (
    isBsff(bsd.type) &&
    isActTab &&
    isSameSiretDestination(currentSiret, bsd)
  ) {
    // ajouter bsff status received with packagings see dashboard/components/BSDList/BSFF/WorkflowAction/WorkflowAction.tsx
    return SIGNATURE_ACCEPTATION_CONTENANT;
  }

  if (
    isBsdasri(bsd.type) &&
    isActTab &&
    isSameSiretDestination(currentSiret, bsd)
  ) {
    return SIGNER_RECEPTION;
  }
  return "";
};

const getSignByProducerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay,
  bsdCurrentTab: BsdCurrentTab
): string => {
  const isToCollectTab = bsdCurrentTab === "toCollectTab";

  if (isBsdd(bsd.type) && isSameSiretTransporter(currentSiret, bsd)) {
    return SIGNATURE_TRANSPORTEUR;
  }

  if (isBsdasri(bsd.type)) {
    if (!isSameSiretTransporter(currentSiret, bsd) || !isToCollectTab) {
      return "";
    }

    if (
      isSameSiretTransporter(currentSiret, bsd) &&
      !isSynthesis(bsd.bsdWorkflowType?.toString())
    ) {
      return SIGNATURE_TRANSPORTEUR;
    }
  }
  if (
    (isBsda(bsd.type) &&
      currentSiret === bsd.transporter?.company?.orgId &&
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
    return SIGNER_ENLEVEMENT;
  }
  if (isSameSiretTransporter(currentSiret, bsd)) {
    return SIGNER_ENLEVEMENT;
  }
  return "";
};

const getAcceptedBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsff(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    // ajouter bsff status accepted with packagings see dashboard/components/BSDList/BSFF/WorkflowAction/WorkflowAction.tsx
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

const getResentBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (
    isBsdd(bsd.type) &&
    isSameSiretTemporaryStorageDestination(currentSiret, bsd)
  ) {
    return VALIDER_RECEPTION;
  }
  return "";
};

const getResealedBtnLabel = (currentSiret: string, bsd: BsdDisplay): string => {
  if (isBsdd(bsd.type) && hasTemporaryStorage(currentSiret, bsd)) {
    return SIGNER_ENTREPOSAGE_PROVISOIRE;
  }
  return "";
};

const getTempStoredBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    return VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE;
  }
  return "";
};

const getTempStorerAcceptedBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (isBsdd(bsd.type) && isSameSiretDestination(currentSiret, bsd)) {
    return VALIDER_TRAITEMENT;
  }
  return "";
};

const getSignTempStorerBtnLabel = (
  currentSiret: string,
  bsd: BsdDisplay
): string => {
  if (
    isBsdd(bsd.type) &&
    isSameSiretTemporaryStorageTransporter(currentSiret, bsd)
  ) {
    return SIGNATURE_TRANSPORTEUR;
  }
  return "";
};

/* à revoir avec harmonisation libéllés et status */
export const getCtaLabelFromStatus = (
  bsd: BsdDisplay,
  currentSiret: string,
  bsdCurrentTab?: BsdCurrentTab
) => {
  switch (bsd.status) {
    case BsdStatusCode.DRAFT:
    case BsdStatusCode.INITIAL:
      return getDraftBtnLabel(currentSiret, bsd, bsdCurrentTab!);
    case BsdStatusCode.SEALED:
      return getSealedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.SENT:
      return getSentBtnLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.RESENT:
      return getResentBtnLabel(currentSiret, bsd);

    case BsdStatusCode.RESEALED:
      return getResealedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.TEMP_STORED:
      return getTempStoredBtnLabel(currentSiret, bsd);

    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      return getTempStorerAcceptedBtnLabel(currentSiret, bsd);

    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      return getSignTempStorerBtnLabel(currentSiret, bsd);

    case BsdStatusCode.RECEIVED:
    case BsdStatusCode.PARTIALLY_REFUSED:
      return getReceivedBtnLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.AWAITING_CHILD:
      return "";

    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return getSignByProducerBtnLabel(currentSiret, bsd, bsdCurrentTab!);

    case BsdStatusCode.SIGNED_BY_EMITTER:
      return getSignedByEmitterLabel(currentSiret, bsd, bsdCurrentTab!);

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
  // à vérifier
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
  /* a faire 

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
    isSameSiretDestination(currentSiret, bsd) &&
    bsd.type === BsdType.Bsdd
  );
};

const canUpdateOrDeleteBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  [BsdStatusCode.DRAFT, BsdStatusCode.SEALED].includes(bsd.status);

const canDeleteBsda = (bsd, siret) =>
  bsd.type === BsdType.Bsda &&
  (bsd.status === BsdStatusCode.INITIAL ||
    (bsd.status === BsdStatusCode.SIGNED_BY_PRODUCER &&
      bsd.emitter?.company?.siret === siret));

const canDeleteBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri && bsd.status === BsdStatusCode.INITIAL;

const canDeleteBsvhu = bsd =>
  bsd.type === BsdType.Bsvhu && bsd.status === BsdStatusCode.INITIAL;

export const canDuplicate = bsd =>
  bsd.type === BsdType.Bsdasri
    ? bsd.bsdWorkflowType === BsdasriType.Simple
    : true;

export const canDuplicateBsff = (bsd, siret) => {
  const emitterSiret = bsd.emitter?.company?.siret;
  const transporterSiret = bsd.transporter?.company?.siret;
  const destinationSiret = bsd.destination?.company?.siret;
  return (
    bsd.type === BsdType.Bsff &&
    [emitterSiret, transporterSiret, destinationSiret].includes(siret)
  );
};

const canDeleteBsff = (bsd, siret) =>
  bsd.type === BsdType.Bsff &&
  bsd.status === BsdStatusCode.INITIAL &&
  canDuplicateBsff(bsd, siret);

export const canDeleteBsd = (bsd, siret) =>
  canUpdateOrDeleteBsdd(bsd) ||
  canDeleteBsda(bsd, siret) ||
  canDeleteBsdasri(bsd) ||
  canDeleteBsff(bsd, siret) ||
  canDeleteBsvhu(bsd);

const canUpdateBsff = (bsd, siret) =>
  bsd.type === BsdType.Bsff &&
  ![BsdStatusCode.PROCESSED, BsdStatusCode.REFUSED].includes(bsd.status) &&
  canDuplicateBsff(bsd, siret);

const canReviewBsda = (bsd, siret) =>
  bsd.type === BsdType.Bsda && !canDeleteBsda(bsd, siret);

const canReviewBsdd = bsd =>
  bsd.type === BsdType.Bsdd &&
  ![BsdStatusCode.DRAFT, BsdStatusCode.SEALED, BsdStatusCode.REFUSED].includes(
    bsd.status
  );

export const canReviewBsd = (bsd, siret) =>
  canReviewBsdd(bsd) || canReviewBsda(bsd, siret);

const canUpdateBsda = bsd =>
  bsd.type === BsdType.Bsda &&
  ![
    BsdStatusCode.PROCESSED,
    BsdStatusCode.REFUSED,
    BsdStatusCode.AWAITING_CHILD,
  ].includes(bsd.status);

const canUpdateBsdasri = bsd =>
  bsd.type === BsdType.Bsdasri &&
  ![BsdStatusCode.PROCESSED, BsdStatusCode.REFUSED].includes(bsd.status);

const canUpdateBsvhu = bsd =>
  bsd.type === BsdType.Bsvhu &&
  ![BsdStatusCode.PROCESSED, BsdStatusCode.REFUSED].includes(bsd.status);

export const canUpdateBsd = (bsd, siret) =>
  canUpdateOrDeleteBsdd(bsd) ||
  canUpdateBsda(bsd) ||
  canUpdateBsdasri(bsd) ||
  canUpdateBsff(bsd, siret) ||
  canUpdateBsvhu(bsd);

export const canGeneratePdf = bsd => bsd.type === BsdType.Bsff || !bsd.isDraft;
