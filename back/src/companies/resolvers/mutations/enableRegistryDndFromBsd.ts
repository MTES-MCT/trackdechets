import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  ForbiddenError,
  NotCompanyAdminErrorMsg
} from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../converters";
import { startOfDay, addDays } from "date-fns";

const enableRegistryDndFromBsdResolver: MutationResolvers["enableRegistryDndFromBsd"] =
  async (parent, args, context) => {
    const authStrategies = [AuthType.Session];
    applyAuthStrategies(context, authStrategies);
    const user = checkIsAuthenticated(context);
    const existingCompany = await getCompanyOrCompanyNotFound({ id: args.id });
    await checkUserPermissions(
      user,
      existingCompany.orgId,
      Permission.CompanyCanUpdate,
      NotCompanyAdminErrorMsg(existingCompany.orgId)
    );
    if (existingCompany.hasEnabledRegistryDndFromBsdSince) {
      throw new ForbiddenError(
        "Cette entreprise a déjà activé la traçabilité des déchets non dangereux dans le registre."
      );
    }
    const updatedCompany = await prisma.company.update({
      where: { id: existingCompany.id },
      data: {
        hasEnabledRegistryDndFromBsdSince: addDays(startOfDay(new Date()), 1)
      }
    });
    return toGqlCompanyPrivate(updatedCompany);
  };

export default enableRegistryDndFromBsdResolver;
