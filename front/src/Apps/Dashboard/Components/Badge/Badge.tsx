import React from "react";
import classnames from "classnames";
import { BadgeProps } from "./badgeTypes";
import "./badge.scss";
import { BsdStatusCode } from "../../../common/types/bsdTypes";
import {
  getBsdStatusLabel,
  getRevisionStatusLabel
} from "../../dashboardServices";

function Badge({
  status,
  isDraft,
  bsdType,
  reviewStatus,
  operationCode,
  bsdaAnnexed,
  transporters
}: BadgeProps): JSX.Element {
  return (
    <>
      <p
        className={classnames(`fr-badge fr-badge--sm fr-badge--${status}`, {
          "fr-badge--success":
            status === BsdStatusCode.Processed ||
            status === BsdStatusCode.FollowedWithPnttd ||
            status === BsdStatusCode.NoTraceability,
          "fr-badge--error":
            status === BsdStatusCode.Refused ||
            status === BsdStatusCode.Canceled,
          "fr-badge--canceled": status === BsdStatusCode.Canceled
        })}
      >
        {getBsdStatusLabel(
          status,
          isDraft,
          bsdType,
          operationCode,
          bsdaAnnexed,
          transporters
        )}
      </p>
      {reviewStatus && (
        <>
          <br />
          <p
            className={classnames(`fr-badge fr-badge--sm`, {
              "fr-badge--review_accepted":
                reviewStatus === BsdStatusCode.Accepted,
              "fr-badge--review_pending":
                reviewStatus === BsdStatusCode.Pending,
              "fr-badge--review_refused":
                reviewStatus === BsdStatusCode.Refused,
              "fr-badge--review_cancelled":
                reviewStatus === BsdStatusCode.Canceled
            })}
          >
            {getRevisionStatusLabel(reviewStatus as string)}
          </p>
        </>
      )}
    </>
  );
}

export default Badge;
