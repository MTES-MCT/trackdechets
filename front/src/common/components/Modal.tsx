import { DialogOverlay, DialogContent } from "@reach/dialog";
import { Close } from "./Icons";
import "@reach/dialog/styles.css";
import styles from "./Modal.module.scss";
import React from "react";
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
      className={styles.tdModalOverlay}
    >
      <DialogContent
        aria-label={ariaLabel}
        className={classNames(styles.tdModal, {
          [styles.tdModalWide]: wide,
          [styles.tdModalPadding]: padding,
        })}
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
