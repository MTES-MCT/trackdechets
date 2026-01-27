import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
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
import type {
  CompanyMember,
  MutationResolvers,
  UserRole
} from "@td/codegen-back";
import {
  checkUserIsAdminOrPermissions,
  Permission
} from "../../../permissions";
import {
  updateCompanyAssociation,
  updateUserAccountHash
} from "../../database";
import { getDefaultNotifications } from "../../notifications";
import { deleteCachedUserRoles } from "../../../common/redis/users";

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
        ...getDefaultNotifications(args.role)
      }
    });

    if (!updatedAssociation) {
      throw new UserInputError(
        `L'utilisateur n'est pas membre de l'entreprise`
      );
    }

    const assocationToComp = await userAssociationToCompanyMember(
      updatedAssociation,
      company.orgId,
      user.id,
      isTDAdmin
    );

    // Clear cache
    await deleteCachedUserRoles(args.userId);

    return assocationToComp;
  }

  const userAccountHash = await prisma.userAccountHash.findFirst({
    where: {
      id: args.userId,
      companySiret: args.orgId,
      acceptedAt: null,
      expiresAt: { gte: new Date() }
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
