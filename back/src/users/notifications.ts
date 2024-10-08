import { UserNotification } from "@prisma/client";
import { Recipient } from "@td/mail";
import { prisma } from "@td/prisma";

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
