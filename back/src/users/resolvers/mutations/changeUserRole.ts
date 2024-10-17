import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";

import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getCompanyOrCompanyNotFound,
  userAccountHashToCompanyMember,
  userAssociationToCompanyMember
} from "../../../companies/database";
import {
  CompanyMember,
  MutationResolvers,
  UserRole
} from "../../../generated/graphql/types";
import {
  checkUserIsAdminOrPermissions,
  Permission
} from "../../../permissions";
import {
  updateCompanyAssociation,
  updateUserAccountHash
} from "../../database";
import { ALL_NOTIFICATIONS } from "../../notifications";

const changeUserRoleResolver: MutationResolvers["changeUserRole"] = async (
  parent,
  args: { userId: string; orgId: string; role: UserRole },
  context: GraphQLContext
): Promise<CompanyMember> => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId: args.orgId });

  const isTDAdmin = await checkUserIsAdminOrPermissions(
    user,
    company.orgId,
    Permission.CompanyCanManageMembers,
    NotCompanyAdminErrorMsg(company.orgId)
  );

  const association = await prisma.companyAssociation.findFirst({
    where: { company: { orgId: args.orgId }, userId: args.userId }
  });
  if (association) {
    if (args.role === association.role) {
      // Évite de faire l'update si le rôle est inchangé
      return userAssociationToCompanyMember(
        { ...association, user },
        company.orgId,
        user.id,
        isTDAdmin
      );
    }

    const updatedAssociation = await updateCompanyAssociation({
      associationId: association.id,
      data: {
        role: args.role,
        notifications: args.role === "ADMIN" ? ALL_NOTIFICATIONS : []
      }
    });

    if (!updatedAssociation) {
      throw new UserInputError(
        `L'utilisateur n'est pas membre de l'entreprise`
      );
    }
    return userAssociationToCompanyMember(
      updatedAssociation,
      company.orgId,
      user.id,
      isTDAdmin
    );
  }

  const userAccountHash = await prisma.userAccountHash.findUnique({
    where: {
      id: args.userId,
      companySiret: args.orgId,
      acceptedAt: null
    },
    select: {
      id: true
    }
  });
  if (!userAccountHash) {
    throw new UserInputError(
      `L'utilisateur ${args.userId} n'existe pas ou ne fait pas partie de l'établissement ${args.orgId}`
    );
  }
  const updatedUserAccountHash = await updateUserAccountHash({
    userId: userAccountHash.id,
    data: {
      role: args.role
    }
  });
  if (!updatedUserAccountHash) {
    throw new UserInputError(
      `L'utilisateur ${args.userId} n'existe pas ou ne fait pas partie de l'établissement ${args.orgId}`
    );
  }
  return userAccountHashToCompanyMember(updatedUserAccountHash, company.orgId);
};
export default changeUserRoleResolver;
