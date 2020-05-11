import { getPutSignedUrl } from "../../common/s3";
import { MutationCreateUploadLinkArgs } from "../../generated/graphql/types";

export default async function createUploadLink(
  userId: string,
  { fileName, fileType }: MutationCreateUploadLinkArgs
) {
  const timestamp = new Date().getTime();
  const computedFileName = [userId, timestamp, fileName].join("-");

  const url = await getPutSignedUrl(computedFileName, fileType);

  return {
    signedUrl: url,
    key: computedFileName
  };
}
