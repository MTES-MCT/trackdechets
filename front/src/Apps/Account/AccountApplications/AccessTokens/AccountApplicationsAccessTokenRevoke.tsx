import * as React from "react";
import { Modal } from "../../../../common/components";
import { AccessToken } from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import { ACCESS_TOKENS, REVOKE_ACCESS_TOKEN } from "./queries";
import { NotificationError } from "../../../common/Components/Error/Error";

type AccountApplicationsAccessTokenRevokeProps = {
  accessToken: AccessToken;
  onClose: () => void;
};

export default function AccountApplicationsAccessTokenRevoke({
  accessToken,
  onClose
}: AccountApplicationsAccessTokenRevokeProps) {
  const [revokeAccessToken, { loading, error }] = useMutation(
    REVOKE_ACCESS_TOKEN,
    {
      refetchQueries: [ACCESS_TOKENS],
      onCompleted: () => {
        onClose();
      }
    }
  );

  return (
    <Modal
      title="Révoquer un jeton d'accès"
      ariaLabel="Révoquer un jeton d'accès"
      onClose={onClose}
      isOpen
    >
      <div>Êtes vous certain.e de vouloir révoquer ce jeton d'accès ? </div>
      <div>
        Tous les scripts et applications susceptibles d'utiliser ce jeton
        d'accès ne pourront plus accéder à l'API Trackdéchets
      </div>
      <div className="td-modal-actions">
        <button className="fr-btn" onClick={() => onClose()}>
          Annuler
        </button>
        <button
          className="fr-btn fr-btn--secondary"
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
