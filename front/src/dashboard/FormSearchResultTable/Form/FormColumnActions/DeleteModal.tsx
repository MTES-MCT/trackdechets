import React from "react";
import { IconTrash } from "common/components/Icons";
import { gql, useMutation } from "@apollo/client";
import {
  FormStatus,
  Mutation,
  MutationDeleteFormArgs,
} from "generated/graphql/types";
import { useParams } from "react-router-dom";
import cogoToast from "cogo-toast";
import { Modal, ModalTitle } from "common/components";

const DELETE_FORM = gql`
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id) {
      id
      status
    }
  }
`;

interface DeleteModalProps {
  formId: string;
  onClose: () => void;
}

export function DeleteModal({ formId, onClose }: DeleteModalProps) {
  const { siret } = useParams<{ siret: string }>();
  const [deleteForm] = useMutation<
    Pick<Mutation, "deleteForm">,
    MutationDeleteFormArgs
  >(DELETE_FORM, {
    variables: { id: formId },
    update: (cache, { data }) => {
      if (!data?.deleteForm) {
        return;
      }
      const deleteForm = data.deleteForm;

      if (deleteForm.status === FormStatus.Draft) {
        // FIXME: update draft tab
      } else if (deleteForm.status === FormStatus.Sealed) {
        // FIXME: update follow tab
      }
    },
    onCompleted: () => {
      cogoToast.success("Bordereau supprimé", { hideAfter: 5 });
      onClose();
    },
    onError: () =>
      cogoToast.error("Le bordereau n'a pas pu être supprimé", {
        hideAfter: 5,
      }),
  });

  return (
    <Modal ariaLabel="Supprimer un bordereau" onClose={onClose} isOpen>
      <ModalTitle>Confirmer la suppression ?</ModalTitle>
      <p>Cette action est irréversible.</p>
      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={onClose}>
          Annuler
        </button>
        <button className="btn btn--primary" onClick={() => deleteForm()}>
          <IconTrash />
          <span> Supprimer</span>
        </button>
      </div>
    </Modal>
  );
}
