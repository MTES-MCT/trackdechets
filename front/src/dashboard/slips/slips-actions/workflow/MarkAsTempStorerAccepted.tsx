import React from "react";
import {
  Mutation,
  QuantityType,
  MutationMarkAsTempStorerAcceptedArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconWarehouseStorage } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import AcceptedInfo from "./AcceptedInfo";

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
  siret,
}: WorkflowActionProps) {
  const [markAsTempStorerAccepted, { error }] = useMutation<
    Pick<Mutation, "markAsTempStorerAccepted">,
    MutationMarkAsTempStorerAcceptedArgs
  >(MARK_TEMP_STORER_ACCEPTED);

  const actionLabel = "Valider l'acceptation de l'entreposage provisoire";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton
          title={actionLabel}
          icon={IconWarehouseStorage}
          onClick={open}
        />
      )}
      modalContent={close => (
        <div>
          <AcceptedInfo
            form={form}
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
            <NotificationError className="action-error" apolloError={error} />
          )}
        </div>
      )}
    />
  );
}
