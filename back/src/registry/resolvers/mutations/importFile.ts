import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationImportFileArgs } from "../../../generated/graphql/types";
import { Permission, checkUserPermissions } from "../../../permissions";
import { enqueueRegistryImportToProcessJob } from "../../../queue/producers/registryImport";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export async function importFile(
  _,
  { s3FileKey, importType }: MutationImportFileArgs,
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

  const registryImport = await prisma.registryImport.create({
    data: {
      type: importType,
      s3FileKey,
      createdById: user.id
    }
  });

  await enqueueRegistryImportToProcessJob({
    importId: registryImport.id,
    s3FileKey,
    importType
  });

  return registryImport;
}
