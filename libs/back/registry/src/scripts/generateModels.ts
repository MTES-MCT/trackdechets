import { PutObjectCommand } from "@aws-sdk/client-s3";
import { format } from "@fast-csv/format";
import * as Excel from "exceljs";
import { Writable } from "node:stream";

import { envConfig } from "../config";
import { INCOMING_TEXS_HEADERS } from "../incomingTexs/constants";
import { INCOMING_WASTE_HEADERS } from "../incomingWaste/constants";
import { registryS3Client } from "../s3";
import { SSD_HEADERS } from "../ssd/constants";
import { OUTGOING_WASTE_HEADERS } from "../outgoingWaste/constants";
import { OUTGOING_TEXS_HEADERS } from "../outgoingTexs/constants";
import { MANAGED_HEADERS } from "../managed/constants";
import { TRANSPORTED_HEADERS } from "../transported/constants";

const MODEL_SOURCES = [
  { headers: SSD_HEADERS, name: "Modele SSD" },
  { headers: INCOMING_WASTE_HEADERS, name: "Modele DND entrant" },
  { headers: INCOMING_TEXS_HEADERS, name: "Modele TEXS entrant" },
  { headers: OUTGOING_WASTE_HEADERS, name: "Modele DND sortant" },
  { headers: OUTGOING_TEXS_HEADERS, name: "Modele TEXS sortant" },
  { headers: TRANSPORTED_HEADERS, name: "Modele transportés" },
  { headers: MANAGED_HEADERS, name: "Modele gérés" }
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

  const row = worksheet.addRow(Object.values(headers));
  row.eachCell(cell => {
    cell.font = { bold: true };
  });
  headers.forEach((value, index) => {
    worksheet.getColumn(index + 1).width = value.toString().length + 2; // We dont use a monospace font, so we add padding to the width
  });

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

  const csvStream = format({ headers: false, writeBOM: true }); // UTF-8 BOM to help tools like Excel recognize UTF-8 encoding
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
    ContentType: contentType,
    ContentEncoding: "utf-8"
  };

  const command = new PutObjectCommand(params);
  await registryS3Client.send(command);
}

generateModels()
  .then(() => process.exit())
  .catch(err => console.error(err));
