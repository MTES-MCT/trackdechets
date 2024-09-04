import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createWriteStream } from "fs";
import { buildPdf as buildBsdasriPdf } from "../../../bsdasris/pdf/generator";
import { generateEmptyBsddPdf } from "../../../forms/pdf/generateBsddPdf";
import { buildPdf as buildBsdaPdf } from "../../../bsda/pdf/generator";
import { buildPdf as buildBsffPdf } from "../../../bsffs/pdf/generator";
import { buildPdf as buildBsvhufPdf } from "../../../bsvhu/pdf/generator";
import {
  emptyBsda,
  emptyBsdasri,
  emptyBsdd,
  emptyBsvhu,
  emptyBsff
} from "./emptyPdfData";

const getEmptyBsdd = async () => {
  const { stream: html } = await generateEmptyBsddPdf(emptyBsdd);

  const fileStream = createWriteStream("bsd.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyBsff = async () => {
  const html = await buildBsffPdf(emptyBsff, true);

  const fileStream = createWriteStream("bsd.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyBsvhu = async () => {
  const html = await buildBsvhufPdf(emptyBsvhu, true);

  const fileStream = createWriteStream("bsd.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyDasri = async () => {
  const html = await buildBsdasriPdf(emptyBsdasri, true);

  const fileStream = createWriteStream("bsd.pdf");

  html.pipe(fileStream);
  return html;
};

const getEmptyBsda = async () => {
  const html = await buildBsdaPdf(emptyBsda, true);

  const fileStream = createWriteStream("bsd.pdf");
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
  const folder = "bsds/";
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_BSD_TEMPLATES_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_BSD_TEMPLATES_SECRET_ACCESS_KEY
    }
  });

  const htmlBsvhu = await getEmptyBsvhu();
  await upload(client, `${folder}/bsvhu.pdf`, htmlBsvhu);

  const htmlBsff = await getEmptyBsff();
  await upload(client, `${folder}/bsff.pdf`, htmlBsff);

  const htmlBsdd = await getEmptyBsdd();
  await upload(client, `${folder}/bsdd.pdf`, htmlBsdd);

  const bsda = await getEmptyBsda();
  await upload(client, `${folder}/bsda.pdf`, bsda);

  const bsdasri = await getEmptyDasri();
  await upload(client, `${folder}/bsdasri.pdf`, bsdasri);
};

(async function () {
  await getBsds();
})();
