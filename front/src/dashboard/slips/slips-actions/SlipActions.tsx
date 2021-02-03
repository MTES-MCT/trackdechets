import React, { useState, useCallback } from "react";
import { IconChevronDown, IconChevronUp } from "common/components/Icons";
import { Form, FormStatus } from "generated/graphql/types";
import "./SlipActions.scss";
import Delete from "./Delete";
import DownloadPdf from "./DownloadPdf";
import Edit from "./Edit";
import Duplicate from "./Duplicate";
import Quicklook from "./Quicklook";
import OutsideClickHandler from "react-outside-click-handler";

interface SlipActionsProps {
  form: Form;
}

export const SlipActions = ({ form }: SlipActionsProps) => {
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
            <IconChevronUp size="18px" color="blueLight" />
          ) : (
            <IconChevronDown size="18px" color="blueLight" />
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
              {form.status !== FormStatus.Draft && (
                <li className="slips-actions__item">
                  <DownloadPdf formId={form.id} onSuccess={onClose} />
                </li>
              )}
              {[FormStatus.Draft, FormStatus.Sealed].includes(form.status) && (
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
