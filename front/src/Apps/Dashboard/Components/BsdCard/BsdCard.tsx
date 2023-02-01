import React from "react";

import { formatDate } from "../../../../common/datetime";
import Badge from "../Badge/Badge";
import InfoWithIcon from "../InfoWithIcon/InfoWithIcon";
import { InfoIconCode } from "../InfoWithIcon/infoWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";
import WasteDetails from "../WasteDetails/WasteDetails";
import {
  canPublishBsd,
  getBsdView,
  getCtaLabelFromStatus,
  getWorkflowLabel,
  hasBsdSuite,
} from "../../dashboardServices";
import BsdAdditionalActionsButton from "../BsdAdditionalActionsButton/BsdAdditionalActionsButton";

import "./bsdCard.scss";
import { completer_bsd_suite } from "../../../Common/wordings/dashboard/wordingsDashboard";
import Actors from "../Actors/Actors";

function BsdCard({
  bsd,
  currentSiret,
  onValidate,
  onOverview,
  onDelete,
  onDuplicate,
  onPdf,
  onUpdate,
  onRevision,
}: BsdCardProps) {
  const bsdDisplay = getBsdView(bsd);

  const updatedAt = bsdDisplay?.updatedAt
    ? formatDate(bsdDisplay.updatedAt)
    : "";

  const ctaPrimaryLabel = bsdDisplay?.type
    ? getCtaLabelFromStatus(bsdDisplay, currentSiret)
    : "";

  const handleValidationClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    onValidate(bsd);
  };

  return (
    <div className="bsd-card" tabIndex={0}>
      {bsdDisplay && (
        <>
          <div className="bsd-card__header">
            <p className="bsd-number">N°: {bsdDisplay.readableid}</p>
            {bsdDisplay?.isTempStorage && (
              <InfoWithIcon labelCode={InfoIconCode.TempStorage} />
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
            <p className="workflow-type">
              {getWorkflowLabel(bsdDisplay.bsdWorkflowType)}
            </p>
          </div>
          <div className="bsd-card__content">
            <div className="bsd-card__content__badge">
              <Badge
                status={bsdDisplay.status}
                isDraft={bsdDisplay.isDraft}
                bsdType={bsdDisplay.type}
              />
            </div>
            <div className="bsd-card__content__waste">
              <WasteDetails
                wasteType={bsdDisplay.type}
                code={bsdDisplay.wasteDetails.code?.toString()}
                name={bsdDisplay.wasteDetails.name?.toString()}
              />
            </div>

            <div className="bsd-card__content__actors">
              <Actors
                emitterName={bsdDisplay.emitter?.company?.name || ""}
                transporterName={bsdDisplay.transporter?.company?.name || ""}
                destinationName={bsdDisplay.destination?.company?.name || ""}
              />
            </div>

            <div className="bsd-card__content__cta">
              {canPublishBsd(bsdDisplay, currentSiret) && ctaPrimaryLabel && (
                <button
                  data-testid="bsd-card-btn-primary"
                  type="button"
                  className="fr-btn fr-btn--sm"
                  onClick={handleValidationClick}
                >
                  {ctaPrimaryLabel}
                </button>
              )}

              <BsdAdditionalActionsButton
                bsd={bsdDisplay}
                currentSiret={currentSiret}
                onOverview={onOverview!}
                onDelete={onDelete!}
                onDuplicate={onDuplicate!}
                onUpdate={onUpdate!}
                onRevision={onRevision!}
                onPdf={onPdf!}
              >
                {hasBsdSuite(bsdDisplay, currentSiret) && (
                  <button
                    type="button"
                    data-testid="bsd-suite-btn"
                    className="fr-btn fr-btn--tertiary-no-outline"
                  >
                    {completer_bsd_suite}
                  </button>
                )}
              </BsdAdditionalActionsButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BsdCard;
