import { prisma } from "@td/prisma";
import { getCompanySplittedAddress } from "../../companies/companyUtils";
import { Company } from "@prisma/client";
import { searchCompanyTD } from "../../companies/sirene/trackdechets/client";

// TODO: important: comment out the ClosedCompanyError!!!
// back/src/companies/sirene/insee/client.ts
// back/src/companies/sirene/trackdechets/client.ts

// Résultat avec la DB de sandbox:
// 30162 entreprises mises à jour, 0 erreurs (0%), 108 ignorées (0%) en 713504ms!

(async function () {
  console.log(">> Lancement du script de mise à jour des adresses splittées");

  let companiesTotal = 0;
  let errors = 0;
  let ignored = 0;

  const startDate = new Date();

  const BATCH_SIZE = 100;
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

      if (company.address === "Adresse test") {
        ignored++;
        continue;
      }

      try {
        const companySearch = await searchCompanyTD(company.orgId);

        const splittedAddress = getCompanySplittedAddress(
          companySearch,
          company as Company
        );

        if (splittedAddress.street === null) {
          ignored++;
          console.log(
            `Impossible d'extraire l'adresse pour l'entreprise ${
              company.orgId
            } (adresse: ${JSON.stringify(company.address)})`
          );
          continue;
        }

        // Apparently we cannot update multiple records at once
        // https://github.com/prisma/prisma/issues/6862
        await prisma.company.update({
          where: { id: company.id },
          data: splittedAddress
        });
      } catch (e) {
        errors++;

        console.log(
          `/!\\ Erreur pour l'entreprise ${company.orgId}: ${e.message}`
        );
      }
    }

    console.log(`${companiesTotal} entreprises mises à jour`);
  }

  const duration = new Date().getTime() - startDate.getTime();

  console.log(
    `${companiesTotal} entreprises mises à jour, ${errors} erreurs (${Math.round(
      (errors / companiesTotal) * 100
    )}%), ${ignored} ignorées (${Math.round(
      (ignored / companiesTotal) * 100
    )}%) en ${duration}ms!`
  );

  console.log("Terminé!");
})().then(() => process.exit());
