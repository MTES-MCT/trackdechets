import * as React from "react";
import { Modal } from "common/components";
import { AuthorizedApplication } from "generated/graphql/types";
import { useMutation } from "@apollo/client";
import {
  REVOKE_AUTHORIZED_APPLICATION,
  AUTHORIZED_APPLICATIONS,
} from "./queries";
import { NotificationError } from "Apps/common/Components/Error/Error";

type AccountAuthorizedAppRevokeProps = {
  authorizedApplication: AuthorizedApplication;
  onClose: () => void;
};

export default function AccountAuthorizedAppRevoke({
  authorizedApplication,
  onClose,
}: AccountAuthorizedAppRevokeProps) {
  const [revokeAuthorizedApplication, { loading, error }] = useMutation(
    REVOKE_AUTHORIZED_APPLICATION,
    {
      refetchQueries: [AUTHORIZED_APPLICATIONS],
    }
  );

  return (
    <Modal ariaLabel="Révoquer une application" onClose={onClose} isOpen>
      <div>
        Etes vous sûr.e de vouloir révoquer l'accès donné à l'application "
        {authorizedApplication.name}" ?
      </div>
      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={() => onClose()}>
          Annuler
        </button>
        <button
          className="btn btn--danger"
          onClick={() =>
            revokeAuthorizedApplication({
              variables: { id: authorizedApplication.id },
            })
          }
          disabled={loading}
        >
          {loading ? "Révocation..." : "Supprimer"}
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
