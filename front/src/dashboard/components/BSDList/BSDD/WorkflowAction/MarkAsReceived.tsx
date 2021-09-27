import React from "react";
import { Mutation, MutationMarkAsReceivedArgs } from "generated/graphql/types";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWaterDam } from "common/components/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { NotificationError } from "common/components/Error";
import { GET_BSDS } from "common/queries";

const MARK_AS_RECEIVED = gql`
  mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $receivedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsReceived({ form }: WorkflowActionProps) {
  const [markAsReceived, { loading, error }] = useMutation<
    Pick<Mutation, "markAsReceived">,
    MutationMarkAsReceivedArgs
  >(MARK_AS_RECEIVED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
  });

  const actionLabel = "Valider la réception";

  return (
    <div>
      <TdModalTrigger
        ariaLabel={actionLabel}
        trigger={open => (
          <ActionButton icon={<IconWaterDam size="24px" />} onClick={open}>
            {actionLabel}
          </ActionButton>
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
            {loading && <Loader />}
          </div>
        )}
      />
    </div>
  );
}
