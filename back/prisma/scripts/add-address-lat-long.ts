import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { searchCompany } from "../../src/companies/search";
import { geocode } from "../../src/companies/geo/geocode";

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
          if (!company.siret) continue;
          // TODO index geocoding directly in trackdechets/search module by fetching geocoded SIRENE fron data.gouv.fr
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
