import * as React from "react";
import { Modal } from "../../common/components";
import { AccessToken, NewAccessToken } from "codegen-ui";
import { useMutation } from "@apollo/client";
import { ACCESS_TOKENS, REVOKE_ACCESS_TOKEN } from "./queries";
import { NotificationError } from "../../Apps/common/Components/Error/Error";

type AccountAccessTokenRevokeProps = {
  accessToken: AccessToken | NewAccessToken;
  onClose: () => void;
  onDelete?: () => void;
};

export default function AccountAccessTokenRevoke({
  accessToken,
  onClose,
  onDelete
}: AccountAccessTokenRevokeProps) {
  const [revokeAccessToken, { loading, error }] = useMutation(
    REVOKE_ACCESS_TOKEN,
    {
      refetchQueries: [ACCESS_TOKENS],
      onCompleted: () => {
        if (onDelete) {
          onDelete();
        }
        onClose();
      }
    }
  );

  return (
    <Modal ariaLabel="Révoquer un jeton d'accès" onClose={onClose} isOpen>
      <div>Êtes vous certain.e de vouloir révoquer ce jeton d'accès ? </div>
      <div>
        Tous les scripts et applications susceptibles d'utiliser ce jeton
        d'accès ne pourront plus accéder à l'API Trackdéchets
      </div>
      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={() => onClose()}>
          Annuler
        </button>
        <button
          className="btn btn--danger"
          onClick={() =>
            revokeAccessToken({ variables: { id: accessToken.id } })
          }
          disabled={loading}
        >
          {loading
            ? "Révocation..."
            : "J'ai compris, révoquer ce jeton d'accès"}
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
