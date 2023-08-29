import React from "react";
import { IconTrash } from "Apps/common/Components/Icons/Icons";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationDeleteFormArgs } from "generated/graphql/types";
import cogoToast from "cogo-toast";
import TdModal from "Apps/common/Components/Modal/Modal";
import { GET_BSDS } from "Apps/common/queries";
import { Loader } from "Apps/common/Components";

const DELETE_FORM = gql`
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id) {
      id
      status
    }
  }
`;

export function DeleteModal({
  formId,
  isOpen,
  onClose,
}: {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deleteForm, { loading }] = useMutation<
    Pick<Mutation, "deleteForm">,
    MutationDeleteFormArgs
  >(DELETE_FORM, {
    variables: { id: formId },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      cogoToast.success("Bordereau supprimé", { hideAfter: 5 });
      !!onClose && onClose();
    },
    onError: error =>
      cogoToast.error(error.message, {
        hideAfter: 5,
      }),
  });

  return (
    <TdModal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      ariaLabel="Supprimer un bordereau"
    >
      <h2 className="td-modal-title">Confirmer la suppression ?</h2>
      <p>Cette action est irréversible.</p>
      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={() => onClose()}>
          Annuler
        </button>
        <button className="btn btn--primary" onClick={() => deleteForm()}>
          <IconTrash />
          <span> Supprimer</span>
        </button>
      </div>
      {loading && <Loader />}
    </TdModal>
  );
}
