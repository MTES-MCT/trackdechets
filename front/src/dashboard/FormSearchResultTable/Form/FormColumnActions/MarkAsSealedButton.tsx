import * as React from "react";
import { useParams } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  FormSearchResult,
  FormStatus,
  Mutation,
  MutationMarkAsSealedArgs,
  Query,
} from "generated/graphql/types";
import { statusChangeFragment } from "common/fragments";
import { updateApolloCache } from "common/helper";
import { Modal, ModalTitle, useModal } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import { SEARCH_DRAFTS } from "../../../slips/tabs/DraftsTab";

const MARK_AS_SEALED = gql`
  mutation MarkAsSealed($id: ID!) {
    markAsSealed(id: $id) {
      readableId
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

interface MarkAsSealedButtonProps {
  searchResult: FormSearchResult;
}

export function MarkAsSealedButton({ searchResult }: MarkAsSealedButtonProps) {
  const { siret } = useParams<{ siret: string }>();
  const { isOpen, onOpen, onClose } = useModal();
  const [markAsSealed, { error }] = useMutation<
    Pick<Mutation, "markAsSealed">,
    MutationMarkAsSealedArgs
  >(MARK_AS_SEALED, {
    variables: { id: searchResult.id },
    update: (cache, { data }) => {
      const sealedForm = data?.markAsSealed;

      if (sealedForm == null) {
        return;
      }

      updateApolloCache<Pick<Query, "searchForms">>(cache, {
        query: SEARCH_DRAFTS,
        variables: { siret },
        getNewData: ({ searchForms }) => ({
          searchForms: [...searchForms].filter(
            form => form.id !== sealedForm.id
          ),
        }),
      });

      // TODO: add the form to the follow tab
    },
    onCompleted: data => {
      if (data.markAsSealed) {
        const sealedForm = data.markAsSealed;
        if (sealedForm.status === FormStatus.Sealed)
          cogoToast.success(
            `Le numéro #${sealedForm.readableId} a été affecté au bordereau. Vous pouvez le retrouver dans l'onglet "Suivi"`
          );
      }
    },
  });

  return (
    <>
      <button type="button" className="btn btn--primary" onClick={onOpen}>
        <IconPaperWrite />
        Valider le bordereau
      </button>
      {isOpen && (
        <Modal ariaLabel="Valider le bordereau" onClose={onClose} isOpen>
          <ModalTitle>Valider le bordereau</ModalTitle>
          <p>
            Cette action aura pour effet de valider les données du bordereau et
            de le faire apparaitre dans l'onglet "À collecter" du tableau de
            bord transporteur. Un identifiant unique lui sera attribué et vous
            pourrez générer un PDF. Le bordereau pourra cependant toujours être
            modifié ou supprimé depuis l'onglet "Suivi".
          </p>

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
              onClick={() => markAsSealed()}
            >
              Je valide
            </button>
          </div>

          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
        </Modal>
      )}
    </>
  );
}
