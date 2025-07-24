import { prisma } from "@td/prisma";
import { getSignedUrlForDownload } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryDownloadTexsAnalysisSignedUrlArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";

export async function registryDownloadTexsAnalysisSignedUrl(
  _,
  { fileId }: QueryRegistryDownloadTexsAnalysisSignedUrlArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const texsAnalysisFile =
    await prisma.registryTexsAnalysisFile.findUniqueOrThrow({
      where: { id: fileId },
      include: { registryIncomingTexs: true, registryOutgoingTexs: true }
    });

  if (texsAnalysisFile.createdById !== user.id) {
    const { registryIncomingTexs, registryOutgoingTexs } = texsAnalysisFile;
    const sirets = [
      registryIncomingTexs?.reportForCompanySiret,
      registryIncomingTexs?.reportAsCompanySiret,
      registryOutgoingTexs?.reportForCompanySiret,
      registryOutgoingTexs?.reportAsCompanySiret
    ].filter(Boolean);
    await checkUserPermissions(
      user,
      sirets,
      Permission.RegistryCanRead,
      `Vous n'êtes pas autorisé à lire ce fichier d'analyse des terres`
    );
  }

  const signedUrl = await getSignedUrlForDownload({
    bucketName: process.env.S3_TEXS_ANALYSIS_BUCKET!,
    key: texsAnalysisFile.s3FileKey
  });

  return { fileKey: texsAnalysisFile.s3FileKey, signedUrl };
}
