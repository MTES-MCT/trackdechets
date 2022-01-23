import React from "react";
import {
  Mutation,
  MutationPublishBsdaArgs,
  Query,
  QueryBsdaArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation, useLazyQuery } from "@apollo/client";

import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import { GET_BSDA } from "form/bsda/stepper/queries";
import { BsdaSummary } from "./BsdaSummary";
import cogoToast from "cogo-toast";
import { generatePath, Link } from "react-router-dom";
import routes from "common/routes";
import { GET_BSDS } from "common/queries";

const PUBLISH_BSDA = gql`
  mutation PublishBsda($id: ID!) {
    publishBsda(id: $id) {
      id
      isDraft
    }
  }
`;

export default function PublishBsda({ bsd, siret }: WorkflowActionProps) {
  const [
    getBsda,
    { error: bsdaGetError, data, loading: bsdaGetLoading },
  ] = useLazyQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsd.id,
    },

    fetchPolicy: "network-only",
  });

  const [publishBsda, { error, loading }] = useMutation<
    Pick<Mutation, "publishBsda">,
    MutationPublishBsdaArgs
  >(PUBLISH_BSDA, {
    variables: { id: bsd.id },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      cogoToast.success(`Bordereau ${bsd.id} publié`, { hideAfter: 5 });
    },
    onError: () =>
      cogoToast.error(`Le bordereau ${bsd.id} n'a pas pu être publié`, {
        hideAfter: 5,
      }),
  });

  const actionLabel = "Publier le bordereau";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton
          icon={<IconPaperWrite size="24px" />}
          onClick={() => {
            getBsda();
            open();
          }}
        >
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => {
        if (!!bsdaGetLoading) {
          return <Loader />;
        }
        if (!!bsdaGetError) {
          return (
            <NotificationError
              className="action-error"
              apolloError={bsdaGetError}
            />
          );
        }
        return (
          <div>
            {!!data?.bsda && <BsdaSummary bsda={data.bsda} />}
            <p>
              Cette action aura pour effet de démarrer le cycle de vie du
              bordereau en le faisant apparaître dans l'onglet{" "}
              <strong>“Pour action”</strong> du tableau de bord de l'émetteur.
              Le bordereau pourra toujours être modifié ou supprimé tant
              qu'aucune signature n'a été apposée.
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
                      id: bsd.id,
                    },
                  })
                }
              >
                <span>Publier le bordereau</span>
              </button>
            </div>
            {loading && <Loader />}
            {error && (
              <>
                <NotificationError
                  className="action-error"
                  apolloError={error}
                />
                <Link
                  to={generatePath(routes.dashboard.bsdas.edit, {
                    siret,
                    id: bsd.id,
                  })}
                  className="btn btn--primary"
                >
                  Mettre le bordereau à jour pour le publier
                </Link>
              </>
            )}
          </div>
        );
      }}
    />
  );
}
