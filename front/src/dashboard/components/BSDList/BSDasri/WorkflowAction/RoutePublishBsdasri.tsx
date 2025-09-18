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
import { GET_DETAIL_DASRI_WITH_METADATA } from "../../../../../Apps/common/queries";
import { TOAST_DURATION } from "../../../../../common/config";
import toast from "react-hot-toast";

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

  const { error, loading } = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(
    GET_DETAIL_DASRI_WITH_METADATA,
    {
      variables: {
        id: formId!
      },

      fetchPolicy: "no-cache"
    }
  );

  const [publishBsdasri, { loading: mutationLoading, error: publishError }] =
    useMutation<Pick<Mutation, "publishBsdasri">, MutationPublishBsdasriArgs>(
      PUBLISH_BSDASRI,
      {
        variables: { id: formId! },
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

  return (
    <div>
      <h2 className="td-modal-title">Publier le bordereau</h2>
      <p>
        En le publiant, le bordereau passera dans l'onglet{" "}
        <strong>« Pour action »</strong> du tableau de bord de l'émetteur ainsi
        que dans l'onglet <strong>« Suivis »</strong> des acteurs visés. Son
        cycle de vie commencera. Vous pourrez encore le modifier ou le supprimer
        tant qu'aucune signature n'aura été apposée.
      </p>
      <div className="td-modal-actions">
        <button
          className="fr-btn fr-btn--secondary"
          onClick={() => {
            navigate(-1);
          }}
        >
          Annuler
        </button>
        <button
          className="fr-btn fr-btn--primary"
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
            to={generatePath(routes.dashboard.bsdasris.edit, {
              siret,
              id: formId
            })}
            className="fr-btn fr-btn--primary"
          >
            Mettre le bordereau à jour pour le publier
          </Link>
        </>
      )}
      {(loading || mutationLoading) && <Loader />}
    </div>
  );
}
