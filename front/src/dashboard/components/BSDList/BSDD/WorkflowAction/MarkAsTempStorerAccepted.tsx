import React from "react";
import {
  Mutation,
  QuantityType,
  MutationMarkAsTempStorerAcceptedArgs,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation, useLazyQuery } from "@apollo/client";

import { statusChangeFragment } from "common/fragments";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWarehouseStorage } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import AcceptedInfo from "./AcceptedInfo";
import { GET_BSDS } from "common/queries";
import { GET_FORM } from "form/bsdd/utils/queries";

const MARK_TEMP_STORER_ACCEPTED = gql`
  mutation MarkAsTempStorerAccepted(
    $id: ID!
    $tempStorerAcceptedInfo: TempStorerAcceptedFormInput!
  ) {
    markAsTempStorerAccepted(
      id: $id
      tempStorerAcceptedInfo: $tempStorerAcceptedInfo
    ) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsTempStorerAccepted({
  form,
}: WorkflowActionProps) {
  const [getBsdd, { error: bsddGetError, data, loading: bsddGetLoading }] =
    useLazyQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
      variables: {
        id: form.id,
        readableId: null,
      },
      fetchPolicy: "network-only",
    });
  const [markAsTempStorerAccepted, { loading, error }] = useMutation<
    Pick<Mutation, "markAsTempStorerAccepted">,
    MutationMarkAsTempStorerAcceptedArgs
  >(MARK_TEMP_STORER_ACCEPTED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    },
  });

  const actionLabel = "Valider l'acceptation de l'entreposage provisoire";

  return (
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
            <div>
              <AcceptedInfo
                form={data?.form}
                close={close}
                onSubmit={values =>
                  markAsTempStorerAccepted({
                    variables: {
                      id: form.id,
                      tempStorerAcceptedInfo: {
                        ...values,
                        quantityReceived: values.quantityReceived ?? 0,
                        quantityType: values.quantityType ?? QuantityType.Real,
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
