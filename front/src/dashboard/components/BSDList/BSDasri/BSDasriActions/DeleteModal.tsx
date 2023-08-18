import React from "react";
import { IconTrash } from "Apps/common/Components/Icons/Icons";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationDeleteBsdasriArgs } from "generated/graphql/types";
import cogoToast from "cogo-toast";
import TdModal from "Apps/common/Components/Modal/Modal";
import { GET_BSDS } from "Apps/common/queries";
import { Loader } from "Apps/common/Components";

const DELETE_BSDASRI = gql`
  mutation DeleteBsdasri($id: ID!) {
    deleteBsdasri(id: $id) {
      id
      status
    }
  }
`;

export function DeleteBsdasriModal({
  formId,
  isOpen,
  onClose,
}: {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deleteBsdasri, { loading }] = useMutation<
    Pick<Mutation, "deleteBsdasri">,
    MutationDeleteBsdasriArgs
  >(DELETE_BSDASRI, {
    variables: { id: formId },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
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
        <button className="btn btn--primary" onClick={() => deleteBsdasri()}>
          <IconTrash />
          <span> Supprimer</span>
        </button>
      </div>
      {loading && <Loader />}
    </TdModal>
  );
}
