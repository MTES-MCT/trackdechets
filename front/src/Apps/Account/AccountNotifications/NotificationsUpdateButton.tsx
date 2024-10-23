import React, { useState } from "react";
import Button from "@codegouvfr/react-dsfr/Button";
import { CompanyPrivate } from "@td/codegen-ui";
import NotificationsUpdateModal from "./NotificationsUpdateModal";

type AccountCompanyNotificationsUpdateButtonProps = {
  company: CompanyPrivate;
};

export default function NotificationsUpdateButton({
  company
}: AccountCompanyNotificationsUpdateButtonProps) {
  const activeNotifications = Object.keys(company.userNotifications).filter(
    notification => company.userNotifications[notification] === true
  );

  const [open, setIsOpen] = useState(false);

  const btnLabel = `Gérer (${activeNotifications.length})`;

  const iconId = activeNotifications.length
    ? "ri-notification-3-line"
    : "ri-notification-off-line";

  return (
    <>
      <NotificationsUpdateModal
        company={company}
        close={() => setIsOpen(false)}
        open={open}
      />
      <Button size="small" onClick={() => setIsOpen(true)} iconId={iconId}>
        {btnLabel}
      </Button>
    </>
  );
}
