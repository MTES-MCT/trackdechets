import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";

import { formatDate } from "../../../../common/datetime";
import Badge from "../Badge/Badge";
import InfoWithIcon from "../InfoWithIcon/InfoWithIcon";
import { InfoIconCode } from "../InfoWithIcon/infoWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";
import WasteDetails from "../WasteDetails/WasteDetails";
import {
  canEditCustomInfoOrTransporterNumberPlate,
  canPublishBsd,
  getBsdView,
  getPrimaryActionsLabelFromBsdStatus,
  getPrimaryActionsReviewsLabel,
  getWorkflowLabel,
  isBsdasri,
  isBsff,
  isBsvhu
} from "../../dashboardServices";
import BsdAdditionalActionsButton from "../BsdAdditionalActionsButton/BsdAdditionalActionsButton";
import Actors from "../Actors/Actors";
import {
  useBsdaDownloadPdf,
  useBsdasriDownloadPdf,
  useBsddDownloadPdf,
  useBsffDownloadPdf,
  useBsvhuDownloadPdf
} from "../Pdf/useDownloadPdf";
import {
  BsdType,
  CompanyType,
  EmitterType,
  Query,
  QueryCompanyPrivateInfosArgs,
  RevisionRequestStatus,
  UserPermission
} from "@td/codegen-ui";
import {
  useBsdaDuplicate,
  useBsdasriDuplicate,
  useBsddDuplicate,
  useBsffDuplicate,
  useBsvhuDuplicate
} from "../Duplicate/useDuplicate";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "../../../common/queries/company/query";
import { Loader } from "../../../common/Components";
import { BsdDisplay, BsdStatusCode } from "../../../common/types/bsdTypes";
import DeleteModal from "../DeleteModal/DeleteModal";
import { useMedia } from "../../../../common/use-media";
import { MEDIA_QUERIES } from "../../../../common/config";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";
import TransporterInfoEditModal from "../TransporterInfoEditModal/TransporterInfoEditModal";
import { NON_RENSEIGNE } from "../../../common/wordings/dashboard/wordingsDashboard";

import "./bsdCard.scss";

function BsdCard({
  bsd,
  bsdCurrentTab,
  currentSiret,
  onValidate,
  secondaryActions: {
    onOverview,
    onUpdate,
    onRevision,
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
  const [duplicateBsvhu, { loading: isDuplicatingBsvhu }] = useBsvhuDuplicate({
    ...options
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransportEditModalOpen, setIsTransportEditModalOpen] =
    useState(false);

  const isDuplicating =
    isDuplicatingBsdd ||
    isDuplicatingBsda ||
    isDuplicatingBsdasri ||
    isDuplicatingBsff ||
    isDuplicatingBsvhu;

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

  const actionsLabel = useMemo(
    () =>
      getPrimaryActionsLabelFromBsdStatus(
        bsdDisplay!,
        currentSiret,
        permissions,
        bsdCurrentTab,
        hasAutomaticSignature,
        emitterIsExutoireOrTtr
      ),
    [
      bsdCurrentTab,
      bsdDisplay,
      currentSiret,
      hasAutomaticSignature,
      permissions,
      emitterIsExutoireOrTtr
    ]
  );
  const ctaPrimaryLabel = bsdDisplay?.type ? actionsLabel : "";

  const ctaPrimaryReviewLabel = bsdDisplay?.type
    ? getPrimaryActionsReviewsLabel(bsdDisplay, currentSiret)
    : "";

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
    },
    [
      downloadBsdaPdf,
      downloadBsdasriPdf,
      downloadBsddPdf,
      downloadBsffPdf,
      downloadBsvhuPdf
    ]
  );

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
    },
    [
      duplicateBsda,
      duplicateBsdasri,
      duplicateBsdd,
      duplicateBsff,
      duplicateBsvhu
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
  const transporterNameEmmiter = emitterIsTransporter
    ? bsdDisplay?.emitter?.company?.name
    : bsdDisplay?.transporter?.company?.name;

  const transporterName = transporterNameEmmiter || NON_RENSEIGNE;

  const unitOfMeasure =
    isBsdasri(bsdDisplay?.type!) || isBsff(bsdDisplay?.type!) ? "kg" : "t";

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

  return (
    <>
      <div className="bsd-card" tabIndex={0}>
        {bsdDisplay && (
          <>
            <div className="bsd-card__header">
              <div>
                <p className="bsd-number">N°: {bsdDisplay.readableid}</p>

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
                  {((isToCollectTab && !isBsvhu(bsdDisplay.type)) ||
                    (isCollectedTab &&
                      Boolean(bsdDisplay?.transporterCustomInfo?.length))) && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.CustomInfo}
                      editableInfos={{
                        customInfo: bsdDisplay?.transporterCustomInfo
                      }}
                      hasEditableInfos
                      isDisabled={
                        isCollectedTab ||
                        !canEditCustomInfoOrTransporterNumberPlate(
                          bsdDisplay,
                          permissions
                        )
                      }
                      onClick={handleEditableInfoClick}
                    />
                  )}
                  {((isToCollectTab && !isBsvhu(bsdDisplay.type)) ||
                    (isCollectedTab &&
                      Boolean(bsdDisplay?.transporterNumberPlate?.length))) && (
                    <InfoWithIcon
                      labelCode={InfoIconCode.TransporterNumberPlate}
                      editableInfos={{
                        transporterNumberPlate:
                          bsdDisplay?.transporterNumberPlate
                      }}
                      hasEditableInfos
                      isDisabled={
                        isCollectedTab ||
                        !canEditCustomInfoOrTransporterNumberPlate(
                          bsdDisplay,
                          permissions
                        )
                      }
                      onClick={handleEditableInfoClick}
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
                    Boolean(bsdDisplay.wasteDetails?.weight)
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
      {isDuplicating && <Loader />}

      <TransporterInfoEditModal
        bsd={bsdDisplay!}
        isOpen={isTransportEditModalOpen}
        onClose={onCloseTransportEditModal}
      />
    </>
  );
}

export default React.memo(BsdCard);
