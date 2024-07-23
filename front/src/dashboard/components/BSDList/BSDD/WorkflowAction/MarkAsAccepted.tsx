import React from "react";
import {
  Mutation,
  MutationMarkAsAcceptedArgs,
  Query,
  QueryFormArgs
} from "@td/codegen-ui";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { statusChangeFragment } from "../../../../../Apps/common/queries/fragments";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { IconWaterDam } from "../../../../../Apps/common/Components/Icons/Icons";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import AcceptedInfo from "./AcceptedInfo";
import { GET_FORM } from "../../../../../Apps/common/queries/bsdd/queries";

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
        readableId: null
      },
      fetchPolicy: "network-only"
    });
  const [markAsAccepted, { loading, error }] = useMutation<
    Pick<Mutation, "markAsAccepted">,
    MutationMarkAsAcceptedArgs
  >(MARK_AS_ACCEPTED, {
    onError: () => {
      // The error is handled in the UI
    }
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
                        quantityReceived: values.quantityReceived ?? 0
                      }
                    }
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

        return null;
      }}
    />
  );
}
