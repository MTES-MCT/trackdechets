import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mutation } from "react-apollo";
import mutations from "./slip-actions.mutations";
import { Form } from "../../form/model";
import { Me } from "../../login/model";

interface IProps {
  form: Form;
  currentUser: Me;
}
export default function SlipActions({ form, currentUser }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const nextStep = getNextStep(form, currentUser);
  console.log(nextStep, form.status);

  return (
    <div className="actions">
      {form.status === "DRAFT" && (
        <Link to={`/form/${form.id}`}>
          <button className="button small">Editer</button>
        </Link>
      )}
      {nextStep && (
        <Mutation
          mutation={mutations[nextStep]}
          onCompleted={() => setIsOpen(false)}
        >
          {(mark, { error }) => (
            <React.Fragment>
              <button className="button small" onClick={() => setIsOpen(true)}>
                {buttons[nextStep].title}
              </button>
              <div
                className="modal__backdrop"
                id="modal"
                style={{ display: isOpen ? "flex" : "none" }}
              >
                <div className="modal">
                  <h2>{buttons[nextStep].title}</h2>
                  <p>{buttons[nextStep].content}</p>
                  {error && (
                    <div className="notification error">{error.message}</div>
                  )}
                  <div className="form__group button__group">
                    <button
                      className="button"
                      onClick={() => mark({ variables: { id: form.id } })}
                    >
                      {buttons[nextStep].title}
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => setIsOpen(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )}
        </Mutation>
      )}
    </div>
  );
}

const buttons = {
  SEALED: {
    title: "Finaliser",
    content:
      "Cette action aura pour effet de finaliser votre bordereau, c'est à dire qu'il ne sera plus éditable. Cette action est nécessaire pour générer un bordereau PDF et permet au bordereau d'entrer dans le circuit de validation."
  },
  SENT: { title: "Marqué comme envoyé", content: "" },
  RECEIVED: { title: "Marqué comme reçu", content: "" },
  PROCESSED: { title: "Marqué comme traité", content: "" }
};

function getNextStep(form: Form, currentUser: Me) {
  const currentUserIsEmitter =
    form.emitter.company.siret === currentUser.company.siret;

  if (form.status === "DRAFT") return "SEALED";

  if (currentUserIsEmitter) {
    if (form.status === "SEALED") return "SENT";
    return null;
  }

  if (form.status === "SENT") return "RECEIVED";
  if (form.status === "RECEIVED") return "PROCESSED";
  return null;
}
