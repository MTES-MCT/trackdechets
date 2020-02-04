import { getPutSignedUrl } from "../../common/s3";
import { GraphQLContext } from "../../types";

export default async function createUploadLink(
  _,
  { fileName, fileType },
  context: GraphQLContext
) {
  const timestamp = new Date().getTime();
  const computedFileName = [context.user.id, timestamp, fileName].join("-");

  const url = await getPutSignedUrl(computedFileName, fileType);

  return {
    signedUrl: url,
    key: computedFileName
  };
}
