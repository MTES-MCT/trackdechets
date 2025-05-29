import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryExhaustiveExportArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";

export async function registryExhaustiveExport(
  _,
  { id }: QueryRegistryExhaustiveExportArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const registryExport = await prisma.registryExhaustiveExport.findUnique({
    where: {
      id,
      createdById: user.id
    },
    include: { createdBy: true }
  });

  if (!registryExport) {
    throw new UserInputError(`Export de registre exhaustif "${id}" non trouvé`);
  }

  return registryExport;
}
