import { prisma } from "../../generated/prisma-client";
import axios from "axios";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function setCompanyName() {
  // filter companies where name field is not set
  const companies = await prisma.companies({ where: { name: null } });

  for (const company of companies) {
    console.log(`Setting name for company ${company.siret}`);

    try {
      const response = await axios.get(
        `http://td-insee:81/siret/${company.siret}`
      );

      if (response.status === 200) {
        const companyInfo = response.data;

        await prisma.updateCompany({
          data: {
            name: companyInfo.name
          },
          where: {
            id: company.id
          }
        });
      } else {
        console.log(`Received status code ${response.status}`, response);
      }
    } catch (error) {
      console.log(error);
    }

    // Wait some time to avoid 429 Too many requests
    await sleep(1000);
  }
}
