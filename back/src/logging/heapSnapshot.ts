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

  // Once we have a first snapshot, we need the second one to be from the same container
  if (req.params.container && req.params.container !== process.env.CONTAINER) {
    return res.send("Wrong container, try again");
  }

  // It's important that the filename end with `.heapsnapshot`,
  // otherwise Chrome DevTools won't open it.
  const fileName = `${process.env.DD_ENV}_${
    process.env.CONTAINER
  }_${Date.now()}.heapsnapshot`;

  // Return early so that the heavy work is done in background (avoiding the 1min HTTP timeout)
  res.status(202).send(fileName);

  // Break execution to allow http response to be sent
  setTimeout(async () => {
    const fileStream = createWriteStream(fileName);
    const snapshotStream = v8.getHeapSnapshot();
    snapshotStream.pipe(fileStream);

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
  });
}
