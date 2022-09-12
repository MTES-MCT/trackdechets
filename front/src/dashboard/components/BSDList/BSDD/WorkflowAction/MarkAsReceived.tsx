import React from "react";
import {
  Mutation,
  MutationMarkAsReceivedArgs,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWaterDam } from "common/components/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { NotificationError } from "common/components/Error";
import { GET_BSDS } from "common/queries";
import { GET_FORM } from "form/bsdd/utils/queries";

const MARK_AS_RECEIVED = gql`
  mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
    markAsReceived(id: $id, receivedInfo: $receivedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

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
  const [markAsReceived, { loading, error }] = useMutation<
    Pick<Mutation, "markAsReceived">,
    MutationMarkAsReceivedArgs
  >(MARK_AS_RECEIVED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    },
  });

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
                onSubmit={values => {
                  return markAsReceived({
                    variables: {
                      id: data.form.id,
                      receivedInfo: values,
                    },
                  });
                }}
                close={close}
              />
              {error && (
                <NotificationError
                  className="action-error"
                  apolloError={error}
                />
              )}
              {loading && <Loader />}
            </div>
          );
        }
      }}
    />
  );
}
