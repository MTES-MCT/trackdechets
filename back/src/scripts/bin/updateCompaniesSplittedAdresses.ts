import { prisma } from "@td/prisma";
import { getCompanySplittedAddress } from "../../companies/companyUtils";
import { Company } from "@prisma/client";
import { searchCompanyTD } from "../../companies/sirene/trackdechets/client";
import { SiretNotFoundError } from "../../companies/sirene/errors";
import { SireneSearchResult } from "../../companies/sirene/types";

// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/updateCompaniesSplittedAdresses.ts

(async function () {
  console.log(">> Lancement du script de mise à jour des adresses splittées");

  let companiesTotal = 0;
  let errors = 0;
  let ignored = 0;
  let addressTest = 0;

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
        addressTest++;
        continue;
      }

      try {
        let companySearch: SireneSearchResult | null = null;
        try {
          companySearch = await searchCompanyTD(company.orgId);
        } catch (e) {
          if (!(e instanceof SiretNotFoundError)) {
            throw e;
          }
        }

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
    )}%), ${addressTest} addresses test (${Math.round(
      (addressTest / companiesTotal) * 100
    )}%) en ${duration}ms!`
  );

  console.log("Terminé!");
})().then(() => process.exit());
