import appRoot from "app-root-path";
import { createLogger, format, transports } from "winston";
import v8 from "v8";
import { createWriteStream } from "fs";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const LOG_PATH = `${appRoot}/logs/app.log`;
// Avoid using undefined console.log() in jest context
const LOG_TO_CONSOLE =
  process.env.FORCE_LOGGER_CONSOLE && process.env.JEST_WORKER_ID === undefined;
// use http transport when datadog agent installation is impossible (eg. one-off container)
const LOG_TO_HTTP =
  process.env.LOG_TO_HTTP && process.env.JEST_WORKER_ID === undefined;

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(format.errors({ stack: true }), format.json()),
  transports: [
    !LOG_TO_CONSOLE && !LOG_TO_HTTP
      ? new transports.File({ filename: LOG_PATH })
      : LOG_TO_CONSOLE
      ? new transports.Console({
          // Simple `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
          format: format.simple()
        })
      : LOG_TO_HTTP
      ? new transports.Http({
          host: "http-intake.logs.datadoghq.com",
          path: `/api/v2/logs?dd-api-key=${
            process.env.DD_API_KEY
          }&ddsource=nodejs&service=${process.env.DD_APP_NAME || "back"}`,
          ssl: true
        })
      : new transports.File({ filename: LOG_PATH })
  ]
});

createHeapSnapshotAndUploadToS3();

async function createHeapSnapshotAndUploadToS3() {
  if (process.env.DEBUG_HEAPDUMP !== "active") {
    return;
  }
  const snapshotStream = v8.getHeapSnapshot();
  // It's important that the filename end with `.heapsnapshot`,
  // otherwise Chrome DevTools won't open it.
  const fileName = `${process.env.DD_ENV}_${
    process.env.CONTAINER
  }_${Date.now()}.heapsnapshot`;
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
      logger.info(progress);
    });

    await parallelUploads3.done();
  } catch (e) {
    logger.error("Error while uploading heapdump", e);
  }
  setTimeout(() => createHeapSnapshotAndUploadToS3(), 1000 * 60 * 60);
}

export default logger;
