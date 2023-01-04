import React from "react";

import { formatDate } from "../../../common/datetime";
import Badge from "../Badge/Badge";
import LabelWithIcon from "../LabelWithIcon/LabelWithIcon";
import { LabelIconCode } from "../LabelWithIcon/labelWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";
import WasteDetails from "../WasteDetails/WasteDetails";
import {
  canPublishBsd,
  getBsdView,
  getCtaLabelFromStatus,
  getWorkflowLabel,
  hasBsdSuite,
} from "../../../services/dashboard/dashboardServices";

import "./bsdCard.scss";

function BsdCard({ bsd, currentSiret, onValidate }: BsdCardProps): JSX.Element {
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
    <div className="bsd-card">
      {bsdDisplay && (
        <>
          <div className="bsd-card__header">
            <p className="bsd-number">N°: {bsdDisplay.id}</p>
            {bsdDisplay?.isTempStorage && (
              <LabelWithIcon labelCode={LabelIconCode.TempStorage} />
            )}
            {updatedAt && (
              <LabelWithIcon
                labelCode={LabelIconCode.LastModificationDate}
                date={updatedAt}
              />
            )}
            {bsdDisplay?.emittedByEcoOrganisme && (
              <LabelWithIcon labelCode={LabelIconCode.EcoOrganism} />
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
            <WasteDetails
              wasteType={bsdDisplay.type}
              code={bsdDisplay.wasteDetails.code?.toString()}
              name={bsdDisplay.wasteDetails.name?.toString()}
            />

            {/* TODO Actors */}

            <div className="bsd-card__content__cta">
              {/* TODO move BSD suite to BsdAdditionnalActions */}
              {hasBsdSuite(bsdDisplay, currentSiret) && (
                <button
                  type="button"
                  className="fr-btn fr-btn--sm fr-btn--secondary"
                >
                  Compléter le BSD suite
                </button>
              )}
              {canPublishBsd(bsdDisplay, currentSiret) && ctaPrimaryLabel && (
                <button
                  type="button"
                  className="fr-btn fr-btn--sm"
                  onClick={handleValidationClick}
                >
                  {ctaPrimaryLabel}
                </button>
              )}

              {/* TODO BsdAdditionalActionsButton */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BsdCard;
