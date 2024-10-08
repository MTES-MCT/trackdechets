import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { NotCompanyMember, UserInputError } from "../../../common/errors";

import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getCompanyOrCompanyNotFound,
  userAssociationToCompanyMember
} from "../../../companies/database";
import {
  CompanyMember,
  MutationResolvers
} from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { authorizedNotifications } from "@td/constants";

const updateEmailNotificationsResolver: MutationResolvers["updateEmailNotifications"] =
  async (parent, args, context: GraphQLContext): Promise<CompanyMember> => {
    applyAuthStrategies(context, [AuthType.Session]);

    const { companyOrgId, emailNotifications } = args.input;

    const user = checkIsAuthenticated(context);

    const company = await getCompanyOrCompanyNotFound({ orgId: companyOrgId });

    const companyAssociation = await prisma.companyAssociation.findFirst({
      where: { companyId: company.id, userId: user.id }
    });

    if (!companyAssociation) {
      throw new NotCompanyMember(company.orgId);
    }

    const unauthorizedNotifications = emailNotifications.filter(
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
      data: { emailNotifications },
      include: { user: true }
    });

    return userAssociationToCompanyMember(
      updatedCompanyAssociation,
      company.orgId
    );
  };
export default updateEmailNotificationsResolver;
