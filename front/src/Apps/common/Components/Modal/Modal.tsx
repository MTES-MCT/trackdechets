import React, { useEffect, useState } from "react";
import { Overlay, useModalOverlay, useOverlayTrigger } from "react-aria";
import { useOverlayTriggerState, OverlayTriggerState } from "react-stately";
import FocusTrap from "focus-trap-react";
import cn from "classnames";

import {
  CRISP_CHAT_CLOSED_EVENT,
  CRISP_CHAT_OPENED_EVENT
} from "../../hooks/useCrisp";

import "./modal.scss";

const ModalSizesClass = {
  M: "fr-col-12 fr-col-md-6 fr-col-lg-6",
  L: "fr-col-12 fr-col-md-8 fr-col-lg-8",
  XL: "fr-col-12 fr-col-md-12 fr-col-lg-12",
  TD_SIZE: "td-dsfr-modal-bsd-form"
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

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isCrispOpen, setIsCrispOpen] = useState(false);

  /**
   * Crisp is itself a modal dialog.
   *
   * Pause the Trackdéchets focus trap while Crisp is opened, then resume it
   * when Crisp closes. The Trackdéchets modal itself stays mounted/open.
   */
  useEffect(() => {
    const handleCrispOpened = () => {
      setIsCrispOpen(true);
    };

    const handleCrispClosed = () => {
      setIsCrispOpen(false);
    };

    window.addEventListener(CRISP_CHAT_OPENED_EVENT, handleCrispOpened);
    window.addEventListener(CRISP_CHAT_CLOSED_EVENT, handleCrispClosed);

    return () => {
      window.removeEventListener(CRISP_CHAT_OPENED_EVENT, handleCrispOpened);
      window.removeEventListener(CRISP_CHAT_CLOSED_EVENT, handleCrispClosed);
    };
  }, []);

  useEffect(() => {
    const visualViewport = window.visualViewport;

    const updateViewportHeight = () => {
      setViewportHeight(visualViewport?.height ?? window.innerHeight);
    };

    updateViewportHeight();

    visualViewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const portal = document.querySelector("#portal-root");

  return (
    <Overlay portalContainer={portal || undefined}>
      <div
        style={{
          height: viewportHeight ? `${viewportHeight}px` : "100dvh",
          maxHeight: viewportHeight ? `${viewportHeight}px` : "100dvh",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain"
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
              paused={isCrispOpen}
              focusTrapOptions={{
                // Keep the existing behaviour for Trackdéchets portals
                // (eg. combobox rendered outside the modal content).
                clickOutsideDeactivates: e => {
                  return portal != null && portal.contains(e.target as Node);
                },

                // Crisp is rendered outside the Trackdéchets modal.
                // Allow the initial click on Crisp without deactivating the focus trap.
                // Once Crisp opens, the trap is paused through `isCrispOpen`.
                allowOutsideClick: e => {
                  const target = e.target;

                  if (!(target instanceof Node)) {
                    return false;
                  }

                  const crisp = document.querySelector(".crisp-client");

                  return crisp?.contains(target) ?? false;
                },

                preventScroll: true,

                // Fix for focus-trap error when modal content has no focusable elements.
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
