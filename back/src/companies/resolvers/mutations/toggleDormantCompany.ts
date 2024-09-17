import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { companyEventTypes } from "../../types";

const toggleDormantCompanyResolver: MutationResolvers["toggleDormantCompany"] =
  async (_, { id }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound(
      { id },
      { orgId: true, isDormantSince: true }
    );

    await checkUserPermissions(
      user,
      company.orgId,
      Permission.CompanyCanUpdate,
      NotCompanyAdminErrorMsg(company.orgId)
    );

    const isDormantSince = company.isDormantSince ? null : new Date();

    await prisma.$transaction(async transaction => {
      await transaction.event.create({
        data: {
          streamId: company.orgId,
          actor: user.id,
          type: companyEventTypes.toggleDormantCompany,
          data: { isDormantSince },
          metadata: { authType: user.auth }
        }
      });

      await transaction.company.update({
        where: { id },
        data: { isDormantSince }
      });
    });

    return true;
  };

export default toggleDormantCompanyResolver;
