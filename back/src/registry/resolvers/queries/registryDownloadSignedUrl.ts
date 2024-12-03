import { prisma } from "@td/prisma";
import { getSignedUrlForDownload } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryDownloadSignedUrlArgs } from "../../../generated/graphql/types";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";

export async function registryDownloadSignedUrl(
  _,
  { importId, target }: QueryRegistryDownloadSignedUrlArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const registryImport = await prisma.registryImport.findUniqueOrThrow({
    where: { id: importId },
    include: { associations: true }
  });

  // If an import failed, it has no associations. Only its owner can see the error file
  if (registryImport.createdById !== user.id) {
    const sirets = registryImport.associations
      .map(a => [a.reportedFor, a.reportedAs])
      .flat();
    await checkUserPermissions(
      user,
      sirets,
      Permission.RegistryCanRead,
      `Vous n'êtes pas autorisé à lire les données de ce registre`
    );
  }

  const bucketName =
    target === "ERROR_FILE"
      ? process.env.S3_REGISTRY_ERRORS_BUCKET!
      : process.env.S3_REGISTRY_IMPORTS_BUCKET!;

  const signedUrl = await getSignedUrlForDownload({
    bucketName,
    key: registryImport.s3FileKey
  });

  return { fileKey: registryImport.s3FileKey, signedUrl };
}
