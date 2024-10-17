import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { NotCompanyMember, UserInputError } from "../../../common/errors";

import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { toGqlCompanyPrivate } from "../../../companies/converters";
import { authorizedNotifications } from "../../notifications";

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

    const unauthorizedNotifications = notifications.filter(
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
      data: { notifications },
      include: { company: true }
    });

    return toGqlCompanyPrivate(updatedCompanyAssociation.company);
  };
export default setCompanyNotificationsResolver;
