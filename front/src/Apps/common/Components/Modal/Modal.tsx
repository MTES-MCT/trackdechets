import React, { useEffect, useState } from "react";
import { Overlay, useModalOverlay, useOverlayTrigger } from "react-aria";
import { useOverlayTriggerState, OverlayTriggerState } from "react-stately";
import FocusTrap from "focus-trap-react";
import "./modal.scss";
import cn from "classnames";
const ModalSizesClass = {
  M: "fr-col-12 fr-col-md-6 fr-col-lg-6",
  L: "fr-col-12 fr-col-md-8 fr-col-lg-8",
  XL: "fr-col-12 fr-col-md-12 fr-col-lg-12",
  TD_SIZE: "td-dsfr-modal-bsd-form" // custom class to host bsd forms
};
export type ModalSizes = keyof typeof ModalSizesClass;

type ModalProps = {
  state: OverlayTriggerState;
  children: React.ReactNode;
  padding?: boolean;
  title?: string;
  closeLabel?: string;
  ariaLabel: string;
  isDismissable: boolean;
  isKeyboardDismissDisabled: boolean;
  size?: ModalSizes;
  hasFooter?: boolean;
};

export function Modal({
  state,
  children,
  closeLabel = "Fermer",
  title,
  ariaLabel,
  size = "M",
  hasFooter = false,
  ...props
}: ModalProps) {
  const ref = React.useRef(null);
  const { modalProps, underlayProps } = useModalOverlay(props, state, ref);

  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const screenHeight = window.innerHeight;

        if (viewportHeight < screenHeight) {
          // Le clavier est ouvert, calcul de l'espace perdu
          setKeyboardOffset(screenHeight - viewportHeight);
        } else {
          // Clavier fermé
          setKeyboardOffset(0);
        }
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  const portal = document.querySelector("#portal-root");

  return (
    <Overlay portalContainer={portal || undefined}>
      <div
        style={{
          height: `calc(100vh - ${keyboardOffset}px)`,
          overflow: "auto",
          transition: "height 0.05s ease-out"
        }}
        className="tdModalOverlay"
        {...underlayProps}
      >
        <div className="tdModalInner">
          <div
            className="fr-container fr-container--fluid fr-container-md"
            aria-label={ariaLabel}
            {...modalProps}
            ref={ref}
          >
            <FocusTrap
              active
              focusTrapOptions={{
                // To allow other portals (eg combobox inside modal)
                clickOutsideDeactivates: e => {
                  return portal != null && portal.contains(e.target as Node);
                },
                preventScroll: true,
                // Fix for focus-trap error when modal content has no focusable elements
                delayInitialFocus: true,
                fallbackFocus: () => {
                  const closeButton =
                    document.querySelector("#close-btn-modal");
                  return closeButton as HTMLElement;
                }
              }}
            >
              <div className="fr-grid-row fr-grid-row--center">
                <div className={ModalSizesClass[size]}>
                  <div className="fr-modal__body">
                    <div className="fr-modal__header close-btn-override">
                      <button
                        id="close-btn-modal"
                        type="button"
                        className="fr-btn--close fr-btn"
                        onClick={state.close}
                        aria-label="Close"
                      >
                        {closeLabel}
                      </button>
                    </div>
                    {title && (
                      <h1 className="fr-modal__header fr-modal__title">
                        {title}
                      </h1>
                    )}
                    <div
                      className={cn("fr-modal__content", {
                        "fr-mb-0": hasFooter
                      })}
                    >
                      {children}
                    </div>
                  </div>
                </div>
              </div>
            </FocusTrap>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

type TdModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
  size?: ModalSizes;
  hasFooter?: boolean;
};

export default function TdModal({
  children,
  isOpen,
  onClose,
  padding,
  ariaLabel,
  closeLabel = "Fermer",
  title,
  size,
  hasFooter = false,
  ...props
}: Pick<ModalProps, "padding" | "ariaLabel"> & TdModalProps) {
  const state = useOverlayTriggerState({
    isOpen: isOpen,
    onOpenChange: isOpen => {
      if (!isOpen) onClose();
    },
    ...props
  });

  return state.isOpen ? (
    <Modal
      ariaLabel={ariaLabel}
      isDismissable={false}
      isKeyboardDismissDisabled
      {...props}
      state={state}
      closeLabel={closeLabel}
      title={title}
      size={size}
      hasFooter={hasFooter}
    >
      {children}
    </Modal>
  ) : null;
}

type TdModalTriggerProps = {
  trigger: (open: () => void) => React.ReactElement;
  modalContent: (close: () => void) => React.ReactElement | null;
  title?: string;
  closeLabel?: string;
};

export function TdModalTrigger({
  trigger,
  modalContent,
  padding,
  ariaLabel,
  title,
  closeLabel,
  ...props
}: Pick<ModalProps, "padding" | "ariaLabel"> & TdModalTriggerProps) {
  const state = useOverlayTriggerState(props);
  const { triggerProps, overlayProps } = useOverlayTrigger(
    { type: "dialog" },
    state
  );

  const modalContentValue = modalContent(state.close);

  return (
    <>
      {React.cloneElement(trigger(state.open), triggerProps)}
      {state.isOpen && (
        <Modal
          ariaLabel={ariaLabel}
          closeLabel={closeLabel}
          title={title}
          isDismissable={false}
          isKeyboardDismissDisabled
          {...props}
          state={state}
        >
          <h2 className="td-modal-title">{ariaLabel}</h2>
          {modalContentValue != null &&
            React.cloneElement(modalContentValue, overlayProps)}
        </Modal>
      )}
    </>
  );
}
