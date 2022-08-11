#!/usr/bin/env ts-node

import prisma from "../../prisma";

import { UserRole } from "@prisma/client";
import {
  createOneCompanyPerUser,
  createUsersWithAccessToken,
  createCompaniesAndAssociate,
  associateExistingUsers
} from "./users";
import { createForms, createStatusLogs, createSegments } from "./bsdds";
import { createBsdasris } from "./bsdasris";
import { createBsdas } from "./bsdas";
import { createBsvhus } from "./bsvhus";
import { createBsffs } from "./bsffs";
import { createEvents } from "./events";

// const USER_NUM = 1000;
// const COMPANIES_WITH_BSDS = 100;
// const DASRI_PER_COMPANIES = 100;
// const BSDA_PER_COMPANIES = 100;
// const VHU_PER_COMPANIES = 100;
// const BSDD_PER_COMPANIES = 100;
// const BSFF_PER_COMPANIES = 100;
// const BIG_CORPS = 30;
// const COMPANY_PER_BIG_CORP_USER = 5;
// const EVENTS_BATCHS = 10;
// const EVENTS_PAGE_SIZE = 10_000;

const USER_NUM = 205_000;
const COMPANIES_WITH_BSDS = 100;
const DASRI_PER_COMPANIES = 1400;
const BSDA_PER_COMPANIES = 500;
const VHU_PER_COMPANIES = 500;
const BSDD_PER_COMPANIES = 10_700;
const BSFF_PER_COMPANIES = 500;
const COMPANY_PER_USER = 3;
const BIG_CORPS = 30;
const COMPANY_PER_BIG_CORP_USER = 200;
const EVENTS = 25_000_000;
const EVENTS_BATCHS = 2_500;
const EVENTS_PAGE_SIZE = 10_000;

(async function main() {
  console.time("script");

  console.log("Users");
  const userIds = await createUsersWithAccessToken(USER_NUM);

  console.log("Companies");
  // create companies to be queried
  const usersAndMatchingCompany = await createOneCompanyPerUser({
    role: UserRole.ADMIN
  });

  console.log("Big corps");
  for (const userId of userIds.slice(0, BIG_CORPS)) {
    await createCompaniesAndAssociate(userId, COMPANY_PER_BIG_CORP_USER);
  }

  console.log("Other companies");

  // for (const userId of userIds.slice(BIG_CORPS)) {
  //   await createCompaniesAndAssociate(userId, 1);
  // }

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
  
  console.log("Segments");
  await createSegments();

  // console.log("Events");
  // await createEvents(EVENTS_PAGE_SIZE, EVENTS_BATCHS);

  console.log("associateExistingUsers");
  await associateExistingUsers();

  console.log(`All done, exiting.`);

  console.timeEnd("script");
  await prisma.$disconnect();
})();
