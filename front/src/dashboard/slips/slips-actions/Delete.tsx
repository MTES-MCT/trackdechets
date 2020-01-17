import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Mutation } from "@apollo/react-components";
import mutations from "./slip-actions.mutations";
import { GET_SLIPS } from "../query";
import { currentSiretService } from "../../CompanySelector";

type Props = { formId: string };

export default function Delete({ formId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Mutation mutation={mutations.DELETE_FORM}>
      {(deleteForm, { error }) => (
        <React.Fragment>
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
                      const data = store.readQuery({
                        query: GET_SLIPS,
                        variables: { siret: currentSiretService.getSiret() }
                      });
                      if (!data || !data.forms) {
                        return;
                      }

                      store.writeQuery({
                        query: GET_SLIPS,
                        variables: { siret: currentSiretService.getSiret() },
                        data: {
                          forms: [
                            ...data.forms.filter(f => f.id !== deleteForm.id)
                          ]
                        }
                      });
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
