import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mutation } from "react-apollo";
import mutations from "./slips-actions/slip-actions.mutations";
import { Form } from "../../form/model";
import { Me } from "../../login/model";
import "./SlipActions.scss";
import Sent from "./slips-actions/Sent";
import Sealed from "./slips-actions/Sealed";
import Received from "./slips-actions/Received";
import { FaEdit, FaFilePdf, FaCheck, FaEnvelope, FaEnvelopeOpen, FaCog, FaClone } from "react-icons/fa";

export type SlipActionProps = {
  onSubmit: (vars: any) => any;
  onCancel: () => void;
};

interface IProps {
  form: Form;
  currentUser: Me;
}
export default function SlipActions({ form, currentUser }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const nextStep = getNextStep(form, currentUser);

  return (
    <div className="SlipActions">
      {form.status === "DRAFT" && (
        <Link to={`/form/${form.id}`} className="icon">
          <FaEdit />
        </Link>
      )}
      {form.status !== "DRAFT" && (
          <FaFilePdf />
      )}
      {nextStep && (
        <Mutation
          mutation={mutations[nextStep]}
          onCompleted={() => setIsOpen(false)}
        >
          {(mark, { error }) => (
            <React.Fragment>
              <a className="icon" onClick={() => setIsOpen(true)}>
                {buttons[nextStep].icon({})}
              </a>
              <div
                className="modal__backdrop"
                id="modal"
                style={{ display: isOpen ? "flex" : "none" }}
              >
                <div className="modal">
                  <h2>{buttons[nextStep].title}</h2>
                  {buttons[nextStep].component({
                    onCancel: () => setIsOpen(false),
                    onSubmit: vars =>
                      mark({ variables: { id: form.id, ...vars } })
                  })}
                  {error && (
                    <div className="notification error">{error.message}</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </Mutation>
      )}
      <a><FaClone /></a>
    </div>
  );
}

const buttons = {
  SEALED: { title: "Finaliser", icon: FaCheck, component: Sealed },
  SENT: { title: "Marquer comme envoyé", icon: FaEnvelope, component: Sent },
  RECEIVED: { title: "Marquer comme reçu", icon: FaEnvelopeOpen,component: Received },
  PROCESSED: { title: "Marquer comme traité", icon: FaCog, component: Sent }
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
