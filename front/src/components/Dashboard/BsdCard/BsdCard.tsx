import React from "react";

import { formatDate } from "../../../common/datetime";
import { createBsd } from "../../../mapper/bsdMapper";
import Badge from "../Badge/Badge";
import LabelWithIcon from "../LabelWithIcon/LabelWithIcon";
import { LabelIconCode } from "../LabelWithIcon/labelWithIconTypes";
import { BsdCardProps } from "./bsdCardTypes";

function BsdCard({ bsd }: BsdCardProps): JSX.Element {
  const bsdDisplay = createBsd(bsd);

  const updatedAt = bsdDisplay?.updatedAt
    ? formatDate(bsdDisplay.updatedAt)
    : "";

  return (
    <div className="bsd-card">
      <p>N°: {bsdDisplay?.id}</p>
      {bsdDisplay?.isTempStorage && (
        <LabelWithIcon labelCode={LabelIconCode.TempStorage} />
      )}
      {bsdDisplay?.updatedAt && (
        <LabelWithIcon
          labelCode={LabelIconCode.LastModificationDate}
          date={updatedAt}
        />
      )}
      {bsdDisplay?.emittedByEcoOrganisme && (
        <LabelWithIcon labelCode={LabelIconCode.EcoOrganism} />
      )}

      {bsdDisplay?.status && <Badge status={bsdDisplay.status} />}
    </div>
  );
}

export default BsdCard;
