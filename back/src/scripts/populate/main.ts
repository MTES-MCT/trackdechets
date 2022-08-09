#!/usr/bin/env ts-node

import prisma from "../../prisma";

import { UserRole } from "@prisma/client";
import {
  createOneCompanyPerUser,
  createUsersWithAccessToken,
  createCompaniesAndAssociate,
  associateExistingUsers
} from "./users";
import { createForms, createStatusLogs } from "./bsdds";
import { createBsdasris } from "./bsdasris";
import { createBsdas } from "./bsdas";
import { createBsvhus } from "./bsvhus";
import { createBsffs } from "./bsffs";

const USER_NUM = 10000;
const COMPANIES_WITH_BSDS = 100;
const DASRI_PER_COMPANIES = 5000;
const BSDA_PER_COMPANIES = 5000;
const VHU_PER_COMPANIES = 5000;
const BSDD_PER_COMPANIES = 5000;
const BSFF_PER_COMPANIES = 5000;
const COMPANY_PER_USER = 3;
const BIG_CORPS = 100;
const COMPANY_PER_BIG_CORP_USER = 30;

(async function main() {
  console.time("script");

  const userIds = await createUsersWithAccessToken(USER_NUM);

  // create companies to be queried
  const usersAndMatchingCompany = await createOneCompanyPerUser({
    role: UserRole.ADMIN
  });

  for (const userId of userIds.slice(0, BIG_CORPS)) {
    await createCompaniesAndAssociate(
      userId,

      COMPANY_PER_BIG_CORP_USER
    );
  }

  for (const userId of userIds.slice(BIG_CORPS)) {
    await createCompaniesAndAssociate(userId, COMPANY_PER_USER);
  }

  console.log("Dasris");
  for (const userAndMatchingCompany of usersAndMatchingCompany.slice(
    0,
    COMPANIES_WITH_BSDS
  )) {
    await createBsdasris(userAndMatchingCompany, DASRI_PER_COMPANIES);
  }

  console.log("Bsdas");
  for (const userAndMatchingCompany of usersAndMatchingCompany.slice(
    0,
    COMPANIES_WITH_BSDS
  )) {
    await createBsdas(userAndMatchingCompany, BSDA_PER_COMPANIES);
  }

  console.log("Vhus");
  for (const userAndMatchingCompany of usersAndMatchingCompany.slice(
    0,
    COMPANIES_WITH_BSDS
  )) {
    await createBsvhus(userAndMatchingCompany, VHU_PER_COMPANIES);
  }

  console.log("Bsff");
  for (const userAndMatchingCompany of usersAndMatchingCompany.slice(
    0,
    COMPANIES_WITH_BSDS
  )) {
    await createBsffs(userAndMatchingCompany, BSFF_PER_COMPANIES);
  }

  console.log("Bsdds");
  for (const userAndMatchingCompany of usersAndMatchingCompany.slice(
    0,
    COMPANIES_WITH_BSDS
  )) {
    await createForms(userAndMatchingCompany, BSDD_PER_COMPANIES);
  }

  console.log("StatusLogs");
  await createStatusLogs();

  await associateExistingUsers();
  console.log(`All done, exiting.`);

  console.timeEnd("script");
  await prisma.$disconnect();
})();
