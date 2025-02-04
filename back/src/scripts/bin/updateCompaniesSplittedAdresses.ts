import { prisma } from "@td/prisma";
import { getCompanySplittedAddress } from "../../companies/companyUtils";
import { Company } from "@prisma/client";

// TODO: important: comment out the ClosedCompanyError!!!

(async function () {
  console.log(">> Starting script to update companies' splitted addresses");

  let companiesTotal = 0;
  const startDate = new Date();

  const BATCH_SIZE = 1000;
  let lastId: string | null = null;
  let finished = false;
  let skip = 0;

  while (!finished) {
    const companies = await prisma.company.findMany({
      take: BATCH_SIZE,
      skip, // Skip the cursor
      ...(lastId
        ? {
            cursor: {
              id: lastId
            }
          }
        : {}),
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        orgId: true,
        address: true,
        vatNumber: true
      }
    });

    if (companies.length < 10) {
      finished = true;
    }
    if (companies.length === 0) {
      break;
    }

    lastId = companies[companies.length - 1].id;
    skip = 1;

    for (const company of companies) {
      companiesTotal += 1;

      console.log(`[${companiesTotal}] Updating company ${company.orgId}`);

      try {
        const splittedAddress = await getCompanySplittedAddress(
          company as Company
        );

        await prisma.company.update({
          where: { id: company.id },
          data: splittedAddress
        });
      } catch (e) {
        console.log(
          `/!\\ Erreur pour l'entreprise ${company.orgId}: ${e.message}`
        );
      }
    }
  }

  const duration = new Date().getTime() - startDate.getTime();

  console.log(`${companiesTotal} updated in ${duration}ms!`);
  console.log("Done!");
})().then(() => process.exit());
