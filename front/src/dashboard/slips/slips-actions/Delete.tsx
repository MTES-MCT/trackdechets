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
import TdModal from "common/components/Modal";

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

export default function Delete({
  formId,
  small = true,
  onOpen,
  onClose,
}: Props) {
  const { siret } = useParams<{ siret: string }>();
  const [isOpen, setIsOpen] = useState(false);
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
      !!onClose && onClose();
    },
    onError: () =>
      cogoToast.error("Le bordereau n'a pas pu être supprimé", {
        hideAfter: 5,
      }),
  });
  const className = small
    ? "btn--no-style slips-actions__button"
    : "btn btn--outline-primary";

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
      <TdModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          !!onClose && onClose();
        }}
        ariaLabel="Supprimer un bordereau"
      >
        <h2 className="td-modal-title">Confirmer la suppression ?</h2>
        <p>Cette action est irréversible.</p>
        <div className="td-modal-actions">
          <button
            className="btn btn--outline-primary"
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </button>
          <button className="btn btn--primary" onClick={() => deleteForm()}>
            <IconTrash />
            <span> Supprimer</span>
          </button>
        </div>
      </TdModal>
    </>
  );
}
