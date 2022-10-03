import React from "react";
import {
  Mutation,
  MutationMarkAsTempStoredArgs,
  QuantityType,
  WasteAcceptationStatus,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import { gql, useMutation, useLazyQuery } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWarehouseStorage } from "common/components/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { NotificationError } from "common/components/Error";
import { GET_BSDS } from "common/queries";
import { GET_FORM } from "form/bsdd/utils/queries";

const MARK_AS_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsTempStored({ form }: WorkflowActionProps) {
  const [getBsdd, { error: bsddGetError, data, loading: bsddGetLoading }] =
    useLazyQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
      variables: {
        id: form.id,
        readableId: null,
      },
      fetchPolicy: "network-only",
    });
  const [markAsTempStored, { loading, error }] = useMutation<
    Pick<Mutation, "markAsTempStored">,
    MutationMarkAsTempStoredArgs
  >(MARK_AS_TEMP_STORED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    },
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
              <div>
                <ReceivedInfo
                  form={data?.form}
                  close={close}
                  onSubmit={values => {
                    return markAsTempStored({
                      variables: {
                        id: form.id,
                        tempStoredInfos: {
                          ...values,
                          quantityType:
                            values.quantityType ?? QuantityType.Real,
                          quantityReceived: values.quantityReceived ?? 0,
                          wasteAcceptationStatus:
                            values.wasteAcceptationStatus ??
                            WasteAcceptationStatus.Accepted,
                        },
                      },
                    });
                  }}
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
    </div>
  );
}
