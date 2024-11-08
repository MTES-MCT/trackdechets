import {
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PassThrough, Readable } from "node:stream";
import { envConfig } from "./config";

export const registryS3Client = new S3Client({
  endpoint: envConfig.S3_ENDPOINT,
  region: envConfig.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: envConfig.S3_ACCESS_KEY_ID,
    secretAccessKey: envConfig.S3_SECRET_ACCESS_KEY
  }
});

const SIGNED_URL_EXPIRES_IN = 60 * 10; // 10 minutes

export function getUploadWithWritableStream(
  bucketName: string,
  key: string,
  contentType?: string
): {
  s3Stream: PassThrough;
  upload: Upload;
} {
  const s3Stream = new PassThrough();

  const upload = new Upload({
    client: registryS3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: s3Stream,
      ContentType: contentType
    }
  });

  return { s3Stream, upload };
}

export async function getFileMetadata(bucketName: string, key: string) {
  const headCommand = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  try {
    const metadata = await registryS3Client.send(headCommand);
    return metadata;
  } catch (err) {
    if (err instanceof NotFound) {
      return undefined;
    }
    throw err;
  }
}

export async function getFileAsStream(bucketName: string, key: string) {
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  const { Body } = await registryS3Client.send(getCommand);
  return Body as Readable;
}

export async function getSignedUrlForUpload({
  bucketName,
  key,
  metadata,
  tags
}: {
  bucketName: string;
  key: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Metadata: metadata,
    Tagging: Object.entries({ ...tags, temp: true })
      .map(([key, value]) => `${key}=${value}`)
      .join("&")
  });

  const signedUrl = await getSignedUrl(registryS3Client, command, {
    expiresIn: SIGNED_URL_EXPIRES_IN,
    unhoistableHeaders: new Set(["x-amz-meta-filename"])
  });
  return signedUrl;
}

export async function getSignedUrlForDownload({
  bucketName,
  key
}: {
  bucketName: string;
  key: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${bucketName}_${key}"`
  });

  const signedUrl = await getSignedUrl(registryS3Client, command, {
    expiresIn: SIGNED_URL_EXPIRES_IN
  });
  return signedUrl;
}

export async function setFileAsNotTemporary(bucketName: string, key: string) {
  const putObjectTaggingCommand = new PutObjectTaggingCommand({
    Bucket: bucketName,
    Key: key,
    Tagging: {
      TagSet: [
        { Key: "temp", Value: "false" } // Change temp to "false"
      ]
    }
  });

  const response = await registryS3Client.send(putObjectTaggingCommand);
  return response;
}
