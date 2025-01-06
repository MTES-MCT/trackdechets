import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryV2ExportArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";

export async function registryV2Export(
  _,
  { id }: QueryRegistryV2ExportArgs,
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
