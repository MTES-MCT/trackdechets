import { Company } from "@td/prisma";
import type { RegistryCompanyResolvers } from "@td/codegen-back";
import { getUserRole, grants, toGraphQLPermission } from "../../permissions";
import { GraphQLContext } from "../../types";

export const RegistryCompany: RegistryCompanyResolvers<
  GraphQLContext,
  Company
> = {
  userPermissions: async (parent, _, context) => {
    const role = await getUserRole(context.user!.id, parent.orgId);
    return role ? grants[role].map(toGraphQLPermission) : [];
  }
};
