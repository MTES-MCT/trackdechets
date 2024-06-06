import { GraphQLContext } from "../../../types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";

import {
  checkIsAdmin,
  checkIsAuthenticated
} from "../../../common/permissions";
import {
  getCompanyOrCompanyNotFound,
  userNameDisplay
} from "../../../companies/database";
import {
  CompanyMember,
  MutationResolvers,
  UserRole
} from "../../../generated/graphql/types";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  getCompanyAssociationOrNotFound,
  getUserAccountHashOrNotFound,
  updateCompanyAssociation,
  updateUserAccountHash
} from "../../database";

const changeUserRoleResolver: MutationResolvers["changeUserRole"] = async (
  parent,
  args: { userId: string; siret: string; role: UserRole },
  context: GraphQLContext
): Promise<CompanyMember> => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId: args.siret });
  let isTDAdmin = false;
  try {
    isTDAdmin = !!checkIsAdmin(context);
  } catch (error) {
    // do nothing
  }
  try {
    await checkUserPermissions(
      user,
      company.orgId,
      Permission.CompanyCanManageMembers,
      NotCompanyAdminErrorMsg(company.orgId)
    );
  } catch (error) {
    if (!isTDAdmin) {
      throw error;
    }
  }

  try {
    const association = await getCompanyAssociationOrNotFound({
      company: {
        orgId: args.siret
      },
      userId: args.userId
    });
    const updatedAssociation = await updateCompanyAssociation({
      associationId: association.id,
      data: {
        role: args.role
      }
    });
    if (!updatedAssociation) {
      throw new UserInputError(
        `L'utilisateur n'est pas membre de l'entreprise`
      );
    }
    return {
      ...updatedAssociation.user,
      orgId: company.orgId,
      name: userNameDisplay(updatedAssociation, user.id, isTDAdmin),
      role: updatedAssociation.role,
      isPendingInvitation: false
    };
  } catch (error) {
    //do nothing
  }
  const userAccountHash = await getUserAccountHashOrNotFound({
    id: args.userId,
    companySiret: args.siret,
    acceptedAt: null
  });

  const updatedUserAccountHash = await updateUserAccountHash({
    userId: userAccountHash.id,
    data: {
      role: args.role
    }
  });
  if (!updatedUserAccountHash) {
    throw new UserInputError(`L'utilisateur n'existe pas`);
  }
  return {
    id: updatedUserAccountHash.id,
    orgId: company.orgId,
    name: "Invité",
    email: updatedUserAccountHash.email,
    role: updatedUserAccountHash.role,
    isActive: false,
    isPendingInvitation: true
  };
};
export default changeUserRoleResolver;
