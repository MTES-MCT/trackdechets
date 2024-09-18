import * as React from "react";
import { Modal } from "../../../../common/components";
import { Application } from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import { MY_APPLICATIONS, DELETE_APPLICATION } from "./queries";
import { NotificationError } from "../../../common/Components/Error/Error";

type AccountApplicationsMyApplicationDeleteProps = {
  application: Application;
  onClose: () => void;
};

export default function AccountApplicationsMyApplicationDelete({
  application,
  onClose
}: AccountApplicationsMyApplicationDeleteProps) {
  const [deleteApplication, { loading, error }] = useMutation(
    DELETE_APPLICATION,
    {
      refetchQueries: [MY_APPLICATIONS],
      onCompleted: () => {
        onClose();
      }
    }
  );

  return (
    <Modal
      title="Supprimer une application"
      ariaLabel="Supprimer une application"
      onClose={onClose}
      closeLabel="Ne pas supprimer"
      isOpen
    >
      <div>
        Etes vous sûr.e de vouloir supprimer l'application "{application.name}"
        ? Tous les jetons d'accès associés à cette application seront invalidés.
      </div>
      <div className="td-modal-actions">
        <button
          className="fr-btn fr-btn--secondary"
          onClick={() =>
            deleteApplication({ variables: { id: application.id } })
          }
          disabled={loading}
        >
          {loading ? "Suppression..." : "Supprimer"}
        </button>
        <button className="fr-btn" onClick={() => onClose()}>
          Ne pas supprimer
        </button>
      </div>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
