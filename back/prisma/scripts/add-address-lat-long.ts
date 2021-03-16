import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { searchCompany } from "../../src/companies/sirene/insee/client";
import geocode from "../../src/companies/geocode";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@registerUpdater(
  "Add address, longitude and latitude to companies",
  "Add address, longitude and latitude to companies",
  false
)
export class AddAddressLatLongUpdater implements Updater {
  async run() {
    try {
      const companies = await prisma.company.findMany();
      for (const company of companies) {
        try {
          const companyInfo = await searchCompany(company.siret);
          const { latitude, longitude } = await geocode(companyInfo.address);
          await prisma.company.update({
            data: { latitude, longitude, address: companyInfo.address },
            where: { id: company.id }
          });
        } catch (_) {
          console.log(
            `Failed retrieving address and geo info for SIRET ${company.siret}`
          );
        } finally {
          // Wait some time to avoid 429 Too many requests
          await sleep(200);
        }
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
