import * as React from "react";
import { Modal } from "../../common/components";
import { useMutation } from "@apollo/client";
import { ACCESS_TOKENS, REVOKE_ALL_ACCESS_TOKENS } from "./queries";
import { NotificationError } from "../../Apps/common/Components/Error/Error";

type AccountAccessTokenRevokeAllProps = {
  onClose: () => void;
  onRevokeAll: () => void;
};

export default function AccountAccessTokenRevokeAll({
  onClose,
  onRevokeAll
}: AccountAccessTokenRevokeAllProps) {
  const [revokeAllAccessTokens, { loading, error }] = useMutation(
    REVOKE_ALL_ACCESS_TOKENS,
    {
      refetchQueries: [ACCESS_TOKENS],
      onCompleted: () => {
        onRevokeAll();
        onClose();
      }
    }
  );

  return (
    <Modal
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
        <button className="btn btn--outline-primary" onClick={() => onClose()}>
          Annuler
        </button>
        <button
          className="btn btn--danger"
          onClick={() => revokeAllAccessTokens()}
          disabled={loading}
        >
          {loading
            ? "Suppression..."
            : "J'ai compris, révoquer tous les jetons"}
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
