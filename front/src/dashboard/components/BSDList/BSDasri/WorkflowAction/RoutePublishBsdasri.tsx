import React from "react";

import {
  Mutation,
  Query,
  QueryBsdasriArgs,
  MutationPublishBsdasriArgs,
} from "generated/graphql/types";
import { NotificationError, InlineError } from "common/components/Error";

import Loader from "common/components/Loaders";
import { useQuery, useMutation, gql } from "@apollo/client";
import routes from "common/routes";
import { useParams, useHistory, generatePath, Link } from "react-router-dom";
import { GET_DETAIL_DASRI_WITH_METADATA, GET_BSDS } from "common/queries";

import EmptyDetail from "dashboard/detail/common/EmptyDetailView";
import cogoToast from "cogo-toast";

import { BdasriSummary } from "dashboard/components/BSDList/BSDasri/Summary/BsdasriSummary";

const PUBLISH_BSDASRI = gql`
  mutation PublishBsdasri($id: ID!) {
    publishBsdasri(id: $id) {
      id
      isDraft
    }
  }
`;
export function RoutePublishBsdasri() {
  const { id: formId, siret } = useParams<{ id: string; siret: string }>();
  const history = useHistory();

  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdasriArgs
  >(GET_DETAIL_DASRI_WITH_METADATA, {
    variables: {
      id: formId,
    },

    fetchPolicy: "network-only",
  });

  const [
    publishBsdasri,
    { loading: mutationLoading, error: publishError },
  ] = useMutation<Pick<Mutation, "publishBsdasri">, MutationPublishBsdasriArgs>(
    PUBLISH_BSDASRI,
    {
      variables: { id: formId },
      refetchQueries: [GET_BSDS],
      awaitRefetchQueries: true,
      onCompleted: () => {
        cogoToast.success(`Bordereau ${formId} publié`, { hideAfter: 5 });
        history.goBack();
      },
      onError: () =>
        cogoToast.error(`Le bordereau ${formId} n'a pas pu être publié`, {
          hideAfter: 5,
        }),
    }
  );
  if (error) {
    return <InlineError apolloError={error} />;
  }
  if (loading) {
    return <Loader />;
  }
  if (data == null) {
    return <EmptyDetail />;
  }
  const { bsdasri } = data;

  return (
    <div>
      <h2 className="td-modal-title">Publier le bordereau</h2>
      <BdasriSummary bsdasri={bsdasri} />

      <p>
        Cette action aura pour effet de démarrer le cycle de vie du bordereau en
        le faisant apparaître dans l'onglet "À collecter" du tableau de bord
        transporteur. Le bordereau pourra toujours être modifié ou supprimé
        depuis l'onglet "Suivi".
      </p>
      <p className="tw-mt-1">
        Le statut du bordereau passera de "brouillon" à "initial".
        <br />
        Une fois publié, le bordereau sera prêt pour l'enlèvement.
      </p>
      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={history.goBack}>
          Annuler
        </button>
        <button
          className="btn btn--primary"
          disabled={mutationLoading}
          onClick={() =>
            publishBsdasri({
              variables: {
                id: formId,
              },
            })
          }
        >
          <span>Publier le bordereau</span>
        </button>
      </div>
      {(error || publishError) && (
        <>
          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
          {publishError && (
            <NotificationError
              className="action-error"
              apolloError={publishError}
            />
          )}

          <Link
            to={generatePath(routes.dashboard.bsdasris.edit, {
              siret,
              id: formId,
            })}
            className="btn btn--primary"
          >
            Mettre le bordereau à jour pour le publier
          </Link>
        </>
      )}
      {(loading || mutationLoading) && <Loader />}
    </div>
  );
}
