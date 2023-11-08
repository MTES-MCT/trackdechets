import React from "react";
import { Query, QueryFormArgs } from "codegen-ui";
import { useLazyQuery } from "@apollo/client";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { IconWarehouseStorage } from "../../../../../Apps/common/Components/Icons/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { GET_FORM } from "../../../../../form/bsdd/utils/queries";

export default function MarkAsTempStored({ form }: WorkflowActionProps) {
  const [getBsdd, { error: bsddGetError, data, loading: bsddGetLoading }] =
    useLazyQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
      variables: {
        id: form.id,
        readableId: null
      },
      fetchPolicy: "network-only"
    });

  const actionLabel = "Valider l'entreposage provisoire";

  return (
    <div>
      <TdModalTrigger
        ariaLabel={actionLabel}
        trigger={open => (
          <ActionButton
            icon={<IconWarehouseStorage size="24px" />}
            onClick={() => {
              getBsdd();
              open();
            }}
          >
            {actionLabel}
          </ActionButton>
        )}
        modalContent={close => {
          if (!!bsddGetLoading) {
            return <Loader />;
          }
          if (!!bsddGetError) {
            return (
              <NotificationError
                className="action-error"
                apolloError={bsddGetError}
              />
            );
          }
          if (!!data?.form) {
            return (
              <ReceivedInfo
                form={data?.form}
                close={close}
                isTempStorage={true}
              />
            );
          }

          return null;
        }}
      />
    </div>
  );
}
