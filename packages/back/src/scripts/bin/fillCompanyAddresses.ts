import prisma from "../../prisma";
import { searchCompany } from "../../companies/sirene/insee/client";
import geocode from "../../companies/geocode";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fill missing addresses, lat/long and naf code in existing companies
 * Almost a clone of prisma/scripts/add-address-lat-long.ts
 */
(async () => {
  let updatedCompaniesCount = 0;
  try {
    // retrieve companies whose address is empty and which are not test companies (codeNaf XXXX)
    const companies = await prisma.company.findMany({
      where: {
        AND: [{ address: null }, { NOT: { codeNaf: "XXXXX" } }]
      }
    });
    let counter = 0;
    for (const company of companies) {
      counter++;

      console.log(`Processing company ${counter}`);
      try {
        const companyInfo = await searchCompany(company.siret);

        const { latitude, longitude } = await geocode(companyInfo.address);

        const data = { latitude, longitude, address: companyInfo.address };

        await prisma.company.update({
          data,
          where: { id: company.id }
        });
        updatedCompaniesCount += 1;
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
    console.log("☠ Something went wrong during the update", err);
    throw new Error();
  }

  console.log(`${updatedCompaniesCount} Companies updated`);
})();
