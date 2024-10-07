import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getCompanyAssociationOrNotFound } from "../../database";
import { deleteCachedUserRoles } from "../../../common/redis/users";
import {
  checkUserIsAdminOrPermissions,
  Permission
} from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const removeUserFromCompanyResolver: MutationResolvers["removeUserFromCompany"] =
  async (parent, { userId, siret }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound({ orgId: siret });
    await checkUserIsAdminOrPermissions(
      user,
      company.orgId,
      Permission.CompanyCanManageMembers,
      NotCompanyAdminErrorMsg(company.orgId)
    );
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

    return toGqlCompanyPrivate(dbCompany!);
  };

export default removeUserFromCompanyResolver;
