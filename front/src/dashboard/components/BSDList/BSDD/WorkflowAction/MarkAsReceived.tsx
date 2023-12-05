import React from "react";
import { Query, QueryFormArgs } from "codegen-ui";
import { useLazyQuery } from "@apollo/client";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { IconWaterDam } from "../../../../../Apps/common/Components/Icons/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { GET_FORM } from "../../../../../form/bsdd/utils/queries";

export default function MarkAsReceived({ form }: WorkflowActionProps) {
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

        return null;
      }}
    />
  );
}
