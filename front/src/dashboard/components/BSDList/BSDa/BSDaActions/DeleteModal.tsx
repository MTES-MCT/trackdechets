import React from "react";
import { IconTrash } from "../../../../../Apps/common/Components/Icons/Icons";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationDeleteBsdaArgs } from "codegen-ui";
import toast from "react-hot-toast";
import TdModal from "../../../../../Apps/common/Components/Modal/Modal";
import { GET_BSDS } from "../../../../../Apps/common/queries";
import { Loader } from "../../../../../Apps/common/Components";

const DELETE_BSDA = gql`
  mutation DeleteBsda($id: ID!) {
    deleteBsda(id: $id) {
      id
      status
    }
  }
`;

export function DeleteBsdaModal({
  formId,
  isOpen,
  onClose
}: {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deleteBsda, { loading }] = useMutation<
    Pick<Mutation, "deleteBsda">,
    MutationDeleteBsdaArgs
  >(DELETE_BSDA, {
    variables: { id: formId },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success("Bordereau supprimé", { duration: 2000 });
      !!onClose && onClose();
    },
    onError: () =>
      toast.error("Le bordereau n'a pas pu être supprimé", {
        duration: 5
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
        <button className="btn btn--primary" onClick={() => deleteBsda()}>
          <IconTrash />
          <span> Supprimer</span>
        </button>
        {loading && <Loader />}
      </div>
    </TdModal>
  );
}
