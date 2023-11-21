import React from "react";
import {
  BsdaRevisionRequest,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "codegen-ui";
import { useParams } from "react-router-dom";
import { BsdaApproveRevision } from "./BsdaApproveRevision";
import { BsdaCancelRevision } from "./BsdaCancelRevision";
import { BsdaConsultRevision } from "./BsdaConsultRevision";

type Props = {
  review: BsdaRevisionRequest;
};

export function BsdaRevisionAction({ review }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const currentApproval = review.approvals.find(
    approval => approval.approverSiret === siret
  );

  if (
    review.status === RevisionRequestStatus.Pending &&
    currentApproval?.status === RevisionRequestApprovalStatus.Pending
  ) {
    return <BsdaApproveRevision review={review} />;
  }

  if (
    review.authoringCompany.siret === siret &&
    review.status === RevisionRequestStatus.Pending
  ) {
    return (
      <>
        <BsdaConsultRevision review={review} />
        <BsdaCancelRevision review={review} />
      </>
    );
  }

  return <BsdaConsultRevision review={review} />;
}
