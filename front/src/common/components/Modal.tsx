import { DialogOverlay, DialogContent } from "@reach/dialog";
import { IconDelete1 } from "./Icons";
import "@reach/dialog/styles.css";
import styles from "./Modal.module.scss";
import React, { useState } from "react";
import classNames from "classnames";

type TdModalProps = {
  onClose: () => any;
  children: React.ReactNode;
  isOpen: boolean;
  padding?: boolean;
  ariaLabel: string;
  wide?: boolean;
};

export default function TdModal({
  onClose,
  isOpen,
  ariaLabel,
  children,
  padding = true,
  wide = false,
}: TdModalProps) {
  return (
    <DialogOverlay
      isOpen={isOpen}
      onDismiss={onClose}
      className={classNames("fr-raw-link fr-raw-list", styles.tdModalOverlay)}
    >
      <DialogContent
        aria-label={ariaLabel}
        className={classNames(styles.tdModal, {
          [styles.tdModalWide]: wide,
          [styles.tdModalPadding]: padding,
        })}
      >
        <button
          type="button"
          className={styles.ModalCloseButton}
          onClick={onClose}
          aria-label="Close"
        >
          <IconDelete1 aria-hidden />
        </button>
        {children}
      </DialogContent>
    </DialogOverlay>
  );
}

type ModalTriggerProps = {
  trigger: (open: () => void) => React.ReactNode;
  modalContent: (close: () => void) => React.ReactNode;
};

/**
 * Represents a component, usually a button used to trigger
 * a modal and its content
 */
export function TdModalTrigger({
  trigger,
  modalContent,
  ...modalProps
}: Pick<TdModalProps, "padding" | "ariaLabel" | "wide"> & ModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return (
    <div>
      {trigger(open)}
      <TdModal {...modalProps} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <>
          <h2 className="td-modal-title">{modalProps.ariaLabel}</h2>
          {modalContent(close)}
        </>
      </TdModal>
    </div>
  );
}
