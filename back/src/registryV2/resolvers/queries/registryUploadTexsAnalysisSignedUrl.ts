import { getSignedUrlForUpload, validateAndGetContentType } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryUploadTexsAnalysisSignedUrlArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { ForbiddenError } from "../../../common/errors";

export async function registryUploadTexsAnalysisSignedUrl(
  _,
  { fileName }: QueryRegistryUploadTexsAnalysisSignedUrlArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  await checkUserPermissions(
    user,
    userCompanies.map(company => company.orgId),
    Permission.RegistryCanImport,
    `Vous n'êtes pas autorisé à ajouter des fichiers d'analyse des terres`
  );

  const fileKey = [Date.now(), user.id, fileName].join("_");
  // Validate file type and get content type
  const contentType = validateAndGetContentType(fileName);
  if (!contentType) {
    throw new ForbiddenError(
      `Type de fichier non autorisé. Seuls les fichiers CSV (.csv) et Excel (.xlsx/.xls) sont acceptés.`
    );
  }

  const { url, fields } = await getSignedUrlForUpload({
    bucketName: process.env.S3_TEXS_ANALYSIS_BUCKET!,
    key: fileKey,
    metadata: { filename: fileName },
    tags: { userId: user.id },
    contentType
  });

  return { fileKey, signedUrl: url, fields };
}
