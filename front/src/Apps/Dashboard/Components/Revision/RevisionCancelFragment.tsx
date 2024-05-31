import React from "react";
import Button from "@codegouvfr/react-dsfr/Button";
import {
  BsdType,
  Mutation,
  MutationCancelBsdaRevisionRequestArgs,
  MutationCancelFormRevisionRequestArgs
} from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import {
  CANCEL_BSDA_REVISION_REQUEST,
  GET_BSDA_REVISION_REQUESTS
} from "../../../common/queries/reviews/BsdaReviewQuery";
import {
  CANCEL_BSDASRI_REVISION_REQUEST,
  GET_BSDASRI_REVISION_REQUESTS
} from "../../../common/queries/reviews/BsdasriReviewQuery";
import {
  CANCEL_FORM_REVISION_REQUEST,
  GET_FORM_REVISION_REQUESTS
} from "../../../common/queries/reviews/BsddReviewsQuery";

interface RevisionCancelFragmentProps {
  reviewId: string;
  bsdType: BsdType;
  siret: string;
  onClose: () => void;
}
const RevisionCancelFragment = ({
  reviewId,
  bsdType,
  siret,
  onClose
}: RevisionCancelFragmentProps) => {
  const [cancelFormRevisionRequest, { loading: cancelingForm }] = useMutation<
    Pick<Mutation, "cancelFormRevisionRequest">,
    MutationCancelFormRevisionRequestArgs
  >(CANCEL_FORM_REVISION_REQUEST, {
    refetchQueries: [GET_FORM_REVISION_REQUESTS]
  });

  const [cancelBsdaRevisionRequest, { loading: cancelingBsda }] = useMutation<
    Pick<Mutation, "cancelBsdaRevisionRequest">,
    MutationCancelBsdaRevisionRequestArgs
  >(CANCEL_BSDA_REVISION_REQUEST, {
    refetchQueries: [
      { query: GET_BSDA_REVISION_REQUESTS, variables: { siret } }
    ]
  });

  const [cancelBsdasriRevisionRequest, { loading: cancelingBsdasri }] =
    useMutation<
      Pick<Mutation, "cancelBsdasriRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDASRI_REVISION_REQUEST, {
      refetchQueries: [
        { query: GET_BSDASRI_REVISION_REQUESTS, variables: { siret } }
      ]
    });

  const handleClose = () => onClose!();

  const handleRevisionCancel = async () => {
    if (bsdType === BsdType.Bsdd) {
      await cancelFormRevisionRequest({
        variables: { id: reviewId }
      });
    }

    if (bsdType === BsdType.Bsda) {
      await cancelBsdaRevisionRequest({
        variables: { id: reviewId }
      });
    }

    if (bsdType === BsdType.Bsdasri) {
      await cancelBsdasriRevisionRequest({
        variables: { id: reviewId }
      });
    }

    handleClose();
  };

  return (
    <>
      <Button priority="secondary" onClick={handleClose}>
        Ne pas annuler
      </Button>
      <Button
        priority="primary"
        onClick={handleRevisionCancel}
        disabled={cancelingForm || cancelingBsda || cancelingBsdasri}
      >
        Annuler la révision
      </Button>
    </>
  );
};
export default RevisionCancelFragment;
