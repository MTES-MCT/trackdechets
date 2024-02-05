import React from "react";

const ModalSizesClass = {
  M: "fr-col-12 fr-col-md-6 fr-col-lg-6",
  L: "fr-col-12 fr-col-md-8 fr-col-lg-8",
  XL: "fr-col-12 fr-col-md-12 fr-col-lg-12"
};

type ModalSizes = keyof typeof ModalSizesClass;

type DsfrModalProps = {
  title?: string;
  children: React.ReactNode;

  size: ModalSizes;
  onClose: () => void;
  padding: boolean;
};

export function DsfrModal({
  title,
  children,
  onClose,
  size = "M",
  padding = true
}: DsfrModalProps) {
  // Handling react-dsfr modal is a bit hacky and tricky to customize, let's stick to a dsfr-ized custom modal component

  return (
    <dialog className="fr-modal fr-modal--opened" aria-modal={true}>
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className={ModalSizesClass[size]}>
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  title="Fermer la fenêtre modale"
                  aria-controls="fr-modal-1"
                  onClick={onClose}
                >
                  Fermer
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
