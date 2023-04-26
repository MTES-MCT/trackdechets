import React from "react";
import { Query, QueryFormArgs } from "generated/graphql/types";
import { useLazyQuery } from "@apollo/client";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWaterDam } from "common/components/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { GET_FORM } from "form/bsdd/utils/queries";

export default function MarkAsReceived({ form }: WorkflowActionProps) {
  const [getBsdd, { data }] = useLazyQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_FORM,
    {
      variables: {
        id: form.id,
        readableId: null,
      },
      fetchPolicy: "network-only",
    }
  );

  const actionLabel = "Valider la réception";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton
          icon={<IconWaterDam size="24px" />}
          onClick={() => {
            getBsdd();
            open();
          }}
        >
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => {
        if (data == null) {
          return <Loader />;
        }

        if (!!data?.form) {
          return (
            <div>
              <ReceivedInfo
                form={data.form}
                close={close}
                isTempStorage={false}
              />
            </div>
          );
        }

        return <></>;
      }}
    />
  );
}
