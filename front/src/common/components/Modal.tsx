import { DialogOverlay, DialogContent } from "@reach/dialog";
import { Close } from "./Icons";
import "@reach/dialog/styles.css";
import styles from "./Modal.module.scss";
import React from "react";

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
      className={styles.tdModalOverlay}
    >
      <DialogContent
        aria-label={ariaLabel}
        className={`${styles.tdModal} ${!!padding ? styles.tdModalPadding: ""} ${!!wide ? styles.tdModalWide: ""}`}
      >
        <div className={styles.tdModalCloseMenu}>
          <button onClick={onClose}>
            <span aria-hidden>
              <Close color="#000" />
            </span>
          </button>
        </div>
        {children}
      </DialogContent>
    </DialogOverlay>
  );
}
