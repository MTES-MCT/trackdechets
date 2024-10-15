import { UserRole, UserNotification } from "@prisma/client";

export const ALL_NOTIFICATIONS = [
  UserNotification.MEMBERSHIP_REQUEST,
  UserNotification.REVISION_REQUEST,
  UserNotification.BSD_REFUSAL,
  UserNotification.SIGNATURE_CODE_RENEWAL,
  UserNotification.BSDA_FINAL_DESTINATION_UPDATE
];

export const authorizedNotifications = {
  [UserRole.ADMIN]: ALL_NOTIFICATIONS,
  [UserRole.MEMBER]: [
    UserNotification.REVISION_REQUEST,
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ],
  [UserRole.READER]: [
    UserNotification.REVISION_REQUEST,
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ],
  [UserRole.DRIVER]: [
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ]
};
