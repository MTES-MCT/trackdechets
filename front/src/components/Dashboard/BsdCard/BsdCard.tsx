import React from "react";

import { formatDate } from "../../../common/datetime";
import { formatBsd } from "../../../mapper/bsdMapper";
import Badge from "../Badge/Badge";
import LabelWithIcon from "../LabelWithIcon/LabelWithIcon";
import { LabelIconCode } from "../LabelWithIcon/labelWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";
import "./bsdCard.scss";
import WasteDetails from "../WasteDetails/WasteDetails";

function BsdCard({ bsd }: BsdCardProps): JSX.Element {
  const bsdDisplay = formatBsd(bsd);

  const updatedAt = bsdDisplay?.updatedAt
    ? formatDate(bsdDisplay.updatedAt)
    : "";

  return (
    <div className="bsd-card">
      {bsdDisplay && (
        <>
          <div className="bsd-card__header">
            <p>N°: {bsdDisplay.id}</p>
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
          </div>
        </>
      )}
    </div>
  );
}

export default BsdCard;
