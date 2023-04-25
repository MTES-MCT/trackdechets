import React from "react";
import { FormStatus } from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import MarkAsResealedModalContent from "dashboard/components/BSDList/BSDD/WorkflowAction/MarkAsResealedModalContent";

export default function MarkAsResealed({ form }: WorkflowActionProps) {
  const actionLabel = "Compléter le BSD suite";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton
          icon={<IconPaperWrite size="24px" />}
          onClick={open}
          secondary={form.status !== FormStatus.TempStorerAccepted}
        >
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => (
        <MarkAsResealedModalContent bsd={form} onClose={close} />
      )}
    />
  );
}
