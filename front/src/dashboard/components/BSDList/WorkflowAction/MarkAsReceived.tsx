import React from "react";
import { Mutation, MutationMarkAsReceivedArgs } from "generated/graphql/types";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconWaterDam } from "common/components/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { NotificationError } from "common/components/Error";

const MARK_AS_RECEIVED = gql`
  mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $receivedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsReceived({ form }: WorkflowActionProps) {
  const [markAsReceived, { error }] = useMutation<
    Pick<Mutation, "markAsReceived">,
    MutationMarkAsReceivedArgs
  >(MARK_AS_RECEIVED);

  const actionLabel = "Valider la réception";

  return (
    <div>
      <TdModalTrigger
        ariaLabel={actionLabel}
        trigger={open => (
          <ActionButton
            title={actionLabel}
            icon={IconWaterDam}
            onClick={open}
          />
        )}
        modalContent={close => (
          <div>
            <ReceivedInfo
              form={form}
              onSubmit={values => {
                return markAsReceived({
                  variables: {
                    id: form.id,
                    receivedInfo: values,
                  },
                });
              }}
              close={close}
            />
            {error && (
              <NotificationError className="action-error" apolloError={error} />
            )}
          </div>
        )}
      />
    </div>
  );
}
