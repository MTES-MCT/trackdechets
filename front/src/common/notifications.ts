import { UserNotification, UserRole } from "@td/codegen-ui";

// if you modify this structure, please modify
// in back/src/users/notifications
export const ALL_NOTIFICATIONS: UserNotification[] = [
  UserNotification.MembershipRequest,
  UserNotification.RevisionRequest,
  UserNotification.BsdRefusal,
  UserNotification.SignatureCodeRenewal,
  UserNotification.BsdaFinalDestinationUpdate
];

// if you modify this structure, please modify
// in back/src/users/notifications
export const authorizedNotifications = {
  [UserRole.Admin]: ALL_NOTIFICATIONS,
  [UserRole.Member]: [
    UserNotification.RevisionRequest,
    UserNotification.BsdRefusal,
    UserNotification.SignatureCodeRenewal,
    UserNotification.BsdaFinalDestinationUpdate
  ],
  [UserRole.Reader]: [
    UserNotification.RevisionRequest,
    UserNotification.BsdRefusal,
    UserNotification.SignatureCodeRenewal,
    UserNotification.BsdaFinalDestinationUpdate
  ],
  [UserRole.Driver]: [
    UserNotification.BsdRefusal,
    UserNotification.SignatureCodeRenewal,
    UserNotification.BsdaFinalDestinationUpdate
  ]
};
