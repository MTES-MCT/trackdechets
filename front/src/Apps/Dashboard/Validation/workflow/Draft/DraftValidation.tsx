import React, { useState } from "react";

import { gql, useMutation } from "@apollo/client";
import {
  FormStatus,
  Mutation,
  MutationMarkAsSealedArgs,
  MutationPublishBsdaArgs,
  MutationPublishBsffArgs,
  MutationPublishBsvhuArgs,
  MutationPublishBspaohArgs
} from "@td/codegen-ui";
import { statusChangeFragment } from "../../../../common/queries/fragments";
import toast from "react-hot-toast";
import { NotificationError } from "../../../../common/Components/Error/Error";
import { Loader } from "../../../../common/Components";
import TdModal from "../../../../common/Components/Modal/Modal";
import { generatePath, Link, useLocation } from "react-router-dom";

import routes from "../../../../routes";
import { TOAST_DURATION } from "../../../../../common/config";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { handleGraphQlError } from "../../../Creation/utils";

const DraftValidationWrapper = ({ onClose, onSubmit, children }) => {
  return (
    <div>
      <p>
        En le publiant, le bordereau passera dans l'onglet{" "}
        <strong>« Pour action »</strong> du tableau de bord de l'émetteur ainsi
        que dans l'onglet <strong>« Suivis »</strong> des acteurs visés. Son
        cycle de vie commencera. Vous pourrez encore le modifier ou le supprimer
        tant qu'aucune signature n'aura été apposée.
      </p>

      <div className="td-modal-actions">
        <Button onClick={onClose} priority="secondary">
          Annuler
        </Button>
        <Button priority="primary" onClick={onSubmit}>
          <span>Publier le bordereau</span>
        </Button>
      </div>

      {children}
    </div>
  );
};

const DraftValidation = ({ bsd, currentSiret, isOpen, onClose }) => {
  const location = useLocation();

  const [publishErrors, setPublishErrors] = useState<
    | {
        code: string;
        path: string[];
        message: string;
      }[]
    | undefined
  >();

  const MARK_AS_SEALED = gql`
    mutation MarkAsSealed($id: ID!) {
      markAsSealed(id: $id) {
        readableId
        ...StatusChange
      }
    }
    ${statusChangeFragment}
  `;
  const PUBLISH_BSDA = gql`
    mutation PublishBsda($id: ID!) {
      publishBsda(id: $id) {
        id
        isDraft
      }
    }
  `;
  const PUBLISH_BSFF = gql`
    mutation PublishBsff($id: ID!) {
      publishBsff(id: $id) {
        id
        isDraft
      }
    }
  `;
  const PUBLISH_BSVHU = gql`
    mutation PublishBsvhu($id: ID!) {
      publishBsvhu(id: $id) {
        id
        isDraft
      }
    }
  `;
  const PUBLISH_BSPAOH = gql`
    mutation PublishBsvpaoh($id: ID!) {
      publishBspaoh(id: $id) {
        id
        isDraft
      }
    }
  `;

  const [
    markAsSealed,
    { loading: loadingValidateBsdd, error: errorValidateBsdd }
  ] = useMutation<Pick<Mutation, "markAsSealed">, MutationMarkAsSealedArgs>(
    MARK_AS_SEALED,
    {
      variables: { id: bsd.id },
      onCompleted: data => {
        if (data.markAsSealed) {
          const sealedForm = data.markAsSealed;
          if (sealedForm.status === FormStatus.Sealed)
            toast.success(
              `Le numéro #${sealedForm.readableId} a été affecté au bordereau. Vous pouvez le retrouver dans l'onglet "Pour action".`
            );
        }
      },
      onError: () => {
        // The error is handled in the UI
      }
    }
  );

  const [
    publishBsda,
    { error: errorPublishBsda, loading: loadingPublishBsda }
  ] = useMutation<Pick<Mutation, "publishBsda">, MutationPublishBsdaArgs>(
    PUBLISH_BSDA,
    {
      variables: { id: bsd.id },
      onCompleted: () => {
        toast.success(`Bordereau ${bsd.id} publié`, {
          duration: TOAST_DURATION
        });
      },
      onError: err => {
        toast.error(`Le bordereau ${bsd.id} n'a pas pu être publié`, {
          duration: TOAST_DURATION
        });
        const normalizedErrors = handleGraphQlError(err);
        setPublishErrors(normalizedErrors);
      }
    }
  );

  const [publishBsff, { loading: loadingBsff, error: errorBsff }] = useMutation<
    Pick<Mutation, "publishBsff">,
    MutationPublishBsffArgs
  >(PUBLISH_BSFF, {
    variables: { id: bsd.id }
  });

  const [publishBsvhu, { loading: loadingBsvhu, error: errorBsvhu }] =
    useMutation<Pick<Mutation, "publishBsvhu">, MutationPublishBsvhuArgs>(
      PUBLISH_BSVHU,
      {
        variables: { id: bsd.id },
        onCompleted: () => {
          toast.success(`Bordereau ${bsd.id} publié`, {
            duration: TOAST_DURATION
          });
        },
        onError: err => {
          toast.error(`Le bordereau ${bsd.id} n'a pas pu être publié`, {
            duration: TOAST_DURATION
          });
          const normalizedErrors = handleGraphQlError(err);
          setPublishErrors(normalizedErrors);
        }
      }
    );

  const [publishBspaoh, { loading: loadingBspaoh, error: errorBspaoh }] =
    useMutation<Pick<Mutation, "publishBspaoh">, MutationPublishBspaohArgs>(
      PUBLISH_BSPAOH,
      {
        variables: { id: bsd.id },

        onCompleted: () => {
          toast.success(`Bordereau ${bsd.id} publié`, {
            duration: TOAST_DURATION
          });
        },
        onError: err => {
          toast.error(`Le bordereau ${bsd.id} n'a pas pu être publié`, {
            duration: TOAST_DURATION
          });
          const normalizedErrors = handleGraphQlError(err);
          setPublishErrors(normalizedErrors);
        }
      }
    );

  const renderContent = () => {
    if (bsd.__typename === "Form") {
      return (
        <DraftValidationWrapper
          onClose={onClose}
          onSubmit={async () => {
            const res = await markAsSealed();
            if (!res.errors) {
              onClose();
            }
          }}
        >
          {errorValidateBsdd && (
            <NotificationError
              className="action-error"
              apolloError={errorValidateBsdd}
            />
          )}
          {loadingValidateBsdd && <Loader />}
        </DraftValidationWrapper>
      );
    }
    if (bsd.__typename === "Bsda") {
      return (
        <DraftValidationWrapper
          onClose={onClose}
          onSubmit={async () => {
            const res = await publishBsda({
              variables: {
                id: bsd.id
              }
            });
            if (!res.errors) {
              onClose();
            }
          }}
        >
          {loadingPublishBsda && <Loader />}
          {errorPublishBsda && (
            <>
              <NotificationError
                className="action-error"
                apolloError={errorPublishBsda}
              />
              <Link
                to={generatePath(routes.dashboard.bsdas.edit, {
                  siret: currentSiret,
                  id: bsd.id
                })}
                className="fr-btn fr-btn--primary"
                onClick={onClose}
                state={{ background: location, publishErrors: publishErrors }}
              >
                Mettre le bordereau à jour pour le publier
              </Link>
            </>
          )}
        </DraftValidationWrapper>
      );
    }

    if (bsd.__typename === "Bsff") {
      return (
        <DraftValidationWrapper
          onClose={onClose}
          onSubmit={async () => {
            const res = await publishBsff();
            if (!res.errors) {
              onClose();
            }
          }}
        >
          {loadingBsff && <Loader />}
          {errorBsff && <NotificationError apolloError={errorBsff} />}
        </DraftValidationWrapper>
      );
    }

    if (bsd.__typename === "Bsvhu") {
      return (
        <div>
          <DraftValidationWrapper
            onClose={onClose}
            onSubmit={async () => {
              const res = await publishBsvhu({
                variables: {
                  id: bsd.id
                }
              });
              if (!res.errors) {
                onClose();
              }
            }}
          >
            {errorBsvhu && (
              <>
                <NotificationError
                  className="action-error"
                  apolloError={errorBsvhu}
                />
                <Link
                  to={generatePath(routes.dashboard.bsvhus.edit, {
                    siret: currentSiret,
                    id: bsd.id
                  })}
                  className="fr-btn fr-btn--primary"
                  onClick={onClose}
                  state={{ background: location, publishErrors: publishErrors }}
                >
                  Mettre le bordereau à jour pour le publier
                </Link>
              </>
            )}
            {loadingBsvhu && <Loader />}
          </DraftValidationWrapper>
        </div>
      );
    }

    if (bsd.__typename === "Bspaoh") {
      return (
        <div>
          <DraftValidationWrapper
            onClose={onClose}
            onSubmit={async () => {
              const res = await publishBspaoh({
                variables: {
                  id: bsd.id
                }
              });
              if (!res.errors) {
                onClose();
              }
            }}
          >
            {errorBspaoh && (
              <>
                <NotificationError
                  className="action-error"
                  apolloError={errorBspaoh}
                />
                <Link
                  to={generatePath(routes.dashboard.bspaohs.edit, {
                    siret: currentSiret,
                    id: bsd.id
                  })}
                  onClick={onClose}
                  state={{ background: location, publishErrors: publishErrors }}
                >
                  <Button priority="primary">
                    Mettre le bordereau à jour pour le publier
                  </Button>
                </Link>
              </>
            )}
            {loadingBspaoh && <Loader />}
          </DraftValidationWrapper>
        </div>
      );
    }
  };
  return (
    <TdModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Publier le bordereau"
      size="M"
    >
      <h2 className="td-modal-title">Publier le bordereau</h2>
      {renderContent()}
    </TdModal>
  );
};

export default DraftValidation;
