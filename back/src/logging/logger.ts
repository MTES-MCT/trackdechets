import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";
import v8 from "v8";
import { createWriteStream } from "fs";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const LOG_PATH = `${appRoot}/logs/app.log`;

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(format.errors({ stack: true }), format.json()),
  transports: [new transports.File({ filename: LOG_PATH })]
});

// TODO - remove
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info("Memory usage - TEMP", memoryUsage);

  if (["sandbox", "recette"].includes(process.env.DD_ENV)) {
    createHeapSnapshotAndUploadToS3();
  }
}, 1000 * 60 * 3);

async function createHeapSnapshotAndUploadToS3() {
  const snapshotStream = v8.getHeapSnapshot();
  // It's important that the filename end with `.heapsnapshot`,
  // otherwise Chrome DevTools won't open it.
  const fileName = `${process.env.DD_ENV}_${Date.now()}.heapsnapshot`;
  const fileStream = createWriteStream(fileName);
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
      console.log(progress);
    });

    await parallelUploads3.done();
  } catch (e) {
    console.log("Error while uploading heapdump", e);
  }
}

export default logger;
