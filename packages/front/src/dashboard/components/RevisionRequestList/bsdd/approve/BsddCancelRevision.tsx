import React from "react";
import { useMutation } from "@apollo/client";
import { ActionButton } from "common/components";
import { IconTrash } from "common/components/Icons";
import { TdModalTrigger } from "common/components/Modal";
import {
  FormRevisionRequest,
  Mutation,
  MutationCancelFormRevisionRequestArgs
} from "@trackdechets/codegen/src/front.gen";
import {
  CANCEL_FORM_REVISION_REQUEST,
  GET_FORM_REVISION_REQUESTS
} from "../query";

type Props = {
  review: FormRevisionRequest;
};

export function BsddCancelRevision({ review }: Props) {
  const [cancelFormRevisionRequest, { loading }] = useMutation<
    Pick<Mutation, "cancelFormRevisionRequest">,
    MutationCancelFormRevisionRequestArgs
  >(CANCEL_FORM_REVISION_REQUEST, {
    refetchQueries: [GET_FORM_REVISION_REQUESTS]
  });

  return (
    <TdModalTrigger
      ariaLabel="Suppression d'une révision"
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
  );
}
