import React from "react";
import {
  FormRevisionRequest,
  RevisionRequestStatus,
} from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { BsddApproveRevision } from ".";
import { BsddCancelRevision } from "./BsddCancelRevision";
import { BsddConsultRevision } from "./BsddConsultRevision";

type Props = {
  review: FormRevisionRequest;
};

export function BsddRevisionAction({ review }: Props) {
  const { siret } = useParams<{ siret: string }>();

  if (review.status !== RevisionRequestStatus.Pending) {
    return <BsddConsultRevision review={review} />;
  }

  if (siret === review.authoringCompany.siret) {
    return (
      <>
        <BsddConsultRevision review={review} />
        <BsddCancelRevision review={review} />
      </>
    );
  }

  return <BsddApproveRevision review={review} />;
}
