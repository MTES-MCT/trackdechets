import React, { useState } from "react";
import Button from "@codegouvfr/react-dsfr/Button";
import { CompanyPrivate, User } from "@td/codegen-ui";
import NotificationsUpdateModal from "./NotificationsUpdateModal";

type AccountCompanyNotificationsUpdateButtonProps = {
  company: CompanyPrivate;
  me: Pick<User, "email">;
};

export default function NotificationsUpdateButton({
  company,
  me
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
      {open && (
        <NotificationsUpdateModal
          company={company}
          me={me}
          close={() => setIsOpen(false)}
          open={open}
        />
      )}
      <Button size="small" onClick={() => setIsOpen(true)} iconId={iconId}>
        {btnLabel}
      </Button>
    </>
  );
}
