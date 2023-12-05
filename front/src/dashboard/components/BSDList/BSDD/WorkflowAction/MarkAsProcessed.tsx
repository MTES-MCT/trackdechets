import React from "react";
import { FormStatus, Query, QueryFormArgs } from "codegen-ui";
import { useLazyQuery } from "@apollo/client";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { IconCogApproved } from "../../../../../Apps/common/Components/Icons/Icons";
import { GET_FORM } from "../../../../../form/bsdd/utils/queries";
import MarkAsProcessedModalContent from "./MarkAsProcessedModalContent";

export default function MarkAsProcessed({ form }: WorkflowActionProps) {
  const [getBsdd, { data }] = useLazyQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_FORM,
    {
      variables: {
        id: form.id,
        readableId: null
      },
      fetchPolicy: "network-only"
    }
  );

  const actionLabel = "Valider le traitement";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton
          icon={<IconCogApproved size="24px" />}
          onClick={() => {
            getBsdd();
            open();
          }}
          secondary={form.status === FormStatus.TempStorerAccepted}
        >
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => {
        return <MarkAsProcessedModalContent data={data} onClose={close} />;
      }}
    />
  );
}
