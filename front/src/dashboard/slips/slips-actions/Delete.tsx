import React, { useState } from "react";

import { COLORS } from "common/config";
import { TrashIcon } from "common/components/Icons";
import mutations from "./slip-actions.mutations";
import { GET_SLIPS } from "../query";
import { useMutation } from "@apollo/react-hooks";
import { updateApolloCache } from "common/helper";
import {
  Form,
  Mutation,
  MutationDeleteFormArgs,
} from "generated/graphql/types";
import { generatePath, useHistory, useParams } from "react-router-dom";
import cogoToast from "cogo-toast";
import TdModal from "common/components/Modal";
import { routes } from "common/routes";

type Props = {
  formId: string;
  small?: boolean;
  redirectToDashboard?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Delete({
  formId,
  small = true,
  onOpen,
  onClose,
  redirectToDashboard,
}: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteForm] = useMutation<
    Pick<Mutation, "deleteForm">,
    MutationDeleteFormArgs
  >(mutations.DELETE_FORM, {
    variables: { id: formId },
    update: (store, { data }) => {
      if (!data?.deleteForm) {
        return;
      }
      const deleteForm = data.deleteForm;
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_SLIPS,
        variables: { siret, status: ["DRAFT"] },
        getNewData: data => ({
          forms: [...data.forms.filter(f => f.id !== deleteForm.id)],
        }),
      });
    },
    onCompleted: () => {
      cogoToast.success("Bordereau supprimé", { hideAfter: 5 });

      if (redirectToDashboard) {
        history.push(
          generatePath(routes.dashboard.slips.drafts, {
            siret,
          })
        );
      }
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
        <TrashIcon color={COLORS.blueLight} />
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
            <TrashIcon />
            <span> Supprimer</span>
          </button>
        </div>
      </TdModal>
    </>
  );
}
