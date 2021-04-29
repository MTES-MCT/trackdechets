import { gql, useMutation } from "@apollo/client";
import React from "react";
import { statusChangeFragment } from "common/fragments";
import { ActionButton } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import {
  FormStatus,
  Mutation,
  MutationMarkAsSealedArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { NotificationError } from "common/components/Error";
import { TdModalTrigger } from "common/components/Modal";
import cogoToast from "cogo-toast";

const MARK_AS_SEALED = gql`
  mutation MarkAsSealed($id: ID!) {
    markAsSealed(id: $id) {
      readableId
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsSealed({ form, siret }: WorkflowActionProps) {
  const [markAsSealed, { error }] = useMutation<
    Pick<Mutation, "markAsSealed">,
    MutationMarkAsSealedArgs
  >(MARK_AS_SEALED, {
    variables: { id: form.id },
    onCompleted: data => {
      if (data.markAsSealed) {
        const sealedForm = data.markAsSealed;
        if (sealedForm.status === FormStatus.Sealed)
          cogoToast.success(
            `Le numéro #${sealedForm.readableId} a été affecté au bordereau. Vous pouvez le retrouver dans l'onglet "Suivi"`
          );
      }
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
              et de le faire apparaitre dans l'onglet "À collecter" du tableau
              de bord transporteur. Un identifiant unique lui sera attribué et
              vous pourrez générer un PDF. Le bordereau pourra cependant
              toujours être modifié ou supprimé depuis l'onglet "Suivi".
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
        </div>
      )}
    />
  );
}
