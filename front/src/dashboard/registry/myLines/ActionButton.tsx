import React from "react";
import { ButtonElementProps } from "../../../Apps/common/Components/DropdownMenu/dropdownMenuTypes";
import classNames from "classnames";
import styles from "./ActionButton.module.scss";

export const ActionButton: React.FC<ButtonElementProps> = ({
  id,
  disabled,
  onClick,
  isOpen,
  menuTitle
}) => {
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
    >
      <span className="fr-sr-only">
        {isOpen ? `Fermer ${menuTitle}` : `Ouvrir ${menuTitle}`}
      </span>
      <figure aria-hidden={true} className={styles.dots}></figure>
      <figure aria-hidden={true} className={styles.dots}></figure>
      <figure aria-hidden={true} className={styles.dots}></figure>
    </button>
  );
};

export default ActionButton;
