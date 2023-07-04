import React, { useState } from "react";

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
} from "../../dashboardServices";
import BsdAdditionalActionsButton from "../BsdAdditionalActionsButton/BsdAdditionalActionsButton";
import Actors from "../Actors/Actors";
import {
  useBsdaDownloadPdf,
  useBsdasriDownloadPdf,
  useBsddDownloadPdf,
  useBsffDownloadPdf,
  useBsvhuDownloadPdf,
} from "Apps/Dashboard/Components/Pdf/useDownloadPdf";
import { BsdType } from "generated/graphql/types";

import "./bsdCard.scss";
import {
  useBsdaDuplicate,
  useBsdasriDuplicate,
  useBsddDuplicate,
  useBsffDuplicate,
  useBsvhuDuplicate,
} from "Apps/Dashboard/Components/Duplicate/useDuplicate";
import { Loader } from "Apps/common/Components";
import { BsdDisplay } from "Apps/common/types/bsdTypes";
import DeleteModal from "../DeleteModal/DeleteModal";

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
    onDeleteReview,
  },
}: BsdCardProps) {
  const isReviewsTab = bsdCurrentTab === "reviewsTab";
  const bsdDisplay = getBsdView(bsd);

  const options = {
    variables: { id: bsd.id },
  };
  const [downloadBsddPdf] = useBsddDownloadPdf({
    ...options,
  });
  const [downloadBsdaPdf] = useBsdaDownloadPdf({
    ...options,
  });
  const [downloadBsdasriPdf] = useBsdasriDownloadPdf({
    ...options,
  });
  const [downloadBsffPdf] = useBsffDownloadPdf({
    ...options,
  });
  const [downloadBsvhuPdf] = useBsvhuDownloadPdf({
    ...options,
  });

  const [duplicateBsdd, { loading: isDuplicatingBsdd }] = useBsddDuplicate({
    ...options,
  });
  const [duplicateBsda, { loading: isDuplicatingBsda }] = useBsdaDuplicate({
    ...options,
  });
  const [duplicateBsdasri, { loading: isDuplicatingBsdasri }] =
    useBsdasriDuplicate({
      ...options,
    });
  const [duplicateBsff, { loading: isDuplicatingBsff }] = useBsffDuplicate({
    ...options,
  });
  const [duplicateBsvhu, { loading: isDuplicatingBsvhu }] = useBsvhuDuplicate({
    ...options,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isDuplicating =
    isDuplicatingBsdd ||
    isDuplicatingBsda ||
    isDuplicatingBsdasri ||
    isDuplicatingBsff ||
    isDuplicatingBsvhu;

  const updatedAt = bsdDisplay?.updatedAt
    ? formatDate(bsdDisplay.updatedAt)
    : "";

  const ctaPrimaryLabel = bsdDisplay?.type
    ? getPrimaryActionsLabelFromBsdStatus(
        bsdDisplay,
        currentSiret,
        bsdCurrentTab
      )
    : "";

  const ctaPrimaryReviewLabel = bsdDisplay?.type
    ? getPrimaryActionsReviewsLabel(bsdDisplay, currentSiret)
    : "";

  const handleValidationClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onValidate(bsd);
  };

  const onPdf = (bsd: BsdDisplay) => {
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
  };

  const onDuplicate = (bsd: BsdDisplay) => {
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
  };

  const onCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const onDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const transporterNameEmmiter =
    bsdDisplay?.emitter?.company?.siret ===
    bsdDisplay?.transporter?.company?.siret
      ? bsdDisplay?.emitter?.company?.name
      : bsdDisplay?.transporter?.company?.name;

  const transporterName = transporterNameEmmiter || "Non renseigné";

  const unitOfMeasure =
    isBsdasri(bsdDisplay?.type!) || isBsff(bsdDisplay?.type!) ? "kg" : "t";
  return (
    <>
      <div className="bsd-card" tabIndex={0}>
        {bsdDisplay && (
          <>
            <div className="bsd-card__header">
              <div>
                <p className="bsd-number">N°: {bsdDisplay.readableid}</p>
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
                    date={updatedAt}
                  />
                )}
                {bsdDisplay?.emittedByEcoOrganisme && (
                  <InfoWithIcon labelCode={InfoIconCode.EcoOrganism} />
                )}
              </div>
            </div>
            <div className="bsd-card__content">
              <div className="bsd-card__content__infos">
                <div className="bsd-card__content__infos__status">
                  <Badge
                    status={bsdDisplay.status}
                    isDraft={bsdDisplay.isDraft}
                    bsdType={bsdDisplay.type}
                    reviewStatus={bsdDisplay?.review?.status}
                  />
                </div>
                <div className="bsd-card__content__infos__other">
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

                  <Actors
                    emitterName={bsdDisplay.emitter?.company?.name!}
                    transporterName={transporterName}
                    destinationName={bsdDisplay.destination?.company?.name!}
                  />
                </div>
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

                {isReviewsTab && (
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
                    onDeleteReview,
                  }}
                  hideReviewCta={isReviewsTab}
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
    </>
  );
}

export default React.memo(BsdCard);
