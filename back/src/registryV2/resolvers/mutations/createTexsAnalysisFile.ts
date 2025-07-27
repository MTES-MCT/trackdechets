import { prisma } from "@td/prisma";
import { getFileMetadata } from "@td/registry";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationCreateTexsAnalysisFileArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export async function createTexsAnalysisFile(
  _,
  { s3FileKey }: MutationCreateTexsAnalysisFileArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  await checkUserPermissions(
    user,
    userCompanies.map(company => company.orgId),
    Permission.RegistryCanImport,
    `Vous n'êtes pas autorisé à créer un fichier d'analyse des terres`
  );

  const fileMetadata = await getFileMetadata(
    process.env.S3_TEXS_ANALYSIS_BUCKET!,
    s3FileKey
  );

  if (!fileMetadata) {
    throw new UserInputError(`Fichier "${s3FileKey}" non trouvé.`);
  }

  const originalFileName = fileMetadata.Metadata?.filename;

  if (!originalFileName) {
    throw new UserInputError(
      `Nom de fichier manquant pour l'import "${s3FileKey}"`
    );
  }

  const texsAnalysisFile = await prisma.registryTexsAnalysisFile.create({
    data: {
      createdById: user.id,
      s3FileKey,
      originalFileName
    }
  });

  return texsAnalysisFile;
}
