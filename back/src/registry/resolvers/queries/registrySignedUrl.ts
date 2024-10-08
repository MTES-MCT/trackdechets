import { getSignedUrlForUpload } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistrySignedUrlArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

export async function registrySignedUrl(
  _,
  { fileName }: QueryRegistrySignedUrlArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const fileKey = [Date.now(), user.id, fileName].join("_");

  const signedUrl = await getSignedUrlForUpload({
    bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET!,
    key: fileKey,
    metadata: { fileName },
    tags: { temp: "true", userId: user.id }
  });

  return { fileKey, signedUrl };
}
