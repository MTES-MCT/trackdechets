import React from "react";
import { Modal } from "../../../../../common/components";
import { FormRevisionRequest } from "@td/codegen-ui";
import { DisplayRevision } from "./BsddApproveRevision";

type Props = {
  review: FormRevisionRequest;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export function BsddConsultRevision({
  review,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  if (isModalOpenFromParent) {
    const formatRevisionAdapter = {
      ...review["review"],
      form: { ...review }
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
