import React from "react";
import { Mutation, MutationPublishBsdaArgs } from "@td/codegen-ui";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation } from "@apollo/client";

import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import { ActionButton } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";

import toast from "react-hot-toast";
import { generatePath, Link } from "react-router-dom";
import routes from "../../../../../Apps/routes";
import { GET_BSDS } from "../../../../../Apps/common/queries";
import { TOAST_DURATION } from "../../../../../common/config";

const PUBLISH_BSDA = gql`
  mutation PublishBsda($id: ID!) {
    publishBsda(id: $id) {
      id
      isDraft
    }
  }
`;

export default function PublishBsda({ form, siret }: WorkflowActionProps) {
  const [publishBsda, { error, loading }] = useMutation<
    Pick<Mutation, "publishBsda">,
    MutationPublishBsdaArgs
  >(PUBLISH_BSDA, {
    variables: { id: form.id },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success(`Bordereau ${form.id} publié`, {
        duration: TOAST_DURATION
      });
    },
    onError: () =>
      toast.error(`Le bordereau ${form.id} n'a pas pu être publié`, {
        duration: TOAST_DURATION
      })
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
                publishBsda({
                  variables: {
                    id: form.id
                  }
                })
              }
            >
              <span>Publier le bordereau</span>
            </button>
          </div>
          {loading && <Loader />}
          {error && (
            <>
              <NotificationError className="action-error" apolloError={error} />
              <Link
                to={generatePath(routes.dashboard.bsdas.edit, {
                  siret,
                  id: form.id
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
