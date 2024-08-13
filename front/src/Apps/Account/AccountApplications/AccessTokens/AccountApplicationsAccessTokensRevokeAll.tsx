import * as React from "react";
import { Modal } from "../../../../common/components";
import { useMutation } from "@apollo/client";
import { ACCESS_TOKENS, REVOKE_ALL_ACCESS_TOKENS } from "./queries";
import { NotificationError } from "../../../common/Components/Error/Error";

type AccountApplicationsAccessTokenRevokeAllProps = {
  onClose: () => void;
};

export default function AccountApplicationsAccessTokenRevokeAll({
  onClose
}: AccountApplicationsAccessTokenRevokeAllProps) {
  const [revokeAllAccessTokens, { loading, error }] = useMutation(
    REVOKE_ALL_ACCESS_TOKENS,
    {
      refetchQueries: [ACCESS_TOKENS],
      onCompleted: () => {
        onClose();
      }
    }
  );

  return (
    <Modal
      title="Révoquer tous les jetons d'accès"
      ariaLabel="Supprimer tous les jetons d'accès ?"
      onClose={onClose}
      isOpen
    >
      <div>
        Êtes vous certain.e de vouloir supprimer tous vos jetons d'accès
        personnels ?
      </div>
      <div>
        Tous les scripts et applications susceptibles d'utiliser vos jetons
        d'accès ne pourront plus accéder à l'API Trackdéchets. Cela n'impacte
        pas en revanche les applications tierces auxquelles vous avez donné un
        accès.
      </div>
      <div className="td-modal-actions">
        <button className="fr-btn" onClick={() => onClose()}>
          Annuler
        </button>
        <button
          className="fr-btn fr-btn--secondary"
          onClick={() => revokeAllAccessTokens()}
          disabled={loading}
        >
          {loading ? "Suppression..." : "Révoquer"}
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
