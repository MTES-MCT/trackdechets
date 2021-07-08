import React from "react";
import { Mutation, MutationPublishBsvhuArgs } from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation } from "@apollo/client";

import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";

import cogoToast from "cogo-toast";
import { generatePath, Link } from "react-router-dom";
import routes from "common/routes";

const PUBLISH_BSVHU = gql`
  mutation PublishBsvhu($id: ID!) {
    publishBsvhu(id: $id) {
      id
      isDraft
    }
  }
`;

export default function PublishBsvhu({ form, siret }: WorkflowActionProps) {
  const [publishBsvhu, { error }] = useMutation<
    Pick<Mutation, "publishBsvhu">,
    MutationPublishBsvhuArgs
  >(PUBLISH_BSVHU, {
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
            bordereau en le faisant apparaître dans l'onglet{" "}
            <strong>“Pour action”</strong> du tableau de bord de l'émetteur. Le
            bordereau pourra toujours être modifié ou supprimé tant qu'aucune
            signature n'a été apposée.
          </p>
          <div className="td-modal-actions">
            <button className="btn btn--outline-primary" onClick={close}>
              Annuler
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                publishBsvhu({
                  variables: {
                    id: form.id,
                  },
                })
              }
            >
              <span>Publier le bordereau</span>
            </button>
          </div>

          {error && (
            <>
              <NotificationError className="action-error" apolloError={error} />
              <Link
                to={generatePath(routes.dashboard.bsvhus.edit, {
                  siret,
                  id: form.id,
                })}
                className="btn btn--primary"
              >
                Mettre le bordereau à jour pour le publier
              </Link>
            </>
          )}
        </div>
      )}
    />
  );
}
