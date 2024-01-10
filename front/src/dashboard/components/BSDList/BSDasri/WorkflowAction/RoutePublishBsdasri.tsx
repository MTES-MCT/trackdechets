import React from "react";

import {
  Mutation,
  Query,
  QueryBsdasriArgs,
  MutationPublishBsdasriArgs
} from "@td/codegen-ui";
import {
  NotificationError,
  InlineError
} from "../../../../../Apps/common/Components/Error/Error";

import Loader from "../../../../../Apps/common/Components/Loader/Loaders";
import { useQuery, useMutation, gql } from "@apollo/client";
import routes from "../../../../../Apps/routes";
import { useParams, useNavigate, generatePath, Link } from "react-router-dom";
import {
  GET_DETAIL_DASRI_WITH_METADATA,
  GET_BSDS
} from "../../../../../Apps/common/queries";
import { TOAST_DURATION } from "../../../../../common/config";

import EmptyDetail from "../../../../detail/common/EmptyDetailView";
import toast from "react-hot-toast";

import { BdasriSummary } from "../Summary/BsdasriSummary";

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
  const navigate = useNavigate();

  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdasriArgs
  >(GET_DETAIL_DASRI_WITH_METADATA, {
    variables: {
      id: formId!
    },

    fetchPolicy: "no-cache"
  });

  const [publishBsdasri, { loading: mutationLoading, error: publishError }] =
    useMutation<Pick<Mutation, "publishBsdasri">, MutationPublishBsdasriArgs>(
      PUBLISH_BSDASRI,
      {
        variables: { id: formId! },
        refetchQueries: [GET_BSDS],
        awaitRefetchQueries: true,
        onCompleted: () => {
          toast.success(`Bordereau ${formId} publié`, {
            duration: TOAST_DURATION
          });
          navigate(-1);
        },
        onError: () =>
          toast.error(`Le bordereau ${formId} n'a pas pu être publié`, {
            duration: TOAST_DURATION
          })
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
        <button
          className="btn btn--outline-primary"
          onClick={() => {
            navigate(-1);
          }}
        >
          Annuler
        </button>
        <button
          className="btn btn--primary"
          disabled={mutationLoading}
          onClick={() =>
            publishBsdasri({
              variables: {
                id: formId!
              }
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
            to={generatePath(routes.dashboardv2.bsdasris.edit, {
              siret,
              id: formId
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
