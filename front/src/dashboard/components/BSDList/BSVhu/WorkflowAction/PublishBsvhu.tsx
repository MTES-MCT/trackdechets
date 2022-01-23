import React from "react";
import {
  Mutation,
  MutationPublishBsvhuArgs,
  Query,
  QueryBsvhuArgs,
} from "generated/graphql/types";
import { WorkflowActionProps } from "./WorkflowAction";
import { gql, useMutation, useLazyQuery } from "@apollo/client";

import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, Loader } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";

import cogoToast from "cogo-toast";
import { generatePath, Link } from "react-router-dom";
import routes from "common/routes";
import { GET_BSDS } from "common/queries";
import { GET_BSVHU } from "form/bsvhu/utils/queries";
import { BsvhuSummary } from "./BsvhuSummary";

const PUBLISH_BSVHU = gql`
  mutation PublishBsvhu($id: ID!) {
    publishBsvhu(id: $id) {
      id
      isDraft
    }
  }
`;

export default function PublishBsvhu({ bsd, siret }: WorkflowActionProps) {
  const [
    getBsvhu,
    { error: bsvhuGetError, data, loading: bsvhuGetLoading },
  ] = useLazyQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(GET_BSVHU, {
    variables: {
      id: bsd.id,
    },

    fetchPolicy: "network-only",
  });

  const [publishBsvhu, { loading, error }] = useMutation<
    Pick<Mutation, "publishBsvhu">,
    MutationPublishBsvhuArgs
  >(PUBLISH_BSVHU, {
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
            getBsvhu();
            open();
          }}
        >
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => {
        if (!!bsvhuGetLoading) {
          return <Loader />;
        }
        if (!!bsvhuGetError) {
          return (
            <NotificationError
              className="action-error"
              apolloError={bsvhuGetError}
            />
          );
        }
        return (
          <div>
            {!!data?.bsvhu && <BsvhuSummary bsvhu={data.bsvhu} />}

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
                  publishBsvhu({
                    variables: {
                      id: bsd.id,
                    },
                  })
                }
              >
                <span>Publier le bordereau</span>
              </button>
            </div>

            {error && (
              <>
                <NotificationError
                  className="action-error"
                  apolloError={error}
                />
                <Link
                  to={generatePath(routes.dashboard.bsvhus.edit, {
                    siret,
                    id: bsd.id,
                  })}
                  className="btn btn--primary"
                >
                  Mettre le bordereau à jour pour le publier
                </Link>
              </>
            )}
            {loading && <Loader />}
          </div>
        );
      }}
    />
  );
}
