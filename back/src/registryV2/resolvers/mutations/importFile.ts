import { prisma } from "@td/prisma";
import { getFileMetadata } from "@td/registry";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationImportFileArgs } from "@td/codegen-back";
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

  const importFileMetadata = await getFileMetadata(
    process.env.S3_REGISTRY_IMPORTS_BUCKET!,
    s3FileKey
  );

  if (!importFileMetadata) {
    throw new UserInputError(`Fichier "${s3FileKey}" non trouvé.`);
  }

  const originalFileName = importFileMetadata.Metadata?.filename;

  if (!originalFileName) {
    throw new UserInputError(
      `Nom de fichier manquant pour l'import "${s3FileKey}"`
    );
  }

  const registryImport = await prisma.registryImport.create({
    data: {
      type: importType,
      s3FileKey,
      createdById: user.id,
      originalFileName
    }
  });

  await enqueueRegistryImportToProcessJob({
    importId: registryImport.id,
    s3FileKey,
    importType
  });

  return registryImport;
}
