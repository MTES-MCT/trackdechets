import * as React from "react";
import { Modal } from "../../../common/components";
import { Application } from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import { MY_APPLICATIONS, DELETE_APPLICATION } from "./queries";
import { NotificationError } from "../../common/Components/Error/Error";

type AccountOauth2AppDeleteProps = {
  application: Application;
  onClose: () => void;
};

export default function AccountOauth2AppDelete({
  application,
  onClose
}: AccountOauth2AppDeleteProps) {
  const [deleteApplication, { loading, error }] = useMutation(
    DELETE_APPLICATION,
    { refetchQueries: [MY_APPLICATIONS] }
  );

  return (
    <Modal ariaLabel="Supprimer une application" onClose={onClose} isOpen>
      <div>
        Etes vous sûr.e de vouloir supprimer l'application "{application.name}"
        ? Tous les jetons d'accès associés à cette application seront invalidés.
      </div>
      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={() => onClose()}>
          Annuler
        </button>
        <button
          className="btn btn--danger"
          onClick={() =>
            deleteApplication({ variables: { id: application.id } })
          }
          disabled={loading}
        >
          {loading ? "Suppression..." : "Supprimer"}
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
