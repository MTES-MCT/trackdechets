import React from "react";
import {
  Mutation,
  MutationMarkAsAcceptedArgs,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWaterDam } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import AcceptedInfo from "./AcceptedInfo";
import { GET_BSDS } from "common/queries";
import { GET_FORM } from "form/bsdd/utils/queries";

const MARK_AS_ACCEPTED = gql`
  mutation MarkAsAccepted($id: ID!, $acceptedInfo: AcceptedFormInput!) {
    markAsAccepted(id: $id, acceptedInfo: $acceptedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsAccepted({ form }: WorkflowActionProps) {
  const [getBsdd, { error: bsddGetError, data, loading: bsddGetLoading }] =
    useLazyQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
      variables: {
        id: form.id,
        readableId: null,
      },
      fetchPolicy: "network-only",
    });
  const [markAsAccepted, { loading, error }] = useMutation<
    Pick<Mutation, "markAsAccepted">,
    MutationMarkAsAcceptedArgs
  >(MARK_AS_ACCEPTED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    },
  });

  const actionLabel = "Valider l'acceptation";

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
            <div>
              <AcceptedInfo
                form={data?.form}
                close={close}
                onSubmit={values =>
                  markAsAccepted({
                    variables: {
                      id: form.id,
                      acceptedInfo: {
                        ...values,
                        quantityReceived: values.quantityReceived ?? 0,
                      },
                    },
                  })
                }
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

        return <></>;
      }}
    />
  );
}
