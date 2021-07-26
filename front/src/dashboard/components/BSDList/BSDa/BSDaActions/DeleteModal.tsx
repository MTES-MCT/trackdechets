import React from "react";
import { IconTrash } from "common/components/Icons";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationDeleteBsdaArgs } from "generated/graphql/types";
import cogoToast from "cogo-toast";
import TdModal from "common/components/Modal";

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
  onClose,
}: {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deleteBsda] = useMutation<
    Pick<Mutation, "deleteBsda">,
    MutationDeleteBsdaArgs
  >(DELETE_BSDA, {
    variables: { id: formId },
    onCompleted: () => {
      cogoToast.success("Bordereau supprimé", { hideAfter: 5 });
      !!onClose && onClose();
    },
    onError: () =>
      cogoToast.error("Le bordereau n'a pas pu être supprimé", {
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
        <button className="btn btn--primary" onClick={() => deleteBsda()}>
          <IconTrash />
          <span> Supprimer</span>
        </button>
      </div>
    </TdModal>
  );
}
