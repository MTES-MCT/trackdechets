import React, { useState } from "react";
import { IconTrash } from "common/components/Icons";
import { DRAFT_TAB_FORMS, FOLLOW_TAB_FORMS } from "../tabs/queries";
import { gql, useMutation } from "@apollo/client";
import { updateApolloCache } from "common/helper";
import {
  FormStatus,
  Mutation,
  MutationDeleteFormArgs,
  Query,
} from "generated/graphql/types";
import { useParams } from "react-router-dom";
import cogoToast from "cogo-toast";
import { Modal, ModalTitle } from "common/components";

type Props = {
  formId: string;
  small?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

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
        // update draft tab
        updateApolloCache<Pick<Query, "forms">>(cache, {
          query: DRAFT_TAB_FORMS,
          variables: { siret },
          getNewData: data => ({
            forms: [...data.forms.filter(f => f.id !== deleteForm.id)],
          }),
        });
      } else if (deleteForm.status === FormStatus.Sealed) {
        // update follow tab
        updateApolloCache<Pick<Query, "forms">>(cache, {
          query: FOLLOW_TAB_FORMS,
          variables: {
            siret,
          },
          getNewData: data => ({
            forms: [...data.forms.filter(f => f.id !== deleteForm.id)],
          }),
        });
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

export default function Delete({
  formId,
  small = true,
  onOpen,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const className = small ? "btn--no-style" : "btn btn--outline-primary";

  return (
    <>
      <button
        className={className}
        title="Supprimer définitivement"
        onClick={() => {
          setIsOpen(true);
          onOpen && onOpen();
        }}
      >
        <IconTrash color="blueLight" size="24px" />
        <span>Supprimer</span>
      </button>
      {isOpen && (
        <DeleteModal
          formId={formId}
          onClose={() => {
            setIsOpen(false);
            onClose && onClose();
          }}
        />
      )}
    </>
  );
}
