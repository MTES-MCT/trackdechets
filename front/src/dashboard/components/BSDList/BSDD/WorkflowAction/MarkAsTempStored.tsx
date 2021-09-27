import React from "react";
import {
  Mutation,
  MutationMarkAsTempStoredArgs,
  QuantityType,
  WasteAcceptationStatusInput,
} from "generated/graphql/types";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconWarehouseStorage } from "common/components/Icons";
import ReceivedInfo from "./ReceivedInfo";
import { NotificationError } from "common/components/Error";
import { GET_BSDS } from "common/queries";

const MARK_AS_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsTempStored({ form }: WorkflowActionProps) {
  const [markAsTempStored, { loading, error }] = useMutation<
    Pick<Mutation, "markAsTempStored">,
    MutationMarkAsTempStoredArgs
  >(MARK_AS_TEMP_STORED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
  });

  const actionLabel = "Valider l'entreposage provisoire";

  return (
    <div>
      <TdModalTrigger
        ariaLabel={actionLabel}
        trigger={open => (
          <ActionButton
            icon={<IconWarehouseStorage size="24px" />}
            onClick={open}
          >
            {actionLabel}
          </ActionButton>
        )}
        modalContent={close => (
          <div>
            <ReceivedInfo
              form={form}
              close={close}
              onSubmit={values => {
                return markAsTempStored({
                  variables: {
                    id: form.id,
                    tempStoredInfos: {
                      ...values,
                      quantityType: values.quantityType ?? QuantityType.Real,
                      quantityReceived: values.quantityReceived ?? 0,
                      wasteAcceptationStatus:
                        values.wasteAcceptationStatus ??
                        WasteAcceptationStatusInput.Accepted,
                    },
                  },
                });
              }}
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
