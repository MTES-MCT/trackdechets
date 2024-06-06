import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  checkIsAdmin,
  checkIsAuthenticated
} from "../../../common/permissions";
import {
  convertUrls,
  getCompanyOrCompanyNotFound
} from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getCompanyAssociationOrNotFound } from "../../database";
import { deleteCachedUserRoles } from "../../../common/redis/users";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";

const removeUserFromCompanyResolver: MutationResolvers["removeUserFromCompany"] =
  async (parent, { userId, siret }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound({ orgId: siret });
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
    const companyAssociation = await getCompanyAssociationOrNotFound({
      user: { id: userId },
      company: { id: company.id }
    });
    await prisma.companyAssociation.delete({
      where: { id: companyAssociation.id }
    });

    // clear cache
    await deleteCachedUserRoles(userId);

    const dbCompany = await prisma.company.findUnique({
      where: { orgId: siret }
    });

    return convertUrls(dbCompany!);
  };

export default removeUserFromCompanyResolver;
