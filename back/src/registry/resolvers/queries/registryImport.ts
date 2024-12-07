import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryImportArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export async function registryImport(
  _,
  { id }: QueryRegistryImportArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  await checkUserPermissions(
    user,
    userCompanies.map(company => company.orgId),
    Permission.RegistryCanImport,
    `Vous n'êtes pas autorisé à importer des données dans le registre`
  );

  const registryImport = await prisma.registryImport.findUnique({
    where: { id, createdById: user.id },
    include: { createdBy: true, associations: true }
  });

  if (!registryImport) {
    throw new UserInputError(`Import de registre "${id}" non trouvé`);
  }

  return registryImport;
}
