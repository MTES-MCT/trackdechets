import React from "react";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationPublishBsffArgs } from "generated/graphql/types";
import { ActionButton } from "common/components";
import { Loader } from "Apps/common/Components";
import { TdModalTrigger } from "common/components/Modal";
import { IconPaperWrite } from "common/components/Icons";
import { GET_BSDS } from "Apps/common/queries";
import { NotificationError } from "Apps/common/Components/Error/Error";

const PUBLISH_BSFF = gql`
  mutation PublishBsff($id: ID!) {
    publishBsff(id: $id) {
      id
      isDraft
    }
  }
`;

interface PublishBsffProps {
  bsffId: string;
}

export function PublishBsff({ bsffId }: PublishBsffProps) {
  const [publishBsff, { loading, error }] = useMutation<
    Pick<Mutation, "publishBsff">,
    MutationPublishBsffArgs
  >(PUBLISH_BSFF, {
    variables: { id: bsffId },
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
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
        <>
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
            <button className="btn btn--primary" onClick={() => publishBsff()}>
              <span>Publier le bordereau</span>
            </button>
          </div>
          {loading && <Loader />}
          {error && <NotificationError apolloError={error} />}
        </>
      )}
    />
  );
}
