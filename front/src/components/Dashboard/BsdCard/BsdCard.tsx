import React from "react";

import { formatDate } from "../../../common/datetime";
import { formatBsd } from "../../../mapper/bsdMapper";
import Badge from "../Badge/Badge";
import LabelWithIcon from "../LabelWithIcon/LabelWithIcon";
import { LabelIconCode } from "../LabelWithIcon/labelWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";
import WasteDetails from "../WasteDetails/WasteDetails";
import { getCtaLabelFromStatus } from "../../../common/utils/dashboardUtils";

import "./bsdCard.scss";

function BsdCard({ bsd }: BsdCardProps): JSX.Element {
  const bsdDisplay = formatBsd(bsd);

  const updatedAt = bsdDisplay?.updatedAt
    ? formatDate(bsdDisplay.updatedAt)
    : "";

  const ctaPrimaryLabel = bsdDisplay?.type
    ? getCtaLabelFromStatus(bsdDisplay.type, bsdDisplay.status)
    : "";

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
          </div>
          <div className="bsd-card__content">
            <div className="bsd-card__content__badge">
              <Badge status={bsdDisplay.status} />
            </div>
            <WasteDetails
              wasteType={bsdDisplay.type}
              code={bsdDisplay.wasteDetails.code?.toString()}
              name={bsdDisplay.wasteDetails.name?.toString()}
            />

            {/* TODO actors */}

            <div className="bsd-card__content__cta">
              {ctaPrimaryLabel && (
                <button type="button" className="fr-btn fr-btn--sm">
                  {ctaPrimaryLabel}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BsdCard;
