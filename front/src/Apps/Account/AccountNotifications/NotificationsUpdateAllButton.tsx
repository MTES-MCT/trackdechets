import React, { useState } from "react";
import Button from "@codegouvfr/react-dsfr/Button";
import AccountNotificationsUpdateAllModal from "./NotificationsUpdateAllModal";

type AccountNotificationsUpdateAllButtonProps = {
  // nombre total d'établissements
  totalCount: number;
};

export default function NotificationsUpdateAllButton({
  totalCount
}: AccountNotificationsUpdateAllButtonProps) {
  const [open, setIsOpen] = useState(false);

  return (
    <>
      <AccountNotificationsUpdateAllModal
        totalCount={totalCount}
        open={open}
        close={() => setIsOpen(false)}
      />

      <Button
        iconId="ri-notification-3-line"
        size="small"
        priority="secondary"
        onClick={() => setIsOpen(true)}
      >
        Gérer tout
      </Button>
    </>
  );
}
