import { useMutation } from "@apollo/react-hooks";
import React, { useState } from "react";
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
  const nextStep = getNextStep(form, siret);

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
      {nextStep && <DynamicActions form={form} nextStep={nextStep} />}
    </div>
  );
}

function DynamicActions({ form, nextStep }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mark, { error }] = useMutation(mutations[nextStep], {
    onCompleted: () => setIsOpen(false)
  });

  const ButtonComponent = nextStep ? buttons[nextStep].component : null;

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
                return mark({ variables: { id: form.id, ...vars } });
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
