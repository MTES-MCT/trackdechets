import React from "react";
import {
  FormRevisionRequest,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "codegen-ui";
import { useParams } from "react-router-dom";
import { BsddApproveRevision } from ".";
import { BsddCancelRevision } from "./BsddCancelRevision";
import { BsddConsultRevision } from "./BsddConsultRevision";

type Props = {
  review: FormRevisionRequest;
};

export function BsddRevisionAction({ review }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const currentApproval = review.approvals.find(
    approval => approval.approverSiret === siret
  );

  if (
    review.status === RevisionRequestStatus.Pending &&
    currentApproval?.status === RevisionRequestApprovalStatus.Pending
  ) {
    return <BsddApproveRevision review={review} />;
  }

  if (
    review.authoringCompany.siret === siret &&
    review.status === RevisionRequestStatus.Pending
  ) {
    return (
      <>
        <BsddConsultRevision review={review} />
        <BsddCancelRevision review={review} />
      </>
    );
  }

  return <BsddConsultRevision review={review} />;
}
