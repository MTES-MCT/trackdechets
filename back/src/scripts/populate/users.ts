import { siretify } from "../../__tests__/factories";

import prisma from "../../prisma";
import { hash } from "bcrypt";
import { hashToken } from "../../utils";
import { CompanyType } from "@prisma/client";
import { randomChoice } from "./utils";

export const createUsersWithAccessToken = async (quantity = 1, opt = {}) => {
  const userData = [];
  const tokenData = [];
  const emailAndToken = [];

  const defaultPassword = await hash("pass", 10);
  for (let i = 0; i < quantity; i++) {
    const idx = i + 1;

    userData.push({
      name: `User_${idx}`,
      email: `user_${idx}@td.io`,
      password: defaultPassword,
      isActive: true,
      ...opt
    });
  }

  await prisma.user.createMany({ data: userData });
  const userEmails = userData.map(u => u.email);

  const createdUsers = await prisma.user.findMany({
    where: { email: { in: userEmails } },
    select: { id: true, email: true },
    orderBy: {
      createdAt: "asc"
    }
  });

  for (let i = 0; i < quantity; i++) {
    const idx = i + 1;
    const clearToken = `token_${idx}`;

    const email = `user_${idx}@td.io`;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    emailAndToken.push({
      token: clearToken,
      email
    });
    tokenData.push({
      token: hashToken(clearToken),
      userId: user.id
    });
  }

  await prisma.accessToken.createMany({
    data: tokenData
  });

  return createdUsers.map(u => u.id);
};

/**
 *   Takes a list of users ids and associate a company to have user_X@td.io - token_X - siret: 0000…X to ease queries
 */
export async function createOneCompanyPerUser({ role, start = 0 }) {
  const data = [];
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc"
    }
  });
  const sirets = [];
  const userCount = users.length;

  for (let i = start + 1; i <= userCount; i++) {
    const siret = siretify(i);
    data.push({
      siret,
      companyTypes: {
        set: [
          "PRODUCER" as CompanyType,
          "TRANSPORTER" as CompanyType,
          "WASTEPROCESSOR" as CompanyType,
          "COLLECTOR" as CompanyType
        ]
      },
      name: `company_${i}`,
      securityCode: 1234,
      verificationCode: "34567",
      address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
      contactEmail: `contact_${i}@gmail.com`,
      contactPhone: `+ 606060606`
    });
    sirets.push(siret);
  }
  await prisma.company.createMany({
    data
  });
  const companiesCreated = await prisma.company.findMany({
    select: { id: true, siret: true },
    orderBy: {
      siret: "asc"
    }
  });

  const assodata = companiesCreated.map((c, idx) => ({
    companyId: c.id,
    userId: users[idx].id,
    role: role
  }));

  const res = companiesCreated.map((c, idx) => ({
    siret: c.siret,
    userId: users[idx].id
  }));

  await prisma.companyAssociation.createMany({
    data: assodata
  });

  return res;
}

/**
 *   Create maxCompaniesPerUser per userId
 */
export async function createCompaniesAndAssociate(
  userId,

  maxCompaniesPerUser = 1
) {
  const data = [];
  const initialCompanyCount = (await prisma.company.count()) + 1;

  const sirets = [];
  for (let i = 0; i < maxCompaniesPerUser; i++) {
    const companyIndex = initialCompanyCount + i;
    const siret = siretify(companyIndex);
    sirets.push(siret);
    data.push({
      siret,
      companyTypes: {
        set: [
          "PRODUCER" as CompanyType,
          "TRANSPORTER" as CompanyType,
          "WASTEPROCESSOR" as CompanyType,
          "COLLECTOR" as CompanyType
        ]
      },
      name: `company_${companyIndex}`,
      securityCode: 1234,
      verificationCode: "34567",
      address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
      contactEmail: `contact_${companyIndex}@gmail.com`,
      contactPhone: `+${companyIndex} 606060606`
    });
  }
  await prisma.company.createMany({
    data
  });

  const companiesCreated = await prisma.company.findMany({
    where: {
      siret: {
        in: sirets
      }
    }
  });

  const companiesIds = companiesCreated.map(c => c.id);
  const assodata = companiesIds.map(id => ({
    companyId: id,
    userId,
    role: randomChoice(["ADMIN", "MEMBER"])
  }));
  const res = companiesCreated.map(c => ({ siret: c.siret, userId }));

  await prisma.companyAssociation.createMany({
    data: assodata
  });

  return res;
}

/**
 *   Associate users from 1010 to 200 to company 1
 */
export async function associateExistingUsers() {
  const siret = siretify(1);
  const company = await prisma.company.findUnique({
    where: { siret: siret },
    select: { id: true, siret: true }
  });
  for (let i = 101; i <= 2000; i++) {
    const email = `user_${i}@td.io`;
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { email: true, id: true }
    });

    await prisma.companyAssociation.create({
      data: {
        user: { connect: { id: user.id } },
        company: {
          connect: { id: company.id }
        },
        role: "MEMBER"
      }
    });
  }
}
