import { getSignedUrlForUpload } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryUploadSignedUrlArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export async function registryUploadSignedUrl(
  _,
  { fileName }: QueryRegistryUploadSignedUrlArgs,
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

  const fileKey = [Date.now(), user.id, fileName].join("_");

  const { url, fields } = await getSignedUrlForUpload({
    bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET!,
    key: fileKey,
    metadata: { filename: fileName },
    tags: { temp: "true", userId: user.id }
  });

  return { fileKey, signedUrl: url, fields };
}
