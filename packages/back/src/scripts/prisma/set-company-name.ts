import prisma from "../../prisma";
import { searchCompany } from "../../companies/search";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function setCompanyName() {
  // filter companies where name field is not set
  const companies = await prisma.company.findMany({ where: { name: null } });

  for (const company of companies) {
    console.log(`Setting name for company ${company.siret}`);

    try {
      const companyInfo = await searchCompany(company.siret);

      await prisma.company.update({
        data: {
          name: companyInfo.name
        },
        where: {
          id: company.id
        }
      });
    } catch (error) {
      console.log(error);
    }

    // Wait some time to avoid 429 Too many requests
    await sleep(1000);
  }
}
