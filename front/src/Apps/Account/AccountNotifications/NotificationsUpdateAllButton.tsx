import React from "react";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import AccountNotificationsUpdateAllModal from "./NotificationsUpdateAllModal";

type AccountNotificationsUpdateAllButtonProps = {
  // nombre total d'établissements
  totalCount: number;
};

export default function NotificationsUpdateAllButton({
  totalCount
}: AccountNotificationsUpdateAllButtonProps) {
  const modal = createModal({
    id: `update-all-notifications`,
    isOpenedByDefault: false
  });

  return (
    <>
      <modal.Component title="Gérer les notifications en masse">
        <AccountNotificationsUpdateAllModal totalCount={totalCount} />
      </modal.Component>
      <Button size="small" priority="secondary" onClick={() => modal.open()}>
        Gérer les notifications en masse
      </Button>
    </>
  );
}
