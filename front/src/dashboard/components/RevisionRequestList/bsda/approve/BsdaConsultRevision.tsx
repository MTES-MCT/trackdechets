import React from "react";
import { ActionButton } from "common/components";
import { IconView } from "common/components/Icons";
import { TdModalTrigger } from "common/components/Modal";
import { BsdaRevisionRequest } from "generated/graphql/types";
import { DisplayRevision } from "./BsdaApproveRevision";

type Props = {
  review: BsdaRevisionRequest;
};

export function BsdaConsultRevision({ review }: Props) {
  return (
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
  );
}
