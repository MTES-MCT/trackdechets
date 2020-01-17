import React, { useState } from "react";
import { Mutation } from "@apollo/react-components";
import {
  FaCheck,
  FaCog,
  FaEdit,
  FaEnvelope,
  FaEnvelopeOpen
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { Form } from "../../form/model";
import { Me } from "../../login/model";
import "./SlipActions.scss";
import Delete from "./slips-actions/Delete";
import DownloadPdf from "./slips-actions/DownloadPdf";
import Duplicate from "./slips-actions/Duplicate";
import { getNextStep } from "./slips-actions/next-step";
import Processed from "./slips-actions/Processed";
import Received from "./slips-actions/Received";
import Sealed from "./slips-actions/Sealed";
import Sent from "./slips-actions/Sent";
import mutations from "./slips-actions/slip-actions.mutations";

export type SlipActionProps = {
  onSubmit: (vars: any) => any;
  onCancel: () => void;
  form: Form;
};

interface IProps {
  form: Form;
  currentUser: Me;
}
export default function SlipActions({ form, currentUser }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const nextStep = getNextStep(form, currentUser);

  const ButtonComponent = nextStep ? buttons[nextStep].component : null;

  return (
    <div className="SlipActions">
      {form.status === "DRAFT" ? (
        <React.Fragment>
          <Link to={`/form/${form.id}`} className="icon" title="Editer">
            <FaEdit />
          </Link>
          <Delete formId={form.id} />
        </React.Fragment>
      ) : (
        <DownloadPdf formId={form.id} />
      )}
      <Duplicate formId={form.id} />
      {nextStep && (
        <Mutation
          mutation={mutations[nextStep]}
          onCompleted={() => setIsOpen(false)}
        >
          {(mark, { error }) => (
            <React.Fragment>
              <button
                className="icon"
                onClick={() => setIsOpen(true)}
                title={buttons[nextStep].title}
              >
                {buttons[nextStep].icon({})}
              </button>
              <div
                className="modal__backdrop"
                id="modal"
                style={{ display: isOpen ? "flex" : "none" }}
              >
                <div className="modal">
                  <h2>{buttons[nextStep].title}</h2>
                  {ButtonComponent && (
                    <ButtonComponent
                      onCancel={() => setIsOpen(false)}
                      onSubmit={vars =>
                        mark({ variables: { id: form.id, ...vars } })
                      }
                      form={form}
                    />
                  )}
                  {error && (
                    <div
                      className="notification error action-error"
                      dangerouslySetInnerHTML={{
                        __html: error.graphQLErrors[0].message
                      }}
                    />
                  )}
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
  SEALED: { title: "Finaliser", icon: FaCheck, component: Sealed },
  SENT: { title: "Marquer comme envoyé", icon: FaEnvelope, component: Sent },
  RECEIVED: {
    title: "Marquer comme reçu",
    icon: FaEnvelopeOpen,
    component: Received
  },
  PROCESSED: {
    title: "Marquer comme traité",
    icon: FaCog,
    component: Processed
  }
};
