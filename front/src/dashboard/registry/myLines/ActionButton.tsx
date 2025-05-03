import React, { forwardRef } from "react";
import { ButtonElementProps } from "../../../Apps/common/Components/DropdownMenu/dropdownMenuTypes";
import classNames from "classnames";
import styles from "./ActionButton.module.scss";

export const ActionButton = forwardRef<HTMLButtonElement, ButtonElementProps>(
  function ActionButton({ id, disabled, onClick, isOpen, menuTitle }, ref) {
    return (
      <button
        id={id}
        type="button"
        className={classNames(
          styles.actionButton,
          "fr-btn fr-btn--tertiary-no-outline"
        )}
        aria-expanded={isOpen}
        onClick={onClick}
        disabled={disabled}
        ref={ref}
      >
        <span className="fr-sr-only">
          {isOpen ? `Fermer ${menuTitle}` : `Ouvrir ${menuTitle}`}
        </span>
        <span
          className={classNames(styles.icon, "fr-icon-more-fill")}
          aria-hidden="true"
        ></span>
      </button>
    );
  }
);

export default ActionButton;
