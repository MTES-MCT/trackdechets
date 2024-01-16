import React from "react";
import { Modal } from "../../../../../common/components";
import { BsdaRevisionRequest } from "@td/codegen-ui";
import { DisplayRevision } from "./BsdaApproveRevision";

type Props = {
  review: BsdaRevisionRequest;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export function BsdaConsultRevision({
  review,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  if (isModalOpenFromParent) {
    const formatRevisionAdapter = {
      ...review["review"],
      bsda: { ...review }
    };
    return (
      <Modal
        onClose={onModalCloseFromParent!}
        ariaLabel="Consultation d'une révision"
        isOpen
      >
        <div>
          <DisplayRevision review={formatRevisionAdapter} />

          <div className="form__actions">
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={onModalCloseFromParent}
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
}
