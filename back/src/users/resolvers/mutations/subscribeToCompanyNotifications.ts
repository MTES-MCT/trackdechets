import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { NotCompanyMember, UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import {
  MutationResolvers,
  UserNotificationsInput
} from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { toGqlCompanyPrivate } from "../../../companies/converters";
import {
  authorizedNotificationsByRole,
  toPrismaNotifications,
  UserNotification
} from "../../notifications";

function activeNotifications(
  notifications: UserNotificationsInput
): UserNotification[] {
  return [
    {
      name: UserNotification.MEMBERSHIP_REQUEST,
      isActive: notifications.membershipRequest
    },
    {
      name: UserNotification.SIGNATURE_CODE_RENEWAL,
      isActive: notifications.signatureCodeRenewal
    },
    {
      name: UserNotification.BSD_REFUSAL,
      isActive: notifications.bsdRefusal
    },
    {
      name: UserNotification.BSDA_FINAL_DESTINATION_UPDATE,
      isActive: notifications.bsdaFinalDestinationUpdate
    },
    {
      name: UserNotification.REVISION_REQUEST,
      isActive: notifications.revisionRequest
    },
    {
      name: UserNotification.REGISTRY_DELEGATION,
      isActive: notifications.registryDelegation
    }
  ]
    .filter(n => n.isActive)
    .map(n => n.name);
}

const subscribeToCompanyNotificationsResolver: MutationResolvers["subscribeToCompanyNotifications"] =
  async (parent, args, context: GraphQLContext) => {
    applyAuthStrategies(context, [AuthType.Session]);

    const { companyOrgId, notifications } = args.input;

    const user = checkIsAuthenticated(context);

    const company = await getCompanyOrCompanyNotFound({ orgId: companyOrgId });

    const companyAssociation = await prisma.companyAssociation.findFirst({
      where: { companyId: company.id, userId: user.id }
    });

    if (!companyAssociation) {
      throw new NotCompanyMember(company.orgId);
    }

    const subscribeTo = activeNotifications(notifications);

    const unauthorizedNotifications = subscribeTo.filter(
      notification =>
        !authorizedNotificationsByRole[companyAssociation.role].includes(
          notification
        )
    );

    if (unauthorizedNotifications.length) {
      throw new UserInputError(
        "Votre rôle au sein de l'établissement ne vous permet pas de recevoir " +
          `les notifications de type ${unauthorizedNotifications.join(", ")}`
      );
    }

    const updatedCompanyAssociation = await prisma.companyAssociation.update({
      where: { id: companyAssociation.id },
      data: toPrismaNotifications(notifications),
      include: { company: true }
    });

    return toGqlCompanyPrivate(updatedCompanyAssociation.company);
  };

export default subscribeToCompanyNotificationsResolver;
