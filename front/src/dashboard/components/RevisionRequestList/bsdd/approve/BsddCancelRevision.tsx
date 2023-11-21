import React from "react";
import { useMutation } from "@apollo/client";
import { ActionButton, Modal } from "../../../../../common/components";
import { IconTrash } from "../../../../../Apps/common/Components/Icons/Icons";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import {
  FormRevisionRequest,
  Mutation,
  MutationCancelFormRevisionRequestArgs
} from "codegen-ui";
import {
  CANCEL_FORM_REVISION_REQUEST,
  GET_FORM_REVISION_REQUESTS
} from "../../../../../Apps/common/queries/reviews/BsddReviewsQuery";

type Props = {
  review: FormRevisionRequest;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export function BsddCancelRevision({
  review,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  const [cancelFormRevisionRequest, { loading }] = useMutation<
    Pick<Mutation, "cancelFormRevisionRequest">,
    MutationCancelFormRevisionRequestArgs
  >(CANCEL_FORM_REVISION_REQUEST, {
    refetchQueries: [GET_FORM_REVISION_REQUESTS]
  });
  const title = "Suppression d'une révision";
  return !isModalOpenFromParent ? (
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
            Cette révision n'a pas encore été validée par tous les approbateurs.
            Vous pouvez décider de la supprimer.
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
                await cancelFormRevisionRequest({
                  variables: { id: review.id }
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
          Cette révision n'a pas encore été validée par tous les approbateurs.
          Vous pouvez décider de la supprimer.
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
              await cancelFormRevisionRequest({
                variables: { id: review.id }
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
  );
}
