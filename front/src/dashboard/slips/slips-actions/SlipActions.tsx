import { useMutation } from "@apollo/react-hooks";
import React, { useState, useEffect, useCallback } from "react";

import {
  WaterDamIcon,
  CogApprovedIcon,
  PaperWriteIcon,
  DeliveryTruckClockIcon,
  WarehouseStorageIcon,
} from "common/components/Icons";
import { Form } from "generated/graphql/types";
import "./SlipActions.scss";
import Delete from "./Delete";
import DownloadPdf from "./DownloadPdf";
import Edit from "./Edit";
import Duplicate from "./Duplicate";
import Quicklook from "./Quicklook";
import { getNextStep } from "./next-step";
import Processed from "./Processed";
import Received from "./Received";
import Sealed from "./Sealed";
import Resealed from "./Resealed";
import mutations from "./slip-actions.mutations";
import { NotificationError } from "common/components/Error";
import { ChevronDown, ChevronUp } from "common/components/Icons";
import OutsideClickHandler from "react-outside-click-handler";
import { COLORS } from "common/config";
import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";

export type SlipActionProps = {
  onSubmit: (vars: any) => any;
  onCancel: () => void;
  form: Form;
};
interface SlipActionsProps {
  form: Form;
  siret: string;
}

export const SlipActions = ({ form, siret }: SlipActionsProps) => {
  const [dropdownOpened, toggleDropdown] = useState(false);
  // To avoid tracking each dropdown opening state we rely on OutsideClickHandler to close opened dropdown
  //when we open another one.
  // As contextual modals are dom-nested in triggering buttons, they would be
  // closed by <OutsideClickHandler> when we click anywhere on the screen
  // so we enable/disable the outside click behaviour
  const [outsideClickEnabled, toggleOutsideClick] = useState(true);
  const disableOutsideClick = () => toggleOutsideClick(false);

  // callback when a child modal is closed
  const _onClose = () => {
    toggleOutsideClick(true);
    toggleDropdown(false);
  };
  // Avoid warning and rerendering in granchild useEffect()
  const onClose = useCallback(() => _onClose(), []);
  return (
    <OutsideClickHandler
      useCapture={false}
      onOutsideClick={() => {
        if (dropdownOpened && outsideClickEnabled) {
          toggleDropdown(false);
        }
      }}
    >
      <div className="slips-actions">
        <button
          onClick={() => toggleDropdown(!dropdownOpened)}
          className="slips-actions-trigger"
        >
          <span>Actions</span>
          {dropdownOpened ? (
            <ChevronUp size={18} color={COLORS.blueLight} />
          ) : (
            <ChevronDown size={18} color={COLORS.blueLight} />
          )}
        </button>
        {dropdownOpened && (
          <div className="slips-actions__content">
            <ul className="slips-actions__items">
              <li className="slips-actions__item">
                <Quicklook
                  formId={form.id}
                  buttonClass="btn--no-style slips-actions__button"
                  onOpen={disableOutsideClick}
                  onClose={onClose}
                />
              </li>

              {form.status === "DRAFT" ? (
                <>
                  <li className="slips-actions__item">
                    <Delete
                      formId={form.id}
                      onOpen={disableOutsideClick}
                      onClose={onClose}
                    />
                  </li>
                  <li className="slips-actions__item">
                    <Edit formId={form.id} />
                  </li>
                </>
              ) : (
                <li className="slips-actions__item">
                  <DownloadPdf formId={form.id} onSuccess={onClose} />
                </li>
              )}
              <li className="slips-actions__item">
                <Duplicate formId={form.id} onClose={onClose} />
              </li>
            </ul>
          </div>
        )}
      </div>
    </OutsideClickHandler>
  );
};

interface DynamicActionsProps extends SlipActionsProps {
  siret: string;
  refetch?: () => void;
}
export function DynamicActions({ form, siret, refetch }: DynamicActionsProps) {
  const nextStep = getNextStep(form, siret);
  // This dynamic mutation must have a value, otherwise the `useMutation` hook throws.
  // And hooks should not be conditionally called (cf rules of hooks)
  // Therefore, when there is no `nextStep`, we assign it **any** mutation: it does not matter as it will never get called
  // Indeed nothing is rendered when there is no `nextStep`
  const dynamicMutation = nextStep
    ? mutations[nextStep]
    : mutations.DELETE_FORM;

  const [isOpen, setIsOpen] = useState(false);
  const [mark, { error }] = useMutation(dynamicMutation, {
    onCompleted: () => {
      !!refetch && refetch();
    },
  });

  useEffect(() => {
    setIsOpen(false);
  }, [nextStep]);

  const ButtonComponent = nextStep ? buttons[nextStep].component : null;

  if (!nextStep) {
    return null;
  }

  return (
    <div className="SlipActions">
      <ActionButton
        title={buttons[nextStep].title}
        icon={buttons[nextStep].icon}
        onClick={() => setIsOpen(true)}
      />

      <TdModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel={buttons[nextStep].title}
      >
        <h2 className="td-modal-title">{buttons[nextStep].title}</h2>
        {ButtonComponent && (
          <ButtonComponent
            onCancel={() => setIsOpen(false)}
            onSubmit={vars => mark({ variables: { id: form.id, ...vars } })}
            form={form}
          />
        )}
        {error && (
          <NotificationError className="action-error" apolloError={error} />
        )}
      </TdModal>
    </div>
  );
}

const buttons = {
  SEALED: {
    title: "Finaliser le bordereau",
    icon: PaperWriteIcon,
    component: Sealed,
  },
  RECEIVED: {
    title: "Valider la réception",
    icon: WaterDamIcon,
    component: Received,
  },
  PROCESSED: {
    title: "Valider le traitement",
    icon: CogApprovedIcon,
    component: Processed,
  },
  TEMP_STORED: {
    title: "Valider l'entreposage provisoire",
    icon: WarehouseStorageIcon,
    component: Received,
  },
  RESEALED: {
    title: "Compléter le BSD suite",
    icon: PaperWriteIcon,
    component: Resealed,
  },
};
