import React from "react";
import { Mutation, MutationPublishBsdasriArgs } from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation } from "@apollo/client";

import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";

import cogoToast from "cogo-toast";

const PUBLISH_BSDASRI = gql`
  mutation PublishBsdasri($id: ID!) {
    publishBsdasri(id: $id) {
      id
      isDraft
    }
  }
`;

export default function PublishBsdasri({ form }: WorkflowActionProps) {
  const [publishBsdasri, { error }] = useMutation<
    Pick<Mutation, "publishBsdasri">,
    MutationPublishBsdasriArgs
  >(PUBLISH_BSDASRI, {
    variables: { id: form.id },
    onCompleted: () => {
      cogoToast.success(`Bordereau ${form.id} publié`, { hideAfter: 5 });
    },
    onError: () =>
      cogoToast.error(`Le bordereau ${form.id} n'a pas pu être publié`, {
        hideAfter: 5,
      }),
  });

  const actionLabel = "Publier le bordereau";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton icon={<IconPaperWrite size="24px" />} onClick={open}>
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <p>
            Cette action aura pour effet de démarrer le cycle de vie du
            bordereau en le faisant apparaître dans l'onglet "À collecter" du
            tableau de bord transporteur. Le bordereau pourra toujours être
            modifié ou supprimé depuis l'onglet "Suivi".
          </p>
          <div className="td-modal-actions">
            <button className="btn btn--outline-primary" onClick={close}>
              Annuler
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                publishBsdasri({
                  variables: {
                    id: form.id,
                  },
                })
              }
            >
              <span> Publier le bordereau</span>
            </button>
          </div>

          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
        </div>
      )}
    />
  );
}
