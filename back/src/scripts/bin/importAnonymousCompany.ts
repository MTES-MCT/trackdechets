#!/usr/bin/env ts-node
// Use like so: `ts-node importAnonymousCompany.ts /path/to/csv/file.csv`
import fs from "fs";
import csv from "csv-parser";
import * as yup from "yup";
import prisma from "../../prisma";
import { nafCodes } from "../../common/constants/NAF";

type AnonymousCompanyRow = {
  siret: string;
  name: string;
  address: string;
  codeCommune: string;
  codeNaf: string;
};
const separator = ",";

async function runImport() {
  const [path] = process.argv.slice(2);

  const stat = await fs.promises.lstat(path);
  if (!stat.isFile()) {
    throw new Error(`Provided path ("${path}") is not valid.`);
  }

  const companies = await readCsv<AnonymousCompanyRow>(path);

  try {
    await anonymousCompaniesSchema.validate(companies, { abortEarly: false });
  } catch (err) {
    console.error(err.errors);
    throw new Error(err.message);
  }

  const existingCompanies = await prisma.anonymousCompany.findMany({
    where: { siret: { in: companies.map(c => c.siret) } },
    select: { siret: true }
  });
  const existingSirets = existingCompanies.map(ec => ec.siret);
  const companiesToCreate = companies.filter(
    c => !existingSirets.includes(c.siret)
  );

  console.info(
    `Importing anonymous companies. Starting creation of the ${companiesToCreate.length} out of ${companies.length} missing companies.`
  );

  for (const company of companiesToCreate) {
    try {
      await prisma.anonymousCompany.create({
        data: {
          ...company,
          libelleNaf: nafCodes[company.codeNaf]
        }
      });
      console.info(`Created ${company.siret}`);
    } catch (err) {
      console.error(`Could not create company ${company.siret}`, err);
    }
  }

  console.info("Done, exiting.");
}

function readCsv<Row>(
  csvpath: string,
  transform?: (row: any) => Row
): Promise<Row[]> {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvpath)
      .pipe(csv({ separator }))
      .on("data", async data => {
        const row = (transform ? transform(data) : data) as Row;
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", err => reject(err));
  });
}

const anonymousCompanySchema = yup.object({
  siret: yup.string().required().length(14),
  name: yup.string().required(),
  address: yup.string().required(),
  codeCommune: yup.string().required().length(5),
  codeNaf: yup.string().required()
});
const anonymousCompaniesSchema = yup
  .array()
  .of(anonymousCompanySchema)
  .required();

runImport();
