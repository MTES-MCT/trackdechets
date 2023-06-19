import React from "react";
import { useMutation } from "@apollo/client";
import { ActionButton, Modal } from "common/components";
import { IconTrash } from "common/components/Icons";
import { TdModalTrigger } from "common/components/Modal";
import {
  BsdaRevisionRequest,
  Mutation,
  MutationCancelBsdaRevisionRequestArgs,
} from "generated/graphql/types";
import {
  CANCEL_BSDA_REVISION_REQUEST,
  GET_BSDA_REVISION_REQUESTS,
} from "../../../../../Apps/common/queries/reviews/BsdaReviewQuery";
import { useParams } from "react-router-dom";

type Props = {
  review: BsdaRevisionRequest;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export function BsdaCancelRevision({
  review,
  isModalOpenFromParent,
  onModalCloseFromParent,
}: Props) {
  const { siret } = useParams<{ siret: string }>();

  const [cancelBsdaRevisionRequest, { loading }] = useMutation<
    Pick<Mutation, "cancelBsdaRevisionRequest">,
    MutationCancelBsdaRevisionRequestArgs
  >(CANCEL_BSDA_REVISION_REQUEST, {
    refetchQueries: [
      { query: GET_BSDA_REVISION_REQUESTS, variables: { siret } },
    ],
  });
  const title = "Suppression d'une révision";
  return (
    <>
      {!isModalOpenFromParent ? (
        <TdModalTrigger
          ariaLabel={title}
          trigger={open => (
            <ActionButton icon={<IconTrash size="24px" />} onClick={open}>
              Supprimer
            </ActionButton>
          )}
          modalContent={close => (
            <div>
              <div>
                Cette révision n'a pas encore été validée par tous les
                approbateurs. Vous pouvez décider de la supprimer.
              </div>
              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--outline-primary"
                  onClick={close}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn btn--primary"
                  onClick={async () => {
                    await cancelBsdaRevisionRequest({
                      variables: { id: review.id },
                    });
                    close();
                  }}
                  disabled={loading}
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        />
      ) : (
        <Modal onClose={onModalCloseFromParent!} ariaLabel={title} isOpen>
          <div>
            <div>
              Cette révision n'a pas encore été validée par tous les
              approbateurs. Vous pouvez décider de la supprimer.
            </div>
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={onModalCloseFromParent!}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="btn btn--primary"
                onClick={async () => {
                  await cancelBsdaRevisionRequest({
                    variables: { id: review.id },
                  });
                  onModalCloseFromParent!();
                }}
                disabled={loading}
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
