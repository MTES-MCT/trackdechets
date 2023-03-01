import React from "react";
import classnames from "classnames";
import { BadgeProps } from "./badgeTypes";
import "./badge.scss";
import { BsdStatusCode } from "../../../Common/types/bsdTypes";
import { getBsdStatusLabel } from "../../dashboardServices";

function Badge({ status, isDraft, bsdType }: BadgeProps): JSX.Element {
  return (
    <p
      className={classnames(`fr-badge fr-badge--sm fr-badge--${status}`, {
        "fr-badge--success": status === BsdStatusCode.PROCESSED,
        "fr-badge--error": status === BsdStatusCode.REFUSED,
      })}
    >
      {getBsdStatusLabel(status, isDraft, bsdType)}
    </p>
  );
}

export default Badge;
