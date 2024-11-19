import { prisma } from "@td/prisma";
import { getSignedUrlForDownload } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryExportDownloadSignedUrlArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { ForbiddenError } from "../../../common/errors";
import { getRegistryFileName } from "../../filename";

export async function registryExportDownloadSignedUrl(
  _,
  { exportId }: QueryRegistryExportDownloadSignedUrlArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const registryExport = await prisma.registryExport.findUniqueOrThrow({
    where: {
      id: exportId,
      createdById: user.id
    },
    include: { createdBy: true }
  });

  const key = registryExport.s3FileKey;
  if (!key) {
    throw new ForbiddenError(
      "Cet export n'a pas de fichier à télécharger. Il est peut-être encore en cours ou a rencontré une erreur."
    );
  }
  const bucketName = process.env.S3_REGISTRY_EXPORTS_BUCKET!;
  const fileName = getRegistryFileName(
    registryExport.registryType ?? "ALL",
    registryExport.sirets,
    registryExport.createdAt
  );
  const signedUrl = await getSignedUrlForDownload({
    bucketName,
    key,
    fileName
  });

  return { fileKey: key, signedUrl };
}
