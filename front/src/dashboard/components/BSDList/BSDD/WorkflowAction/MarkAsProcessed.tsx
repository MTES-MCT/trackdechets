import React from "react";
import { FormStatus, Query, QueryFormArgs } from "@td/codegen-ui";
import { useLazyQuery } from "@apollo/client";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { IconCogApproved } from "../../../../../Apps/common/Components/Icons/Icons";
import MarkAsProcessedModalContent from "./MarkAsProcessedModalContent";
import { GET_FORM } from "../../../../../Apps/common/queries/bsdd/queries";

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
