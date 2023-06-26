import React from "react";
import { IconTrash } from "common/components/Icons";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationDeleteBsffArgs } from "generated/graphql/types";
import cogoToast from "cogo-toast";
import TdModal from "common/components/Modal";
import { GET_BSDS } from "Apps/common/queries";
import { Loader } from "Apps/common/Components";

const DELETE_BSFF = gql`
  mutation DeleteBsff($id: ID!) {
    deleteBsff(id: $id) {
      id
      status
    }
  }
`;

export function DeleteBsffModal({
  formId,
  isOpen,
  onClose,
}: {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deleteBsff, { loading }] = useMutation<
    Pick<Mutation, "deleteBsff">,
    MutationDeleteBsffArgs
  >(DELETE_BSFF, {
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
        <button className="btn btn--primary" onClick={() => deleteBsff()}>
          <IconTrash />
          <span> Supprimer</span>
        </button>
      </div>
      {loading && <Loader />}
    </TdModal>
  );
}
