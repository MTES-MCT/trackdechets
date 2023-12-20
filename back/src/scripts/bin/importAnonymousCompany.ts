#!/usr/bin/env ts-node
/* Use like so: `ts-node importAnonymousCompany.ts /path/to/csv/file.csv` */

import fs from "fs";
import * as yup from "yup";
import prisma from "../../prisma";
import { readCsv } from "../../users/bulk-creation/loaders";
import { logger } from "@td/logger";
import { libelleFromCodeNaf } from "../../companies/sirene/utils";

type AnonymousCompanyRow = {
  siret: string;
  name: string;
  address: string;
  codeCommune: string;
  codeNaf: string;
};

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
    logger.error(err.errors);
    throw new Error(err.message);
  }

  const existingCompanies = await prisma.anonymousCompany.findMany({
    where: { siret: { in: companies.map(c => c.siret) } },
    select: { siret: true, orgId: true }
  });
  const existingSirets = existingCompanies.map(ec => ec.siret);
  const companiesToCreate = companies.filter(
    c => !existingSirets.includes(c.siret)
  );

  logger.info(
    `Importing anonymous companies. Starting creation of the ${companiesToCreate.length} out of ${companies.length} missing companies.`
  );

  for (const company of companiesToCreate) {
    try {
      await prisma.anonymousCompany.create({
        data: {
          orgId: company.siret,
          ...company,
          libelleNaf: libelleFromCodeNaf(company.codeNaf)
        }
      });
      logger.info(`Created ${company.siret}`);
    } catch (err) {
      logger.error(`Could not create company ${company.siret}`, err);
    }
  }

  logger.info("Done, exiting.");
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
