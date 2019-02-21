import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Mutation } from "react-apollo";
import mutations from "./slip-actions.mutations";
import { GET_SLIPS } from "../query";
import { Form } from "../../../form/model";

type Props = { formId: string };

export default function Delete({ formId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Mutation mutation={mutations.DELETE_FORM}>
      {(deleteForm, { error }) => (
        <React.Fragment>
          <a
            className="icon"
            title="Supprimer définitivement"
            onClick={() => setIsOpen(true)}
          >
            <FaTrash />
          </a>
          <div
            className="modal__backdrop"
            id="modal"
            style={{ display: isOpen ? "flex" : "none" }}
          >
            <div className="modal">
              <h3>Confirmer la suppression ?</h3>
              <p>Cette action est irréversible.</p>
              <button
                className="button warning"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </button>
              <button
                className="button"
                onClick={() =>
                  deleteForm({
                    variables: { id: formId },
                    update: (store, { data: { deleteForm } }) => {
                      const data = store.readQuery<{ forms: Form[] }>({
                        query: GET_SLIPS
                      });
                      if (!data || !data.forms) {
                        return;
                      }
                      data.forms = data.forms.filter(
                        f => f.id !== deleteForm.id
                      );
                      store.writeQuery({ query: GET_SLIPS, data });
                    }
                  })
                }
              >
                Supprimer
              </button>
            </div>
          </div>
        </React.Fragment>
      )}
    </Mutation>
  );
}
