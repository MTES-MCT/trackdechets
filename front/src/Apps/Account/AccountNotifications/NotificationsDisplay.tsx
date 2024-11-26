import Badge from "@codegouvfr/react-dsfr/Badge";
import {
  CompanyMember,
  CompanyPrivate,
  UserNotifications
} from "@td/codegen-ui";
import React from "react";

type AccountCompanyNotificationsProps = {
  company: CompanyPrivate;
};

function getNotificationLabels(notifications: UserNotifications) {
  const labels = [
    {
      value: "Rattachement",
      isActive: notifications.membershipRequest
    },
    { value: "Code signature", isActive: notifications.signatureCodeRenewal },
    { value: "Refus", isActive: notifications.bsdRefusal },
    {
      value: "Destination finale amiante",
      isActive: notifications.bsdaFinalDestinationUpdate
    },
    { value: "Revision", isActive: notifications.revisionRequest }
  ];
  return labels
    .filter(l => l.isActive)
    .map(l => l.value)
    .join(", ");
}

/**
 * Renvoie le nombre de notifications sans aucun abonné
 */
function withoutSubscribersCount(users: CompanyMember[]) {
  const subscribersCount = {
    membershipRequest: 0,
    signatureCodeRenewal: 0,
    bsdRefusal: 0,
    bsdaFinalDestinationUpdate: 0,
    revisionRequest: 0,
    registryDelegation: 0
  };
  for (const user of users) {
    if (user.notifications.membershipRequest) {
      subscribersCount.membershipRequest =
        subscribersCount.membershipRequest + 1;
    }
    if (user.notifications.signatureCodeRenewal) {
      subscribersCount.signatureCodeRenewal =
        subscribersCount.signatureCodeRenewal + 1;
    }
    if (user.notifications.bsdRefusal) {
      subscribersCount.bsdRefusal = subscribersCount.bsdRefusal + 1;
    }
    if (user.notifications.bsdaFinalDestinationUpdate) {
      subscribersCount.bsdaFinalDestinationUpdate =
        subscribersCount.bsdaFinalDestinationUpdate + 1;
    }
    if (user.notifications.revisionRequest) {
      subscribersCount.revisionRequest = subscribersCount.revisionRequest + 1;
    }
    if (user.notifications.registryDelegation) {
      subscribersCount.registryDelegation =
        subscribersCount.registryDelegation + 1;
    }
  }

  const withoutSubscribers = Object.values(subscribersCount).reduce(
    (acc, count) => {
      if (count < 1) {
        return acc + 1;
      }
      return acc;
    },
    0
  );

  return withoutSubscribers;
}

export function NotificationsDisplay({
  company
}: AccountCompanyNotificationsProps) {
  const hasSome = Object.keys(company.userNotifications).some(
    notification => company.userNotifications[notification] === true
  );

  const labels = hasSome
    ? getNotificationLabels(company.userNotifications)
    : "Désactivé";

  const withoutSubscribers = withoutSubscribersCount(company.users ?? []);
  const badgeLabel = `${withoutSubscribers} ${
    withoutSubscribers > 1 ? "notifications" : "notification"
  } sans abonné`;
  return (
    <>
      <div>{labels}</div>
      {withoutSubscribers > 0 && (
        <Badge small severity="warning">
          {badgeLabel}
        </Badge>
      )}
    </>
  );
}
