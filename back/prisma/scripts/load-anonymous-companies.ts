import * as fs from "fs";
import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";

@registerUpdater(
  "Load anonymous companies",
  "Load anonymous SIRENE companies from file ./src/companies/sirene/fixtures/anonymousCompanies.json",
  false
)
export class LoadAnonymousCompaniesUpdater implements Updater {
  async run() {
    try {
      console.info("Starting script to load anonymous SIRENE companies...");

      // For security reasons, this file is git ignored, make sure
      // you get a copy of it before running the script
      const fixturePath =
        "./src/companies/sirene/fixtures/anonymousCompanies.json";

      const data = JSON.parse(
        fs.readFileSync(fixturePath, "utf8")
      ) as Prisma.AnonymousCompanyCreateInput[];

      for (const companyInput of data) {
        await prisma.anonymousCompany.create({ data: companyInput });
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
