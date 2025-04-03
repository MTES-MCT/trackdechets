import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";

import { formatDate } from "../../../../common/datetime";
import Badge from "../Badge/Badge";
import InfoWithIcon from "../InfoWithIcon/InfoWithIcon";
import { InfoIconCode } from "../InfoWithIcon/infoWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";
import WasteDetails from "../WasteDetails/WasteDetails";
import {
  canPublishBsd,
  getBsdView,
  getPrimaryActionsLabelFromBsdStatus,
  getPrimaryActionsReviewsLabel,
  getWorkflowLabel,
  isBsdasri,
  isBsff,
  isBspaoh
} from "../../dashboardServices";
import BsdAdditionalActionsButton from "../BsdAdditionalActionsButton/BsdAdditionalActionsButton";
import Actors from "../Actors/Actors";
import {
  useBsdaDownloadPdf,
  useBsdasriDownloadPdf,
  useBsddDownloadPdf,
  useBsffDownloadPdf,
  useBsvhuDownloadPdf,
  useBspaohDownloadPdf
} from "../Pdf/useDownloadPdf";
import {
  BsdType,
  CompanyType,
  EmitterType,
  Query,
  QueryCompanyPrivateInfosArgs,
  RevisionRequestStatus,
  TransportMode,
  UserPermission
} from "@td/codegen-ui";
import {
  useBsdaDuplicate,
  useBsdasriDuplicate,
  useBsddDuplicate,
  useBsffDuplicate,
  useBsvhuDuplicate,
  useBspaohDuplicate
} from "../Duplicate/useDuplicate";
import {
  COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS,
  COMPANY_SELECTOR_PRIVATE_INFOS
} from "../../../common/queries/company/query";
import { Loader } from "../../../common/Components";
import { BsdDisplay, BsdStatusCode } from "../../../common/types/bsdTypes";
import DeleteModal from "../DeleteModal/DeleteModal";
import { useMedia } from "../../../../common/use-media";
import { MEDIA_QUERIES } from "../../../../common/config";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";
import TransporterInfoEditModal from "../TransporterInfoEditModal/TransporterInfoEditModal";
import { NON_RENSEIGNE } from "../../../common/wordings/dashboard/wordingsDashboard";

import "./bsdCard.scss";
import { getCurrentTransporterInfos } from "../../bsdMapper";
import { isDefined } from "../../../../common/helper";
import { useCloneBsd } from "../Clone/useCloneBsd";
import copyTextToClipboard from "copy-text-to-clipboard";
import Button from "@codegouvfr/react-dsfr/Button";

const shouldDisplayTransporterNumberPlate = (
  currentTransporterInfos,
  isToCollectTab
) => {
  if (!currentTransporterInfos) return false;

  const isRoad =
    currentTransporterInfos.transporterMode === TransportMode.Road ||
    // permet de gérer un trou dans la raquette en terme de validation des données
    // qui ne rend pas le mode de transport obligatoire à la signature transporteur
    // en attente de correction Cf ticket tra-14517
    !currentTransporterInfos.transporterMode;

  if (!isRoad) return false;

  const platesAreDefined = Boolean(
    currentTransporterInfos?.transporterNumberPlate?.length
  );

  return platesAreDefined || isToCollectTab;
};

function BsdCard({
  bsd,
  posInSet = 0,
  setSize = -1,
  bsdCurrentTab,
  currentSiret,
  onValidate,
  secondaryActions: {
    onOverview,
    onUpdate,
    onRevision,
    onCorrection,
    onBsdSuite,
    onAppendix1,
    onConsultReview,
    onEmitterDasriSign,
    onEmitterBsddSign
  },
  hasAutomaticSignature
}: BsdCardProps) {
  const { permissions } = usePermissions();
  const isReviewsTab =
    bsdCurrentTab === "reviewedTab" || bsdCurrentTab === "toReviewTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";
  const isCollectedTab = bsdCurrentTab === "collectedTab";
  const bsdDisplay = getBsdView(bsd);

  const options = {
    variables: { id: bsd.id }
  };
  const [downloadBsddPdf] = useBsddDownloadPdf({
    ...options
  });
  const [downloadBsdaPdf] = useBsdaDownloadPdf({
    ...options
  });
  const [downloadBsdasriPdf] = useBsdasriDownloadPdf({
    ...options
  });
  const [downloadBsffPdf] = useBsffDownloadPdf({
    ...options
  });
  const [downloadBsvhuPdf] = useBsvhuDownloadPdf({
    ...options
  });
  const [downloadBspaohPdf] = useBspaohDownloadPdf({
    ...options
  });
  const [duplicateBsdd, { loading: isDuplicatingBsdd }] = useBsddDuplicate({
    ...options
  });
  const [duplicateBsda, { loading: isDuplicatingBsda }] = useBsdaDuplicate({
    ...options
  });
  const [duplicateBsdasri, { loading: isDuplicatingBsdasri }] =
    useBsdasriDuplicate({
      ...options
    });
  const [duplicateBsff, { loading: isDuplicatingBsff }] = useBsffDuplicate({
    ...options
  });
  const [cloneBsd, { loading: isCloningBsd }] = useCloneBsd({
    ...options
  });
  const [duplicateBsvhu, { loading: isDuplicatingBsvhu }] = useBsvhuDuplicate({
    ...options
  });
  const [duplicateBspaoh, { loading: isDuplicatingBspaoh }] =
    useBspaohDuplicate({
      ...options
    });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransportEditModalOpen, setIsTransportEditModalOpen] =
    useState(false);

  const [isBsdNumberClicked, setIsBsdNumberClicked] = useState(false);

  const isDuplicating =
    isDuplicatingBsdd ||
    isDuplicatingBsda ||
    isDuplicatingBsdasri ||
    isDuplicatingBsff ||
    isDuplicatingBsvhu ||
    isDuplicatingBspaoh;

  const updatedAt = bsdDisplay?.updatedAt
    ? formatDate(bsdDisplay.updatedAt)
    : "";

  const { data: emitterCompanyData } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
    variables: { clue: bsd.emitter?.company?.siret! },
    skip:
      !bsdDisplay ||
      bsdDisplay.emitterType !== EmitterType.Appendix1Producer ||
      bsdDisplay.transporter?.company?.siret !== currentSiret
  });

  const emitterIsExutoireOrTtr = Boolean(
    emitterCompanyData?.companyPrivateInfos.companyTypes.filter(type =>
      [CompanyType.Wasteprocessor, CompanyType.Collector].includes(type)
    )?.length
  );

  const { data: dataEmitterRegistered } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: { clue: bsd.emitter?.company?.siret! }
  });

  const isEmitterRegistered =
    dataEmitterRegistered?.companyPrivateInfos?.isRegistered;

  const actionsLabel = useMemo(
    () =>
      getPrimaryActionsLabelFromBsdStatus(
        bsdDisplay!,
        currentSiret,
        permissions,
        bsdCurrentTab,
        hasAutomaticSignature,
        emitterIsExutoireOrTtr,
        isEmitterRegistered
      ),
    [
      bsdCurrentTab,
      bsdDisplay,
      currentSiret,
      hasAutomaticSignature,
      permissions,
      emitterIsExutoireOrTtr,
      isEmitterRegistered
    ]
  );
  const ctaPrimaryLabel = bsdDisplay?.type ? actionsLabel : "";

  const ctaPrimaryReviewLabel = bsdDisplay?.type
    ? getPrimaryActionsReviewsLabel(bsdDisplay, currentSiret)
    : "";

  const isTransportTabs = isToCollectTab || isCollectedTab;

  const currentTransporterInfos = useMemo(() => {
    return getCurrentTransporterInfos(bsd, currentSiret, isToCollectTab);
  }, [bsd, currentSiret, isToCollectTab]);

  // display the transporter's custom info if:
  // - we are in the "To Collect" tab
  // OR
  // - we are in the "Collected" tab and there is a custom info
  const displayTransporterCustomInfo =
    isTransportTabs &&
    !!currentTransporterInfos &&
    (isToCollectTab ||
      (isCollectedTab &&
        !!currentTransporterInfos?.transporterCustomInfo?.length));

  const displayTransporterNumberPlate = shouldDisplayTransporterNumberPlate(
    currentTransporterInfos,
    isToCollectTab
  );

  const handleValidationClick = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onValidate(bsd);
  };
  const handleEditableInfoClick = () => {
    setIsTransportEditModalOpen(true);
  };

  const onPdf = useCallback(
    (bsd: BsdDisplay) => {
      if (bsd.type === BsdType.Bsdd) {
        downloadBsddPdf();
      }
      if (bsd.type === BsdType.Bsda) {
        downloadBsdaPdf();
      }
      if (bsd.type === BsdType.Bsdasri) {
        downloadBsdasriPdf();
      }
      if (bsd.type === BsdType.Bsff) {
        downloadBsffPdf();
      }
      if (bsd.type === BsdType.Bsvhu) {
        downloadBsvhuPdf();
      }
      if (bsd.type === BsdType.Bspaoh) {
        downloadBspaohPdf();
      }
    },
    [
      downloadBsdaPdf,
      downloadBsdasriPdf,
      downloadBsddPdf,
      downloadBsffPdf,
      downloadBsvhuPdf,
      downloadBspaohPdf
    ]
  );

  const onClone = useCallback(() => {
    cloneBsd();
  }, [cloneBsd]);

  const onDuplicate = useCallback(
    (bsd: BsdDisplay) => {
      if (bsd.type === BsdType.Bsdd) {
        duplicateBsdd();
      }
      if (bsd.type === BsdType.Bsda) {
        duplicateBsda();
      }
      if (bsd.type === BsdType.Bsdasri) {
        duplicateBsdasri();
      }
      if (bsd.type === BsdType.Bsff) {
        duplicateBsff();
      }
      if (bsd.type === BsdType.Bsvhu) {
        duplicateBsvhu();
      }
      if (bsd.type === BsdType.Bspaoh) {
        duplicateBspaoh();
      }
    },
    [
      duplicateBsda,
      duplicateBsdasri,
      duplicateBsdd,
      duplicateBsff,
      duplicateBsvhu,
      duplicateBspaoh
    ]
  );

  const onCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const onCloseTransportEditModal = () => {
    setIsTransportEditModalOpen(false);
  };

  const onDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const emitterIsTransporter =
    bsdDisplay?.emitter?.company?.siret !== null &&
    bsdDisplay?.transporter?.company?.siret !== null &&
    bsdDisplay?.emitter?.company?.siret ===
      bsdDisplay?.transporter?.company?.siret;
  const transporterNameEmitter = emitterIsTransporter
    ? bsdDisplay?.emitter?.company?.name
    : bsdDisplay?.transporter?.company?.name;

  const transporterName = transporterNameEmitter || NON_RENSEIGNE;

  const unitOfMeasure =
    isBsdasri(bsdDisplay?.type!) ||
    isBsff(bsdDisplay?.type!) ||
    isBspaoh(bsdDisplay?.type!)
      ? "kg"
      : "t";

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);
  const pickupSiteName =
    bsdDisplay?.emitter?.pickupSite?.name ||
    bsdDisplay?.emitter?.workSite?.name;

  const latestRevision = bsdDisplay?.metadata?.latestRevision;
  const reviewStatus = isReviewsTab
    ? latestRevision?.status
    : latestRevision?.status === RevisionRequestStatus.Pending
    ? latestRevision?.status
    : null;

  const isNoTraceability = (bsd: BsdDisplay) =>
    bsd.packagings?.length &&
    bsd.packagings?.every(packaging => packaging.operation?.noTraceability);

  const handleBsdNumberClick = () => {
    setIsBsdNumberClicked(true);
    copyTextToClipboard(bsdDisplay!.readableid);
    setTimeout(() => {
      setIsBsdNumberClicked(false);
    }, 2000);
  };

  return (
    <>
      <div
        className="bsd-card"
        tabIndex={0}
        aria-posinset={posInSet}
        aria-setsize={setSize}
        role="article"
      >
        {bsdDisplay && (
          <>
            <div className="bsd-card__header">
              <div>
                <Button
                  type="button"
                  className={`label-icon__copy label-icon__copy fr-btn--icon-right ${
                    isBsdNumberClicked ? "btn-clicked" : ""
                  }`}
                  priority="tertiary no outline"
                  title="Cliquez pour copier dans le presse-papier"
                  aria-label={`${bsdDisplay.readableid}, copier dans le presse-papier`}
                  iconId={
                    isBsdNumberClicked ? "ri-check-line" : "ri-file-copy-line"
                  }
                  onClick={handleBsdNumberClick}
                  nativeButtonProps={{
                    ...{ "data-testid": bsdDisplay.readableid }
                  }}
                >
                  {bsdDisplay.readableid}
                </Button>

                {isMobile && <div className="bsd-card-border" />}
                <div className="bsd-card__header__infos">
                  {bsdDisplay.customId && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.CustomId}
                      info={bsdDisplay.customId}
                    />
                  )}
                  {bsdDisplay?.isTempStorage && (
                    <InfoWithIcon labelCode={InfoIconCode.TempStorage} />
                  )}
                  {getWorkflowLabel(bsdDisplay.bsdWorkflowType) && (
                    <p className="workflow-type">
                      {getWorkflowLabel(bsdDisplay.bsdWorkflowType)}
                    </p>
                  )}
                  {updatedAt && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.LastModificationDate}
                      info={updatedAt}
                    />
                  )}
                  {bsdDisplay?.ecoOrganisme?.name && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.EcoOrganism}
                      info={bsdDisplay?.ecoOrganisme?.name}
                    />
                  )}
                  {pickupSiteName && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.PickupSite}
                      info={pickupSiteName}
                    />
                  )}
                  {displayTransporterCustomInfo && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.CustomInfo}
                      editableInfos={{
                        customInfo:
                          currentTransporterInfos?.transporterCustomInfo
                      }}
                      hasEditableInfos
                      isDisabled={
                        isCollectedTab ||
                        !permissions.includes(UserPermission.BsdCanUpdate)
                      }
                      onClick={handleEditableInfoClick}
                    />
                  )}
                  {displayTransporterNumberPlate && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.TransporterNumberPlate}
                      editableInfos={{
                        transporterNumberPlate:
                          currentTransporterInfos?.transporterNumberPlate
                      }}
                      hasEditableInfos={isToCollectTab}
                      info={currentTransporterInfos?.transporterNumberPlate?.toString()}
                      isDisabled={
                        isCollectedTab ||
                        !permissions.includes(UserPermission.BsdCanUpdate)
                      }
                      onClick={handleEditableInfoClick}
                    />
                  )}
                  {bsdDisplay?.destination?.["cap"] && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.Cap}
                      info={bsdDisplay?.destination?.["cap"]}
                    />
                  )}
                </div>
                {isMobile && <div className="bsd-card-border" />}
              </div>
            </div>
            <div className="bsd-card__content">
              <div className="bsd-card__content__infos">
                <WasteDetails
                  wasteType={bsdDisplay.type}
                  code={bsdDisplay.wasteDetails.code!}
                  name={bsdDisplay.wasteDetails.name!}
                  weight={
                    isDefined(bsdDisplay.wasteDetails?.weight)
                      ? `${bsdDisplay.wasteDetails.weight} ${unitOfMeasure}`
                      : ""
                  }
                />
                <div className="bsd-card__content__infos__status">
                  <Badge
                    status={
                      isNoTraceability(bsdDisplay)
                        ? BsdStatusCode.NoTraceability
                        : bsdDisplay.status
                    }
                    isDraft={bsdDisplay.isDraft}
                    bsdType={bsdDisplay.type}
                    reviewStatus={reviewStatus}
                    operationCode={
                      bsdDisplay?.destination?.["operation"]?.["code"] ||
                      bsdDisplay?.destination?.["plannedOperationCode"]
                    }
                    bsdaAnnexed={
                      !!bsdDisplay?.forwardedIn?.id ||
                      !!bsdDisplay?.groupedIn?.id
                    }
                    transporters={bsdDisplay.transporters}
                  />
                </div>
                {isMobile && <div className="bsd-card-border" />}

                <Actors
                  emitterName={bsdDisplay.emitter?.company?.name!}
                  transporterName={transporterName}
                  destinationName={bsdDisplay.destination?.company?.name!}
                  workerCompanyName={bsdDisplay?.worker?.company?.name?.toString()}
                />
              </div>
              <div className="bsd-card__content__cta">
                {!isReviewsTab &&
                  canPublishBsd(bsdDisplay, currentSiret) &&
                  ctaPrimaryLabel && (
                    <button
                      data-testid={`bsd-card-btn-primary-${bsdDisplay.readableid}`}
                      type="button"
                      className="fr-btn fr-btn--sm"
                      onClick={handleValidationClick}
                    >
                      {ctaPrimaryLabel}
                      <span className="fr-sr-only">
                        bordereau numéro {bsdDisplay.readableid}
                      </span>
                    </button>
                  )}

                {isReviewsTab &&
                  permissions.includes(UserPermission.BsdCanRevise) && (
                    <button
                      data-testid={`bsd-card-btn-review-primary-${bsdDisplay.readableid}`}
                      type="button"
                      className="fr-btn fr-btn--sm"
                      onClick={handleValidationClick}
                    >
                      {ctaPrimaryReviewLabel}
                    </button>
                  )}

                <BsdAdditionalActionsButton
                  bsd={bsdDisplay}
                  permissions={permissions}
                  currentSiret={currentSiret}
                  actionList={{
                    onOverview,
                    onDelete,
                    onDuplicate,
                    onUpdate,
                    onRevision,
                    onCorrection,
                    onClone,
                    onPdf,
                    onAppendix1,
                    onBsdSuite,
                    onConsultReview,
                    onEmitterDasriSign,
                    onEmitterBsddSign
                  }}
                  hideReviewCta={isReviewsTab}
                  isToCollectTab={isToCollectTab}
                  hasAutomaticSignature={hasAutomaticSignature}
                  emitterIsExutoireOrTtr={emitterIsExutoireOrTtr}
                />
              </div>
            </div>

            <DeleteModal
              bsdId={bsdDisplay.id}
              bsdType={bsdDisplay.type}
              isOpen={isDeleteModalOpen}
              onClose={onCloseDeleteModal}
            />
          </>
        )}
      </div>
      {(isDuplicating || isCloningBsd) && <Loader />}

      <TransporterInfoEditModal
        bsd={bsdDisplay!}
        currentTransporter={currentTransporterInfos!}
        isOpen={isTransportEditModalOpen}
        onClose={onCloseTransportEditModal}
      />
    </>
  );
}

export default React.memo(BsdCard);
