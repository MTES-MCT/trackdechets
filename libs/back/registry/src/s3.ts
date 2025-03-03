import {
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectTaggingCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
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
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function getUploadWithWritableStream({
  bucketName,
  key,
  contentType,
  metadata
}: {
  bucketName: string;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
}): {
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
      Metadata: metadata,
      ContentType: contentType,
      ContentEncoding: "utf-8"
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
  const metadataFields = metadata
    ? Object.entries(metadata).map(([key, value]) => ({
        [`x-amz-meta-${key}`]: value
      }))
    : [];
  const taggingField = {
    "x-amz-tagging": Object.entries({ ...tags, temp: true })
      .map(([key, value]) => `${key}=${value}`)
      .join("&")
  };

  // We use a presigned post as it supports POST policy conditions
  // that allow us to limit the file size
  const { url, fields } = await createPresignedPost(registryS3Client, {
    Bucket: bucketName,
    Key: key,
    Expires: SIGNED_URL_EXPIRES_IN,
    Conditions: [
      ["content-length-range", 0, MAX_FILE_SIZE],
      ...metadataFields,
      taggingField
    ],
    Fields: {
      ...metadataFields.reduce((acc, field) => ({ ...acc, ...field }), {}),
      ...taggingField
    }
  });
  return { url, fields };
}

export async function getSignedUrlForDownload({
  bucketName,
  key,
  fileName
}: {
  bucketName: string;
  key: string;
  fileName?: string;
}) {
  const metadataResponse = await getFileMetadata(bucketName, key);
  const metadataFileName = metadataResponse?.Metadata?.filename;

  const computedFileName =
    fileName ?? metadataFileName ?? `${bucketName}_${key}`;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${computedFileName}"`
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
