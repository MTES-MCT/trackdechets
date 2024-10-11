import { UserNotification, UserRole } from "@prisma/client";
import { ALL_NOTIFICATIONS } from "@td/constants";
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
export async function getDefaultNotifications(role: UserRole) {
  return role === UserRole.ADMIN ? ALL_NOTIFICATIONS : [];
}
