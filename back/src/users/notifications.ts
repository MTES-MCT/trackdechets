import { CompanyAssociation, Prisma, UserRole } from "@prisma/client";
import { Recipient } from "@td/mail";
import { prisma } from "@td/prisma";
import {
  UserNotifications as GqlNotifications,
  UserNotificationsInput
} from "@td/codegen-ui";
import { safeInput } from "../common/converter";

// Notifications auxquelles un utilisateur peut s'abonner pour
// un établissement donné
export enum UserNotification {
  // Notification de demande de rattachement
  MEMBERSHIP_REQUEST = "MEMBERSHIP_REQUEST",
  // Notification de renouvellement du code signature
  SIGNATURE_CODE_RENEWAL = "SIGNATURE_CODE_RENEWAL",
  // Notifications en cas de refus total ou partiel d'un BSD
  BSD_REFUSAL = "BSD_REFUSAL",
  // Notification lors de la modification de la destination finale amiante
  BSDA_FINAL_DESTINATION_UPDATE = "BSDA_FINAL_DESTINATION_UPDATE",
  // Notification lors d'une demande de révision
  REVISION_REQUEST = "REVISION_REQUEST"
}

// Liste les champs qui permettent de contrôler les abonnements
// aux notifications sur le modèle `CompanyAssociation`
type notificationFields =
  | "notificationIsActiveMembershipRequest"
  | "notificationIsActiveSignatureCodeRenewal"
  | "notificationIsActiveBsdRefusal"
  | "notificationIsActiveRevisionRequest"
  | "notificationIsActiveBsdaFinalDestinationUpdate";

type PrismaNotifications = Pick<CompanyAssociation, notificationFields>;

/**
 * Construit un mapping entre les types de notifications et
 * les champs booléans du modèle `CompanyAssociation` qui
 * permettent d'activer ou de désactiver les notifications
 */
export const notificationToPrismaField: {
  [key in UserNotification]: keyof PrismaNotifications;
} = {
  [UserNotification.MEMBERSHIP_REQUEST]:
    "notificationIsActiveMembershipRequest",
  [UserNotification.SIGNATURE_CODE_RENEWAL]:
    "notificationIsActiveSignatureCodeRenewal",
  [UserNotification.BSD_REFUSAL]: "notificationIsActiveBsdRefusal",
  [UserNotification.REVISION_REQUEST]: "notificationIsActiveRevisionRequest",
  [UserNotification.BSDA_FINAL_DESTINATION_UPDATE]:
    "notificationIsActiveBsdaFinalDestinationUpdate"
};

/**
 * Construit un mapping entre les champs booléans du type
 * GraphQL `UserNotifications` et les types de notifications
 * définies en tant qu'enum dans le code
 */
export const gqlFieldToNotification: {
  [key in keyof GqlNotifications]: UserNotification;
} = {
  membershipRequest: UserNotification.MEMBERSHIP_REQUEST,
  signatureCodeRenewal: UserNotification.SIGNATURE_CODE_RENEWAL,
  bsdRefusal: UserNotification.BSD_REFUSAL,
  revisionRequest: UserNotification.REVISION_REQUEST,
  bsdaFinalDestinationUpdate: UserNotification.BSDA_FINAL_DESTINATION_UPDATE
};

/**
 * Renvoie les notififications auxquelles un utilisateur est abonné par
 * défaut lorsqu'il rejoint un établissement ou change de rôle
 */
export function getDefaultNotifications(role: UserRole): PrismaNotifications {
  const isActive = role === UserRole.ADMIN ? true : false;
  return {
    notificationIsActiveMembershipRequest: isActive,
    notificationIsActiveSignatureCodeRenewal: isActive,
    notificationIsActiveBsdRefusal: isActive,
    notificationIsActiveRevisionRequest: isActive,
    notificationIsActiveBsdaFinalDestinationUpdate: isActive
  };
}

/**
 * Convertit les champs booléans de notification du format Prisma
 * vers le format GraphQL (revient à enlever `notificationIsActive`
 * en début du nom des champs Prisma)
 */
export function toGqlNotifications(
  notifications: PrismaNotifications
): GqlNotifications {
  return {
    membershipRequest: notifications.notificationIsActiveMembershipRequest,
    revisionRequest: notifications.notificationIsActiveRevisionRequest,
    signatureCodeRenewal:
      notifications.notificationIsActiveSignatureCodeRenewal,
    bsdRefusal: notifications.notificationIsActiveBsdRefusal,
    bsdaFinalDestinationUpdate:
      notifications.notificationIsActiveBsdaFinalDestinationUpdate
  };
}

/**
 * Convertit l'input GraphQL UserNotificationsInput
 * en payload d'update Prisma
 */
export function toPrismaNotifications(
  notifications: UserNotificationsInput
): Prisma.CompanyAssociationUpdateInput {
  return safeInput({
    notificationIsActiveMembershipRequest:
      notifications.membershipRequest ?? undefined,
    notificationIsActiveRevisionRequest:
      notifications.revisionRequest ?? undefined,
    notificationIsActiveSignatureCodeRenewal:
      notifications.signatureCodeRenewal ?? undefined,
    notificationIsActiveBsdRefusal: notifications.bsdRefusal ?? undefined,
    notificationIsActiveBsdaFinalDestinationUpdate:
      notifications.bsdaFinalDestinationUpdate ?? undefined
  });
}

// if you modify this structure, please modify
// in front/src/common/notifications
export const authorizedNotificationsByRole = {
  [UserRole.ADMIN]: [
    UserNotification.MEMBERSHIP_REQUEST,
    UserNotification.REVISION_REQUEST,
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ],
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

// Inverse la structure précédente afin de renvoyer
// pour chaque notification les rôles autorisés
export const authorizedRolesByNotification: {
  [key in UserNotification]: UserRole[];
} = Object.entries(authorizedNotificationsByRole).reduce(
  (inverted, [role, notifications]) => {
    notifications.forEach(notification => {
      // Si la notification n'existe pas encore dans le mapping inversé, l'initialiser
      if (!inverted[notification]) {
        inverted[notification] = [];
      }
      // Ajouter le rôle à la liste des rôles autorisés pour cette notification
      inverted[notification].push(role as UserRole);
    });
    return inverted;
  },
  {} as {
    [key in UserNotification]: UserRole[];
  }
);

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
          [notificationToPrismaField[notification]]: true,
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
