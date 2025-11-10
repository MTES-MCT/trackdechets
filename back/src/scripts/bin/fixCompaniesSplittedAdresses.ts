import { prisma } from "@td/prisma";
import { getCompanySplittedAddress } from "../../companies/companyUtils";
import { Company } from "@td/prisma";
import { searchCompanyTD } from "../../companies/sirene/trackdechets/client";
import { SiretNotFoundError } from "../../companies/sirene/errors";
import { SireneSearchResult } from "../../companies/sirene/types";
import { setTimeout } from "timers/promises";

const formatTime = milliseconds => {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
  const hours = Math.floor((milliseconds / 1000 / 60 / 60) % 24);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0")
  ].join(":");
};

// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/fixCompaniesSplittedAdresses.ts

(async function () {
  console.log(
    ">> Correction des adresses splittées des entreprises avec des [ND] dans leur adresse"
  );

  let updatedCompanies = 0;
  let errors = 0;
  let ignored = 0;
  let addressTest = 0;

  const startDate = new Date();

  const BATCH_SIZE = 100;
  let lastId: string | null = null;
  let finished = false;
  let skip = 0;

  const where = { street: { contains: "[ND]" } };

  const companiesTotal = await prisma.company.count({
    where
  });

  console.log(`${companiesTotal} entreprises détectées`);

  // Give time to Ctrl+C out of the script
  await setTimeout(5000);

  while (!finished) {
    const companies = await prisma.company.findMany({
      where,
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
      updatedCompanies += 1;

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

    const loopDuration = new Date().getTime() - startDate.getTime();
    console.log(
      `${updatedCompanies} entreprises mises à jour (${Math.round(
        (updatedCompanies / companiesTotal) * 100
      )}%) en ${formatTime(loopDuration)} (temps total estimé: ${formatTime(
        (loopDuration / updatedCompanies) * companiesTotal
      )})`
    );
  }

  const duration = new Date().getTime() - startDate.getTime();

  console.log(
    `${updatedCompanies} entreprises mises à jour, ${errors} erreurs (${Math.round(
      (errors / updatedCompanies) * 100
    )}%), ${ignored} ignorées (${Math.round(
      (ignored / updatedCompanies) * 100
    )}%), ${addressTest} addresses test (${Math.round(
      (addressTest / updatedCompanies) * 100
    )}%) en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
})().then(() => process.exit());
