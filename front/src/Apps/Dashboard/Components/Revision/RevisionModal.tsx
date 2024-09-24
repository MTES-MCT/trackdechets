import React, { useState, useEffect } from "react";
import { GET_FORM_REVISION_REQUESTS } from "../../../common/queries/reviews/BsddReviewsQuery";
import {
  BsdType,
  Query,
  QueryBsdaRevisionRequestsArgs,
  QueryFormRevisionRequestsArgs,
  QueryBsdasriRevisionRequestsArgs,
  RevisionRequestStatus
} from "@td/codegen-ui";
import { useLazyQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_BSDA_REVISION_REQUESTS } from "../../../common/queries/reviews/BsdaReviewQuery";
import { GET_BSDASRI_REVISION_REQUESTS } from "../../../common/queries/reviews/BsdasriReviewQuery";
import { ReviewInterface, mapRevision } from "./revisionMapper";
import RevisionList from "./RevisionList/RevisionList";
import { Modal } from "../../../../common/components";
import Button from "@codegouvfr/react-dsfr/Button";
import RevisionApproveFragment from "./RevisionApproveFragment";
import "./revisionModal.scss";
import RevisionCancelFragment from "./RevisionCancelFragment";
import {
  MODAL_ARIA_LABEL_CONSULT,
  MODAL_ARIA_LABEL_UPDATE,
  MODAL_TITLE_CONSULT,
  MODAL_TITLE_DELETE,
  MODAL_TITLE_UPDATE
} from "./wordingsRevision";
import { InlineLoader } from "../../../common/Components/Loader/Loaders";

const hasBeenUpdated = revision => {
  return (
    revision.status === RevisionRequestStatus.Accepted ||
    revision.status === RevisionRequestStatus.Refused
  );
};

const noRevisionRequestsIn = (bsdRevisions, bsdaRevisions) => {
  return (
    !bsdRevisions?.formRevisionRequests?.edges?.length &&
    !bsdaRevisions?.bsdaRevisionRequests?.edges?.length
  );
};

export enum ActionType {
  CONSUlT = "CONSUlT",
  UPDATE = "UPDATE",
  DELETE = "DELETE"
}
interface RevisionModalProps {
  bsdId: string;
  bsdType: BsdType;
  actionType: ActionType;
  onModalCloseFromParent?: () => void;
}
const RevisionModal = ({
  bsdId,
  bsdType,
  actionType,
  onModalCloseFromParent
}: RevisionModalProps) => {
  const [reviewList, setReviewList] = useState<ReviewInterface[]>();
  const { siret } = useParams<{ siret: string }>();

  const [fetchFormRevision, { data: dataForm, loading: loadingFormRevision }] =
    useLazyQuery<
      Pick<Query, "formRevisionRequests">,
      QueryFormRevisionRequestsArgs
    >(GET_FORM_REVISION_REQUESTS, {
      fetchPolicy: "no-cache", // If we use the cache and have several revisions on a single bsdd the linked bsdd that is returned is the cached one instead of the previous version
      variables: { siret: siret!, where: { bsddId: { _eq: bsdId } } }
    });

  const [fetchBsdaRevision, { data: dataBsda, loading: loadingBsdaRevision }] =
    useLazyQuery<
      Pick<Query, "bsdaRevisionRequests">,
      QueryBsdaRevisionRequestsArgs
    >(GET_BSDA_REVISION_REQUESTS, {
      fetchPolicy: "no-cache",
      variables: { siret: siret!, where: { bsdaId: { _eq: bsdId } } }
    });

  const [
    fetchBsdasriRevision,
    { data: dataBsdasri, loading: loadingBsdasriRevision }
  ] = useLazyQuery<
    Pick<Query, "bsdasriRevisionRequests">,
    QueryBsdasriRevisionRequestsArgs
  >(GET_BSDASRI_REVISION_REQUESTS, {
    fetchPolicy: "no-cache",
    variables: { siret: siret!, where: { bsdasriId: { _eq: bsdId } } }
  });

  useEffect(() => {
    if (bsdType === BsdType.Bsdd) {
      fetchFormRevision();
    }
    if (bsdType === BsdType.Bsda) {
      fetchBsdaRevision();
    }

    if (bsdType === BsdType.Bsdasri) {
      fetchBsdasriRevision();
    }
  }, [bsdType, fetchBsdaRevision, fetchFormRevision, fetchBsdasriRevision]);

  useEffect(() => {
    if (bsdType === BsdType.Bsdd && dataForm) {
      setReviewList(
        buildReviewList(bsdType, dataForm.formRevisionRequests.edges)
      );
    }

    if (bsdType === BsdType.Bsda && dataBsda) {
      setReviewList(
        buildReviewList(bsdType, dataBsda.bsdaRevisionRequests.edges)
      );
    }

    if (bsdType === BsdType.Bsdasri && dataBsdasri) {
      setReviewList(
        buildReviewList(bsdType, dataBsdasri.bsdasriRevisionRequests.edges)
      );
    }
  }, [dataForm, dataBsda, dataBsdasri, bsdType]);

  const buildReviewList = (bsdType, data) => {
    let bsdName = "";

    if (bsdType === BsdType.Bsdd) {
      bsdName = "form";
    }
    if (bsdType === BsdType.Bsda) {
      bsdName = "bsda";
    }
    if (bsdType === BsdType.Bsdasri) {
      bsdName = "bsdasri";
    }

    return data?.map(review => {
      return mapRevision(review.node, bsdName);
    });
  };

  const latestRevision = reviewList?.[0] as ReviewInterface;

  let actualActionType = actionType;
  // User had a direct link to the revision, but it has been updated since.
  // Show consultation modal instead
  if (
    latestRevision &&
    actionType === ActionType.UPDATE &&
    hasBeenUpdated(latestRevision)
  ) {
    actualActionType = ActionType.CONSUlT;
  }

  const reviews = (
    actualActionType === ActionType.CONSUlT ? reviewList : [latestRevision]
  )?.filter(Boolean);

  // If the data sent by the API is void of revisions, the bsdId is probably wrong.
  // Don't crash & close the modal
  useEffect(() => {
    if (
      (dataForm || dataBsda) && // We've got the data back
      noRevisionRequestsIn(dataForm, dataBsda) // But it's empty
    ) {
      if (onModalCloseFromParent) onModalCloseFromParent();
    }
  }, [reviews, dataForm, dataBsda, onModalCloseFromParent]);

  const ariaLabel =
    actualActionType === ActionType.CONSUlT
      ? MODAL_ARIA_LABEL_CONSULT
      : MODAL_ARIA_LABEL_UPDATE;

  const getModalTitlePrefix = () => {
    if (actualActionType === ActionType.UPDATE) {
      return MODAL_TITLE_UPDATE;
    }
    if (actualActionType === ActionType.CONSUlT) {
      return MODAL_TITLE_CONSULT;
    }
    if (actualActionType === ActionType.DELETE) {
      return MODAL_TITLE_DELETE;
    }
    return "";
  };

  return (
    <Modal onClose={onModalCloseFromParent!} ariaLabel={ariaLabel} isOpen>
      <div className="revision-modal">
        {(loadingFormRevision ||
          loadingBsdaRevision ||
          loadingBsdasriRevision) && (
          <div className="revision-modal-loader">
            <div>
              <InlineLoader />
            </div>
          </div>
        )}

        {reviewList && (
          <RevisionList reviews={reviews} title={getModalTitlePrefix()} />
        )}
        <div className="revision-modal__btn">
          {actualActionType === ActionType.CONSUlT && (
            <Button priority="primary" onClick={onModalCloseFromParent}>
              Fermer
            </Button>
          )}

          {(!loadingFormRevision ||
            !loadingBsdaRevision ||
            !loadingBsdasriRevision) &&
            actualActionType === ActionType.UPDATE && (
              <RevisionApproveFragment
                reviewId={latestRevision?.id}
                bsdType={bsdType}
                siret={siret!}
                onClose={onModalCloseFromParent!}
              />
            )}
          {(!loadingFormRevision ||
            !loadingBsdaRevision ||
            !loadingBsdasriRevision) &&
            actualActionType === ActionType.DELETE && (
              <RevisionCancelFragment
                reviewId={latestRevision?.id}
                bsdType={bsdType}
                siret={siret!}
                onClose={onModalCloseFromParent!}
              />
            )}
        </div>
      </div>
    </Modal>
  );
};
export default RevisionModal;
