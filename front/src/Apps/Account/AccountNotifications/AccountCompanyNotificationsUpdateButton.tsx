import React from "react";
import Button from "@codegouvfr/react-dsfr/Button";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { CompanyPrivate } from "@td/codegen-ui";
import AccountCompanyNotificationsUpdateModal from "./AccountCompanyNotificationsUpdateModal";

type AccountCompanyNotificationsUpdateButtonProps = {
  company: CompanyPrivate;
};

export default function AccountCompanyNotificationsUpdateButton({
  company
}: AccountCompanyNotificationsUpdateButtonProps) {
  const btnLabel = company.userNotifications?.length
    ? `Gérer les notifications (${company.userNotifications.length})`
    : "S'abonner";
  const modalTitle = `Gérer les notifications`;

  const iconId = company.userNotifications?.length
    ? "ri-notification-3-line"
    : "ri-notification-off-line";

  const modal = createModal({
    id: `Notifications ${company.orgId}`,
    isOpenedByDefault: false
  });

  return (
    <>
      <modal.Component title={modalTitle}>
        <AccountCompanyNotificationsUpdateModal
          company={company}
          close={modal.close}
        />
      </modal.Component>
      <Button size="small" onClick={() => modal.open()} iconId={iconId}>
        {btnLabel}
      </Button>
    </>
  );
}
