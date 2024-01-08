import React from "react";
import {
  FormRevisionRequest,
  RevisionRequestApprovalStatus
} from "@td/codegen-ui";
import Tooltip from "../../../../../common/components/Tooltip";

type Props = {
  review: FormRevisionRequest;
};

const STATUS_LABELS = {
  PENDING: "En attente de validation",
  ACCEPTED: "Approuvée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée"
};

export function BsddRevisionStatus({ review }: Props) {
  const remainingApprovalsSirets = review.approvals
    .filter(
      approval => approval.status === RevisionRequestApprovalStatus.Pending
    )
    .map(approval => approval.approverSiret);

  return (
    <span>
      {STATUS_LABELS[review.status]}{" "}
      <Tooltip
        msg={`En attente de ${
          remainingApprovalsSirets.length
        } validation(s) (SIRETS: ${remainingApprovalsSirets.join(", ")})`}
      />
    </span>
  );
}
