import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryExportArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

export async function registryExport(
  _,
  { id }: QueryRegistryExportArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const registryExport = await prisma.registryExport.findUnique({
    where: {
      id,
      createdById: user.id
    },
    include: { createdBy: true }
  });

  if (!registryExport) {
    throw new UserInputError(`Export de registre "${id}" non trouvé`);
  }

  return registryExport;
}
