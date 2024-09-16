import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createWriteStream } from "fs";

import { generateEmptyBsddPdf } from "../../../forms/pdf/generateBsddPdf";
import { buildPdf as buildBsdaPdf } from "../../../bsda/pdf/generator";
import { buildPdf as buildBsffPdf } from "../../../bsffs/pdf/generator";
import { buildPdf as buildBsvhufPdf } from "../../../bsvhu/pdf/generator";
import { emptyBsda, emptyBsdd, emptyBsvhu, emptyBsff } from "./emptyPdfData";
import { logger } from "@td/logger";

const getEmptyBsdd = async () => {
  const { stream: html } = await generateEmptyBsddPdf(emptyBsdd);

  const fileStream = createWriteStream("/tmp/bsds.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyBsff = async () => {
  const html = await buildBsffPdf(emptyBsff, true);

  const fileStream = createWriteStream("/tmp/bsff.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyBsvhu = async () => {
  const html = await buildBsvhufPdf(emptyBsvhu, true);

  const fileStream = createWriteStream("/tmp/bsvhu.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyBsda = async () => {
  const html = await buildBsdaPdf(emptyBsda, true);

  const fileStream = createWriteStream("/tmp/bsda.pdf");
  html.pipe(fileStream);
  return html;
};

const upload = async (client, filename, content) => {
  try {
    const uploads3 = new Upload({
      client,
      params: {
        Bucket: process.env.S3_BSD_TEMPLATES_BUCKET,
        Key: filename,
        Body: content
      },

      leavePartsOnError: false
    });

    uploads3.on("httpUploadProgress", progress => {
      if (progress.loaded && progress.total) {
        console.log(
          `${filename} uploaded: ${Math.round(
            (progress.loaded * 100) / progress.total
          )}%`
        );
      }
    });

    await uploads3.done();
  } catch (e) {
    console.error("Error while uploading bsd template", e);
  }
};

const getBsds = async () => {
  const {
    S3_ENDPOINT,
    S3_REGION,
    S3_BSD_TEMPLATES_ACCESS_KEY_ID,
    S3_BSD_TEMPLATES_SECRET_ACCESS_KEY,
    S3_BSD_TEMPLATES_BUCKET
  } = process.env;
  if (
    [
      S3_ENDPOINT,
      S3_REGION,
      S3_BSD_TEMPLATES_ACCESS_KEY_ID,
      S3_BSD_TEMPLATES_SECRET_ACCESS_KEY,
      S3_BSD_TEMPLATES_BUCKET
    ].some(el => !el)
  ) {
    console.log("no templates");
    process.exit(0);
  }
  const folder = "bsds/";
  const client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_BSD_TEMPLATES_ACCESS_KEY_ID,
      secretAccessKey: S3_BSD_TEMPLATES_SECRET_ACCESS_KEY
    }
  });

  const htmlBsvhu = await getEmptyBsvhu();
  await upload(client, `${folder}bsvhu.pdf`, htmlBsvhu);

  const htmlBsff = await getEmptyBsff();
  await upload(client, `${folder}bsff.pdf`, htmlBsff);

  const htmlBsdd = await getEmptyBsdd();
  await upload(client, `${folder}bsdd.pdf`, htmlBsdd);

  const bsda = await getEmptyBsda();
  await upload(client, `${folder}bsda.pdf`, bsda);
};

async function exitScript() {
  logger.info("Done uploading emty bsds templates");

  process.exit(0);
}

(async function () {
  await getBsds();

  return exitScript();
})();
