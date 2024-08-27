import * as React from "react";
import { Modal } from "../../../../common/components";
import { AuthorizedApplication } from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import {
  REVOKE_AUTHORIZED_APPLICATION,
  AUTHORIZED_APPLICATIONS
} from "./queries";
import { NotificationError } from "../../../common/Components/Error/Error";

type AccountApplicationsAuthorizedApplicationsRevokeProps = {
  authorizedApplication: AuthorizedApplication;
  onClose: () => void;
};

export default function AccountApplicationsAuthorizedApplicationsRevoke({
  authorizedApplication,
  onClose
}: AccountApplicationsAuthorizedApplicationsRevokeProps) {
  const [revokeAuthorizedApplication, { loading, error }] = useMutation(
    REVOKE_AUTHORIZED_APPLICATION,
    {
      refetchQueries: [AUTHORIZED_APPLICATIONS],
      onCompleted: () => {
        onClose();
      }
    }
  );

  return (
    <Modal
      title="Révoquer une application"
      ariaLabel="Révoquer une application"
      onClose={onClose}
      closeLabel="Ne pas révoquer"
      isOpen
    >
      <div>
        Etes vous sûr.e de vouloir révoquer l'accès donné à l'application "
        {authorizedApplication.name}" ?
      </div>
      <div className="td-modal-actions">
        <button
          className="fr-btn fr-btn--secondary"
          onClick={() =>
            revokeAuthorizedApplication({
              variables: { id: authorizedApplication.id }
            })
          }
          disabled={loading}
        >
          {loading ? "Révocation..." : "Révoquer"}
        </button>
        <button className="fr-btn" onClick={() => onClose()}>
          Ne pas révoquer
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
