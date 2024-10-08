import { CompanyPrivate, UserNotification } from "@td/codegen-ui";
import React from "react";

type AccountCompanyNotificationsProps = {
  company: CompanyPrivate;
};

const notificationLabels: { [key in UserNotification]: string } = {
  [UserNotification.MembershipRequest]: "Rattachement",
  [UserNotification.SignatureCodeRenewal]: "Code signature",
  [UserNotification.BsdRefusal]: "Refus",
  [UserNotification.BsdaFinalDestinationUpdate]: "Destination finale amiante",
  [UserNotification.RevisionRequest]: "Révision"
};

export function AccountCompanyNotifications({
  company
}: AccountCompanyNotificationsProps) {
  if (!company.userNotifications || company.userNotifications.length === 0) {
    return <div>Désactivé</div>;
  }
  return (
    <div>
      {company.userNotifications.map(n => notificationLabels[n]).join(", ")}
    </div>
  );
}
