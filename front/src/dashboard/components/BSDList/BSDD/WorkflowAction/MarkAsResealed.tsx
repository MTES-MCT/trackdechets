import React from "react";
import { FormStatus } from "codegen-ui";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import MarkAsResealedModalContent from "./MarkAsResealedModalContent";

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
