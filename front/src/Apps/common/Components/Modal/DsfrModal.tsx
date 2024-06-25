import React from "react";

const ModalSizesClass = {
  M: "fr-col-12 fr-col-md-6 fr-col-lg-6",
  L: "fr-col-12 fr-col-md-8 fr-col-lg-8",
  XL: "fr-col-12 fr-col-md-12 fr-col-lg-12",
  BSD_FORM: "td-dsfr-modal-bsd-form" // custom class to host bsd forms
};

export type ModalSizes = keyof typeof ModalSizesClass;

type DsfrModalProps = {
  title?: string;
  closeLabel?: string;
  children: React.ReactNode;
  size?: ModalSizes;
  onClose: () => void;
  padding?: boolean;
};

export function DsfrModal({
  title,
  children,
  onClose,
  size = "M",
  closeLabel = "Fermer",
  padding
}: Readonly<DsfrModalProps>) {
  // Handling react-dsfr modal is a bit hacky and tricky to customize, let's stick to a dsfr-ized custom modal component
  // Dsrf modal is vertically centered, it does not play nicely with tabs and varying children height, so we override the flex
  return (
    <dialog className="fr-modal fr-modal--opened" onClick={onClose}>
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className={ModalSizesClass[size]}>
            <div
              className="fr-modal__body"
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  title="Fermer la fenêtre modale"
                  aria-controls="fr-modal-1"
                  onClick={onClose}
                >
                  {closeLabel}
                </button>
              </div>
              {title && (
                <h1 className="fr-modal__header fr-modal__title">{title}</h1>
              )}
              <div className={padding ? "fr-modal__content" : ""}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
