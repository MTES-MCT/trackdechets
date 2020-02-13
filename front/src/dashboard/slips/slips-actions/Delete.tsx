import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import mutations from "./slip-actions.mutations";
import { GET_SLIPS } from "../query";
import { currentSiretService } from "../../CompanySelector";
import { useMutation } from "@apollo/react-hooks";
import { uploadApolloCache } from "../../../common/helper";
import { Form } from "../../../form/model";

type Props = { formId: string };

export default function Delete({ formId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteForm] = useMutation(mutations.DELETE_FORM, {
    variables: { id: formId },
    update: (store, { data: { deleteForm } }) => {
      uploadApolloCache<{ forms: Form[] }>(store, {
        query: GET_SLIPS,
        variables: { siret: currentSiretService.getSiret() },
        getNewData: data => ({
          forms: [...data.forms.filter(f => f.id !== deleteForm.id)]
        })
      });
    }
  });

  return (
    <>
      <button
        className="icon"
        title="Supprimer définitivement"
        onClick={() => setIsOpen(true)}
      >
        <FaTrash />
      </button>
      <div
        className="modal__backdrop"
        id="modal"
        style={{ display: isOpen ? "flex" : "none" }}
      >
        <div className="modal">
          <h3>Confirmer la suppression ?</h3>
          <p>Cette action est irréversible.</p>
          <button className="button warning" onClick={() => setIsOpen(false)}>
            Annuler
          </button>
          <button className="button" onClick={() => deleteForm()}>
            Supprimer
          </button>
        </div>
      </div>
    </>
  );
}
