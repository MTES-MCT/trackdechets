import React, { useState, useEffect } from "react";
import { GET_FORM_REVISION_REQUESTS } from "../../../common/queries/reviews/BsddReviewsQuery";
import {
  BsdType,
  Query,
  QueryBsdaRevisionRequestsArgs,
  QueryFormRevisionRequestsArgs
} from "@td/codegen-ui";
import { useLazyQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_BSDA_REVISION_REQUESTS } from "../../../common/queries/reviews/BsdaReviewQuery";
import { ReviewInterface, mapRevision } from "./revisionMapper";
import RevisionList from "./RevisionList/RevisionList";
import { Modal } from "../../../../common/components";
import Button from "@codegouvfr/react-dsfr/Button";
import { Loader } from "../../../common/Components";
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
      fetchPolicy: "cache-and-network",
      variables: { siret: siret!, where: { bsddId: { _eq: bsdId } } }
    });
  const [fetchBsdaRevision, { data: dataBsda, loading: loadingBsdaRevision }] =
    useLazyQuery<
      Pick<Query, "bsdaRevisionRequests">,
      QueryBsdaRevisionRequestsArgs
    >(GET_BSDA_REVISION_REQUESTS, {
      fetchPolicy: "cache-and-network",
      variables: { siret: siret!, where: { bsdaId: { _eq: bsdId } } }
    });

  useEffect(() => {
    if (bsdType === BsdType.Bsdd) {
      fetchFormRevision();
    }
    if (bsdType === BsdType.Bsda) {
      fetchBsdaRevision();
    }
  }, [bsdType, fetchBsdaRevision, fetchFormRevision]);

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
  }, [dataForm, dataBsda, bsdType]);

  const buildReviewList = (bsdType, data) => {
    const bsdName = bsdType === BsdType.Bsdd ? "form" : "bsda";
    return data?.map(review => {
      return mapRevision(review.node, bsdName);
    });
  };

  const ariaLabel =
    actionType === ActionType.CONSUlT
      ? MODAL_ARIA_LABEL_CONSULT
      : MODAL_ARIA_LABEL_UPDATE;

  const getModalTitlePrefix = () => {
    if (actionType === ActionType.UPDATE) {
      return MODAL_TITLE_UPDATE;
    }
    if (actionType === ActionType.CONSUlT) {
      return MODAL_TITLE_CONSULT;
    }
    if (actionType === ActionType.DELETE) {
      return MODAL_TITLE_DELETE;
    }
    return "";
  };

  const latestRevision = reviewList?.[0] as ReviewInterface;
  const reviews =
    actionType === ActionType.CONSUlT ? reviewList : [latestRevision];
  return (
    <Modal onClose={onModalCloseFromParent!} ariaLabel={ariaLabel} isOpen>
      <div className="revision-modal">
        {(loadingFormRevision || loadingBsdaRevision) && <Loader />}

        {reviewList && (
          <RevisionList reviews={reviews} title={getModalTitlePrefix()} />
        )}
        <div className="revision-modal__btn">
          {actionType === ActionType.CONSUlT && (
            <Button priority="primary" onClick={onModalCloseFromParent}>
              Fermer
            </Button>
          )}

          {(!loadingFormRevision || !loadingBsdaRevision) &&
            actionType === ActionType.UPDATE && (
              <RevisionApproveFragment
                reviewId={latestRevision?.id}
                bsdType={bsdType}
                siret={siret!}
                onClose={onModalCloseFromParent!}
              />
            )}
          {(!loadingFormRevision || !loadingBsdaRevision) &&
            actionType === ActionType.DELETE && (
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
