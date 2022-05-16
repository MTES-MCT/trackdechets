import React from "react";
import {
  Mutation,
  MutationMarkAsReceivedArgs,
  MutationMarkAsTempStoredArgs,
  WasteAcceptationStatus,
} from "generated/graphql/types";
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

const MARK_AS_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsReceived({ form }: WorkflowActionProps) {
  const [
    markAsReceived,
    { loading: markAsReceivedLoading, error: markAsReceivedError },
  ] = useMutation<Pick<Mutation, "markAsReceived">, MutationMarkAsReceivedArgs>(
    MARK_AS_RECEIVED,
    {
      refetchQueries: [GET_BSDS],
      awaitRefetchQueries: true,
      onError: () => {
        // The error is handled in the UI
      },
    }
  );

  const [
    markAsTempStored,
    { loading: markAsTempStoredLoading, error: markAsTempStoredError },
  ] = useMutation<
    Pick<Mutation, "markAsTempStored">,
    MutationMarkAsTempStoredArgs
  >(MARK_AS_TEMP_STORED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    },
  });

  const loading = markAsReceivedLoading ?? markAsTempStoredLoading;
  const error = markAsReceivedError ?? markAsTempStoredError;

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
              onSubmit={({ isTempStorage, quantityType, ...values }) => {
                return isTempStorage
                  ? markAsTempStored({
                      variables: {
                        id: form.id,
                        tempStoredInfos: {
                          ...values,
                          quantityType: quantityType!,
                          quantityReceived: values.quantityReceived ?? 0,
                          wasteAcceptationStatus:
                            values.wasteAcceptationStatus ??
                            WasteAcceptationStatus.Accepted,
                        },
                      },
                    })
                  : markAsReceived({
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
