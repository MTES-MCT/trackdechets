import React from "react";
import { Overlay, useModalOverlay, useOverlayTrigger } from "react-aria";
import { useOverlayTriggerState, OverlayTriggerState } from "react-stately";
import styles from "./Modal.module.scss";
import { IconDelete1 } from "./Icons";
import classNames from "classnames";

type ModalProps = {
  state: OverlayTriggerState;
  children: React.ReactNode;
  padding?: boolean;
  ariaLabel: string;
  wide?: boolean;
  isDismissable: boolean;
  isKeyboardDismissDisabled: boolean;
};

export function Modal({
  state,
  children,
  ariaLabel,
  padding = true,
  wide = false,
  ...props
}: ModalProps) {
  let ref = React.useRef(null);
  let { modalProps, underlayProps } = useModalOverlay(props, state, ref);

  return (
    <Overlay>
      <div className={styles.tdModalOverlay} {...underlayProps}>
        <div
          className={classNames(styles.tdModal, {
            [styles.tdModalWide]: wide,
            [styles.tdModalPadding]: padding,
          })}
          aria-label={ariaLabel}
          {...modalProps}
          ref={ref}
        >
          <button
            type="button"
            className={styles.ModalCloseButton}
            onClick={state.close}
            aria-label="Close"
          >
            <IconDelete1 aria-hidden />
          </button>
          {children}
        </div>
      </div>
    </Overlay>
  );
}

type TdModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export default function TdModal({
  children,
  isOpen,
  onClose,
  padding,
  wide,
  ariaLabel,
  ...props
}: Pick<ModalProps, "padding" | "ariaLabel" | "wide"> & TdModalProps) {
  let state = useOverlayTriggerState({
    isOpen: isOpen,
    onOpenChange: isOpen => {
      if (!isOpen) onClose();
    },
    ...props,
  });

  return (
    <>
      {state.isOpen && (
        <Modal
          ariaLabel={ariaLabel}
          wide={wide}
          padding={padding}
          isDismissable
          isKeyboardDismissDisabled
          {...props}
          state={state}
        >
          {children}
        </Modal>
      )}
    </>
  );
}

type TdModalTriggerProps = {
  trigger: (open: () => void) => React.ReactElement;
  modalContent: (close: () => void) => React.ReactElement;
};

export function TdModalTrigger({
  trigger,
  modalContent,
  padding,
  wide,
  ariaLabel,
  ...props
}: Pick<ModalProps, "padding" | "ariaLabel" | "wide"> & TdModalTriggerProps) {
  let state = useOverlayTriggerState(props);
  let { triggerProps, overlayProps } = useOverlayTrigger(
    { type: "dialog" },
    state
  );

  return (
    <>
      {React.cloneElement(trigger(state.open), triggerProps)}
      {state.isOpen && (
        <Modal
          ariaLabel={ariaLabel}
          wide={wide}
          padding={padding}
          isDismissable
          isKeyboardDismissDisabled
          {...props}
          state={state}
        >
          <h2 className="td-modal-title">{ariaLabel}</h2>
          {React.cloneElement(modalContent(state.close), overlayProps)}
        </Modal>
      )}
    </>
  );
}
