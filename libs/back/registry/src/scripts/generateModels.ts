import { PutObjectCommand } from "@aws-sdk/client-s3";
import { format } from "@fast-csv/format";
import * as Excel from "exceljs";
import { Writable } from "node:stream";

import { envConfig } from "../config";
import { INCOMING_TEXS_HEADERS } from "../incomingTexs/constants";
import { INCOMING_WASTE_HEADERS } from "../incomingWaste/constants";
import { registryS3Client } from "../s3";
import { SSD_HEADERS } from "../ssd/constants";

const MODEL_SOURCES = [
  { headers: SSD_HEADERS, name: "Modele SSD" },
  { headers: INCOMING_WASTE_HEADERS, name: "Modele DND entrant" },
  { headers: INCOMING_TEXS_HEADERS, name: "Modele TEXS entrant" }
];

/**
 * Generate Excel and CSV models for each source and store them in S3
 */
async function generateModels() {
  for (const source of MODEL_SOURCES) {
    const headers = Object.values(source.headers);
    await generateExcelModel({ headers, name: source.name });
    await generateCsvModel({ headers, name: source.name });
    console.info(`✅ Generated XLSX & CSV for ${source.name}`);
  }
}

async function generateExcelModel({
  headers,
  name
}: {
  headers: string[];
  name: string;
}) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(name);

  worksheet.addRow(Object.values(headers));
  const excelBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(excelBuffer);

  await writeToS3({
    name: `${name}.xlsx`,
    buffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

async function generateCsvModel({
  headers,
  name
}: {
  headers: string[];
  name: string;
}) {
  // Initiate buffer that will collect model in memory
  let csvBuffer = Buffer.alloc(0);

  const writableStream = new Writable({
    write(chunk, _, callback) {
      csvBuffer = Buffer.concat([csvBuffer, chunk]);
      callback();
    }
  });

  const csvStream = format({ headers: false });
  csvStream.pipe(writableStream);

  csvStream.write(headers);
  csvStream.end();

  // Wait for the writable stream to finish
  await new Promise((resolve, reject) => {
    writableStream.on("finish", resolve);
    writableStream.on("error", reject);
  });

  await writeToS3({
    name: `${name}.csv`,
    buffer: csvBuffer,
    contentType: "text/csv"
  });
}

async function writeToS3({
  name,
  buffer,
  contentType
}: {
  name: string;
  buffer: Buffer;
  contentType: string;
}) {
  const params = {
    Bucket: envConfig.S3_REGISTRY_MODELS_BUCKET,
    Key: name,
    Body: buffer,
    ContentType: contentType
  };

  const command = new PutObjectCommand(params);
  await registryS3Client.send(command);
}

generateModels()
  .then(() => process.exit())
  .catch(err => console.error(err));
