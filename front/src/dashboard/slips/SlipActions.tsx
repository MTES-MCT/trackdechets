import { useMutation } from "@apollo/react-hooks";
import React, { useState, useEffect } from "react";
import {
  FaTruckMoving,
  FaCogs,
  FaEdit,
  FaIndustry,
  FaFileSignature,
  FaPencilAlt,
} from "react-icons/fa";
import { IconContext } from "react-icons";

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
import Resealed from "./slips-actions/Resealed";
import Resent from "./slips-actions/Resent";
import mutations from "./slips-actions/slip-actions.mutations";
import { NotificationError } from "../../common/Error";

export type SlipActionProps = {
  onSubmit: (vars: any) => any;
  onCancel: () => void;
  form: Form;
};

interface SlipActionsProps {
  form: Form;
}
export function SlipActions({ form }: SlipActionsProps) {
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
    </div>
  );
}

interface DynamicActionsProps extends SlipActionsProps {
  siret: string;
}
export function DynamicActions({ form, siret }: DynamicActionsProps) {
  const nextStep = getNextStep(form, siret);
  // This dynamic mutation must have a value, otherwise the `useMutation` hook throws.
  // And hooks should not be conditionally called (cf rules of hooks)
  // Therefore, when there is no `nextStep`, we assign it **any** mutation: it does not matter as it will never get called
  // Indeed nothing is rendered when there is no `nextStep`
  const dynamicMutation = nextStep
    ? mutations[nextStep]
    : mutations.DELETE_FORM;

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
    <div className="SlipActions">
      <button
        className="button small"
        onClick={() => setIsOpen(true)}
        title={buttons[nextStep].title}
      >
        <span className="dynamic-action">
          <IconContext.Provider value={{ size: "2em" }}>
            {buttons[nextStep].icon({})}
          </IconContext.Provider>
          <span className="dynamic-action__text">
            {buttons[nextStep].title}
          </span>
        </span>
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
              onSubmit={(vars) => {
                mark({ variables: { id: form.id, ...vars } });
              }}
              form={form}
            />
          )}
          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
        </div>
      </div>
    </div>
  );
}

const buttons = {
  SEALED: {
    title: "Finaliser le bordereau",
    icon: FaFileSignature,
    component: Sealed,
  },
  SENT: { title: "Valider l'enlèvement", icon: FaTruckMoving, component: Sent },
  RECEIVED: {
    title: "Valider la réception",
    icon: FaIndustry,
    component: Received,
  },
  PROCESSED: {
    title: "Valider le traitement",
    icon: FaCogs,
    component: Processed,
  },
  TEMP_STORED: {
    title: "Valider l'entreposage provisoire",
    icon: FaIndustry,
    component: Received,
  },
  RESEALED: {
    title: "Compléter le BSD suite",
    icon: FaPencilAlt,
    component: Resealed,
  },
  RESENT: {
    title: "Valider l'envement",
    icon: FaTruckMoving,
    component: Resent,
  },
};
