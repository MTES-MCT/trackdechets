import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  authorizedRolesByNotification,
  gqlFieldToNotification,
  toPrismaNotifications
} from "../../notifications";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const subscribeToNotificationsResolver: MutationResolvers["subscribeToNotifications"] =
  async (parent, args, context: GraphQLContext) => {
    applyAuthStrategies(context, [AuthType.Session]);

    const user = checkIsAuthenticated(context);

    const { notifications } = args.input;

    for (const [notification, isActive] of Object.entries(notifications)) {
      const data = toPrismaNotifications({ [notification]: isActive });

      if (isActive === true) {
        await prisma.companyAssociation.updateMany({
          where: {
            userId: user.id,
            role: {
              // on active la notification uniquement sur les
              // établissements sur lesquelles l'utilisateur à un
              // rôle qui le lui permet
              in: authorizedRolesByNotification[
                gqlFieldToNotification[notification]
              ]
            }
          },
          data
        });
      } else if (isActive === false) {
        await prisma.companyAssociation.updateMany({
          where: { userId: user.id },
          data
        });
      }
    }

    const companyAssociations = await prisma.companyAssociation.findMany({
      where: { userId: user.id },
      include: { company: true }
    });

    return companyAssociations.map(a => toGqlCompanyPrivate(a.company));
  };

export default subscribeToNotificationsResolver;
