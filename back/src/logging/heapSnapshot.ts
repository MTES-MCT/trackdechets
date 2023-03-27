import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createWriteStream } from "fs";
import v8 from "v8";

export async function heapSnapshotToS3Router() {
  // It's important that the filename end with `.heapsnapshot`,
  // otherwise Chrome DevTools won't open it.
  const fileName = `${process.env.DD_ENV}_${
    process.env.CONTAINER
  }_${Date.now()}.heapsnapshot`;

  console.info(`Taking a heap snapshot named "${fileName}"...`);

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
      console.log(
        `Uploaded: ${Math.round((progress.loaded * 100) / progress.total)}%`
      );
    });

    await parallelUploads3.done();
  } catch (e) {
    console.error("Error while uploading heapdump", e);
  }
}
