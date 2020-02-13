import { useMutation } from "@apollo/react-hooks";
import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaCog,
  FaEdit,
  FaEnvelope,
  FaEnvelopeOpen
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { Form } from "../../form/model";
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
  siret: string;
}
export default function SlipActions({ form, siret }: IProps) {
  return (
    <div className="SlipActions">
      {form.status === "DRAFT" ? (
        <>
          <Link to={`/form/${form.id}`} className="icon" title="Editer">
            <FaEdit />
          </Link>
          <Delete formId={form.id} />
        </>
      ) : (
        <DownloadPdf formId={form.id} />
      )}
      <Duplicate formId={form.id} />
      <DynamicActions form={form} siret={siret} />
    </div>
  );
}

function DynamicActions({ form, siret }) {
  const nextStep = getNextStep(form, siret);
  // This dynamic mutation must have a value, otherwise the `useMutation` hook throws.
  // And hooks should not be conditionally called (cf rules of hooks)
  // Therefore, when there is no `nextStep`, we assign it **any** mutation: it does not matter at it will never get called
  // Indeed nothing is rendered when there is no `nextStep`
  const dynamicMutation = mutations[nextStep ?? mutations.DELETE_FORM];

  const [isOpen, setIsOpen] = useState(false);
  const [mark, { error }] = useMutation(dynamicMutation);

  useEffect(() => {
    setIsOpen(false);
  }, [nextStep]);

  const ButtonComponent = nextStep ? buttons[nextStep].component : null;

  if (!nextStep) {
    return null;
  }

  return (
    <>
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
              onSubmit={vars => {
                mark({ variables: { id: form.id, ...vars } });
              }}
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
    </>
  );
}

const buttons = {
  SEALED: { title: "Finaliser", icon: FaCheck, component: Sealed },
  SENT: { title: "Marquer comme envoyé", icon: FaEnvelope, component: Sent },
  RECEIVED: {
    title: "Réception du déchet",
    icon: FaEnvelopeOpen,
    component: Received
  },
  PROCESSED: {
    title: "Marquer comme traité",
    icon: FaCog,
    component: Processed
  }
};
