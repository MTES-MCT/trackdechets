import { UserNotification, UserRole } from "@prisma/client";
import { Recipient } from "@td/mail";
import { prisma } from "@td/prisma";

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

// Récupère la liste des des utilisateurs abonnés à un type
// de notification donnée au sein d'un ou plusieurs établissements
export async function getMailNotificationSubscribers(
  notification: UserNotification,
  orgIds: string[]
): Promise<Recipient[]> {
  const companies = await prisma.company.findMany({
    where: { orgId: { in: orgIds } },
    include: {
      companyAssociations: {
        where: {
          emailNotifications: { has: notification },
          user: {
            isActive: true
          }
        },
        include: {
          user: { select: { name: true, email: true } }
        }
      }
    }
  });

  return companies.flatMap(c => c.companyAssociations.map(a => a.user));
}
