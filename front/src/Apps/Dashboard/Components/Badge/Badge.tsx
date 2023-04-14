import React from "react";
import classnames from "classnames";
import { BadgeProps } from "./badgeTypes";
import "./badge.scss";
import { BsdStatusCode } from "../../../Common/types/bsdTypes";
import { getBsdStatusLabel } from "../../dashboardServices";

function Badge({ status, isDraft }: BadgeProps): JSX.Element {
  return (
    <p
      className={classnames(`fr-badge fr-badge--sm fr-badge--${status}`, {
        "fr-badge--success":
          status === BsdStatusCode.Processed ||
          status === BsdStatusCode.FollowedWithPnttd ||
          status === BsdStatusCode.NoTraceability,
        "fr-badge--error":
          status === BsdStatusCode.Refused || status === BsdStatusCode.Canceled,
        "fr-badge--canceled": status === BsdStatusCode.Canceled,
      })}
    >
      {getBsdStatusLabel(status, isDraft)}
    </p>
  );
}

export default Badge;
