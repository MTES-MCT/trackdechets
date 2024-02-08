import React from "react";
import { gql, useMutation } from "@apollo/client";
import {
  FormStatus,
  Mutation,
  MutationMarkAsSealedArgs,
  MutationPublishBsdaArgs,
  MutationPublishBsffArgs,
  MutationPublishBsvhuArgs
} from "@td/codegen-ui";
import { statusChangeFragment } from "../../../../common/queries/fragments";
import toast from "react-hot-toast";
import { NotificationError } from "../../../../common/Components/Error/Error";
import { Loader } from "../../../../common/Components";
import TdModal from "../../../../common/Components/Modal/Modal";
import {
  bsdaPublishDraft,
  bsddValidationDraftText,
  bsffPublishDraft,
  bsvhuPublishDraft
} from "../../../../common/wordings/dashboard/wordingsDashboard";
import { generatePath, Link } from "react-router-dom";
import routes from "../../../../routes";
import { TOAST_DURATION } from "../../../../../common/config";

const DraftValidation = ({ bsd, currentSiret, isOpen, onClose }) => {
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
      onError: () =>
        toast.error(`Le bordereau ${bsd.id} n'a pas pu être publié`, {
          duration: TOAST_DURATION
        })
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
        onError: () =>
          toast.error(`Le bordereau ${bsd.id} n'a pas pu être publié`, {
            duration: TOAST_DURATION
          })
      }
    );

  const renderTitle = (): string => {
    if (bsd.__typename === "Form") {
      return "Valider le bordereau";
    }

    if (
      bsd.__typename === "Bsda" ||
      bsd.__typename === "Bsff" ||
      bsd.__typename === "Bsvhu"
    ) {
      return "Publier le bordereau";
    }
    return "";
  };
  const renderContent = () => {
    if (bsd.__typename === "Form") {
      return (
        <>
          <div>
            <p>{bsddValidationDraftText}</p>

            <div className="td-modal-actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                onClick={async () => {
                  const res = await markAsSealed();
                  if (!res.errors) {
                    onClose();
                  }
                }}
              >
                Je valide
              </button>
            </div>
          </div>

          {errorValidateBsdd && (
            <NotificationError
              className="action-error"
              apolloError={errorValidateBsdd}
            />
          )}
          {loadingValidateBsdd && <Loader />}
        </>
      );
    }
    if (bsd.__typename === "Bsda") {
      return (
        <>
          <p dangerouslySetInnerHTML={{ __html: bsdaPublishDraft }} />
          <div className="td-modal-actions">
            <button className="btn btn--outline-primary" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn btn--primary"
              onClick={async () => {
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
              <span>Publier le bordereau</span>
            </button>
          </div>
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
                className="btn btn--primary"
              >
                Mettre le bordereau à jour pour le publier
              </Link>
            </>
          )}
        </>
      );
    }

    if (bsd.__typename === "Bsff") {
      return (
        <>
          <p dangerouslySetInnerHTML={{ __html: bsffPublishDraft }} />

          <div className="td-modal-actions">
            <button className="btn btn--outline-primary" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn btn--primary"
              onClick={async () => {
                const res = await publishBsff();
                if (!res.errors) {
                  onClose();
                }
              }}
            >
              <span>Publier le bordereau</span>
            </button>
          </div>
          {loadingBsff && <Loader />}
          {errorBsff && <NotificationError apolloError={errorBsff} />}
        </>
      );
    }

    if (bsd.__typename === "Bsvhu") {
      return (
        <div>
          <p dangerouslySetInnerHTML={{ __html: bsvhuPublishDraft }} />

          <div className="td-modal-actions">
            <button className="btn btn--outline-primary" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn btn--primary"
              onClick={async () => {
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
              <span>Publier le bordereau</span>
            </button>
          </div>

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
                className="btn btn--primary"
              >
                Mettre le bordereau à jour pour le publier
              </Link>
            </>
          )}
          {loadingBsvhu && <Loader />}
        </div>
      );
    }
  };

  return (
    <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
      <h2 className="td-modal-title">{renderTitle()}</h2>
      {renderContent()}
    </TdModal>
  );
};

export default DraftValidation;
