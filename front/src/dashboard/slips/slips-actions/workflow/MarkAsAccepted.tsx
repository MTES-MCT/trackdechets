import React from "react";
import { Mutation, MutationMarkAsAcceptedArgs } from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconWaterDam } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import AcceptedInfo from "./AcceptedInfo";

const MARK_AS_ACCEPTED = gql`
  mutation MarkAsAccepted($id: ID!, $acceptedInfo: AcceptedFormInput!) {
    markAsAccepted(id: $id, acceptedInfo: $acceptedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsAccepted({ form }: WorkflowActionProps) {
  const [markAsAccepted, { error }] = useMutation<
    Pick<Mutation, "markAsAccepted">,
    MutationMarkAsAcceptedArgs
  >(MARK_AS_ACCEPTED);

  const actionLabel = "Valider l'acceptation";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton title={actionLabel} icon={IconWaterDam} onClick={open} />
      )}
      modalContent={close => (
        <div>
          <AcceptedInfo
            form={form}
            close={close}
            onSubmit={values => {
              markAsAccepted({
                variables: {
                  id: form.id,
                  acceptedInfo: {
                    ...values,
                    quantityReceived: values.quantityReceived ?? 0,
                  },
                },
              });
            }}
          />

          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
        </div>
      )}
    />
  );
}
