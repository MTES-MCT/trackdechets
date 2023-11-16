import React from "react";
import { IconTrash } from "../../../../../Apps/common/Components/Icons/Icons";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationDeleteFormArgs } from "codegen-ui";
import toast from "react-hot-toast";
import TdModal from "../../../../../Apps/common/Components/Modal/Modal";
import { GET_BSDS } from "../../../../../Apps/common/queries";
import { Loader } from "../../../../../Apps/common/Components";
import { TOAST_DURATION } from "../../../../../common/config";

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
  onClose
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
      toast.success("Bordereau supprimé", { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: error =>
      toast.error(error.message, {
        duration: TOAST_DURATION
      })
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
