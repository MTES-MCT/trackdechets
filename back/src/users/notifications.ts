import { UserNotification, UserRole } from "@prisma/client";
import { Recipient } from "@td/mail";
import { prisma } from "@td/prisma";

// Récupère la liste des des utilisateurs abonnés à un type
// de notification donnée au sein d'un ou plusieurs établissements
export async function getNotificationSubscribers(
  notification: UserNotification,
  orgIds: string[]
): Promise<Recipient[]> {
  const companies = await prisma.company.findMany({
    where: { orgId: { in: orgIds } },
    include: {
      companyAssociations: {
        where: {
          notifications: { has: notification },
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

/**
 * Renvoie les notififications auxquelles un utilisateur est abonné par
 * défaut lorsqu'il rejoint un établissement ou change de rôle
 */
export function getDefaultNotifications(role: UserRole) {
  return role === UserRole.ADMIN ? ALL_NOTIFICATIONS : [];
}

// if you modify this structure, please modify
// in front/src/common/notifications
export const ALL_NOTIFICATIONS: UserNotification[] = [
  UserNotification.MEMBERSHIP_REQUEST,
  UserNotification.REVISION_REQUEST,
  UserNotification.BSD_REFUSAL,
  UserNotification.SIGNATURE_CODE_RENEWAL,
  UserNotification.BSDA_FINAL_DESTINATION_UPDATE
];

// if you modify this structure, please modify
// in front/src/common/notifications
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
  DRIVER: [
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ]
};
