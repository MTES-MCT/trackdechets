import React from "react";
import Button from "@codegouvfr/react-dsfr/Button";
import {
  BsdType,
  Mutation,
  MutationSubmitBsdaRevisionRequestApprovalArgs,
  MutationSubmitFormRevisionRequestApprovalArgs,
  MutationSubmitBsdasriRevisionRequestApprovalArgs
} from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import {
  GET_BSDA_REVISION_REQUESTS,
  SUBMIT_BSDA_REVISION_REQUEST_APPROVAL
} from "../../../common/queries/reviews/BsdaReviewQuery";
import {
  GET_FORM_REVISION_REQUESTS,
  SUBMIT_FORM_REVISION_REQUEST_APPROVAL
} from "../../../common/queries/reviews/BsddReviewsQuery";
import {
  GET_BSDASRI_REVISION_REQUESTS,
  SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL
} from "../../../common/queries/reviews/BsdasriReviewQuery";

interface RevisionApproveFragmentProps {
  reviewId: string;
  bsdType: BsdType;
  siret: string;
  onClose: () => void;
}
const RevisionApproveFragment = ({
  reviewId,
  bsdType,
  siret,
  onClose
}: RevisionApproveFragmentProps) => {
  const [
    submitFormRevisionRequestApproval,
    { loading: updatingForm, error: errorForm }
  ] = useMutation<
    Pick<Mutation, "submitFormRevisionRequestApproval">,
    MutationSubmitFormRevisionRequestApprovalArgs
  >(SUBMIT_FORM_REVISION_REQUEST_APPROVAL, {
    refetchQueries: [
      { query: GET_FORM_REVISION_REQUESTS, variables: { siret } }
    ]
  });

  const [
    submitBsdaRevisionRequestApproval,
    { loading: updatingBsda, error: errorBsda }
  ] = useMutation<
    Pick<Mutation, "submitBsdaRevisionRequestApproval">,
    MutationSubmitBsdaRevisionRequestApprovalArgs
  >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
    refetchQueries: [
      { query: GET_BSDA_REVISION_REQUESTS, variables: { siret } }
    ]
  });

  const [
    submitBsdasriRevisionRequestApproval,
    { loading: updatingBsdasri, error: errorBsdasri }
  ] = useMutation<
    Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
    MutationSubmitBsdasriRevisionRequestApprovalArgs
  >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
    refetchQueries: [
      { query: GET_BSDASRI_REVISION_REQUESTS, variables: { siret } }
    ]
  });

  const handleClose = () => onClose!();

  const handleRevisionReject = async () => {
    if (bsdType === BsdType.Bsdd) {
      await submitFormRevisionRequestApproval({
        variables: { id: reviewId, isApproved: false }
      });
    }

    if (bsdType === BsdType.Bsda) {
      await submitBsdaRevisionRequestApproval({
        variables: { id: reviewId, isApproved: false }
      });
    }

    if (bsdType === BsdType.Bsdasri) {
      await submitBsdasriRevisionRequestApproval({
        variables: { id: reviewId, isApproved: false }
      });
    }

    handleClose();
  };

  const handleRevisionApprove = async () => {
    if (bsdType === BsdType.Bsdd) {
      await submitFormRevisionRequestApproval({
        variables: { id: reviewId, isApproved: true }
      });
    }

    if (bsdType === BsdType.Bsda) {
      await submitBsdaRevisionRequestApproval({
        variables: { id: reviewId, isApproved: true }
      });
    }

    if (bsdType === BsdType.Bsdasri) {
      await submitBsdasriRevisionRequestApproval({
        variables: { id: reviewId, isApproved: true }
      });
    }
    handleClose();
  };

  return (
    <>
      {(errorBsda || errorForm || errorBsdasri) && (
        <div
          style={{ marginTop: "2em", marginBottom: "2em" }}
          className="notification notification--warning"
        >
          {errorForm?.message}
          {errorBsda?.message}
          {errorBsdasri?.message}
        </div>
      )}
      <Button
        priority="primary"
        onClick={handleRevisionReject}
        disabled={updatingForm || updatingBsda || updatingBsdasri}
      >
        Refuser
      </Button>
      <Button
        priority="primary"
        onClick={handleRevisionApprove}
        disabled={updatingForm || updatingBsda || updatingBsdasri}
      >
        Approuver
      </Button>
      <Button priority="secondary" onClick={handleClose}>
        Fermer
      </Button>
    </>
  );
};
export default RevisionApproveFragment;
