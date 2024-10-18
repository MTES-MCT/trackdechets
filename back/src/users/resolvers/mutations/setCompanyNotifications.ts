import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { NotCompanyMember, UserInputError } from "../../../common/errors";

import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { toGqlCompanyPrivate } from "../../../companies/converters";
import {
  authorizedNotifications,
  toPrismaNotifications,
  UserNotification
} from "../../notifications";
import { UserNotificationsInput } from "@td/codegen-ui";

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
    }
  ]
    .filter(n => n.isActive)
    .map(n => n.name);
}

const setCompanyNotificationsResolver: MutationResolvers["setCompanyNotifications"] =
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
        !authorizedNotifications[companyAssociation.role].includes(notification)
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
export default setCompanyNotificationsResolver;
