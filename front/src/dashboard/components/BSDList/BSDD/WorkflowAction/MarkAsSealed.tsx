import { gql, useMutation } from "@apollo/client";
import React from "react";
import { statusChangeFragment } from "Apps/common/queries/fragments";
import { ActionButton } from "common/components";
import { Loader } from "Apps/common/Components";
import { IconPaperWrite } from "common/components/Icons";
import {
  FormStatus,
  Mutation,
  MutationMarkAsSealedArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { TdModalTrigger } from "common/components/Modal";
import cogoToast from "cogo-toast";
import { GET_BSDS } from "Apps/common/queries";

const MARK_AS_SEALED = gql`
  mutation MarkAsSealed($id: ID!) {
    markAsSealed(id: $id) {
      readableId
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsSealed({ form }: WorkflowActionProps) {
  const [markAsSealed, { loading, error }] = useMutation<
    Pick<Mutation, "markAsSealed">,
    MutationMarkAsSealedArgs
  >(MARK_AS_SEALED, {
    variables: { id: form.id },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: data => {
      if (data.markAsSealed) {
        const sealedForm = data.markAsSealed;
        if (sealedForm.status === FormStatus.Sealed)
          cogoToast.success(
            `Le numéro #${sealedForm.readableId} a été affecté au bordereau. Vous pouvez le retrouver dans l'onglet "Pour action".`
          );
      }
    },
    onError: () => {
      // The error is handled in the UI
    },
  });

  const actionLabel = "Valider le bordereau";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <div>
          <ActionButton icon={<IconPaperWrite size="24px" />} onClick={open}>
            {actionLabel}
          </ActionButton>
        </div>
      )}
      modalContent={close => (
        <div>
          <div>
            <p>
              Cette action aura pour effet de valider les données du bordereau
              et de le faire apparaitre dans l'onglet "Pour action" de
              l'émetteur ainsi que l'onglet "À collecter" du transporteur. Un
              identifiant unique lui sera attribué et vous pourrez générer un
              PDF. Le bordereau pourra cependant toujours être modifié ou
              supprimé depuis l'onglet "Pour action", "À collecter" ou "Suivi".
            </p>

            <div className="td-modal-actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={close}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                onClick={() => markAsSealed()}
              >
                Je valide
              </button>
            </div>
          </div>

          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
          {loading && <Loader />}
        </div>
      )}
    />
  );
}
