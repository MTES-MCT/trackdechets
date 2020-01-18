import * as S3 from "aws-sdk/clients/s3";

const s3 = new S3({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  signatureVersion: "v4"
});

export async function getPutSignedUrl(fileName: string, fileType: string) {
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: "private"
  };

  return await s3.getSignedUrlPromise("putObject", s3Params);
}
