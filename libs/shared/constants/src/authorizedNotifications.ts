export const ALL_NOTIFICATIONS = [
  "MEMBERSHIP_REQUEST",
  "REVISION_REQUEST",
  "BSD_REFUSAL",
  "SIGNATURE_CODE_RENEWAL",
  "BSDA_FINAL_DESTINATION_UPDATE"
];

// if you modify this structure, please modify
// in back/src/common/authorizedNotifications
// and front/src/common/authorizedNotifications
export const authorizedNotifications = {
  ADMIN: ALL_NOTIFICATIONS,
  MEMBER: [
    "REVISION_REQUEST",
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ],
  READER: [
    "REVISION_REQUEST",
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ],
  DRIVER: [
    "BSD_REFUSAL",
    "SIGNATURE_CODE_RENEWAL",
    "BSDA_FINAL_DESTINATION_UPDATE"
  ]
};
