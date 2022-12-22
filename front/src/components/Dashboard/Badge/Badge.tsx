import React from "react";
import classnames from "classnames";
import { BadgeProps } from "./badgeTypes";
import "./badge.scss";
import { BsdStatusCode } from "../../../common/types/bsdTypes";
import { getBsdStatusLabel } from "../../../common/utils/dashboardUtils";
/*
    We don't use the @dataesr/react-dsfr Badge component because don't have the same colors/status but we reuse the same styles and override when needed
*/
function Badge({ status, isSmall = false }: BadgeProps): JSX.Element {
  return (
    <p
      className={classnames(`fr-badge fr-badge--${status}`, {
        "fr-badge--sm": isSmall,
        "fr-badge--success": status === BsdStatusCode.PROCESSED,
        "fr-badge--error": status === BsdStatusCode.REFUSED,
      })}
    >
      {getBsdStatusLabel(status)}
    </p>
  );
}

export default Badge;
