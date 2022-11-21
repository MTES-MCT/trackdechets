import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Request, Response } from "express";
import { createWriteStream } from "fs";
import v8 from "v8";
import logger from "./logger";

export async function heapSnapshotToS3Router(req: Request, res: Response) {
  if (process.env.DEBUG_HEAPDUMP !== "active") {
    return res.send("Inactive");
  }
  const snapshotStream = v8.getHeapSnapshot();
  // It's important that the filename end with `.heapsnapshot`,
  // otherwise Chrome DevTools won't open it.
  const fileName = `${process.env.DD_ENV}_${
    process.env.CONTAINER
  }_${Date.now()}.heapsnapshot`;
  const fileStream = createWriteStream(fileName);
  snapshotStream.pipe(fileStream);

  res.send(fileName);
  res.status(202);

  try {
    const parallelUploads3 = new Upload({
      client: new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
      }),
      params: {
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
        Body: snapshotStream
      },
      leavePartsOnError: false
    });

    parallelUploads3.on("httpUploadProgress", progress => {
      logger.info(progress);
    });

    await parallelUploads3.done();
  } catch (e) {
    logger.error("Error while uploading heapdump", e);
  }
}
