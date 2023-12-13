import React from "react";
import { ActionButton, Modal } from "../../../../../common/components";
import { IconView } from "../../../../../Apps/common/Components/Icons/Icons";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { FormRevisionRequest } from "codegen-ui";
import { DisplayRevision } from "./BsddApproveRevision";
import { useMatch } from "react-router-dom";

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
  const isV2Routes = !!useMatch("/v2/dashboard/*");

  if (isV2Routes && isModalOpenFromParent) {
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
  return !isV2Routes ? (
    <TdModalTrigger
      ariaLabel="Consultation d'une révision"
      trigger={open => (
        <ActionButton icon={<IconView size="24px" />} onClick={open}>
          Consulter
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <DisplayRevision review={review} />

          <div className="form__actions">
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={close}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    />
  ) : null;
}
