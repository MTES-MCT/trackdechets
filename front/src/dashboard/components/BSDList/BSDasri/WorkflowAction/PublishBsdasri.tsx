import React from "react";
import { Mutation, MutationPublishBsdasriArgs } from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation } from "@apollo/client";
import { BdasriSummary } from "dashboard/components/BSDList/BSDasri/Summary/BsdasriSummary";

import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import { Link, generatePath } from "react-router-dom";
import routes from "common/routes";

import cogoToast from "cogo-toast";
import { GET_BSDS } from "common/queries";

const PUBLISH_BSDASRI = gql`
  mutation PublishBsdasri($id: ID!) {
    publishBsdasri(id: $id) {
      id
      isDraft
    }
  }
`;

export default function PublishBsdasri({ form, siret }: WorkflowActionProps) {
  const [publishBsdasri, { loading, error }] = useMutation<
    Pick<Mutation, "publishBsdasri">,
    MutationPublishBsdasriArgs
  >(PUBLISH_BSDASRI, {
    variables: { id: form.id },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
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
          <BdasriSummary bsdasri={form} />
          <p>
            Cette action aura pour effet de démarrer le cycle de vie du
            bordereau en le faisant apparaître dans l'onglet "À collecter" du
            tableau de bord transporteur. Le bordereau pourra toujours être
            modifié ou supprimé depuis l'onglet "Suivi".
          </p>
          <p className="tw-mt-1">
            Le statut du bordereau passera de "brouillon" à "initial".
            <br />
            Une fois publié, le bordereau sera prêt pour l'enlèvement.
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
              <span>Publier le bordereau</span>
            </button>
          </div>

          {error && (
            <>
              <NotificationError className="action-error" apolloError={error} />
              <Link
                to={generatePath(routes.dashboard.bsdasris.edit, {
                  siret,
                  id: form.id,
                })}
                className="btn btn--primary"
              >
                Mettre le bordereau à jour pour le publier
              </Link>
            </>
          )}
          {loading && <Loader />}
        </div>
      )}
    />
  );
}
