import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryExportArgs } from "../../../generated/graphql/types";
import { Permission, can } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export async function registryExport(
  _,
  { id }: QueryRegistryExportArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  const authorizedOrgIds: string[] = [];
  const orgIds = userCompanies.map(company => company.orgId);
  const userRoles = await context.dataloaders.userRoles.load(user.id);

  for (const orgId of orgIds) {
    if (!user.isAdmin) {
      if (
        Object.keys(userRoles).includes(orgId) &&
        can(userRoles[orgId], Permission.RegistryCanRead)
      ) {
        authorizedOrgIds.push(orgId);
      }
    } else {
      authorizedOrgIds.push(orgId);
    }
  }

  const registryExport = await prisma.registryExport.findUnique({
    where: {
      id,
      OR: [
        {
          sirets: { hasSome: authorizedOrgIds }
        },
        { delegateSiret: { in: authorizedOrgIds } }
      ]
    },
    include: { createdBy: true }
  });

  if (!registryExport) {
    throw new UserInputError(`Export de registre "${id}" non trouvé`);
  }

  return registryExport;
}
